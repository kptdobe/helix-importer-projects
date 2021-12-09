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

import WorkfrontToBusinessImporter from './WorkfrontToBusinessImporter';

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fetch from 'node-fetch';

// tslint:disable: no-console

config();

const TARGET_HOST = 'https://main--business-website--adobe.hlx.page';

async function getPostsJson() {
  let page = 1;
  let length = page;
  const res = [];
  while (length && length >= 1) {
    const req = await fetch(`https://dev.workfront.com/rest-api/workfront/blogs?_format=json&page=${page}`);
    if (req.ok) {
      const json = await req.json();
      length = json.length;
      json.forEach((post) => {
        const { langcode, title, created, metatag, path, body, field_image } = post;
        res.push({
          path: path[0].alias,
          lang: langcode[0].value || metatag.content_language,
          title: title[0].value,
          img: {
            alt: field_image[0].alt || field_image[0].title,
            url: field_image[0].url,
          },
          body: body[0].processed,
          meta: {
            desc: metatag.value.description,
            date: new Date(created[0].value),
          },
        });
      });
      page++;
    }
  }
  return res;
}

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
  const req = await fetch(`${TARGET_HOST}/drafts/fkakatie/import/workfront.json`);
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

  const handler = new FSHandler('output/workfronttobusiness', customLogger);

  const blob = new BlobHandler({
    skipSchedule: true,
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI,
    log: customLogger,
  });

  // const promoListJSON = await getPromoList();

  const allEntries = await getEntries();
  const entries = sectionData(allEntries, argMin, argMax);

  const importer = new WorkfrontToBusinessImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/workfront',
    skipAssetsUpload: false,
    skipDocxConversion: true,
    // skipMDFileCreation: true,
    // logger: customLogger,
  });

  let output = `source;file;lang;author;date;category;topics;tags;banners;\n`;
  await Utils.asyncForEach(entries, async (e) => {
    try {
      const resources = await importer.import('https://www.workfront.com' + e.path, { target: TARGET_HOST, allEntries });

      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.docx}`);
        output += `${entry.source};${entry.docx};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.category};${entry.extra.topics};${entry.extra.tags};${entry.extra.banners}\n`;
      });
      await handler.put('importer_output.csv', output);
    } catch(error) {
      console.error(`Could not import ${e.path}`, error);
    }
  });
  console.log('Done');
}

main();
