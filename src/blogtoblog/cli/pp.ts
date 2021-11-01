import fetch from 'node-fetch';
import { Utils } from '@adobe/helix-importer';

import { pp, preview } from '../utils';
import config from '../config';

// tslint:disable: no-console

const BATCH_SIZE = 5;
const START_INDEX = -1;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(lang) {
  const INDEX_PATH = `/${lang}/drafts/import/output.json`;
  const INDEX_URL = `https://${config.BRANCH}--${config.REPO}--${config.OWNER}.hlx3.page${INDEX_PATH}`;

  // preview and publish the index file
  await preview(INDEX_PATH, -1);
  const res = await fetch(INDEX_URL);
  let total = 0;
  if (res.ok) {
    const json = await res.json();

    let promises = [];
    await Utils.asyncForEach(json.data, async (d, index) => {
      if (index >= START_INDEX && d.path) {
        promises.push(new Promise(async (resolve, reject) => {
          let success = false;
          let retry = 0;
          do {
            success = await pp(d.path, index);
            if (!success) {
              console.log(`Retrying ${d.path}...`);
              // pause 1s to let the system cool down (maybe...)
              await delay(1000);
              retry += 1;
            } else {
              retry = 3;
            }
          } while (retry < 3);

          if (!success) {
            console.error(`Could not preview / publish ${d.path}...`);
            reject(false);
          } else {
            total += 1;
            resolve(true);
          }
        }));
      }
      if (promises.length === BATCH_SIZE) {
        await Promise.all(promises);
        promises = [];
      }
    });

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  } else {
    console.error(`Invalid index: ${INDEX_URL}`);
  }
  console.log(`Done - previewed / published ${total} pages`);
}

main('fr');

