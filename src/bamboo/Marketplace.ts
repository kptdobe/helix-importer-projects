/*
 * Copyright 2020 Adobe. All rights reserved.
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

  cleanupHeadings(main: Element, document: Document) {
    main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      h.innerHTML = h.textContent;
    });
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

  /* SPECIFICS */
  createMetadata(main: Element, document: Document): any {
    const meta = {};

    const title = document.querySelector('title');
    if (title) {
      meta['Title'] = title.innerHTML.replace(/[\n\t]/gm, '');
    }

    const desc = document.querySelector('[property="og:description"]');
    if (desc) {
      meta['Description'] = desc.content;
    }

    const img = document.querySelector('[property="og:image"]');
    if (img) {
      const el = document.createElement('img');
      el.src = img.content;
      meta['Image'] = el;
    }

    const categories = document.querySelectorAll('.mkpListingBreadcrumb a[href*="listing_category"');
    if (categories.length) {
      if (categories[0]) {
        meta['Category'] = categories[0].textContent;
      }
      if (categories[1]) {
        meta['Sub Category'] = categories[1].textContent.replace(',', '').trim();
      }
    }

    const blocks = document.querySelectorAll('.mkpListingIntgHighlights__block');
    if (blocks.length) {
      meta['Integration Type'] = blocks[0].querySelector('.mkpListingIntgHighlights__blockDesc').textContent;
      meta['Direction of Data Flow'] = blocks[1]?.querySelector('.mkpListingIntgHighlights__blockDesc').textContent;
      meta['Sync Trigger'] = blocks[2]?.querySelector('.mkpListingIntgHighlights__blockDesc').textContent;
      meta['Sync Frequency'] = blocks[3]?.querySelector('.mkpListingIntgHighlights__blockDesc').textContent;
    }

    const logo = document.querySelector('.mkpListingDetails__logo');
    if (logo) {
      const el = document.createElement('img');
      el.src = logo.getAttribute('data-src');
      meta['Logo'] = el;
    }

    const level = document.querySelector('.mkpListingDetails__tierImg');
    if (level) {
      const src = level.getAttribute('data-src');
      if (src.includes('pro')) {
        meta['Level'] = 'Pro';
      } else if (src.includes('elite')) {
        meta['Level'] = 'Elite';
      }
    }

    const publisher = document.querySelector('.mkpListingPublisherInfo__item');
    if (publisher) {
      meta['Publisher'] = publisher.textContent;
    }

    meta['Tags'] = '';
    meta['Listing Type'] = '';
    meta['Discover Apps'] = '';
    meta['Business Size'] = '';
    meta['Data Flow'] = '';
    meta['Industry Served'] = '';

    const location = document.querySelector('#field_2_27');
    if (location) {
      const loc = location.querySelector('label')?.textContent;
      const restrictions = [];
      if (loc.includes('Australia')) restrictions.push('Australia only');
      if (loc.includes('New Zealand')) restrictions.push('New Zealand only');
      if (loc.includes('United Kingdom')) restrictions.push('United Kingdom only');

      if (restrictions.length) {
        meta['Location Restrictions'] = restrictions.join(', ').trim();
      }
    }

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    DOMUtils.remove(document, [
      '[id*="modal"]',
      '[class*="modal"]',
      '.js-open-modal',
      '.Modal',
      '.mkpListingBreadcrumb',
      '.mkpListingIntgHighlights__wrap',
      '.mkpListingDetails__left img',
    ]);

    return meta;
  }

  rewriteTabs(main: Element, document: Document): any {
    const panels = main.querySelectorAll('.mkpListingTabs__panel');
    if (panels) {
      panels.forEach((panel) => {
        // adjust headings
        const hs = panel.querySelectorAll('h2, h4');
        hs.forEach((h) => {
          const h3 = document.createElement('h3');
          h3.textContent = h.textContent;
          h.replaceWith(h3);
        });
        // fix title
        const a = panel.querySelector('a');
        const title = document.createElement('h2');
        title.textContent = a.textContent;
        a.replaceWith(title);
      });
    }
  }

  rewriteSyncTable(main: Element, document: Document): any {
    const table = main.querySelector('.mkpListingTable');
    if (table) {
      const body = table.querySelector('tbody');
      // rewrite current head
      const headCells = table.querySelectorAll('thead th');
      const row = document.createElement('tr');
      headCells.forEach((cell) => {
        const td = document.createElement('td');
        td.innerHTML = `<strong>${cell.textContent}</strong>`;
        row.append(td);
      });
      if (row.children) body.prepend(row);
      table.querySelector('thead').remove();
      // add block head
      const numCols = body.querySelectorAll('tr:last-child td').length;
      const head = document.createElement('thead');
      head.innerHTML = `<tr><th colspan="${numCols}"><strong>Table (Data Sync)</strong></th></tr>`;
      table.prepend(head);
      // rewrite arrows
      const arrows = table.querySelectorAll('img');
      arrows.forEach((arrow) => {
        const direction = new URL(arrow.getAttribute('data-src')).pathname.split('/');
        const svg = direction[direction.length - 1].replace('.svg', '');
        const text = document.createTextNode(`:${svg}:`);
        arrow.replaceWith(text);
      });
    }
  }

  rewritePublisherInfo(main: Element, document: Document): any {
    const container = main.querySelector('.mkpListingPublisherInfo__container');
    if (container) {
      [...container.children]?.forEach((item) => {
        const title = item.querySelector('.mkpListingPublisherInfo__title');
        const h4 = document.createElement('h4');
        h4.textContent = title.textContent;
        title.replaceWith(h4);
      });
      const hr = document.createElement('hr');
      container.prepend(hr);
    }
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      '.NavbarMobile',
      '.acc-out-of-view',
      'iframe',
      'script',
      'noscript',
      'footer',
      '.Footer',
      'img[src*="leaf"]',
      'img[src*="curve"]',
      '.skip-link',
      '.js-search-icon',
      '.mkpSearch__overlay',
      '.um_upload_single',
      '.um_view_photo',
      '.mkpListingTabs',
      '.slick-cloned',
      '.mkpListingDetails__installBtn',
    ]);

    const main = document.querySelector('body');

    this.rewriteLinks(main, document, entryParams.target);
    this.cleanupHeadings(main, document);
    this.rewriteTabs(main, document);
    this.rewriteSyncTable(main, document);
    this.rewritePublisherInfo(main, document);

    const meta = this.createMetadata(main, document);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const subPath = s.filter((p, i) => { if (i > 1) return p; }).join('/');

    const pir = new PageImporterResource(name, subPath, main, null, {
      meta,
    });

    return [pir];
  }
}
