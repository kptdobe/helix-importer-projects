import fetch from 'node-fetch';
import { Utils } from '@adobe/helix-importer';

const OWNER = 'adobe';
const REPO = 'blog';
const BRANCH = 'main';

const LANG = 'en';

const INDEX_PATH = `/${LANG}/drafts/import/output.json`;
const INDEX_URL = `https://${BRANCH}--${REPO}--${OWNER}.hlx3.page${INDEX_PATH}`;

const BATCH_SIZE = 8;
const START_INDEX = -1;

async function pp(path, index) {
  let url = `https://admin.hlx3.page/preview/${OWNER}/${REPO}/${BRANCH}${path}`;
  console.log(`${index} - Previewing ${url}`);
  let r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Something wrong with ${url}`);
  }

  url = `https://admin.hlx3.page/live/${OWNER}/${REPO}/${BRANCH}${path}`;
  console.log(`${index} - Publishing ${url}`);
  r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Something wrong with ${url}`);
  }
}

async function main() {
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
          resolve();
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

main();

