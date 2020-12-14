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

const DEFAULT_MAIN_CATEGORY = 'Digital Transformation';
const IMPORT_TAG = 'Digital EMEA';

export default class DigitalEuropeImporter extends PageImporter {
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
      const anim = JSDOM.fragment(`<table><tr><th>Video</th></tr><tr><td>${video.outerHTML}</td></tr></table>`);
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

  process(document: Document, url: string, entryParams?: any): PageImporterResource[] {

    const main = document.querySelector('main');

    DOMUtils.remove(main, [
      '.post_navigation',
      '#discussion',
      '#comments',
      '.content > .post_categories'
    ]);

    this.replaceCaptions(main, ['.wp-caption-text']);

    // an h5 following an image / video is a caption
    main.querySelectorAll('p img, video').forEach(item => {
      if ((item.parentNode.nextElementSibling && item.parentNode.nextElementSibling.tagName === 'H5') ||
        (item.nextElementSibling && item.nextElementSibling.tagName === 'H5')) {
          const elem = item.parentNode.nextElementSibling && item.parentNode.nextElementSibling.tagName === 'H5' ? item.parentNode.nextElementSibling : item.nextElementSibling;
          const captionText = elem.textContent.trim();
          elem.parentNode.insertBefore(JSDOM.fragment(`<p><em>${captionText}</em><p>`), elem);
          elem.remove();
      }
    });

    // embeds
    this.replaceEmbeds(main);

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

    const author = main.querySelector('[rel=author]').textContent;

    const content = main.querySelector('.post_content');

    // // author and date
    content.before(JSDOM.fragment('<hr>'));
    content.before(JSDOM.fragment(`<p>by ${author}</p><p>Posted on ${authoredDate}</p>`));
    content.before(JSDOM.fragment('<hr>'));

    let lang = 'en';
    // determine language
    if (author.indexOf('UK Team') !== -1) {
      lang = 'en';
    } else if (author.indexOf('DE Team') !== -1) {
      lang = 'de';
    } else if (author.indexOf('France') !== -1) {
      lang = 'fr';
    } else if (author.indexOf('Spain') !== -1) {
      lang = 'es';
    } else if (author.indexOf('Italia') !== -1) {
      lang = 'it';
    } else 
    // use unique keywords to try to determine language
    if (main.textContent.toLowerCase().indexOf(' das ') !== -1) {
      lang = 'de';
    } else if (main.textContent.toLowerCase().indexOf(' à ') !== -1) {
      lang = 'fr';
    } else if (main.textContent.toLowerCase().indexOf('ñ') !== -1) {
      lang = 'es';
    } else if (main.textContent.toLowerCase().indexOf(' di ') !== -1) {
      lang = 'it';
    }

    // topics / products
    let list = [];
    const categories = main.querySelector('.post_categories');
    if (categories) {
      list = categories.textContent.split(', ');
    }

    const tags = main.querySelector('.post_tags');
    if (tags) {
      list = list.concat(
        tags.textContent.split(', ').map(t => t.replace(/ \(.*\)/gm, ''))
      );
    }

    let topics = [];
    const products = [];
    let oneTopicMatch = false;
    list.forEach(t => {
      const noAdobeName = t.replace('Adobe ', '');
      if (entryParams.products.includes(t)) {
        // if product
        if (!products.includes(t)) products.push(t);
      } else if (t.indexOf('Adobe ') !== -1 && entryParams.products.includes(noAdobeName)) {
           // if product without Adobe
           if (!products.includes(noAdobeName)) products.push(noAdobeName);
          } else if (entryParams.topics.includes(t)) {
            // if detected topic, push first
            if (!topics.includes(t)) {
              topics = [t].concat(topics);
              oneTopicMatch = true;
            }
          } else {
            // worst case, unknown, push at the end of topics
            if (!topics.includes(t)) topics.push(t);
          }
    });
    
    if (!oneTopicMatch) {
      // no topic for taxonomy found (i.e. no main category). Define one
      topics = [DEFAULT_MAIN_CATEGORY].concat(topics);
    }

    if (lang === 'en') {
      topics.push('UK');
      topics.push('UK Exclusive');
    }

    topics.push(IMPORT_TAG);

    main.appendChild(JSDOM.fragment(`
      <hr>
      <p>Topics: ${topics.join(', ')}</p>
      <p>Products: ${products.join(', ')}</p>
    `));

    // final cleanup
    DOMUtils.remove(main, [
      '.author',
      '.post_categories',
      '.post_tags'
    ]);

    // extract "emphasis" from links
    // see https://github.com/adobe/helix-pipeline/issues/895
    main.querySelectorAll('a strong').forEach((elem) => {
      const parent = elem.parentNode;
      if (parent.childNodes.length === 1) {
        // only cover case with 1 child
        const txt = elem.textContent;
        // only treat links
        if (txt && (txt.indexOf('.') !== -1 || txt.indexOf(':') !== -1 )) {
          elem.innerHTML = '';
          // take out of parent
          parent.parentNode.insertBefore(elem, parent.nextSibling);
          elem.appendChild(parent);
          parent.innerHTML = txt;
        }
      }
    });

    // some images are in headings...
    main.querySelectorAll('h1 img, h2 img, h3 img, h4 img, h5 img, h6 img').forEach((img) => {
      // move image after its parent heading
      img.parentNode.parentNode.insertBefore(img, img.parentNode.nextSibling);
    });

    // heading could be full of tags
    main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      h.innerHTML = h.textContent;
    });

    // convert h4 -> h2
    main.querySelectorAll('h4').forEach((h) => {
      h.replaceWith(JSDOM.fragment(`<h2>${h.textContent}</h2>`));
    });

    // convert h5 -> h3
    main.querySelectorAll('h5').forEach((h) => {
      h.replaceWith(JSDOM.fragment(`<h3>${h.textContent}</h3>`));
    });

    let name = path.parse(new URL(url).pathname).name;

    const pir = new PageImporterResource(name, `${lang}/${folderDate}`, main, null, {
      topics,
      products,
      author,
      date: authoredDate,
      lang
    });

    return [pir];
  }
}
