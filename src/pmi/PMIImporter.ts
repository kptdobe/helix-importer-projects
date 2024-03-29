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

export default class PMIImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  rewriteLinks(main: Element, entries: any, target: string): void {
    main.querySelectorAll('a').forEach((a) => {
      const { href } = a;
      // TODO: use outer cdn URL
      if (!href || href === '') {
        a.remove();
      } else if (href.startsWith('https://www.pmi.com/markets/italy/it/')) {
        a.href = href.replace('https://www.pmi.com/markets/italy/it/', `${target}/it/`);
        if (a.innerHTML.startsWith('https://www.pmi.com/markets/italy/it/')) {
          a.innerHTML = a.innerHTML.replace('https://www.pmi.com/markets/italy/it/', `${target}/it/`);
        }
      } else if (href.startsWith('/markets/italy/it/')) {
        a.href = href.replace('/markets/italy/it/', `${target}/it/`);
        if (a.innerHTML.startsWith('/markets/italy/it/')) {
          a.innerHTML = a.innerHTML.replace('/markets/italy/it/', `${target}/it/`);
        }
      }
    });
  }

  rewriteImgs(main: Element): void {
    main.querySelectorAll('img').forEach((img) => {
      if (img.src) {
        try {
          const u = new URL(img.src);
          const w = u.searchParams.get('imwidth');
          if (w) {
            u.searchParams.set('imwidth', '1600');
            img.src = u.toString();
          }
        } catch (error) {
          // tslint:disable-next-line: no-console
          // console.error(`Invalid image src: ${img.src}`);
          img.remove();
        }
      } else {
        img.remove();
      }
    });
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

  buildRelated(main: Element, document: Document, selector: string, linksSelector: string, blockName: string, target: string): void {
    const related = main.querySelector(selector);
    if (related) {
      const table = document.createElement('table');
      const headRow = document.createElement('tr');
      table.append(headRow);

      const th = document.createElement('th');
      th.textContent = blockName;
      headRow.append(th);

      const bodyRow = document.createElement('tr');
      table.append(bodyRow);

      const td = document.createElement('td');

      let hasLink = false;
      related.querySelectorAll(linksSelector).forEach((a) => {
        hasLink = true;
        const href = `${target}/${a.getAttribute('href')}`.replace('/markets/italy/', '');
        a.setAttribute('href', href);
        a.innerHTML = href;
        a.removeAttribute('class');
        a.removeAttribute('tabIndex');
        const p = document.createElement('p');
        p.append(a);
        td.append(p);
      });
      bodyRow.append(td);

      if (hasLink) {
        related.replaceWith(table);
      } else {
        related.remove();
      }
    }
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

    const category = main.querySelector('.related-category--category');
    if (category) {
      meta['Category'] = category.innerHTML;
    }

    const date = main.querySelector('.page-info-widget-content--date');
    if (date) {
      meta['Publication Date'] = date.innerHTML;
    }

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  createIntroBlock(main: Element, document: Document) {
    main.querySelectorAll('.article-intro').forEach((intro) => {
      const a = intro.querySelector('a');
      if (a) {
        a.innerHTML = a.href;
        const p = document.createElement('p');
        p.append(a);

        if (intro.previousElementSibling && intro.previousElementSibling.classList.contains('article-intro-block')) {
          // insert in previous intro block
          const previousA = intro.previousElementSibling.querySelector('a');
          previousA.parentNode.parentNode.append(p);
          intro.remove();
        } else {
          const table = DOM.createTable([['Article Intro'], [p]], document);
          table.classList.add('article-intro-block');
          intro.replaceWith(table);
        }
      }
    });
  }

  createBlogLinkBlock(main: Element, document: Document) {
    main.querySelectorAll('a.investor-cta-widget-blue').forEach((a) => {
      a.innerHTML = a.querySelector('p').innerHTML;
      const container = a.parentElement;
      const table = DOM.createTable([['Blog Link'], [a]], document);
      container.replaceWith(table);
    });
  }

  createEmbedBlock(main: Element, document: Document) {
    main.querySelectorAll('[data-plyr-embed-id]').forEach((div) => {
      const embedId = div.getAttribute('data-plyr-embed-id');

      let url = embedId;
      if (!url.startsWith('http')) {
        url = `https://www.youtube.com/watch?v=${embedId}`;
      }
      const a = document.createElement('a');
      a.href = url;
      a.innerHTML = url;

      const table = DOM.createTable([['Embed'], [a]], document);
      div.replaceWith(table);
    });
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      '.nav-layout',
      'footer',
      'nav',
      '.social-share',
      '.blue-circles',
      'script',
      'noscript',
    ]);

    const main = document.querySelector('main');

    const meta = this.createMetadata(main, document);

    this.buildRelated(main, document, '.related-articles-partial', ':scope > div > div > a', 'Related Articles', entryParams.target);
    this.buildRelated(main, document, '.related-category', ':scope > div > a', 'Related Categories', entryParams.target);
    this.createIntroBlock(main, document);
    this.createBlogLinkBlock(main, document);
    this.createEmbedBlock(main, document);

    this.rewriteLinks(main, entryParams.allEntries, entryParams.target);
    this.rewriteImgs(main);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const subPath = s.filter((p, i) => i > 2).join('/');

    const pir = new PageImporterResource(name, subPath, main, null, {
      category: meta.Category,
    });

    return [pir];
  }
}
