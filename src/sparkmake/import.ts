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

import SparkMakeImporter from './SparkMakeImporter';

import { FSHandler, CSV, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
/* tslint:disable: no-console */

config();

async function main() {
  const handler = new FSHandler('output/sparkmake/round6', console);
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
    },
    blobAgent: 'helix-importer-sparkmake',
  });

  let csv = await handler.get('url-mapping.csv');
  const allEntries = CSV.toArray(csv.toString());
  const urlMapping = {};
  allEntries.forEach(e => {
    urlMapping[e.URL] = e.Target;
  });

  // csv = await handler.get('Sprout-To-Learn.csv');
  // csv = await handler.get('SEO-Pages-To-Migrate.csv');
  // csv = await handler.get('errors.csv');
  csv = await handler.get('all.csv');
  // csv = await handler.get('one.csv');
  const entries = CSV.toArray(csv.toString());

  csv = await handler.get('resources.csv');
  const array = CSV.toArray(csv.toString());
  const metadata = {};
  array.forEach(r => {
    [ '', 'de-DE', 'ko-KR', 'pt-BR', 'es-ES', 'it-IT', 'nl-NL', 'fr-FR', 'zh-Hant-TW', 'da-DK' ].forEach(l => {
      const lang = l || 'en-US';
      const title = r[`${lang}/Title`] || r['en-US/Title'];
      const description = r[`${lang}/Description`] || r['en-US/Description'];
      const shortTitle = r[`${lang}/Design Name`] || r['en-US/Design Name'];

      metadata[`https://spark.adobe.com${l ? `/${l}` : ''}${r.route}`] = {
        title,
        description,
        shortTitle,
        language: lang,
      };
    });
  });

  const importer = new SparkMakeImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/sparkmake'
  });

  let output = `source;file;\n`;
  await Utils.asyncForEach(entries, async (e) => {
    const { URL } = e;
    try {
      const params = {
        ...e,
        metadata: metadata[URL] ? metadata[URL] : null,
        urlMapping
      };
      const resources = await importer.import(URL, params);
      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.file}`);
        output += `${entry.source};${entry.file};\n`;
      });
      await handler.put('importer_output.csv', output)
    } catch(error) {
      console.error(`Could not import ${URL}`, error);
    }
  });
  console.log('Done');
}

main();