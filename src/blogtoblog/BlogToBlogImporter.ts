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

export default class BlogToBlogImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {

    const main = document.querySelector('main');

    DOMUtils.remove(main, [
      'header',
      'footer',
    ]);


    // TODO: convert all blocks back to tables
    // TODO: rename "Promotion" block to "Banner"
    // TODO: check if more blocks need conversion
    // TODO: convert "featured articles" section to table
    // TODO: extact author / date and merge into metadata table (may not exist)
    // TODO: extact topics / products and merge into metadata table (may not exist)

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = p.name;
    const lang = s[1];
    const folder = `${s[3]}/${s[4]}/${s[5]}`;
    const date = `${s[4]}-${s[5]}-${s[3]}`;

    const pir = new PageImporterResource(name, `${lang}/${folder}`, main, null, {
      topics: [],
      products: [],
      author: '',
      date,
      lang
    });

    return [pir];
  }
}
