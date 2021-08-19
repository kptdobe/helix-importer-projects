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

import BlogToBlogImporter from './BlogToBlogImporter';

import { FSHandler, CSV, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';

// tslint:disable: no-console

config();

async function main() {
  const handler = new FSHandler('output/blogtoblog', console);
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

  // const csv = await handler.get('posts.csv');
  // const entries = CSV.toArray(csv.toString());
  const entries = [
    {
      url: 'https://blog.adobe.com/en/publish/2021/08/17/photoshop-releases-major-update-sky-replacement-healing-brush-magic-wand-on-ipad-much-more.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2021/06/07/back-to-school-2021-how-digital-technologies-can-ease-the-return-to-in-person-education.html',
    }, {
      url: 'https://blog.adobe.com/en/publish/2021/03/31/premiere-gal-shares-her-adobe-premiere-pro-knowledge.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2021/01/14/adobe-stock-motion-audio-creative-trends-2021.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2020/12/17/evolving-role-cio-2021.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2020/02/20/access-the-power-of-adobe-acrobat-inside-google-drive.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2019/12/15/where-executives-are-placing-their-biggest-bets-in-2020.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2019/01/08/3-opportunities-for-life-insurers-to-win-amid-digital-disruption.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2018/05/03/customers-report-3x-return-investment-adobe-experience-manager.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2017/08/08/15-mind-blowing-stats-about-design-led-businesses.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2017/07/18/a-brief-history-of-ui-and-whats-coming.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2016/03/20/the-real-value-in-voice-of-the-customer-the-customer-experience.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2016/03/20/data-decisions-dsp-vs-dmp.html',
    },{
      url: 'https://blog.adobe.com/en/publish/2015/04/09/top-5-internet-things-devices.html',
    },
  ];

  const importer = new BlogToBlogImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/blogtoblog',
  });

  let output = `source;file;lang;author;date;topics;products;\n`;
  await Utils.asyncForEach(entries, async (e) => {
    const { url } = e;
    try {
      const resources = await importer.import(url, {});
      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.file}`);
        output += `${entry.source};${entry.file};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.topics.join(', ')};${entry.extra.products.join(', ')};\n`;
      });
      await handler.put('importer_output.csv', output);
    } catch(error) {
      console.error(`Could not import ${url}`, error);
    }
  });
  console.log('Done');
}

main();
