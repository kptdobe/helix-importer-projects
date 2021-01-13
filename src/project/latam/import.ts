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

import LATAMImporter from './LATAMImporter';
import FSHandler from '../../product/storage/FSHandler';

import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import CSV from '../../product/utils/CSV';
import Utils from '../../product/utils/Utils';

// tslint:disable: no-console

config();

async function main() {
  const handler = new FSHandler('output/latam', console);
  // tslint:disable-next-line: no-empty
  const noop = () => {};
  const blob = new BlobHandler({
	  skipSchedule: true,
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI,
    log: {
      debug: noop,
      info: noop,
      warn: noop,
      error: () => console.error(...arguments)
    }
  });

  const csv = await handler.get('explorer_result_full.csv');
  const entries = CSV.toArray(csv.toString());

  const importer = new LATAMImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/latam'
  });


  let output = `source;url;date;author;topics;products;\n`;
  Utils.asyncForEach(entries, async (e) => {
    const url = e.url;
    try {
      const files = await importer.import(url);
      files.forEach((f) => {
        console.log(`${url} -> ${f.file}`);
        output += `${url};${f.file};${f.extra.date};${f.extra.author};${f.extra.topics.join(', ')};${f.extra.products.join(', ')};\n`;
      });
      await handler.put('importer_output.csv', output)
    } catch(error) {
      console.error(`Could not import ${url}`, error);
    }
  });
  console.log('Done');

  // await importer.import(entries[11].url);
}

main();