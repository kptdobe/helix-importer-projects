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

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  rewriteCallouts(main: Element, document: Document) {
    const callouts = main.querySelectorAll('.StickySideBar__content');
    if (callouts.length) {
      callouts.forEach((c) => {
        const cells = [];
        cells.push(['Callout (left)']);
        cells.push([c.innerHTML]);
        const title = c.querySelector('.typ-title1');
        if (title) {
          const h3 = document.createElement('h3');
          h3.textContent = title.innerHTML;
          title.replaceWith(h3);
        }
        const table = DOM.createTable(cells, document);
        c.replaceWith(table);
      });
    }
  }

  rewriteCTAs(main: Element, document: Document) {
    const ctas = main.querySelectorAll('.VirtualEbookMainCta, .VirtualEbookBottomCta');
    if (ctas.length) {
      ctas.forEach((c) => {
        const content = c.querySelector('.VirtualEbookMainCta__content, .VirtualEbook__container, .VirtualEbookMainCta__content--withImg');
        const title = content.querySelector('.VirtualEbookMainCta__title, .VirtualEbookBottomCta__title');
        if (title) {
          const h3 = document.createElement('h3');
          h3.textContent = title.innerHTML;
          title.replaceWith(h3);
        }
        const cells = [];
        cells.push(['Call to Action']);
        cells.push([content.innerHTML]);
        const table = DOM.createTable(cells, document);
        c.replaceWith(table);
      });
    }
  }

  rewriteColumns(main: Element, document: Document) {
    const columns = main.querySelectorAll('.VirtualEbookMainImgBlock + .VirtualEbookMainContentBlock');
    if (columns.length) {
      columns.forEach((c, i) => {
        const content = c.querySelector('.VirtualEbookMainContentBlock__container');
        const img = c.previousElementSibling;
        const cells = [];
        cells.push(['Columns']);
        if (i % 2 === 0) { // even, img first
          cells.push([
            [img.querySelector('img')],
            [content],
          ]);
        } else { // odd, content first
          cells.push([
            [content],
            [img.querySelector('img')],
          ]);
        }
        const table = DOM.createTable(cells, document);
        c.replaceWith(table);
        // img.remove();
      });
    }
  }

  rewriteQuotes(main: Element, document: Document) {
    const quotes = main.querySelectorAll('.VirtualEbookMainQuote__container');
    if (quotes.length) {
      quotes.forEach((q) => {
        const cells = [];
        cells.push(['Quote']);
        cells.push([q.innerHTML]);
        const table = DOM.createTable(cells, document);
        q.replaceWith(table);
      });
    }
  }

  buildEmbedBlock(main: Element, document: Document) {
    const vids = main.querySelectorAll('.ProductUpdatesLPMainIntro');
    if (vids.length) {
      vids.forEach((v) => {
        const cells = [];
        cells.push(['Embed'], ['']);
        const table = DOM.createTable(cells, document);
        v.replaceWith(table);
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
      '.ProductUpdatesLP__disclaimer',
    ]);

    const main = document.querySelector('body');

    this.rewriteLinks(main, document, entryParams.target);
    // this.rewriteHeader(main, document);
    // this.buildEmbedBlock(main, document);
    this.rewriteCallouts(main, document);
    this.rewriteColumns(main, document);
    this.rewriteCTAs(main, document);
    this.rewriteQuotes(main, document);

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
