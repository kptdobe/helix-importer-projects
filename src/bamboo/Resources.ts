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
  createMetadata(main: Element, document: Document, url: string): any {
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

    const cardImg = document.querySelector('img.AssetTopCopy__image');
    if (cardImg) {
      const el = document.createElement('img');
      el.src = cardImg.src;
      meta['Card Image'] = el;
    }

    const author = document.querySelector('.academyCourseAuthor__name');
    if (author) {
      meta['Author'] = author.textContent;
    }

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  rewriteAuthorSection(main: Element, document: Document) {
    const authorSection = main.querySelector('.academyCourseAuthor__container');
    if (authorSection) {
      const hr = document.createElement('hr');
      authorSection.prepend(hr);
      const author = authorSection.querySelector('.academyCourseAuthor__name');
      if (author) {
        const strong = document.createElement('strong');
        strong.textContent = author.textContent;
        author.innerHTML = strong.outerHTML;
      }
    }
  }

  rewriteDownloadModal(main: Element, document: Document) {
    const modal = main.querySelector('#ebook-form-modal');
    if (modal) {
      const cells = [];
      cells.push(['Modal'], [modal.innerHTML]);
      const table = DOM.createTable(cells, document);
      modal.replaceWith(table);
    }
  }

  buildEmbedBlocks(main: Element, document: Document) {
    const vids = main.querySelectorAll('.academyCourseMain__video');
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
      '.AssetTopForm__title--desktop',
    ]);

    const main = document.querySelector('body');

    this.rewriteLinks(main, document, entryParams.target);
    this.rewriteAuthorSection(main, document);
    this.rewriteDownloadModal(main, document);
    this.buildEmbedBlocks(main, document);

    const meta = this.createMetadata(main, document, url);

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
