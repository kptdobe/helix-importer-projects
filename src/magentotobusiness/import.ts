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

import MagentoToBusinessImporter from './MagentoToBusinessImporter';

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fetch from 'node-fetch';

// tslint:disable: no-console

config();

const TARGET_HOST = 'https://main--business-website--adobe.hlx.page';

const DATA_LIMIT = 20000;

const [argMin, argMax] = process.argv.slice(2);

function sectionData(data, min, max) {
  if (!min) { return data; }
  min = Number(min);
  max = max ? Number(max) : data.length;
  const section = data.slice(min, max);
  return section;
}

async function getEntries() {
  const req = await fetch(`${TARGET_HOST}/drafts/poolson/magento-content-migration.json`);
  const res = [];
  if (req.ok) {
    const json = await req.json();
    for (let i=0; i < Math.min(DATA_LIMIT, json.data.length); i++) {
      const e = json.data[i];
      try {
        const u = new URL(e.URL);
        const title = e.URL
          .split('/')
          .pop()
          .replace('.html', '');
        if (e.URL.startsWith('http')) {
          res.push(e);
        }
      } catch(error) {
        // ignore rows with invalid URL
      }
    }
  }
  return res;
}

async function main() {
  // tslint:disable-next-line: no-empty
  const noop = () => {};

  const customLogger = {
    debug: noop,
    info: noop,
    log: noop,
    warn: () => console.log(...arguments),
    error: () => console.error(...arguments),
  };

  const handler = new FSHandler('output/magentotobusiness', customLogger);

  const blob = new BlobHandler({
    skipSchedule: true,
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI,
    log: customLogger,
  });

  const allEntries = await getEntries();
  const entries = sectionData(allEntries, argMin, argMax);

  // entries.forEach((e) => {
  //   e.URL = e.URL.replace('https://blog.adobe.com', TARGET_HOST);
  // });

  const importer = new MagentoToBusinessImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/magento',
    skipAssetsUpload: false,
    skipDocxConversion: true,
    // skipMDFileCreation: true,
    logger: customLogger,
  });

  let output = `source;file;lang;author;date;category;topics;tags;banners;\n`;
  await Utils.asyncForEach(entries, async (e) => {
    try {
      const resources = await importer.import(e.URL, { target: TARGET_HOST, allEntries });

      resources.forEach((entry) => {
        if (entry.name !== 'error') {
          console.log(`${entry.source} -> ${entry.docx}`);
          output += `${entry.source};${entry.docx};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.category};${entry.extra.topics};${entry.extra.tags}\n`;
        }
      });
      await handler.put('importer_output.csv', output);
    } catch(error) {
      console.error(`Could not import ${e.url}`, error);
    }
  });
  console.log('Done');
}

main();
