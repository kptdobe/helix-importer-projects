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

    const cardImg = document.querySelector(
      '.Industry2Top__backgroundImage--laptop, .IndustryTop__backgroundImage--big',
    );
    if (cardImg) {
      const el = document.createElement('img');
      const src = cardImg.getAttribute('style').match(/\'([^)]+)\'/g)[0];
      el.src = `https:${src.replace(/'/g, '')}`;
      meta['Card Image'] = el;
    }

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  rewriteHeader(main: Element, document: Document) {
    main.querySelector('.Industry2Top__bottomLeaf, .IndustryTop__bottomLeaf')?.remove();
  }

  rewriteColumns(main: Element, document: Document) {
    const columns = main.querySelectorAll(
      '.Industry2Content__container, .IndustryContent .IndustryContent__container',
    );
    if (columns.length) {
      columns.forEach((block) => {
        const cells = [];
        cells.push(['Columns']);
        const cols = block.querySelectorAll('.Industry2Content__block, .IndustryContent__block');
        if (cols.length) {
          cols.forEach((col) => {
            const row = [];
            [...col.children].forEach((child) => {
              row.push([child]);
            });
            cells.push(row);
          });
          const table = DOM.createTable(cells, document);
          block.replaceWith(table);
        }
      });
    }
  }

  rewriteCTAs(main: Element, document: Document) {
    const ctas = main.querySelectorAll('.Industry2Content--leaf, [aria-label="CTA"], [aria-label="CTA Content"]');
    if (ctas.length) {
      ctas.forEach((c) => {
        const cells = [];
        cells.push(['Call to Action']);
        const content = c.querySelector('.Industry2Content__container');
        cells.push([content ? content.innerHTML.toString() : c.innerHTML.toString()]);
        const table = DOM.createTable(cells, document);
        c.replaceWith(table);
      });
    }
  }

  removeLeafs(main: Element, document: Document) {
    const leafs = main.querySelectorAll('img');
    if (leafs) {
      leafs.forEach((leaf) => {
        const alt = leaf.getAttribute('alt')?.toLowerCase();
        if (alt.includes('page leaf')) leaf.remove();
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
    ]);

    const main = document.querySelector('body');

    this.rewriteLinks(main, document, entryParams.target);
    this.rewriteHeader(main, document);
    this.rewriteCTAs(main, document);
    this.rewriteColumns(main, document);
    this.removeLeafs(main, document);

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
