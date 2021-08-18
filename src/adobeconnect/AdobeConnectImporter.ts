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
import moment from 'moment';
import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';

const DEFAULT_AUTHOR = 'Adobe';
const DEFAULT_MAIN_CATEGORY = 'Adobe Connect';
const IMPORT_TOPIC = 'AdobeConnect Import';

export default class AdobeConnectImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  async handleAuthor(url: string, name: string) {
    const { document } = await this.get(url);
    if (document) {
      const content = document.querySelector('.post_author');

      content.querySelectorAll('h4').forEach((h) => {
        // upgrade to h4 to match template
        h.replaceWith(JSDOM.fragment(`<h2>${h.textContent}</h2>`));
      });

      return new PageImporterResource(name, 'authors', content, null);
    }
    return null;
  }

  async process(document: Document, url: string, entryParams: any): Promise<PageImporterResource[]> {
    const resources = [];
    const main = document.querySelector('#page section');

    WPUtils.handleCaptions(main);
    DOMUtils.replaceEmbeds(main);

    const heading = main.querySelector('.post_single_title h1');
    heading.after(JSDOM.fragment('<hr>'));

    // find hero image
    const hero = main.querySelector('.feature_image');

    let author = DEFAULT_AUTHOR;

    const authorContainer = document.querySelector('.date_category_author [rel="author"]');
    if (authorContainer) {
      author = authorContainer.textContent.trim();
      if (!entryParams || !entryParams.knownAuthors || entryParams.knownAuthors.indexOf(author) === -1) {
        const pir = await this.handleAuthor(authorContainer.getAttribute('href'), author);
        if (pir) {
          resources.push(pir);
        }
      }
    }

    // date
    const dateContainer = document.querySelector('.date_category_author');
    let folderDate = '';
    let authoredDate = '';
    if (dateContainer) {
      const d = moment(dateContainer.textContent, 'MMM DD, YYYY');
      folderDate = d.format('YYYY/MM/DD');
      authoredDate = d.format('MM-DD-YYYY');
      dateContainer.remove();
    }

    const content = main.querySelector('.post_single');

    // author and date
    content.before(JSDOM.fragment('<hr>'));
    content.before(JSDOM.fragment(`<p>by ${author}</p><p>Posted on ${authoredDate}</p>`));
    content.before(JSDOM.fragment('<hr>'));

    const serial = main.querySelector('.post_serial');
    if (serial) {
      content.before(serial);
    }

    // topics / products
    let topics = [DEFAULT_MAIN_CATEGORY];
    let products = [];
    const cats = document.querySelectorAll('.post_categories a');
    cats.forEach((cat) => {
      topics.push(cat.textContent.trim());
    });

    const tags = document.querySelectorAll('.post_tags a');
    tags.forEach((tag) => {
      const t = tag.textContent.trim().replace(/\s\(.*\)/gm, '');
      topics.push(t);
    });

    topics.push(IMPORT_TOPIC);

    topics = topics.filter((t, i) => topics.indexOf(t) === i);
    products = products.filter((t, i) => products.indexOf(t) === i);

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${topics.join(', ')}</p>
      <p>Products: ${products.join(', ')}</p>
    `));

    // final cleanup
    DOMUtils.remove(main, [
      '.date_category_author',
      '.addthis_inline_share_toolbox',
      '.post_categories',
      '.post_tags',
      '.article_supplement',
      '.post_navigation',
      '#discussion',
      '#comments',
      '.post_author',
      '.post_listing_navigation',
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
