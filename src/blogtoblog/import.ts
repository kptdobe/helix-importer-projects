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

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fetch from 'node-fetch';

// tslint:disable: no-console

config();

async function getPromoList() {
  const req = await fetch('https://main--business-website--adobe.hlx.page/drafts/alex/import/promotions.json');
  const res = {};
  if (req.ok) {
    const json = await req.json();
    json.data.forEach((e) => {
      const className = `embed-internal-${e.file
          .toLowerCase()
          .substring(e.file.lastIndexOf('/')+1)
          .replace(/-/gm, '')}`;

      if (res[className]) throw new Error(`Duplicate entry for ${e.file}`);
      res[className] = e.url;
    });
  }
  return res;
}


const DATA_LIMIT = 200000;

const [argMin, argMax] = process.argv.slice(2);

function sectionData(data, min, max) {
  min = min ? Number(min) : 0;
  max = max ? Number(max) : data.length;
  const section = data.slice(min, max);
  return section;
}

async function getEntries() {
  const req = await fetch('https://main--business-website--adobe.hlx.page/drafts/alex/import/cmo-dx-content-to-migrate---official.json');
  const res = [];
  if (req.ok) {
    const json = await req.json();
    for (let i=0; i < Math.min(DATA_LIMIT, json.data.length); i++) {
      const e = json.data[i];
      try {
        const u = new URL(e.URL);
        e.Category = e.Category || 'unknown';
        if (e.Category) {
          res.push(e);
        } else {
          console.warn(`No category for ${e.URL}`);
        }
      } catch(error) {
        // ignore rows with invalid URL
      }
    }
  }
  return res;
}

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

  const promoListJSON = await getPromoList();

  // const entries = [
    // {
    //   url: 'https://blog.adobe.com/en/publish/2021/08/17/photoshop-releases-major-update-sky-replacement-healing-brush-magic-wand-on-ipad-much-more.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2021/06/07/back-to-school-2021-how-digital-technologies-can-ease-the-return-to-in-person-education.html',
    // }, {
    //   url: 'https://blog.adobe.com/en/publish/2021/03/31/premiere-gal-shares-her-adobe-premiere-pro-knowledge.html',
    // }, {
    //   url: 'https://blog.adobe.com/en/publish/2020/05/27/the-connection-by-adobe-advertising-cloud.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2021/01/14/adobe-stock-motion-audio-creative-trends-2021.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2020/12/17/evolving-role-cio-2021.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2020/02/20/access-the-power-of-adobe-acrobat-inside-google-drive.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2019/12/15/where-executives-are-placing-their-biggest-bets-in-2020.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2019/01/08/3-opportunities-for-life-insurers-to-win-amid-digital-disruption.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2018/05/03/customers-report-3x-return-investment-adobe-experience-manager.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2017/08/08/15-mind-blowing-stats-about-design-led-businesses.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2017/07/18/a-brief-history-of-ui-and-whats-coming.html',
    // }, {
    //   url: 'https://blog.adobe.com/en/publish/2016/12/06/meet-the-designer-isaac-powell.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2016/03/20/the-real-value-in-voice-of-the-customer-the-customer-experience.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2016/03/20/data-decisions-dsp-vs-dmp.html',
    // }, {
    //   url: 'https://blog.adobe.com/en/publish/2015/11/16/adobe-nordic-creative-talent-award-winners-2015.html',
    // },{
    //   url: 'https://blog.adobe.com/en/publish/2015/04/09/top-5-internet-things-devices.html',
    // },
  //   {
  //     URL: 'https://blog.adobe.com/en/publish/2021/06/07/improving-the-customer-experience-cios-look-beyond-business-technology-to-privacy.html',
  //     'Destination URL': 'https://business.adobe.com/blog/insights/improving-the-customer-experience-cios-look-beyond-business-technology-to-privacy.html',
  //     Category: 'insights',
  //     'Article Tags': 'Personalization,\nData Management,\nIT Executive',
  //     '': 0,
  //   },
  //   {
  //     URL: 'https://blog.adobe.com/en/publish/2021/06/07/back-to-school-2021-how-digital-technologies-can-ease-the-return-to-in-person-education.html',
  //     'Destination URL': 'https://business.adobe.com/blog/insights/back-to-school-2021-how-digital-technologies-can-ease-the-return-to-in-person-education.html',
  //     Category: 'insights',
  //     'Article Tags': 'Education,\nDocument Management,\nAdobe Sign',
  //     '': 0,
  //   },
  //   {
  //     URL: 'https://master--theblog--adobe.hlx-3.page/en/publish/2020/05/27/the-connection-by-adobe-advertising-cloud.html',
  //     'Destination URL': 'https://business.adobe.com/blog/insights/mind-blowing-stats-adobe-impact-on-environmental-sustainability.html',
  //     Category: 'insights',
  //     'Article Tags': 'Tech For Good,\nAdobe Creative Cloud,\nAdobe Experience Cloud,\nAdobe Sign',
  //     '': 0,
  //   },
  // ];

  const allEntries = await getEntries();
  const entries = sectionData(allEntries, argMin, argMax);

  // entries.forEach((e) => {
  //   e.URL = e.URL.replace('https://blog.adobe.com', 'https://master--theblog--adobe.hlx.page');
  // });

  const importer = new BlogToBlogImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/blogtoblog',
    skipAssetsUpload: true,
    skipDocxConversion: true,
  });

  let output = `source;file;lang;author;date;category;topics;tags;banners;\n`;
  await Utils.asyncForEach(entries, async (e) => {
    try {
      const resources = await importer.import(e.URL, { allEntries: entries, category: e.Category, tags: e['Article Tags'], promoList: promoListJSON });

      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.file}`);
        output += `${entry.source};${entry.file};${entry.extra.lang};${entry.extra.author};${entry.extra.date};${entry.extra.category};${entry.extra.topics};${entry.extra.tags};${entry.extra.banners}\n`;
      });
      await handler.put('importer_output.csv', output);
    } catch(error) {
      console.error(`Could not import ${e.url}`, error);
    }
  });
  console.log('Done');
}

main();
