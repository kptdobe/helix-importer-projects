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

import CC_Novedades from './CC_Novedades';
import CC_Stories from './CC_Stories';

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fs from 'fs-extra';
import Excel from 'exceljs';

import getEntries from './entries';

// tslint:disable: no-console

config();

const LOCALE = 'cn';
const [argMin, argMax] = process.argv.slice(2);

function getTarget(locale) {
  switch (locale) {
    case 'bo':
      return {
        brand: 'Coca-Cola',
        country: 'Bolivia',
        url: 'https://www.coca-coladebolivia.com.bo',
        type: 'novedades',
      };
    case 'cl':
      return {
        country: 'Chile',
        url: 'https://www.cocacoladechile.cl',
        type: 'novedades',
      };
    case 'py':
      return {
        brand: 'Coca-Cola',
        country: 'Paraguay',
        url: 'https://www.coca-coladeparaguay.com.py',
        type: 'novedades',
      };
    case 'latam':
      return {
        brand: 'Coca-Cola',
        country: 'América Latina',
        url: 'https://journey.coca-cola.com',
        type: 'novedades',
      };
    case 'nz':
      return {
        brand: 'Coca-Cola',
        country: 'New Zealand',
        url: 'https://www.coca-colajourney.co.nz',
        type: 'stories',
      };
    case 'cn':
      return {
        brand: '可口可乐', // Coca-Cola
        country: '中国', // China
        url: 'https://www.coca-cola.com.cn',
        type: 'stories',
      };
    case 'hk':
      return {
        country: '香港', // Hong Kong
        url: 'https://www.coca-cola.hk',
        type: 'stories',
      };
    case 'india':
      return {
        brand: 'Coca-Cola',
        country: 'India',
        url: 'https://https://www.coca-colaindia.com',
        type: 'stories',
      };
    default:
      return {};
  }
}

function sectionData(data, min, max) {
  if (!min) { return data; }
  min = Number(min);
  max = max ? Number(max) : data.length;
  return data.slice(min, max);
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

  const handler = new FSHandler('output/cocacola/import', customLogger);

  const blob = new BlobHandler({
    skipSchedule: true,
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI,
    log: customLogger,
  });

  const TARGET = getTarget(LOCALE);
  let importer;

  if (TARGET.type === 'novedades') {
    importer = new CC_Novedades({
      storageHandler: handler,
      blobHandler: blob,
      cache: `.cache/cocacola/${LOCALE}`,
      skipAssetsUpload: true,
      skipDocxConversion: true,
      // skipMDFileCreation: true,
      logger: customLogger,
    });
  } else if (TARGET.type === 'stories') {
    importer = new CC_Stories({
      storageHandler: handler,
      blobHandler: blob,
      cache: `.cache/cocacola/${LOCALE}`,
      // skipAssetsUpload: true,
      // skipDocxConversion: true,
      skipMDFileCreation: true,
      logger: customLogger,
    });
  }

  const rows = [[
    'source',
    'file',
    'locale',
  ]];

  const entries = await getEntries(LOCALE);
  const section = sectionData(entries, argMin, argMax);

  console.log(`\nIMPORTING for ${TARGET.country}, ${LOCALE}`);

  await Utils.asyncForEach(section, async (e) => {
    try {
      const resources = await importer.import(e.URL, {
        folder: TARGET.type,
        brand: TARGET.brand,
        locale: LOCALE,
        country: TARGET.country,
        target: TARGET.url,
        entries,
      });
      resources.forEach((entry) => {
        // console.log(`\nIMPORTED ${e.URL}`);
        rows.push([
          entry.source,
          entry.docx,
          LOCALE,
        ]);
      });
    } catch(error) {
      console.error(`\nCould not import \n${e.URL}`);
      // console.error(error, '\n');
    }
  });

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/cocacola/${LOCALE}`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/import.xlsx`);

  console.log('Done');
}

main();
