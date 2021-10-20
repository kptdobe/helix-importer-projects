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

  rewriteLinks(main: Element): void {
    main.querySelectorAll('a').forEach((a) => {
      const { href, innerHTML } = a;
      // TODO: use outer cdn URL
      if (href.startsWith('https://blog.adobe.com/')) {
        a.href = href.replace('https://blog.adobe.com/', 'https://main--business-website--adobe.hlx3.page/');
        a.innerHTML = innerHTML.replace('https://blog.adobe.com/', 'https://main--business-website--adobe.hlx3.page/');
      }
    });
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      'footer',
    ]);

    const main = document.querySelector('main');

    this.updateHeadings(main, document);

    this.rewriteImgSrc(main);
    // this.rewriteLinks(main);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const name = p.name;

    const pir = new PageImporterResource(
      name,
      `banners/${name}`,
      main,
      null,
      {},
    );

    return [pir];
  }
}
