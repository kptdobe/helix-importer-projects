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

    this.rewriteLinks(main, entryParams.allEntries, entryParams.target);
    this.buildRelated(main, document, '.related-articles-partial', ':scope > div > div > a', 'Related Articles', entryParams.target);
    this.buildRelated(main, document, '.related-category', ':scope > div > a', 'Related Category', entryParams.target);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const category = s[s.length - 1];

    const pir = new PageImporterResource(name, `${category}`, main, null, {
      category,
    });

    return [pir];
  }
}
