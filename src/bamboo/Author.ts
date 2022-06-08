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

    const category = document.querySelector('[property="article:section"]');
    if (category) {
      meta['Category'] = category.content;
    }

    const date = main.querySelector('.published');
    if (date) {
      const datetime = date.getAttribute('datetime');
      meta['Publication Date'] = datetime.substring(0, datetime.indexOf('T'));
    }

    const author = main.querySelector('[rel="author"]');
    if (author) {
      meta['Author'] = author;
    }

    const metatop = main.querySelector('.blogPostContent__metaTop');
    if (metatop) {
      const split = metatop.textContent.trim().split('\n');
      if (split.length === 3) {
        meta['Read Time'] = split[2];
      }
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

  createRelatedPostsBlock(main: Element, document: Document) {
    const related = document.querySelectorAll('.blogPostsBlock__titleLink');
    if (related) {
      const cells = [];
      cells.push(['Related Posts']);
      related.forEach((r) => {
        r.innerHTML = r.getAttribute('href');
        cells.push([r]);
      });
      const table = DOM.createTable(cells, document);
      main.append(table);
    }
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

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      'NavbarMobile',
      '.blogSearchIcon__container',
      'script',
      'noscript',
      '.Footer',
      '.blogSearch__overlay',
      '.blogPostBanner__extra',
      '.blogSocial',
      '.blogPostContentToc',
      '.blogPostContentSubscribe',
      '.blogPostAuthor',
      '.blogPostContent__ctaContainer',
    ]);

    const main = document.querySelector('.blogPostMain');

    this.cleanupHeadings(main, document);

    const title = document.querySelector('h1');

    let hero = document.querySelector('.blogPostBanner__img');
    if (hero) {
      hero = DOM.replaceBackgroundByImg(hero, document);
      if (title) hero.before(title);
    }

    this.createRelatedPostsBlock(main, document);

    const meta = this.createMetadata(main, document);

    DOMUtils.remove(document, [
      '.blogPostContent__meta',
      '.blogPostContent__metaTop',
    ]);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const subPath = 'blog' + s.filter((p, i) => i > 2).join('/');

    const pir = new PageImporterResource(name, subPath, main, null, {
      meta,
    });

    return [pir];
  }
}
