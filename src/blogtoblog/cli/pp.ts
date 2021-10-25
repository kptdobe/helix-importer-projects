import fetch from 'node-fetch';
import { Utils } from '@adobe/helix-importer';

import { pp } from '../utils';
import config from '../config';

// tslint:disable: no-console

const BATCH_SIZE = 8;
const START_INDEX = -1;

async function main(lang) {
  const INDEX_PATH = `/${lang}/drafts/import/output.json`;
  const INDEX_URL = `https://${config.BRANCH}--${config.REPO}--${config.OWNER}.hlx3.page${INDEX_PATH}`;

  // preview and publish the index file
  await pp(INDEX_PATH, -1);
  const res = await fetch(INDEX_URL);
  if (res.ok) {
    const json = await res.json();

    let promises = [];
    await Utils.asyncForEach(json.data, async (d, index) => {
      if (index >= START_INDEX && d.path) {
        promises.push(new Promise(async (resolve, reject) => {
          await pp(d.path, index);
          resolve(true);
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
}

main('en');

