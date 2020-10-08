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

import AdobeLifeImporter from './AdobeLifeImporter';
import FSHandler from '../../product/storage/FSHandler';

import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import CSV from '../../product/utils/CSV';
import Utils from '../../product/utils/Utils';

config();

async function main() {
  const handler = new FSHandler('output/adobelife', console);
  const blob = new BlobHandler({
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI
  });

  const csv = await handler.get('explorer_result.csv');
  const entries = CSV.toArray(csv.toString());

  const importer = new AdobeLifeImporter({
    storageHandler: handler,
    blobHandler: blob
  });

  Utils.asyncForEach(entries, async (e) => {
    await importer.import(e.url);
  });
}

main();