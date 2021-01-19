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

const DEFAULT_MAIN_CATEGORY = '';
const IMPORT_TAG = 'Spark';

export default class SparkImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {

    const main = document.querySelector('main article');

    DOMUtils.remove(main, [
      '.aspark-breadcrumb',
    ]);

    WPUtils.handleCaptions(main);
    DOMUtils.replaceEmbeds(main);

    // insta embeds
    main.querySelectorAll('.instagram-media').forEach(insta => {
      const link = insta.getAttribute('data-instgrm-permalink');
      if (link) {
        insta.after(JSDOM.fragment(`<hlxembed>${link}</hlxembed>`));
      }
      insta.remove();
    });

    main.querySelectorAll('.twitter-tweet a:last-child').forEach(tweet => {
      const link = tweet.getAttribute('href');
      if (link) {
        tweet.parentNode.parentNode.after(JSDOM.fragment(`<hlxembed>${link}</hlxembed>`));
      }
      tweet.parentNode.parentNode.remove();
    });

    const heading = main.querySelector('h1.entry-title');
    // heading.after(JSDOM.fragment('<hr>'));

    const heroMeta = document.querySelector('meta[property="og:image"]')
    if (heroMeta) {
      const heroImage = heroMeta.getAttribute('content');
      if (heroImage && heading) {
        heading.append(JSDOM.fragment(`<img src="${heroImage}">`));
      }
    }

    // date
    const dateContainer = document.querySelector('.entry-time');
    let folderDate = '';
    let authoredDate = '';
    if (dateContainer) {
      const d = moment(dateContainer.textContent, 'MMM DD, YYYY');
      folderDate = d.format('YYYY/MM/DD');
      authoredDate = d.format('MM-DD-YYYY');
      dateContainer.remove();
    }

    const author = main.querySelector('[rel=author]').textContent;

    const content = main.querySelector('.entry-content');

    content.before(JSDOM.fragment(`<p>by ${author}</p><p>Posted on ${authoredDate}</p>`));

    const tagList = main.querySelectorAll('[rel=tag]');
    const tags = [];
    tagList.forEach(t => {
      tags.push(t.textContent.trim());
    })

    main.appendChild(JSDOM.fragment(`
      <p>Tags: ${tags.join(', ')}</p>
    `));

    // final cleanup
    DOMUtils.remove(main, [
      '.entry-meta',
      '.entry-footer',
    ]);

    WPUtils.genericDOMCleanup(main);

    const name = path.parse(new URL(url).pathname).name;

    const pir = new PageImporterResource(name, `${folderDate}`, main, null, {
      tags,
      author,
      date: authoredDate,
    });

    return [pir];
  }
}
