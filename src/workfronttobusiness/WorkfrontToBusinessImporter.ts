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

export default class WorkfrontToBusinessImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  reorganizeHeader(element: Element, document: Document): void {
    const title = element.querySelector('.blog-body h1');
    const h1 = document.createElement('h1');
    h1.textContent = title.textContent;
    title.remove();
    element.prepend(h1);
  }

  removeOldBlocks(element: Element, document: Document): void {
    const socialBlock = element.querySelector('.blog-social-share-block');
    if (socialBlock) {
      socialBlock.remove();
    }
    const subscribeBlock = element.querySelector('.blog-subscribe-form-block');
    if (subscribeBlock) {
      subscribeBlock.remove();
    }
    const blogBody = element.querySelector('.blog-body');
    if (blogBody) {
      blogBody.querySelectorAll('p').forEach((p) => {
        if (p.textContent.trim() === '***') {
          p.remove();
        } else if (p.textContent.trim() === '```') {
          p.remove();
        }
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
      .querySelector('meta[name~="description"]')
      .getAttribute('content');
    if (metaDesc) {
      const descRow = document.createElement('tr');
      table.append(descRow);
      const descTitle = document.createElement('td');
      descTitle.textContent = 'Description';
      descRow.append(descTitle);
      const descData = document.createElement('td');
      descData.textContent = metaDesc;
      descRow.append(descData);
    }

    let author;
    const authorContainer = article.querySelector('.field--name-body');
    if (authorContainer) {
      const p = authorContainer.querySelector('p');
      if (p.textContent.toLowerCase().startsWith('by ')) {
        author = p.textContent.replace('By ', '');
        const authorRow = document.createElement('tr');
        table.append(authorRow);
        const authorTitle = document.createElement('td');
        authorTitle.textContent = 'Author';
        authorRow.append(authorTitle);
        const authorData = document.createElement('td');
        authorData.textContent = author;
        authorRow.append(authorData);
        p.remove();
      }
    }

    let date;
    const dateHead = article.querySelector('.blog-container h5');
    if (dateHead) {
      const dateStr = /[A-Za-z]+\s\d{1,2},\s\d{4}/.exec(dateHead.textContent)[0];
      const dateObj = new Date(dateStr);
      if (dateStr && dateObj) {
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
        dateHead.remove();
      }
    }

    article.append(table);

    return {
      author,
      date,
    };
  }

  convertPullQuotes(article: Element, document: Document): void {
    const blockquotes = article.querySelectorAll('blockquote');
    if (blockquotes) {
      blockquotes.forEach((quote) => {
        if (quote.textContent.includes('"')) {
          // contains quotation marks
          if (quote.textContent.includes(' - ')) {
            const arr = quote.textContent.split(' - ');
            const attr = arr[arr.length - 1];
            if (attr) {
              // quote has attribution
              let q = quote.innerHTML.toString()
                .replace(` - ${attr}`, '');
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

    this.reorganizeHeader(article, document);
    this.removeOldBlocks(article, document);

    this.convertPullQuotes(article, document);
    this.convertEmbeds(article, document);
    this.convertImages(article, document);

    const meta = this.buildMetadataTable(head, article, document, entryParams);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const lang = 'en';

    const pir = new PageImporterResource(name, 'workfront', article, null, {
      topics: 'topics',
      tags: 'tags',
      author: meta.author || null,
      category: 'category',
      date: meta.date || null,
      lang,
    });

    return [pir];
  }
}
