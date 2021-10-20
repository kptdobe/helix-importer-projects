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

import BlogToBlogImporter from './BlogToBlogImporter';

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fetch from 'node-fetch';

// tslint:disable: no-console

config();

const TARGET_HOST = 'https://blog.adobe.com';
const DATA_LIMIT = 100;

const [argMin, argMax] = process.argv.slice(2);

async function getPromoList() {
  const req = await fetch(`${TARGET_HOST}/drafts/alex/import/promotions.json`);
  const res = {};
  if (req.ok) {
    const json = await req.json();
    json.data.forEach((e) => {
      const className = `embed-internal-${e.file
          .toLowerCase()
          .substring(e.file.lastIndexOf('/')+1)
          .replace(/-/gm, '')}`;

      if (res[className]) throw new Error(`Duplicate entry for ${e.file}`);
      res[className] = e.url;
    });
  }
  return res;
}

function sectionData(data, min, max) {
  if (!min) { return data; }
  min = Number(min);
  max = max ? Number(max) : data.length;
  const section = data.slice(min, max);
  return section;
}

async function getEntries() {
  const req = await fetch(`${TARGET_HOST}/en/query-index.json?limit=256&offset=0`);
  const res = [];
  if (req.ok) {
    const json = await req.json();
    for (let i=0; i < Math.min(DATA_LIMIT, json.data.length); i++) {
      const e = json.data[i];
      try {
        let path = e.path;
        if (!path.startsWith('/')) {
          path = `/${path}`;
        }
        e.URL = `${TARGET_HOST}${path}`;
        res.push(e);
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

  const handler = new FSHandler('output/blogtoblog', customLogger);

  const blob = new BlobHandler({
    skipSchedule: true,
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI,
    log: customLogger,
  });

  const promoListJSON = await getPromoList();

  const allEntries = await getEntries();
  const entries = sectionData(allEntries, argMin, argMax);

  const importer = new BlogToBlogImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/blogadobecom',
    skipAssetsUpload: true,
    // skipDocxConversion: true,
    logger: customLogger,
  });

  let output = `source;path;file;lang;author;date;tags;banners;\n`;
  await Utils.asyncForEach(entries, async (e) => {
    try {
      const resources = await importer.import(e.URL, { target: TARGET_HOST, allEntries, promoList: promoListJSON });

      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.docx}`);
        output += `${entry.source};${entry.extra.path};${entry.docx};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.tags};${entry.extra.banners}\n`;
      });
      await handler.put('importer_output.csv', output);
    } catch(error) {
      console.error(`Could not import ${e.URL}`, error.message, error.stack);
    }
  });
  console.log('Done');
}

main();
