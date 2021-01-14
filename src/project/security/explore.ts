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

/* tslint:disable: no-console */

import { WPContentPager } from '../explorers/WPContentPager';
import FSHandler from '../../product/storage/FSHandler';

import CSV from '../../product/utils/CSV';

async function main() {
  const handler = new FSHandler('output/security', console);

  const pager = new WPContentPager({
    nbMaxPages: 1000,
    url: `https://blogs.adobe.com/security/`
  });
  const entries = await pager.explore();
  console.log(`Received ${entries.length} entries!`);

  const csv = CSV.toCSV(entries);
  await handler.put(`explorer_result_full.csv`, csv);
}

main();