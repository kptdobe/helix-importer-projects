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

import CreativeImporter from './CreativeImporter';
import FSHandler from '../../product/storage/FSHandler';

import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import CSV from '../../product/utils/CSV';
import Utils from '../../product/utils/Utils';

// tslint:disable: no-console

config();

async function main() {
  const handler = new FSHandler('output/creative', console);
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

  const csv = await handler.get('posts.csv');
  const entries = CSV.toArray(csv.toString());

  const taxonomy = JSON.parse(await handler.get('taxonomy.json'));
  const topics = [];
  const products = [];

  taxonomy.data.forEach(t => {
    const name = t['Level 3'] || t['Level 2'] || t['Level 1'];
    if (t.Type === 'Products') {
      products.push(name);
    } else {
      topics.push(name);
    }
  });


  const importer = new CreativeImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/creative'
  });

  let output = `source;file;lang;author;date;topics;products;\n`;
  Utils.asyncForEach(entries, async (e) => {
    const { url } = e;
    try {
      const resources = await importer.import(url, {
        topics,
        products
      });
      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.file}`);
        output += `${entry.source};${entry.file};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.topics.join(', ')};${entry.extra.products.join(', ')};\n`;
      });
      await handler.put('importer_output.csv', output)
    } catch(error) {
      console.error(`Could not import ${url}`, error);
    }
  });
  console.log('Done');
}

main();