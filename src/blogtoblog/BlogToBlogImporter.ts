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

import DOM from '../utils/DOM';
import Blocks from '../utils/Blocks';

export default class BlogToBlogImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  convertBlocksToTables(element: Element, document: Document): void {
    element.querySelectorAll('main > div:nth-child(4) > div[class]').forEach(block => {
      const name = Blocks.computeBlockName(block.className);
      const data = [[name]] as (string|Element)[][];
      const divs = block.querySelectorAll(':scope > div');
      if (divs) {
        divs.forEach((div: Element) => {
          const subDivs = div.querySelectorAll(':scope > div');
          if (subDivs && subDivs.length > 0) {
            const rowData = [];
            subDivs.forEach((cell: Element) => {
              if (cell.nodeName === 'DIV') {
                // remove transparent divs
                Array.from(cell.childNodes).forEach((c) => rowData.push(c));
              } else {
                rowData.push(cell);
              }
            });
            data.push(rowData);
          } else {
            data.push([div.innerHTML]);
          }
        });
      }
      const table = DOM.createTable(data, document);
      block.replaceWith(table);
    });
  }

  buildRecommendedArticlesTable(element: Element, document: Document): void {
    element.querySelectorAll('main > div > h2').forEach(h2 => {
      if (h2.textContent.toLowerCase().startsWith('featured posts')) {
        const linksContainer = h2.nextElementSibling;
        if (linksContainer) {
          const links = Array.from(linksContainer.querySelectorAll('a'));

          const table = document.createElement('table');
          const headRow = document.createElement('tr');
          table.append(headRow);

          const th = document.createElement('th');
          th.textContent = 'recommended articles';
          headRow.append(th);

          const bodyRow = document.createElement('tr');
          table.append(bodyRow);

          const td = document.createElement('td');
          links.forEach((a) => {
            td.append(a, `\n`);
          })
          bodyRow.append(td);

          h2.parentElement.replaceWith(table);
        }
      }
    })
  }

  buildMetadataTable(element: Element, document: Document): void {
    const table = document.createElement('table');
    const headRow = document.createElement('tr');
    table.append(headRow);
    const th = document.createElement('th');
    th.textContent = 'metadata';
    headRow.append(th);

    // TODO: fetch post description

    const [ authorStr, dateStr ] = Array
      .from(element.querySelectorAll('main > div:nth-child(3) > p'))
      .map((p) => { return p.textContent });
    element.querySelector('main > div:nth-child(3)').remove();

    let author;
    let date;
    if (authorStr) {
      author = authorStr.replace('By ', '');
      const authorRow = document.createElement('tr');
      table.append(authorRow);
      const authorTitle = document.createElement('td');
      authorTitle.textContent = 'Author';
      authorRow.append(authorTitle);
      const authorData = document.createElement('td');
      authorData.textContent = author;
      authorRow.append(authorData);
    }
    if (dateStr) {
      date = dateStr.replace('Posted on ', '');
      const dateRow = document.createElement('tr');
      table.append(dateRow);
      const dateTitle = document.createElement('td');
      dateTitle.textContent = 'Publication Date';
      dateRow.append(dateTitle);
      const dateData = document.createElement('td');
      dateData.textContent = date;
      dateRow.append(dateData);
    }

    let topics;
    const topicsArr = [];
    const [ topicsStr, productsStr ] = Array
      .from(element.querySelectorAll('main > div:last-child > p'))
      .map((p) => { return p.textContent });
    element.querySelector('main > div:last-child').remove();
    if (topicsStr || productsStr) {
      (topicsStr + productsStr)
        .replace('Topics: ', '')
        .replace('Products: ', '')
        .split(',')
        .forEach((topic) => {
          if (topic.trim().length) {
            topicsArr.push(topic.trim());
          }
        });
    }

    let category;
    if (topicsArr.length) {
      category = topicsArr.shift();
      topics = topicsArr.join(', ');
      const categoryRow = document.createElement('tr');
      table.append(categoryRow);
      const categoryTitle = document.createElement('td');
      categoryTitle.textContent = 'Category';
      categoryRow.append(categoryTitle);
      const categoryData = document.createElement('td');
      categoryData.textContent = category;
      categoryRow.append(categoryData);
      if (topics.length) {
        const topicsRow = document.createElement('tr');
        table.append(topicsRow);
        const topicsTitle = document.createElement('td');
        topicsTitle.textContent = 'Topics';
        topicsRow.append(topicsTitle);
        const topicsData = document.createElement('td');
        topicsData.textContent = topics;
        topicsRow.append(topicsData);
      }
    }
    element.append(table);
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {

    DOMUtils.remove(document, [
      'header',
      'footer',
    ]);

    const main = document.querySelector('main');
    // TODO: convert all blocks back to tables
    this.convertBlocksToTables(main, document);

    // TODO: rename "Promotion" block to "Banner"
    // TODO: check if more blocks need conversion
    // TODO: convert "featured articles" section to table
    this.buildRecommendedArticlesTable(main, document);
    // TODO: create metadata table from... metadata
    this.buildMetadataTable(main, document);
    // TODO: extact author / date and merge into metadata table (may not exist)
    // TODO: extact topics / products and merge into metadata table (may not exist)

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = p.name;
    const lang = s[1];
    const folder = `${s[3]}/${s[4]}/${s[5]}`;
    const date = `${s[4]}-${s[5]}-${s[3]}`;

    const pir = new PageImporterResource(name, `${lang}/${folder}`, main, null, {
      topics: [],
      products: [],
      author: '',
      date,
      lang
    });

    return [pir];
  }
}
