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
import FSHandler from '../../product/storage/FSHandler';

import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import CSV from '../../product/utils/CSV';
import Utils from '../../product/utils/Utils';

// tslint:disable: no-console

config();

async function main() {
  const handler = new FSHandler('output/creativedialogue', console);
  // tslint:disable-next-line: no-empty
  const noop = () => {};
  const blob = new BlobHandler({
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
        trans[item.Original] = item['Level 3'] || item['Level 2'] || item['Level 1'];
      });
    }
    return trans;
  }

  const translate = (array, trans) => {
    return array.map(a => {
      if (!trans[a]) {
        console.error(`Unknown translation for ${a}`);
      }
      return trans[a] || `Unknown translation for ${a}`
    });
  }

  const getTopics = (e) => {
    let topics = [];

    // e.Category: Insight & Inspiration-Creativity-Creative Inspiration & Trends| Illustration
    // e.Tags: Products-Creative Cloud-Photoshop /  Internal-Corporate Alignment-Creative Cloud

    if (e.Category) {
      const s = e.Category.split('-');
      if (s.length > 0) {
        topics = topics.concat(s[s.length - 1].split('|').map(p => p.trim()));
      }
    }

    if (e.Tags) {
      const s = e.Tags.split('/');
      s.forEach(element => {
        const sub = element.split('-');
        if (sub.length > 0 && sub[0].toLowerCase() !== 'products') {
          topics = topics.concat(sub[sub.length - 1].split('|').map(p => p.trim()));
        }
      });
    }

    return topics;
  };

  const getProducts = (e) => {
    let products = [];
    // e.Tags: Products-Creative Cloud-Photoshop| Illustrator| Fresco| Aero| Premiere / Internal-Corporate Alignment-Creative Cloud
    if (e.Tags) {
      const s = e.Tags.split('/');
      s.forEach(element => {
        const sub = element.split('-');
        if (sub.length > 0 && sub[0].toLowerCase() === 'products') {
          products = products.concat(sub[sub.length - 1].split('|').map(p => p.trim()));
        }
      });
    }
    return products;
  };

  const translations = await getTranslations();
  const results = [];

  let output = `source;url;topics;products;\n`;
  Utils.asyncForEach(entries, async (e) => {
    const url = e.Page;
    try {
      const topics = translate(getTopics(e), translations)
      const products = translate(getProducts(e), translations)
      const files = await importer.import(e.Page, {
        topics,
        products
      });
      files.forEach((f) => {
        console.log(`${url} -> ${f}`);
        output += `${url};${f};${topics.join(', ')};${products.join(', ')};\n`;
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