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

import { WPAdminAjaxPager, FSHandler, CSV } from '@adobe/helix-importer';

async function main() {
  const handler = new FSHandler('output/adobelife', console);
  const pager = new WPAdminAjaxPager({
    nbMaxPages: 3,
    url: 'https://blogs.adobe.com/adobelife/',
  });
  const entries = await pager.explore();
  console.log(`Received ${entries.length} entries!`);

  const csv = CSV.toCSV(entries);
  await handler.put('explorer_result.csv', csv);
}

main();
