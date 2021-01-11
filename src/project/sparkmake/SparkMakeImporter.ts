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
import Utils from '../../product/utils/Utils';
import { strict } from 'assert';

const DEFAULT_MAIN_CATEGORY = '';
const IMPORT_TAG = 'SparkMake';

export default class SparkMakeImporter extends PageImporter {
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

    // an h5 following an image / video is a caption
    document.querySelectorAll('p img, video').forEach(item => {
      if ((item.parentNode.nextElementSibling && item.parentNode.nextElementSibling.tagName === 'H5') ||
        (item.nextElementSibling && item.nextElementSibling.tagName === 'H5')) {
          const elem = item.parentNode.nextElementSibling && item.parentNode.nextElementSibling.tagName === 'H5' ? item.parentNode.nextElementSibling : item.nextElementSibling;
          const captionText = elem.textContent.trim();
          elem.parentNode.insertBefore(JSDOM.fragment(`<p><em>${captionText}</em><p>`), elem);
          elem.remove();
      }
    });

    // embeds
    this.replaceEmbeds(document);

    // extract "emphasis" from links
    // see https://github.com/adobe/helix-pipeline/issues/895
    document.querySelectorAll('a strong').forEach((elem) => {
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
    document.querySelectorAll('h1 img, h2 img, h3 img, h4 img, h5 img, h6 img').forEach((img) => {
      // move image after its parent heading
      img.parentNode.parentNode.insertBefore(img, img.parentNode.nextSibling);
    });

    // heading could be full of tags
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      h.innerHTML = h.textContent;
    });

    const fbPixel = document.querySelector('img')
    if (fbPixel) {
      const src = fbPixel.getAttribute('src');
      if (src && src.indexOf('facebook') !== -1) {
        fbPixel.remove();
      }
    }

    const hero = document.querySelector('.hero');
    if (hero) {
      const bkgImg = hero.style['background-image'];
      if (bkgImg) {
        const src = /url\((.*)\)/.exec(bkgImg)[1];
        hero.before(JSDOM.fragment(`<img src="${src}">`));
      }
      hero.after(JSDOM.fragment(`<hr>`))
    }

    // templates
  document.querySelectorAll('.template-examples').forEach(templateExample => {
      const table = document.createElement('table');
      templateExample.after(table);
      templateExample.querySelectorAll('.example').forEach(t => {
        const row = document.createElement('tr');
        table.append(row);

        const imgCell = document.createElement('td');
        row.append(imgCell);

        const img = t.querySelector('img');
        if (img) {
          imgCell.append(img);
        }

        const linkCell = document.createElement('td');
        row.append(linkCell);
        const link = t.querySelector('a');
        if (link) {
          linkCell.append(link);
        }
      });

      templateExample.remove();
    });

    DOMUtils.remove(document, [
      'header',
      'footer',
      'style',
      '#seo-dropdown',
      '.product-deeper',
      '.more-related-designs'
    ]);

    const parsed = path.parse(new URL(url).pathname);
    const name = parsed.name;


    const pir = new PageImporterResource(name, parsed.dir, document.querySelector('body'), null);

    return [pir];
  }
}
