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

const DEFAULT_TOPIC = 'Adobe Life';
const DEFAULT_AUTHOR = 'Adobe Life Team';

export default class AdobeLifeImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  replaceEmbeds(document: Document) {
    document.querySelectorAll('iframe').forEach((iframe) => {
      if (iframe.src) {
        iframe.after(JSDOM.fragment(`<hlxembed>${iframe.src}</hlxembed>`))
      }
      iframe.remove();
    });
  }

  process(document: Document, url: string): PageImporterResource[] {

    const main = document.querySelector('.content-area');

    DOMUtils.remove(main, [
      '.sticky-footer',
      '.articles-section',
      '.content-description',
      '.heading-line'
    ]);

    // embeds
    this.replaceEmbeds(main);

    // headings
    const hero = document.querySelector('.hero-article');

    // convert hero background image
    if (hero && hero.dataset.interchange) {
      const img = hero.dataset.interchange.match(/\[([^,]+), \w+\]$/)[1];
      if (img) {
        // add img as DOM element
        hero.append(JSDOM.fragment(`<img src="${img.replace(/url\((.*)\)/, '$1')}">`));
      }
    }

    // organise first part
    const headingContainer = document.querySelector('.heading-container');

    if (hero) {
      hero.parentNode.insertBefore(headingContainer, hero);
      hero.before(JSDOM.fragment('<hr>'));
    }

    // date
    const dateContainer = document.querySelector('.heading-container .heading p');
    let folderDate = '';
    let authoredDate = '';
    if (dateContainer) {
      const d = moment(dateContainer.textContent, 'MMM DD, YYYY');
      folderDate = d.format('YYYY/MM/DD');
      authoredDate = d.format('MM-DD-YYYY');
      dateContainer.remove();
    }

    // author and date
    hero.after(JSDOM.fragment('<hr>'));
    hero.after(JSDOM.fragment(`<p>by ${DEFAULT_AUTHOR}</p><p>Posted on ${authoredDate}</p>`));
    hero.after(JSDOM.fragment('<hr>'));

    // topic
    const tag = document.querySelector('.heading-container h2 a');
    const mainTopic = tag ? tag.textContent.trim() : '';
    tag.parentNode.remove();

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${mainTopic}, ${DEFAULT_TOPIC}</p>
      <p>Products:</p>
    `));

    const p = path.parse(new URL(url).pathname);
    const pir = new PageImporterResource(p.name, folderDate, main, null);

    return [pir];
  }
}
