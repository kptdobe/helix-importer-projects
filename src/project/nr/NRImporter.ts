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

import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';
import DOMUtils from '../../product/utils/DOMUtils';

import WPUtils from '../../product/wp/WPUtils';

export default class NRImporter extends PageImporter {
  async fetch(url: string): Promise<Response> {
    const res = await fetch(url);
    if (res.status === 404) {
      throw new Error(`404 - Page does not exist - ${url}`);
    } else {
      if (res.redirected && url !== res.url) {
        throw new Error(`301 - Redirected - ${url} -> ${res.url}`);
      }
    }
    return res;
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {

    const main = document.querySelector('main');

    WPUtils.handleCaptions(main);
    DOMUtils.replaceEmbeds(main);

    WPUtils.genericDOMCleanup(main);

    const hero = main.querySelector('.hero');
    if (hero) {
      const bkgImg = hero.style['background-image'];
      if (bkgImg) {
        const src = /url\((.*)\)/.exec(bkgImg)[1];
        hero.before(JSDOM.fragment(`<img src="${src}">`));
      }
    }

    DOMUtils.remove(main, [
      '.nav-subnav',
    //   'footer',
    //   'style',
    //   '#seo-dropdown',
    //   '.product-deeper',
    //   '.more-related-designs'
    ]);

    const parsed = path.parse(new URL(url).pathname);
    let name = parsed.name;

    if (name === '') {
      name = 'index';
    }
    const pir = new PageImporterResource(name, parsed.dir, main, null);

    return [pir];
  }
}
