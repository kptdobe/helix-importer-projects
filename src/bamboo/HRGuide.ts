/*
* Copyright 2022 Adobe. All rights reserved.
* This file is licensed to you under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License. You may obtain a copy
* of the License at http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software distributed under
* the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
* OF ANY KIND, either express or implied. See the License for the specific language
* governing permissions and limitations under the License.
*/
/* eslint-disable no-console */
import { PageImporter, PageImporterResource, DOMUtils } from '@adobe/helix-importer';

import fetch from 'node-fetch';
import path from 'path';
import { Response } from 'node-fetch';
import { Document } from 'jsdom';

import Blocks from '../utils/Blocks';
import DOM from '../utils/DOM';

export default class Importer extends PageImporter {
  /* ====================
    UTILS
    ===================== */
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  cleanupName(name: string): string {
    const firstChar = name.charAt(0);
    const lastChar = name.charAt(name.length - 1);
    if (!/[A-Za-z0-9]/.test(firstChar)) {
      name = name.substring(1);
    }
    if (!/[A-Za-z0-9]/.test(lastChar)) {
      name = name.slice(0, -1);
    }
    return name;
  }

  postProcessMD(md: string): string {
    let ret = super.postProcessMD(md);
    ret = ret.replace(/\u00A0/gm, '');
    return ret;
  }

  rewriteLinks(main: Element, document: Document, target: string): any {
    main.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href.startsWith('//')) {
        a.setAttribute('href', `https:${href}`);
      }
    });
    main.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (src.startsWith('//')) {
        img.setAttribute('src', `https:${src}`);
      } else if (src.startsWith('/images/')) {
        img.setAttribute('src', `${target}${src}`);
      }
    });
  }

  rewriteChapterEls(main: Element, document: Document) {
    main.querySelectorAll('.Hr101GuideChapterIcon__wrapper > h6').forEach((h6) => {
      const p = document.createElement('p');
      p.innerHTML = h6.innerHTML;
      h6.replaceWith(p);
    });
  }

  /* ====================
    SPECIFICS
    ===================== */
  createMetadata(main: Element, document: Document): any {
    const meta = {};

    const title = document.querySelector('title');
    if (title) {
      meta['Title'] = title.textContent.replace(/[\n\t]/gm, '');
    }

    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      meta['Description'] = desc.content;
    }

    const img = document.querySelector('[property="og:image"]');
    if (img) {
      const el = document.createElement('img');
      el.src = img.content;
      meta['Image'] = el;
    }

    meta['Template'] = 'HR 101 Guide';

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  rewriteHeader(main: Element, document: Document) {
    const header = main.querySelector('.Hr101GuideHeader');
    if (header) {
      const wrapper = document.createElement('div');
      const h3 = header.querySelector('h3');
      const h2 = header.querySelector('h2');
      if (h3 && h2) {
        wrapper.innerHTML = `<p><em>${h3.textContent}</em></p>
          <p><strong>${h2.textContent}</strong></p>
          <hr />`;
        header.replaceWith(wrapper);
      }
    }
  }

  replaceCTAs(main: Element, document: Document) {
    const ctas = main.querySelectorAll('.Hr101GuideCtaMain');
    if (ctas) {
      ctas.forEach((c) => {
        const cells = [];
        cells.push(['Call to Action']);
        const content = c.querySelector('.Hr101GuideCtaMain__bigWrap');
        if (content) {
          cells.push([content.innerHTML.toString()]);
          const table = DOM.createTable(cells, document);
          c.replaceWith(table);
        }
      });
    }
  }

  buildCallouts(main: Element, document: Document) {
    const callouts = main.querySelectorAll('.Hr101GuideCtaAlt--big');
    if (callouts) {
      callouts.forEach((c) => {
        const cells = [];
        cells.push(['Callout']);
        cells.push([c.innerHTML.toString()]);
        const table = DOM.createTable(cells, document);
        c.replaceWith(table);
      });
    }
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      '.NavbarMobile',
      '.acc-out-of-view',
      'script',
      'noscript',
      'footer',
      '.Footer',
      '.Hr101GuideBottom__navContainer',
      '.Hr101GuideBackToTop',
    ]);

    const main = document.querySelector('body');

    this.rewriteLinks(main, document, entryParams.target);
    this.rewriteHeader(main, document);
    this.rewriteChapterEls(main, document);
    this.replaceCTAs(main, document);
    this.buildCallouts(main, document);

    const meta = this.createMetadata(main, document);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const subPath = s.filter((p, i) => i > 2).join('/');

    const pir = new PageImporterResource(name, subPath, main, null, {
      meta,
    });

    return [pir];
  }
}