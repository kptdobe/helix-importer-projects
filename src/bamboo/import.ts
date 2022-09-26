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

// import Importer from './Importer';
// import Importer from './Customers';
// import Importer from './HRGuide';
// import Importer from './HRGlossary';
// import Importer from './Industry';
// import Importer from './JobDescription';
// import Importer from './ProductUpdates';
// import Importer from './Resources';
// import Importer from './Ebook';
import Importer from './Marketplace';
// import Importer from './Default';

const IMPORT_TYPE = 'marketplace';

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fs from 'fs-extra';
import Excel from 'exceljs';

import { getEntries } from './entries';

// tslint:disable: no-console

config();

// const TARGET_HOST = 'https://www.bamboohr.com';
const TARGET_HOST = 'https://marketplace.bamboohr.com';

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

  const handler = new FSHandler(`output/bamboo/${IMPORT_TYPE.toLowerCase().replace(/ /, '-')}`, customLogger);

  const blob = new BlobHandler({
    skipSchedule: true,
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI,
    log: customLogger,
  });

  const entries = await getEntries(IMPORT_TYPE);
  const mp = await getEntries('mp');
  const metadata = {};

  mp.forEach((m) => {
    const [url, category, subcategory, tags] = m;
    const listing = new URL(url).pathname.split('/')[2];
    metadata[listing] = tags.split('|');
  });

  const importer = new Importer({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/bamboo',
    // skipAssetsUpload: true,
    // skipDocxConversion: true,
    skipMDFileCreation: true,
    logger: customLogger,
  });

  const rows = [[
    'source',
    'file',
    'category',
  ]];

  await Utils.asyncForEach(entries, async (e) => {
    try {
      const resources = await importer.import(e, { target: TARGET_HOST, entries, metadata });

      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.docx || entry.md}`);
        rows.push([
          entry.source,
          entry.docx,
          entry.extra.category,
        ]);
      });
    } catch(error) {
      console.error(`Could not import ${e}`, error);
    }
  });


  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/bamboo/${IMPORT_TYPE.toLowerCase().replace(/ /, '-')}`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/import.xlsx`);

  console.log('Done');
}

main();
