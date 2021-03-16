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
      let link = insta.getAttribute('data-instgrm-permalink');
      if (!link) {
        const a = insta.querySelector('a:last-child')
        if (a) {
          link = a.href;
        }
      }

      if (link) {
        insta.after(DOMUtils.generateEmbed(link));
      }
      insta.remove();
    });

    main.querySelectorAll('.twitter-tweet p:last-child a').forEach(tweet => {
      const link = tweet.getAttribute('href');
      if (link) {
        tweet.parentNode.parentNode.after(DOMUtils.generateEmbed(link));
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

    main.append(JSDOM.fragment(`<p>Tags: ${tags.join(', ')}</p>`));

    const findTOCNode = (doc) => {
      let parent = null;
      doc.querySelectorAll('b,strong').forEach(b => {
        const txt = b.textContent ? b.textContent.trim().toLowerCase().replace(/[\.\:]/gm, '') : null;
        if ('table of contents' === txt) {
          parent = b.parentNode;
        }
      });
      return parent;
    }

    const toc = findTOCNode(main);
    if (toc) {
      toc.before(JSDOM.fragment(`<table><tr><th>Table of Contents</th></tr><tr><td>Levels</td><td>1</td></tr></table>`));
      const list = toc.nextElementSibling;
      if (list && (list.tagName === 'UL' || list.tagName === 'OL')) {
        list.remove();
      }
      toc.remove();
    }

    // final cleanup
    DOMUtils.remove(main, [
      '.entry-meta',
      '.entry-footer',
    ]);

    WPUtils.genericDOMCleanup(main);

    const parsed = path.parse(new URL(`https://${entryParams.target}`).pathname);
    const name = parsed.name;

    const pir = new PageImporterResource(name, parsed.dir, main, null, {
      tags,
      author,
      date: authoredDate,
    });

    return [pir];
  }
}
