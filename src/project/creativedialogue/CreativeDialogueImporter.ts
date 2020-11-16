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

const DEFAULT_TOPIC = 'Creative Dialogue';
const DEFAULT_AUTHOR = 'Adobe Korea';

export default class CreativeDialogueImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  replaceEmbeds(document: Document) {
    document.querySelectorAll('iframe').forEach((iframe) => {
      if (iframe.src) {
        iframe.after(JSDOM.fragment(`<hlxembed>${iframe.src}</hlxembed>`));
      }
      iframe.remove();
    });

    document.querySelectorAll('video').forEach((video) => {
      const anim = JSDOM.fragment(`<table><tr><th>Animation</th></tr><tr><td>${video.outerHTML}</td></tr></table>`);
      video.replaceWith(anim);
    });
  }

  replaceCaptions(document: Document, selectors: string[]) {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((elem) => {
        const captionText = elem.textContent.trim();
        elem.parentNode.insertBefore(JSDOM.fragment(`<p><em>${captionText}</em><p>`), elem);
        elem.remove();
      })
    });
  }

  process(document: Document, url: string): PageImporterResource[] {

    const main = document.querySelector('main');

    DOMUtils.remove(main, [
      '.post_navigation',
      '#discussion',
      '#comments',
      '.content > .post_categories'
    ]);

    // embeds
    this.replaceEmbeds(main);
    this.replaceCaptions(main, ['.wp-caption-text']);

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

    // // author and date
    content.before(JSDOM.fragment('<hr>'));
    content.before(JSDOM.fragment(`<p>by ${DEFAULT_AUTHOR}</p><p>Posted on ${authoredDate}</p>`));
    content.before(JSDOM.fragment('<hr>'));

    // topics / products
    const topics = [];
    const products = [];
    const cats = document.querySelectorAll('.post_categories a');
    cats.forEach((cat) => {
      topics.push(cat.textContent.trim());
    });

    const tags = document.querySelectorAll('.post_tags a');
    tags.forEach((tag) => {
      const t = tag.textContent.trim().replace(/\s\(.*\)/gm, '');
      products.push(t);
    });

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${topics.length > 0 ? topics.join(', ') + ', ' : ''}${DEFAULT_TOPIC}</p>
      <p>Products: ${products.join(', ')}</p>
    `));

    // final cleanup
    DOMUtils.remove(main, [
      '.author',
      '.post_categories',
      '.post_tags'
    ]);

    // convert h4 -> h2
    main.querySelectorAll('h4').forEach((h) => {
      h.replaceWith(JSDOM.fragment(`<h2>${h.textContent}</h2>`));
    });

    // convert h5 -> h3
    main.querySelectorAll('h5').forEach((h) => {
      h.replaceWith(JSDOM.fragment(`<h3>${h.textContent}</h3>`));
    });

    const p = path.parse(new URL(url).pathname);
    const pir = new PageImporterResource(p.name, folderDate, main, null);

    return [pir];
  }
}
