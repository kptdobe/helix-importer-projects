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

config();

async function main() {
  const handler = new FSHandler('output/adobelife', console);
  const importer = new AdobeLifeImporter({
    // url: 'https://blogs.adobe.com/adobelife/2020/08/26/how-to-build-a-designed-alliance/',
    // url: 'https://blogs.adobe.com/adobelife/2019/11/27/adobe-france-create-change/',
    url: 'https://blogs.adobe.com/adobelife/2020/08/31/parth-gupta/',
    storageHandler: handler,
    blobHandler: new BlobHandler({
      azureBlobSAS: process.env.AZURE_BLOB_SAS,
      azureBlobURI: process.env.AZURE_BLOB_URI
    })
  });
  importer.import();

}

main();