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

import { PageImporter, PageImporterResource, DOMUtils, WPUtils } from '@adobe/helix-importer';

import fetch from 'node-fetch';
import path from 'path';
import { Response } from 'node-fetch';
import { Document } from 'jsdom';

import Blocks from '../utils/Blocks';
import DOM from '../utils/DOM';

export default class BlogToBlogImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  updateHeadings(main: Element, document: Document): void {
    const heading = main.querySelector('h1');
    if (!heading) {
      const nextHeading = main.querySelector('h2, h3, h4, h5, h6');
      const newHeading = document.createElement('h1');
      newHeading.textContent = nextHeading.textContent;
      nextHeading.replaceWith(newHeading);
    }
  }

  rewriteImgSrc(main: Element): void {
    main.querySelectorAll('img').forEach((img) => {
      const { src } = img;
      if (src && src.indexOf('?') !== -1) {
        img.src = src.split('?')[0];
      }
    });
  }

  buildRecommendedArticlesTable(element: Element, document: Document): void {
    element.querySelectorAll('main > div > h2').forEach((h2) => {
      if (h2.textContent.toLowerCase().startsWith('featured posts')) {
        const linksContainer = h2.nextElementSibling;
        if (linksContainer) {
          const links = Array.from(linksContainer.querySelectorAll('a'));

          const table = document.createElement('table');
          const headRow = document.createElement('tr');
          table.append(headRow);

          const th = document.createElement('th');
          headRow.append(th);

          if (links.length === 1) {
            th.textContent = 'Featured Article';
          } else if (links.length > 1) {
            th.textContent = 'Recommended Articles';
          }

          const bodyRow = document.createElement('tr');
          table.append(bodyRow);

          const td = document.createElement('td');
          links.forEach((a) => {
            const p = document.createElement('p');
            p.append(a);
            td.append(p);
          });
          bodyRow.append(td);

          h2.parentElement.replaceWith(table);
        }
      }
    });
  }

  buildArticleFeed(main: Element, document: Document): void {
    const table = document.createElement('table');

    const head = document.createElement('tr');
    const blockTH = document.createElement('th');
    blockTH.textContent = 'Article Feed';
    head.append(blockTH);

    const row = document.createElement('tr');
    const keyTD = document.createElement('td');
    keyTD.textContent = 'Topics';
    const nameTD = document.createElement('td');
    nameTD.textContent = main.querySelector('h1').textContent;
    row.append(keyTD, nameTD);

    const filter = main.querySelector('.embed-internal-filtersfull');
    if (filter) {
      const filterRow = document.createElement('tr');
      const filterTDs = `<td>Filter</td>
        <td>Full</td>`;
      filterRow.innerHTML = filterTDs;
      row.append(filterRow);
      filter.remove();
    }

    const ps = main.querySelectorAll('p');
    if (ps) {
      ps.forEach((p) => {
        if (p.textContent.toLowerCase().trim() === 'product filters') {
          const productFilterRow = document.createElement('tr');
          const productFilterTDs = `<td>Filter</td>
            <td>Products</td>`;
          productFilterRow.innerHTML = productFilterTDs;
          row.append(productFilterRow);
          p.remove();
        }
        if (p.textContent.toLowerCase().trim() === 'industry filters') {
          const productFilterRow = document.createElement('tr');
          const productFilterTDs = `<td>Filter</td>
            <td>Products</td>`;
          productFilterRow.innerHTML = productFilterTDs;
          row.append(productFilterRow);
          p.remove();
        }
      });
    }

    table.append(head, row);
    main.append(table);
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      'footer',
    ]);

    const main = document.querySelector('main');

    this.updateHeadings(main, document);
    this.buildRecommendedArticlesTable(main, document);
    this.buildArticleFeed(main, document);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const name = p.name;

    const pir = new PageImporterResource(
      name,
      `topics`,
      main,
      null,
      {},
    );

    return [pir];
  }
}
