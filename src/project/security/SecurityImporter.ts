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

import PageImporter from '../../product/importer/PageImporter';
import PageImporterResource from '../../product/importer/PageImporterResource';

import fetch from 'node-fetch';
import path from 'path';
import moment from 'moment';
import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';
import DOMUtils from '../../product/utils/DOMUtils';
import WPUtils from '../wp/WPUtils';

const DEFAULT_AUTHOR = 'Adobe';
const DEFAULT_MAIN_CATEGORY = 'Security';

export default class SecurityImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  async handleAuthor(url: string, name: string) {
    const { document } = await this.get(url);
    if (document) {
      const content = document.querySelector('.author');

      content.querySelectorAll('h1').forEach(h => {
        // downgrade to h2 to match template
        h.replaceWith(JSDOM.fragment(`<h2>${h.textContent}</h2>`));
      });

      return new PageImporterResource(name, 'authors', content, null);
    }
    return null;
  }

  async process(document: Document, url: string, entryParams: any): Promise<PageImporterResource[]> {

    const resources = [];
    const main = document.querySelector('main');

    WPUtils.handleCaptions(main);
    DOMUtils.replaceEmbeds(main);

    const heading = main.querySelector('.content h1');

    // find hero image
    const hero = main.querySelector('.post_image');

    if (hero) {
      if (hero && hero.dataset) {
        const img = hero.dataset['size-6'] || hero.dataset['size-5'] || hero.dataset['size-4'] || hero.dataset['size-3'] || hero.dataset['size-2'] || hero.dataset['size-1'];
        if (img) {
          // add img as DOM element
          hero.append(JSDOM.fragment(`<img src="${img.replace(/url\((.*)\)/, '$1')}">`));
        }
      }
    }

    heading.after(JSDOM.fragment('<hr>'));

    // date
    const dateContainer = document.querySelector('.author .author_date');
    let folderDate = '';
    let authoredDate = '';
    if (dateContainer) {
      const d = moment(dateContainer.textContent, 'MM-DD-YYYY');
      folderDate = d.format('YYYY/MM/DD');
      authoredDate = d.format('MM-DD-YYYY');
      dateContainer.remove();
    }

    const content = main.querySelector('.post_content');

    let author = DEFAULT_AUTHOR;

    const authorContainer = main.querySelector('.author_link a');
    if (authorContainer) {
      author = authorContainer.textContent.trim();
      if (!entryParams || !entryParams.knownAuthors || entryParams.knownAuthors.indexOf(author) === -1) {
        const pir = await this.handleAuthor(authorContainer.getAttribute('href'), author);
        if (pir) {
          resources.push(pir);
        }
      }
    }

    // author and date
    content.before(JSDOM.fragment('<hr>'));
    content.before(JSDOM.fragment(`<p>by ${author}</p><p>Posted on ${authoredDate}</p>`));
    content.before(JSDOM.fragment('<hr>'));

    const serial = main.querySelector('.post_serial');
    if (serial) {
      content.before(serial);
    }

    // topics / products
    const topics = [DEFAULT_MAIN_CATEGORY];
    const products = [];
    const cats = document.querySelectorAll('.post_categories a');
    cats.forEach((cat) => {
      topics.push(cat.textContent.trim());
    });

    const tags = document.querySelectorAll('.article-tag-link li a');
    tags.forEach((tag) => {
      const t = tag.textContent.trim().replace(/\s\(.*\)/gm, '');
      topics.push(t);
    });

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${topics.filter((t, i) => topics.indexOf(t) === i).join(', ')}</p>
      <p>Products: ${products.filter((t, i) => products.indexOf(t) === i).join(', ')}</p>
    `));

    // final cleanup
    DOMUtils.remove(main, [
      '.author',
      '.post_categories',
      '.post_tags',
      '.article_supplement',
      '.post_navigation',
      '#discussion',
      '#comments',
    ]);

    WPUtils.genericDOMCleanup(main);

    const name = path.parse(new URL(url).pathname).name;

    resources.push(new PageImporterResource(name, folderDate, main, null, {
      author,
      topics,
      products,
      date: authoredDate,
    }));

    return resources;
  }
}
