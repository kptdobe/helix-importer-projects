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

/* tslint:disable: no-console */

import { PagingExplorer, FSHandler, CSV } from '@adobe/helix-importer';

import fetch from 'node-fetch';
import { Response } from 'node-fetch';
import { Document } from 'jsdom';

const API = 'page/';

class WPPostPager extends PagingExplorer {
  async fetch(page: number): Promise<Response> {
    const api = `${this.params.url}${API}${page}`;
    return fetch(api);
  }

  process(document: Document, all: any[]): object[] {
    const entries = [];
    document.querySelectorAll('#entries .post').forEach((el) => {
      const link = el.querySelector('.entry-title > a');
      const url = link.getAttribute('href');

      const entryDate = el.querySelector('.entry-date');
      const date = entryDate.textContent.trim();

      if (all.findIndex(entry => entry.url === url) === -1) {
        entries.push({
          date,
          url,
        });
      }
    });
    return entries;
  }
}

async function main() {
  const handler = new FSHandler('output/acrolaw', console);

  const pager = new WPPostPager({
    nbMaxPages: 1000,
    url: `https://blogs.adobe.com/acrolaw/`,
  });
  const entries = await pager.explore();
  console.log(`Received ${entries.length} entries!`);

  const csv = CSV.toCSV(entries);
  await handler.put(`explorer_result_full.csv`, csv);
}

main();
