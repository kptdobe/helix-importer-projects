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

import SparkImporter from './SparkBlogImporter';

import { FSHandler, CSV, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';

/* tslint:disable: no-console */

config();

async function main() {
  const handler = new FSHandler('output/sparkblog/round7', console);
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

  let csv = await handler.get('url-mapping.csv');
  const allEntries = CSV.toArray(csv.toString());
  const urlMapping = {};
  allEntries.forEach(e => {
    let u = e.Target;
    if (u.lastIndexOf('/') === u.length - 1) {
      u = u.substring(0, u.length-1);
    }
    urlMapping[e.URL] = u;
  });

  // csv = await handler.get('one.csv');
  csv = await handler.get('Blog-To-Learn.csv');
  const toImportEntries = CSV.toArray(csv.toString());

  const importer = new SparkImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/sparkblog'
  });

  const knownResources = [];
  let output = `source;file;author;date;tags;\n`;
  await Utils.asyncForEach(toImportEntries, async (e) => {
    const { URL } = e;
    try {
      const params = {
        ...e,
        urlMapping,
        knownResources,
      }
      const resources = await importer.import(URL, params);
      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.file}`);
        if (entry.extra) {
          output += `${entry.source};${entry.file};${entry.extra.author};${entry.extra.date};${entry.extra.tags.join(', ')};\n`;
        }
      });
      await handler.put('importer_output.csv', output)
    } catch(error) {
      console.error(`Could not import ${URL}`, error);
    }
  });
  console.log('Done');
}

main();