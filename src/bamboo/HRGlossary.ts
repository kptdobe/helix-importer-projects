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

    meta['Template'] = 'HR Glossary';

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  rewriteHeader(main: Element, document: Document) {
    const header = main.querySelector('.HrGlossaryBanner__container');
    if (header) {
      const wrapper = document.createElement('div');
      const head = header.querySelector('.typ-hero-header');
      const subhead = header.querySelector('.typ-hero-subhead');
      if (head && subhead) {
        wrapper.innerHTML = `<p><strong>${head.textContent}</strong></p>
          <p><em>${subhead.textContent}</em></p>
          <hr />`;
        header.replaceWith(wrapper);
      }
      main.querySelector('.HrGlossaryBanner__leaf')?.remove();
    }
  }

  createRelatedPostsBlock(main: Element, document: Document, target: string) {
    const related = document.querySelectorAll('.HrGlossaryAlsoLike__wrapper');
    if (related.length) {
      const cells = [];
      cells.push(['Related Posts']);
      related.forEach((r) => {
        const a = r.querySelector('a[href]');
        a.textContent = `${target}${a.href}`;
        a.href = `${target}${a.href}`;
        cells.push([a]);
        r.remove();
      });
      const table = DOM.createTable(cells, document);
      main.append(table);
      document.querySelector('.HrGlossaryAlsoLike')?.remove();
    }
  }

  rewriteCallouts(main: Element, document: Document) {
    const callouts = main.querySelectorAll('.HrGlossaryTerm__contentCta');
    if (callouts.length) {
      callouts.forEach((c) => {
        let type = 'Callout';
        const classList = [...c.classList];
        if (classList.includes('HrGlossaryTerm__contentCta--left')) {
          type += ' (left)';
        } else if (classList.includes('HrGlossaryTerm__contentCta--right')) {
          type += ' (right)';
        }
        const cells = [];
        cells.push([type]);
        const title = c.querySelector('.HrGlossaryTerm__contentCtaTitle');
        if (title) {
          const h3 = document.createElement('h3');
          h3.textContent = title.innerHTML;
          title.replaceWith(h3);
        }
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
      '.HrGlossarySearch',
      '.HrGlossaryBreadcrumb',
    ]);

    const main = document.querySelector('body');

    this.rewriteLinks(main, document, entryParams.target);
    this.rewriteHeader(main, document);
    this.rewriteCallouts(main, document);
    this.createRelatedPostsBlock(main, document, entryParams.target);

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
