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

import BlogToBlogAuthorImporter from './BlogToBusinessTagsImporter';

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

async function getTags() {
  const req = await fetch(`https://main--business-website--adobe.hlx3.page/drafts/fkakatie/tags.json`);
  if (req.ok) {
    const { data } = await req.json();
    return data;
  }
  return [];
}

async function main() {
  const handler = new FSHandler(`output/blogtobusiness-tags`, console);
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

  const allTopics = await getTags();
  const tags = sectionData(allTopics, argMin, argMax);

  const importer = new BlogToBlogAuthorImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/blogtobusiness-tags',
    skipAssetsUpload: true,
    // skipDocxConversion: false,
    skipMDFileCreation: true,
  });

  let output = `source;file;lang;author;date;category;tags;tags;banners;\n`;
  await Utils.asyncForEach(tags, async (e) => {
    try {
      const url = `https://main--business-website--adobe.hlx3.page/blog${e.currentPath}`;
      console.log(url);

      const resources = await importer.import(url);

      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.file}`);
        output += `${entry.source};${entry.file};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.category};${entry.extra.tags};${entry.extra.tags};${entry.extra.banners}\n`;
      });
      await handler.put('tags-import_output.csv', output);
    } catch(error) {
      console.error(`Could not import ${e.author}`);
    }
  });
  console.log('Done');
}

main();
