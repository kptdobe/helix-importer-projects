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

import AdobeConnectImporter from './AdobeConnectImporter';

import { FSHandler, CSV, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';

// tslint:disable: no-console

config();

async function main() {
  const handler = new FSHandler('output/adobeconnect', console);
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
  // const csv = await handler.get('one.csv');

  const entries = CSV.toArray(csv.toString());

  const importer = new AdobeConnectImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/adobeconnect'
  });

  let output = `source;url;author;date;topics;products;\n`;
  const knownAuthors = [];
  await Utils.asyncForEach(entries, async (e) => {
    const url = e.url;
    try {
      const files = await importer.import(url, {
        knownAuthors
      });
      files.forEach((entry) => {
        console.log(`${url} -> ${entry.file}`);
        if (entry.extra) {
          knownAuthors.push(entry.extra.author);
          output += `${entry.source};${entry.file};${entry.extra.author};${entry.extra.date};${entry.extra.topics.join(', ')};${entry.extra.products.join(', ')};\n`;
        }
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