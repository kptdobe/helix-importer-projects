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

import BlogToBlogBannerImporter from './BlogToBusinessBannerImporter';

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fetch from 'node-fetch';

// tslint:disable: no-console

config();

const [argMin, argMax] = process.argv.slice(2);

function sectionData(data, min, max) {
  min = min ? Number(min) : 0;
  max = max ? Number(max) : data.length;
  const section = data.slice(min, max);
  return section;
}

async function getBanners() {
  const req = await fetch('https://main--business-website--adobe.hlx3.page/drafts/fkakatie/importer-banners.json');
  if (req.ok) {
    const { data } = await req.json();
    return data;
  }
  return [];
}

async function main() {
  const handler = new FSHandler('output/blogtoblog-banners', console);
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
      error: () => console.error(...arguments),
    },
  });

  const allBanners = await getBanners();
  const banners = sectionData(allBanners, argMin, argMax);

  const importer = new BlogToBlogBannerImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/blogtoblog-banners',
    skipAssetsUpload: true,
    // skipDocxConversion: false,
    // skipMDFileCreation: true,
  });

  // let output = `source;file;lang;author;date;category;topics;tags;banners;\n`;
  await Utils.asyncForEach(banners, async (e) => {
    try {

      console.log(e.banners);

      const resources = await importer.import(e.banners);

      // resources.forEach((entry) => {
      //   console.log(`${entry.source} -> ${entry.file}`);
      //   output += `${entry.source};${entry.file};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.category};${entry.extra.topics};${entry.extra.tags};${entry.extra.banners}\n`;
      // });
      // await handler.put('banners-import_output.csv', output);
    } catch(error) {
      console.error(`Could not import ${e.url}`, error);
    }
  });
  console.log('Done');
}

main();
