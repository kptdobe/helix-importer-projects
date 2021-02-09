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

import { PageImporter, PageImporterResource, DOMUtils } from '@adobe/helix-importer';

import fetch from 'node-fetch';
import path from 'path';
import moment from 'moment';
import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';

// const DEFAULT_TOPIC = 'Creative Dialogue';

export default class XDImporter extends PageImporter {
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

  async process(document: Document, url: string, params: object[], raw: string): Promise<PageImporterResource[]> {

    const main = document.querySelector('main');

    DOMUtils.remove(main, [
      '.article-cta-container',
      '.related-article-border',
      '.post-author-bottom',
      '.share-icon-container',
      '.related-content-header-wrapper'
    ]);

    // embeds
    this.replaceEmbeds(main);

    const heading = main.querySelector('.article-title-wrapper h1');
    heading.after(JSDOM.fragment('<hr>'));

    const hero = document.querySelector('.article-image-wrapper');
    if (hero) {
      // JSDOM does not support pseudo, need to extra "manually" the url
      const regex = /\.hasWebp \.article-featured-image-test:after \{.*\n.*background-image: url\('(.*)'.*\n.*\}/gm;
      const src = regex.exec(raw);
      if (src && src.length > 0) {
        // add img as DOM element
        hero.append(JSDOM.fragment(`<img src="${src[1]}">`));
      }
      const heroCaption = document.querySelector('.article-featured-image-caption');
      if (heroCaption) {
        hero.after(heroCaption);
      }
    }

    const content = main.querySelector('.article-body-wrapper');

    // date
    const dateContainer = document.querySelector('.post-author-info .post-date');
    let folderDate = '';
    let authoredDate = '';
    if (dateContainer) {
      const d = moment(dateContainer.textContent, 'MMM DD, YYYY');
      folderDate = d.format('YYYY/MM/DD');
      authoredDate = d.format('MM-DD-YYYY');
    }


    // author and date
    const authorContainer = document.querySelector('.post-author-info .post-author');
    let author = '';
    if (authorContainer) {
      author = authorContainer.textContent;
    }

    content.before(JSDOM.fragment('<hr>'));
    content.before(JSDOM.fragment(`<p>by ${author}</p><p>Posted on ${authoredDate}</p>`));
    content.before(JSDOM.fragment('<hr>'));

    // topics / products
    const topics = [];
    const cats = document.querySelectorAll('.article-breadcrumbs a');
    cats.forEach((cat) => {
      topics.push(cat.textContent.trim());
    });

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${topics.length > 0 ? topics.join(', ') : ''}</p>
      <p>Products:</p>
    `));

    this.replaceCaptions(main, ['figcaption', '.article-featured-image-caption']);

    // final cleanup
    DOMUtils.remove(main, [
      '.article-byline-wrapper',
      '.article-top-section',
      '.category-eyebrow',
      '.article-tag',
      '.article-breadcrumbs'
    ]);

    const hostname = new URL(url).origin;
    main.querySelectorAll('img').forEach((img) => {
      if (img.src.indexOf('data:') === 0) {
        // remove B64 images
        img.remove();
      } else {
        // append host to images
        if (img.src.indexOf('http') !== 0) {
          img.src = `${hostname}${img.src}`;
        }
      }
    });

    const p = path.parse(new URL(url).pathname);
    const pir = new PageImporterResource(p.name, folderDate, main, null);

    return [pir];
  }
}
