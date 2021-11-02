import fetch from 'node-fetch';
import config from './config';

import { Utils } from '@adobe/helix-importer';

// tslint:disable: no-console

export async function preview(path, index = 0) {
  const url = `https://admin.hlx3.page/preview/${config.OWNER}/${config.REPO}/${config.BRANCH}${path}`;
  console.log(`${index} - Previewing ${url}`);
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Preview problem - something wrong with ${url} - ${r.headers.get('x-error')}`);
    return false;
  }
  return true;
}

export async function publish(path, index = 0) {
  const url = `https://admin.hlx3.page/live/${config.OWNER}/${config.REPO}/${config.BRANCH}${path}`;
  console.log(`${index} - Publishing ${url}`);
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Publish problem - something wrong with ${url} - ${r.headers.get('x-error')}`);
    return false;
  }
  return true;
}

export async function pp(path, index = 0) {
  if (await preview(path, index)) {
    return await publish(path, index);
  }
  return false;
}

const BATCH_SIZE = 5;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function batchPreviewPublish(paths, startIndex = -1) {
  let promises = [];
  let total = 0;
  await Utils.asyncForEach(paths, async (path, index) => {
    if (index >= startIndex && path) {
      promises.push(new Promise(async (resolve, reject) => {
        let success = false;
        let retry = 0;
        do {
          success = await pp(path, index);
          if (!success) {
            console.log(`Retrying ${path}...`);
            // pause 1s to let the system cool down (maybe...)
            await delay(1000);
            retry += 1;
          } else {
            retry = 3;
          }
        } while (retry < 3);

        if (!success) {
          console.error(`Could not preview / publish ${path}...`);
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

  return total;
}
