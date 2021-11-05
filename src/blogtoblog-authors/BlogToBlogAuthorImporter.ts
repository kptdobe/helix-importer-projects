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

  buildArticleFeed(main: Element, document: Document, entryParams?: any): void {
    const table = document.createElement('table');

    const head = document.createElement('tr');
    const blockTH = document.createElement('th');
    blockTH.textContent = 'Article Feed';
    head.append(blockTH);

    const row = document.createElement('tr');
    const keyTD = document.createElement('td');
    keyTD.textContent = 'Author';
    const nameTD = document.createElement('td');
    nameTD.textContent = main.querySelector('h1').textContent;
    row.append(keyTD, nameTD);
    table.append(head, row);

    // if (entryParams.target !== entryParams.transform) {
    //   const authorUrlRow = document.createElement('tr');
    //   const authorUrlKey = document.createElement('td');
    //   authorUrlKey.textContent = 'Author URL';
    //   const authorURLTD = document.createElement('td');
    //   const authorUrl = document.createElement('a');
    //   authorUrl.href = entryParams.transform;
    //   authorUrl.textContent = entryParams.transform;
    //   authorURLTD.append(authorUrl);
    //   authorUrlRow.append(authorUrlKey, authorURLTD);
    //   table.append(authorUrlRow);
    // }
    // const lineBreak = document.createElement('p');
    // lineBreak.textContent = '---';
    // main.append(lineBreak, table);
    main.append(table);
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      'footer',
    ]);

    const main = document.querySelector('main');

    this.updateHeadings(main, document);
    this.buildArticleFeed(main, document, entryParams);

    const u = new URL(entryParams.target);
    const p = path.parse(u.pathname);
    const name = p.name;

    const pir = new PageImporterResource(
      name,
      `authors`,
      main,
      null,
      {},
    );

    return [pir];
  }
}