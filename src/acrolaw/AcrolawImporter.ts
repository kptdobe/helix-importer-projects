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
const DEFAULT_MAIN_CATEGORY = 'acrolaw';

export default class AcrolawImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  async process(document: Document, url: string, entryParams: any): Promise<PageImporterResource[]> {

    const resources = [];
    const main = document.querySelector('#main');

    WPUtils.handleCaptions(main);
    DOMUtils.replaceEmbeds(main);

    const heading = main.querySelector('.entry-title');

    heading.after(JSDOM.fragment('<hr>'));

    // date
    const dateContainer = document.querySelector('#primary .entry-left-text');
    let folderDate = '';
    let authoredDate = '';
    if (dateContainer) {
      const d = moment(dateContainer.textContent, 'MMM DD, YYYY');
      folderDate = d.format('YYYY/MM/DD');
      authoredDate = d.format('MM-DD-YYYY');
      dateContainer.remove();
    }

    const content = main.querySelector('.entry-content');

    let author = DEFAULT_AUTHOR;
    const $author = document.querySelector('#primary .entry-header');
    if ($author) {
      author = $author.textContent.charAt(0).toLowerCase() + $author.textContent.slice(1);
    }

    // author and date
    content.before(JSDOM.fragment('<hr>'));
    content.before(JSDOM.fragment(`<p>${author}</p><p>Posted on ${authoredDate}</p>`));
    content.before(JSDOM.fragment('<hr>'));

    const serial = main.querySelector('.post_serial');
    if (serial) {
      content.before(serial);
    }

    // topics / products
    const topics = [DEFAULT_MAIN_CATEGORY];
    const products = [];

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${topics.join(', ')}</p>
      <p>Products: ${products.join(', ')}</p>
    `));

    // final cleanup
    DOMUtils.remove(main, [
      '#breadcrumb',
      '#primary',
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
