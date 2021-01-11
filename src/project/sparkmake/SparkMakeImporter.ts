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
import WPUtils from '../wp/WPUtils';

const DEFAULT_MAIN_CATEGORY = '';
const IMPORT_TAG = 'SparkMake';

export default class SparkMakeImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  process(document: Document, url: string, entryParams?: any): PageImporterResource[] {

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
