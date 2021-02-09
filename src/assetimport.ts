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


import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';

config();

async function main() {
  const blobHandler = new BlobHandler({
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI
  });

  const print = async (url) => {
    // tslint:disable-next-line: no-console
    console.log(`RESULT IS: [](${(await blobHandler.getBlob(url)).uri})`);
  }

  await print('https://blogsimages.adobe.com/creative/files/2020/10/01_Glyph_Snapping_v01.gif');

}

main();
