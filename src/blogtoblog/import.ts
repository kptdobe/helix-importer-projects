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
import { Response } from 'node-fetch';
import fs from 'fs-extra';
import Excel from 'exceljs';

import { preview } from './utils';

// tslint:disable: no-console

config();

const HLX_HOST = 'https://main--blog--adobe.hlx3.page';
const TARGET_HOST = 'https://blog.adobe.com';
const LANG = 'en';
const DATA_LIMIT = 30000;
const BATCH_SIZE = 20;
const DO_PREVIEWS = true;

const [argMin, argMax] = process.argv.slice(2);

async function getPromoList() {
  const path = `/${LANG}/drafts/import/promotions.json`;
  if (DO_PREVIEWS) await preview(path);
  const url = `${HLX_HOST}${path}`;

  const response = await fetch(url);
  const res = {};
  if (response.ok) {
    const json = await response.json();
    json.data.forEach((e) => {
      if (!res[e.selector]) {
        res[e.selector] = e.newPath;
      }
    });
  } else {
    throw new Error(`Cound not find promotion mapping at ${url}`);
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
  const path = `${TARGET_HOST}/${LANG}/query-index.json`;
  const res = [];

  const OFFSET = 256;
  let offset = 0;
  let response: Response;
  let doContinue;
  do {
    doContinue = false;
    const queryParams = new URLSearchParams();
    queryParams.set('limit', `${OFFSET}`);
    queryParams.set('offset', `${offset}`);

    response = await fetch(`${path}?${queryParams.toString()}`);
    console.log(response.url);

    if (response.ok) {
      const json = await response.json();

      for (let i=0; i < json.data.length; i++) {
        const e = json.data[i];
        try {
          let p = e.path;
          if (!p.startsWith('/')) {
            p = `/${p}`;
          }
          e.URL = `${TARGET_HOST}${p}`;
          res.push(e);
        } catch(error) {
          // ignore rows with invalid URL
          console.warn(`Entries - ignoring ${e.path}.`);
        }
      }

      doContinue = json.data.length === OFFSET;
    }

    offset += OFFSET;
  } while (doContinue);

  return res;
}

async function getTaxonomy() {
  const path = `/${LANG}/topics/taxonomy.json`;
  if (DO_PREVIEWS) await preview(path);
  const res = await fetch(`${HLX_HOST}/${path}`);
  const json = await res.json();

  const taxonomy = {};

  json.data.forEach((t) => {
    const name = t['Level 3'] || t['Level 2'] || t['Level 1'];
    t.isVisible = t.Hidden === '';
    taxonomy[name] = t;
  });

  return taxonomy;
}

async function main() {
  const startTime = new Date().getTime();
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
    skipMDFileCreation: true,
    logger: customLogger,
  });

  const taxonomy = await getTaxonomy();

  let output = `source;path;file;lang;author;date;tags;banners;\n`;
  let promises = [];
  let count = 0;
  await Utils.asyncForEach(entries, async (e, index) => {
    promises.push(new Promise(async (resolve, reject) => {
      try {
        const resources = await importer.import(e.URL, { target: TARGET_HOST, allEntries, promoList: promoListJSON, taxonomy });

        resources.forEach((entry) => {
          console.log(`${index}: ${entry.source} -> ${entry.docx || entry.md}`);
          output += `${entry.source};${entry.extra.path};${entry.docx || entry.md};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.tags};${entry.extra.banners}\n`;
          count++;
        });
      } catch(error) {
        console.error(`Could not import ${e.URL}`, error.message, error.stack);
      }
      resolve(true);
    }));

    if (promises.length === BATCH_SIZE) {
      await Promise.all(promises);
      promises = [];
      await handler.put(`${LANG}_importer_output.csv`, output);
    }
  });

  if (promises.length > 0) {
    await Promise.all(promises);
    await handler.put(`${LANG}_importer_output.csv`, output);
  }

  console.log(`Entries - found ${allEntries.length} in index`);
  console.log(`Entries - after filtering: ${entries.length}`);
  console.log(`Entries - imported ${count}.`);

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  const data = output.split('\n').map((row: string) => row.split(';'));
  sheet.addRows(data);
  const dir = `output/blogtoblog/${LANG}/drafts/import/`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/output.xlsx`);
  console.log(`Done in ${(new Date().getTime()-startTime)/1000}s.`);
}

main();
