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
import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';
import Blocks from '../utils/Blocks';

const DEFAULT_MAIN_CATEGORY = '';
const IMPORT_TAG = 'SparkMake';

export default class SparkMakeImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {

    WPUtils.handleCaptions(document);
    DOMUtils.replaceEmbeds(document);

    WPUtils.genericDOMCleanup(document);

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
      hero.after(JSDOM.fragment(`<hr>`));
    }

    // templates
  document.querySelectorAll('.template-examples').forEach(templateExample => {
      const table = document.createElement('table');
      let row = document.createElement('tr');
      table.append(row);

      const hCell = document.createElement('th');
      row.append(hCell);

      hCell.innerHTML = 'Template List';
      hCell.setAttribute('colspan', 2);

      let hasOne = false;

      if ('Refer to English page' === entryParams['Template reference tag']) {
        hasOne = true;
      } else {
        templateExample.querySelectorAll('.example').forEach(t => {
          row = document.createElement('tr');
          table.append(row);

          const imgCell = document.createElement('td');
          row.append(imgCell);

          const img = t.querySelector('img');
          if (img) {
            imgCell.append(img);
          }

          const titleCell = document.createElement('td');
          row.append(titleCell);
          const title = t.querySelector('.title');
          if (title) {
            titleCell.append(title.parentNode);
          } else {
            const a = t.querySelector('a');
            if (a) {
              a.textContent = 'Template';
              imgCell.append(a);
            }
          }

          hasOne = true;
        });
      }

      if (hasOne) {
        templateExample.after(table);
      }

      templateExample.remove();
    });

    // tips
    document.querySelectorAll('.tip-list').forEach(tipList => {
      const table = document.createElement('table');

      let row = document.createElement('tr');
      table.append(row);

      const hCell = document.createElement('th');
      row.append(hCell);

      hCell.innerHTML = 'How-to Steps';
      hCell.setAttribute('colspan', 2);

      let hasOne = false;
      tipList.querySelectorAll('.tip').forEach(tip => {
        row = document.createElement('tr');
        table.append(row);

        const titleCell = document.createElement('td');
        row.append(titleCell);

        const h3 = tip.querySelector('h3');
        if (h3) {
          titleCell.append(h3.textContent);
        }

        const textCell = document.createElement('td');
        row.append(textCell);

        const text = tip.querySelector('.tip-text');
        if (text) {
          textCell.append(text);
        }
        hasOne = true;
      });

      if (hasOne) {
        tipList.after(table);
      }

      tipList.remove();
    });

    // remove empty divs
    document.querySelectorAll('.intro > div').forEach(div => {
      if (div.textContent.trim() === '') {
        div.remove();
      }
    });

    // first div is intro
    const intro = document.querySelector('.intro > div');
    const container = document.querySelector('.container');
    if (intro && container) {
      container.before(intro);
    }

    // try to find how-to-steps
    document.querySelectorAll('.intro > div').forEach(div => {
      const tipList = div.querySelector('.text');
      if (tipList && div.textContent.trim().toLowerCase().indexOf('how to') === 0) {
        // found an How To / Tips section

        const table = document.createElement('table');

        let row = document.createElement('tr');
        table.append(row);

        const hCell = document.createElement('th');
        row.append(hCell);

        hCell.innerHTML = 'How-to Steps';
        hCell.setAttribute('colspan', 2);

        let hasOne = false;
        let index = 0;
        tipList.querySelectorAll('p').forEach(tip => {
          if (index%2 === 0) {
            // odd p is title
            row = document.createElement('tr');
            table.append(row);

            const titleCell = document.createElement('td');
            row.append(titleCell);

            if (tip.textContent.trim().match(/\d. /)) {
              titleCell.append(tip.textContent.trim().substring(3));
            } else {
              titleCell.append(tip.textContent.trim());
            }
          } else {
            // even p is text
            const textCell = document.createElement('td');
            row.append(textCell);

            textCell.append(tip.textContent.trim());
          }
          index++;
          hasOne = true;
        });

        if (hasOne) {
          tipList.after(table);
        }

        // div.firstElementChild.replaceWith(JSDOM.fragment(`<h2>${div.firstElementChild.textContent}</h2>`));

        tipList.remove();
      }
    });

    const lang = (entryParams.Language || 'en-US') === 'EN' ? 'en-US' : entryParams.Language;

    const h1 = document.querySelector('h1');
    const h1Title = h1 ? h1.textContent : null;
    const metaTitle = entryParams[`${lang}/Title`] || h1Title || entryParams['en-US/Title'];
    const description = entryParams[`${lang}/Description`] || entryParams['en-US/Description'];
    const shortTitle = entryParams[`${lang}/Design Name`] || entryParams['en-US/Design Name'];

    document.body.append(Blocks.getMetadataBlock(document, {
      'Title': metaTitle,
      'Description': description,
      'Short Title': shortTitle
    }));

    DOMUtils.remove(document, [
      'header',
      'footer',
      'style',
      '#seo-dropdown',
      '.product-deeper',
      '.more-related-designs'
    ]);

    const parsed = path.parse(new URL(`https://${entryParams['Proposed URL']}`).pathname);
    const name = parsed.name;


    const pir = new PageImporterResource(name, parsed.dir, document.querySelector('body'), null);

    return [pir];
  }
}
