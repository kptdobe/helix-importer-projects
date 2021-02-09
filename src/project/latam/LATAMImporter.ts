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

const DEFAULT_TOPIC = 'LATAM';
const DEFAULT_AUTHOR = 'Adobe';

export default class LATAMImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  async process(document: Document, url: string): Promise<PageImporterResource[]> {

    const main = document.querySelector('main');

    DOMUtils.remove(main, [
      '.post_navigation',
      '#discussion',
      '#comments',
    ]);

    WPUtils.handleCaptions(main);
    DOMUtils.replaceEmbeds(main);

    const heading = main.querySelector('.content h1');
    heading.after(JSDOM.fragment('<hr>'));

    const hero = main.querySelector('.post_image');

    // convert hero data-size image
    if (hero && hero.dataset) {
      const img = hero.dataset['size-6'] || hero.dataset['size-5'] || hero.dataset['size-4'] || hero.dataset['size-3'] || hero.dataset['size-2'] || hero.dataset['size-1'];
      if (img) {
        // add img as DOM element
        hero.append(JSDOM.fragment(`<img src="${img.replace(/url\((.*)\)/, '$1')}">`));
      }
    }

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

    const author = DEFAULT_AUTHOR;
    // // author and date
    content.before(JSDOM.fragment('<hr>'));
    content.before(JSDOM.fragment(`<p>by ${author}</p><p>Posted on ${authoredDate}</p>`));
    content.before(JSDOM.fragment('<hr>'));

    // topics / products
    const topics = [];
    const products = [];
    const cats = document.querySelectorAll('.post_categories a');
    cats.forEach((cat) => {
      products.push(cat.textContent.trim());
    });

    const tags = document.querySelectorAll('.post_tags a');
    tags.forEach((tag) => {
      const t = tag.textContent.trim().replace(/\s\(.*\)/gm, '');
      topics.push(t);
    });

    topics.push(DEFAULT_TOPIC);

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${topics.filter((t, i) => topics.indexOf(t) === i).join(', ')}</p>
      <p>Products: ${products.filter((t, i) => products.indexOf(t) === i).join(', ')}</p>
    `));

    // final cleanup
    DOMUtils.remove(main, [
      '.author',
      '.post_categories',
      '.post_tags'
    ]);

    WPUtils.genericDOMCleanup(main);

    // convert h4 -> h2
    main.querySelectorAll('h4').forEach((h) => {
      h.replaceWith(JSDOM.fragment(`<h2>${h.textContent}</h2>`));
    });

    // convert h5 -> h3
    main.querySelectorAll('h5').forEach((h) => {
      h.replaceWith(JSDOM.fragment(`<h3>${h.textContent}</h3>`));
    });

    const name = path.parse(new URL(url).pathname).name;

    const pir = new PageImporterResource(name, folderDate, main, null, {
      date: authoredDate,
      author,
      topics,
      products,
    });

    return [pir];
  }
}
