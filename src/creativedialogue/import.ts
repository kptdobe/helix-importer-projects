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

import CreativeDialogueImporter from './CreativeDialogueImporter';

import { FSHandler, CSV, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';

// tslint:disable: no-console

config();

async function main() {
  const handler = new FSHandler('output/creativedialogue', console);
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

  // const csv = await handler.get('provided_full.csv');
  const csv = await handler.get('provided.csv');
  const entries = CSV.toArray(csv.toString());

  const importer = new CreativeDialogueImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/creativedialogue'
  });

  const getTranslations = async () => {
    const trans = {};
    const json = JSON.parse(await handler.get('translations.json'));
    if (json && json.data) {
      json.data.forEach(item => {
        if (!trans[item.Original]) {
          trans[item.Original] = {
            name: item['Level 3'] || item['Level 2'] || item['Level 1'],
            isProduct: item.Type === 'Products'
          };
        } else {
          trans[item.Original].isProduct = trans[item.Original].isProduct || item.Type === 'Products';
        }
      });
    }
    return trans;
  }

  const translate = (item, trans) => {
    const r = {
      products: [],
      topics: [],
    };

    if (item.Tags) {
      item.Tags.split('|').forEach(t => {
        const a = t.trim();
        if (!trans[a]) {
          console.error(`Unknown translation for ${a}`);
          r.topics.push(`Unknown translation for ${a}`);
        } else {
          if(trans[a].isProduct) {
            r.products.push(trans[a].name);
          } else {
            r.topics.push(trans[a].name);
          }
        }
      });
    }
    return r;
  }

  const translations = await getTranslations();
  const results = [];

  let output = `source;url;topics;products;\n`;
  Utils.asyncForEach(entries, async (e) => {
    const url = e.Page;
    try {
      const { products, topics } = translate(e, translations);

      const files = await importer.import(e.Page, {
        topics,
        products
      });
      files.forEach((f) => {
        console.log(`${url} -> ${f.file}`);
        output += `${url};${f.file};${topics.join(', ')};${products.join(', ')};\n`;
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