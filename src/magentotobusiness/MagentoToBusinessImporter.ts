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

export default class MagentoToBusinessImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  removeOldBlocks(element: Element, document: Document): void {
    const linksBlock = element.querySelector('.blog-links-container');
    if (linksBlock) {
      linksBlock.remove();
    }
  }

  removeTables(element: Element, document: Document): void {
    const tables = element.querySelectorAll('table');
    if (tables) {
      tables.forEach((table) => {
        const replacement = document.createElement('div');
        const firstRow = table.querySelector('tr');
        const numColumns = firstRow.children.length;
        const rows = table.querySelectorAll('tr');
        const numRows = rows.length;
        for (let i = 0; i < numColumns; i++) {
          rows.forEach((row) => {
            const cell = row.querySelectorAll('td')[i];
            replacement.insertAdjacentHTML('beforeend', cell.innerHTML);
          });
        }
        table.replaceWith(replacement);
      });
    }
  }

  convertPullQuotes(article: Element, document: Document): void {
    const blockquotes = article.querySelectorAll('blockquote');
    if (blockquotes) {
      blockquotes.forEach((quote) => {
        if (quote.textContent.includes('"') || quote.textContent.includes('“')) {
          // contains quotation marks
          if (quote.textContent.includes(' – ')) {
            const arr = quote.textContent.split(' – ');
            const attr = arr[arr.length - 1];
            if (attr) {
              // quote has attribution
              let q = quote.innerHTML.toString()
                .replace(` – ${attr}`, '');
              let qmark = q.indexOf('"');
              while (qmark > 0) {
                q = q
                .replace('"', '“')
                .replace('"', '”');
                qmark = q.indexOf('"');
              }
              quote.replaceWith(DOM.createTable([
                ['Pull Quote'],
                [`<p>${q}</p><p>${attr}<p>`],
              ], document));
            }
          } else {
            // quote has NO attribution
            let q = quote.innerHTML;
            let qmark = q.indexOf('"');
            while (qmark > 0) {
              q = q
              .replace('"', '“')
              .replace('"', '”');
              qmark = q.indexOf('"');
            }
            quote.replaceWith(DOM.createTable([
              ['Pull Quote'],
              [`<p>${q}</p>`],
            ], document));
          }
        } else {
          quote.replaceWith(DOM.createTable([
            ['Pull Quote'],
            [quote.innerHTML],
          ], document));
        }
      });
    }
  }


  convertEmbeds(article: Element, document: Document): void {
    const iframes = article.querySelectorAll('iframe');
    if (iframes) {
      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        if (iframe.src) {
          iframe.replaceWith(DOM.createTable([
            ['Embed'],
            [`<a href="${iframe.src}">${iframe.src}</a>`],
          ], document));
        }
      }
    }
  }

  convertImages(article: Element, document: Document): void {
    const imgsInAnchor = article.querySelectorAll('a > img');
    if (imgsInAnchor) {
      imgsInAnchor.forEach((img) => {
        const a = img.closest('a');
        if (a) {
          a.replaceWith(DOM.createTable([
            ['Images'],
            [`<p>${img.outerHTML}</p><p><a href="${a.getAttribute('href')}">${a.getAttribute('href')}</a></p>`],
          ], document));
        }
      });
    }
    const imgsInHeader = article.querySelectorAll('h1 > img, h2 > img, h3 > img, h4 > img, h5 > img, h6 > img, strong > img');
    if (imgsInHeader) {
      imgsInHeader.forEach((img) => {
        const heading = img.parentElement;
        const wrapper = document.createElement('div');
        const newHead = document.createElement(heading.nodeName.toLowerCase());
        newHead.textContent = heading.textContent;
        wrapper.append(newHead, img);
        heading.replaceWith(wrapper);
      });
    }
  }

  buildMetadataTable(head: Element, article: Element, document: Document, params: any): any {
    const table = document.createElement('table');
    const headRow = document.createElement('tr');
    table.append(headRow);
    const th = document.createElement('th');
    th.textContent = 'Metadata';
    headRow.append(th);

    const metaTitle = article.querySelector('h1');
    if (metaTitle) {
      const titleRow = document.createElement('tr');
      table.append(titleRow);
      const titleTitle = document.createElement('td');
      titleTitle.textContent = 'Title';
      titleRow.append(titleTitle);
      const titleData = document.createElement('td');
      titleData.textContent = metaTitle.textContent;
      titleRow.append(titleData);
    }

    const metaDesc = head
      .querySelector('meta[name~="description"]');
    if (metaDesc) {
      const desc = metaDesc.getAttribute('content');
      const descRow = document.createElement('tr');
      table.append(descRow);
      const descTitle = document.createElement('td');
      descTitle.textContent = 'Description';
      descRow.append(descTitle);
      const descData = document.createElement('td');
      descData.textContent = desc;
      descRow.append(descData);
    }

    let date;
    const metaDate = article.querySelector('.blog-date');
    if (metaDate) {
      const dateObj = new Date(metaDate.textContent);
      metaDate.remove();
      if (dateObj) {
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const dd = dateObj.getDate().toString().padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        date = `${mm}-${dd}-${yyyy}`;
        const dateRow = document.createElement('tr');
        table.append(dateRow);
        const dateTitle = document.createElement('td');
        dateTitle.textContent = 'Publication Date';
        dateRow.append(dateTitle);
        const dateData = document.createElement('td');
        dateData.textContent = date;
        dateRow.append(dateData);
      }
    }

    let author;
    const metaAuthor = article.querySelector('.blog-author-container');
    if (metaAuthor) {
      const a = metaAuthor.querySelector('p a[href^="/blog/author/"]');
      metaAuthor.remove();
      if (a) {
        author = a.textContent;
        const authorRow = document.createElement('tr');
        table.append(authorRow);
        const authorTitle = document.createElement('td');
        authorTitle.textContent = 'Author';
        authorRow.append(authorTitle);
        const authorData = document.createElement('td');
        authorData.textContent = author;
        authorRow.append(authorData);
      } else {
        author = metaAuthor.textContent.replace('By:', '');
        const authorRow = document.createElement('tr');
        table.append(authorRow);
        const authorTitle = document.createElement('td');
        authorTitle.textContent = 'Author';
        authorRow.append(authorTitle);
        const authorData = document.createElement('td');
        authorData.textContent = author;
        authorRow.append(authorData);
      }
    }

    article.append(table);

    return {
      author,
      date,
    };
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

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      'footer',
    ]);

    const head = document.querySelector('head');
    const article = document.querySelector('article');

    if (!article) {
      const errorPir = new PageImporterResource('error', `magento`, document.createElement('div'), null, {
        topics: null,
        tags: null,
        author: null,
        category: null,
        date: null,
        lang: null,
      });
      return [errorPir];
    }

    this.removeOldBlocks(article, document);
    this.removeTables(article, document);

    this.convertPullQuotes(article, document);
    this.convertEmbeds(article, document);
    this.convertImages(article, document);

    const meta = this.buildMetadataTable(head, article, document, entryParams);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const lang = 'en';

    const pir = new PageImporterResource(name, `magento`, article, null, {
      topics: 'meta.topics',
      tags: 'meta.tags',
      author: meta.author || null,
      category: 'meta.category',
      date: meta.date || null,
      lang,
    });

    return [pir];
  }
}
