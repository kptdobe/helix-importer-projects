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

    const fbPixel = document.querySelector('img');
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
    document.querySelectorAll('.template-examples').forEach((templateExample) => {
    // ignore empty template-list
      if (!templateExample.textContent.trim() && !templateExample.querySelector('a')) return;

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
        templateExample.querySelectorAll('.example').forEach((t) => {
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
              a.textContent = a.href;
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
    document.querySelectorAll('.tip-list').forEach((tipList) => {
      const table = document.createElement('table');

      let row = document.createElement('tr');
      table.append(row);

      const hCell = document.createElement('th');
      row.append(hCell);

      hCell.innerHTML = 'How-to Steps';
      hCell.setAttribute('colspan', 2);

      let hasOne = false;
      tipList.querySelectorAll('.tip').forEach((tip) => {
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
    document.querySelectorAll('.intro > div').forEach((div) => {
      if (div.textContent.trim() === '') {
        div.remove();
      }
    });

    // first div is intro
    const intro = document.querySelector('.intro > div');
    const container = document.querySelector('.container');
    if (intro && container) {
      const title = document.querySelector('.intro div:first-child p:first-child strong:first-child');
      // if first paragraph is strong, promote to h2
      if (title) {
        title.replaceWith(JSDOM.fragment(`<h2>${title.textContent}</h2>`));
      }

      container.before(intro);
    }

    // try to find how-to-steps
    document.querySelectorAll('.intro > div').forEach((div) => {
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
        tipList.querySelectorAll('p').forEach((tip) => {
          const hasBR = tip.querySelector('br');
          if (hasBR) {
            hasBR.remove();
            row = document.createElement('tr');
            table.append(row);

            const titleCell = document.createElement('td');
            row.append(titleCell);

            const strong = tip.querySelector('strong');

            if (strong) {
              if (strong.textContent.trim().match(/\d. /)) {
                titleCell.append(strong.textContent.trim().substring(3));
              } else {
                titleCell.append(strong.textContent.trim());
              }
              strong.remove();
            }
            const textCell = document.createElement('td');
            row.append(textCell);

            textCell.append(tip.textContent.trim());
          } else {
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
          }
          hasOne = true;
        });

        if (hasOne) {
          tipList.after(table);
        }

        // div.firstElementChild.replaceWith(JSDOM.fragment(`<h2>${div.firstElementChild.textContent}</h2>`));

        tipList.remove();
      }
    });

    // feature-list
    // document.querySelectorAll('.features').forEach(div => {
    //   const table = document.createElement('table');

    //   let row = document.createElement('tr');
    //   table.append(row);

    //   const hCell = document.createElement('th');
    //   row.append(hCell);

    //   hCell.innerHTML = 'Feature List';
    //   hCell.setAttribute('colspan', 3);

    //   let hasOne = false;
    //   div.querySelectorAll('li.feature').forEach(li => {
    //     hasOne = true;
    //     row = document.createElement('tr');
    //     table.append(row);

    //     const iconCell = document.createElement('td');
    //     row.append(iconCell);

    //     iconCell.textContent = li.className.replace('feature ', '');

    //     const titleCell = document.createElement('td');
    //     row.append(titleCell);

    //     const h3 = li.querySelector('h3');
    //     if (h3) {
    //       titleCell.append(h3.textContent);
    //     }

    //     const textCell = document.createElement('td');
    //     row.append(textCell);

    //     textCell.append(li.querySelector('p'));
    //   });

    //   if (hasOne) {
    //     div.after(table);
    //   }

    //   div.remove();
    // });

    let { metadata } = entryParams;
    if (!metadata) {
      metadata = {};
      const t = document.querySelector('title');
      if (t) {
        metadata.title = t.textContent;
      }
      const d = document.querySelector('meta[name="description"]');
      if (d) {
        metadata.description = d.content;
      }
    }

    document.body.append(Blocks.getMetadataBlock(document, {
      Title: metadata.title,
      Description: metadata.description,
      'Short Title': metadata.shortTitle,
    }));

    DOMUtils.remove(document, [
      'header',
      'footer',
      'style',
      '#seo-dropdown',
      '.product-deeper',
      '.more-related-designs',
      '.features',
    ]);

    document.querySelectorAll('a').forEach((a) => {
      const target = entryParams.urlMapping[a.href];
      if (target) {
        if (a.textContent === a.href) {
          // also update the link text
          a.textContent = target;
        }
        a.href = target;
      }
    });

    document.querySelectorAll('img').forEach((img) => {
      // img is in a link
      const parent = img.parentNode;
      if (parent && parent.tagName === 'A') {
        parent.before(img);
        if (parent.textContent === '') {
          // set text content to be the link
          parent.textContent = parent.href;
        }
        const p = JSDOM.fragment(`<p>${parent.outerHTML}</p>`);
        parent.before(p);
        parent.remove();
      }
    });

    // promote h3 to h2 for /templates pages
    if (url.includes('/templates/')) {
      document.querySelectorAll('h3').forEach((h) => {
        // exclude the ones in table (=block)
        if (!h.closest('table')) {
          h.replaceWith(JSDOM.fragment(`<h2>${h.textContent}</h2>`));
        }
      });
    }

    const parsed = path.parse(new URL(`https://${entryParams['Proposed URL']}`).pathname);
    const name = parsed.name;


    const pir = new PageImporterResource(name, parsed.dir, document.querySelector('body'), null);

    return [pir];
  }
}
