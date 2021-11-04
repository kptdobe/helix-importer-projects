import fg from 'fast-glob';
import fetch from 'node-fetch';
import config from './config';

import { Utils } from '@adobe/helix-importer';

// tslint:disable: no-console

export async function preview(path, index = 0, total?) {
  const url = `https://admin.hlx3.page/preview/${config.OWNER}/${config.REPO}/${config.BRANCH}${path}`;
  console.log(`${index}${total ? `/${total}`: ''} - Previewing ${url}`);
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Preview problem - something wrong with ${url} - ${r.headers.get('x-error')}`);
    return false;
  }
  return true;
}

export async function publish(path, index = 0, total?) {
  const url = `https://admin.hlx3.page/live/${config.OWNER}/${config.REPO}/${config.BRANCH}${path}`;
  console.log(`${index}${total ? `/${total}`: ''} - Publishing ${url}`);
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Publish problem - something wrong with ${url} - ${r.headers.get('x-error')}`);
    return false;
  }
  return true;
}

export async function pp(path, index = 0, total?) {
  if (await preview(path, index, total)) {
    return await publish(path, index, total);
  }
  return false;
}

const BATCH_SIZE = 5;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function batchPreviewPublish(paths, startIndex = -1, doReject = true, doPublish = true) {
  let promises = [];
  let total = 0;
  await Utils.asyncForEach(paths, async (path, index) => {
    if (index >= startIndex && path) {
      promises.push(new Promise(async (resolve, reject) => {
        let success = false;
        let retry = 0;
        do {
          if (doPublish) {
            success = await pp(path, index, paths.length);
          } else {
            success = await preview(path, index, paths.length);
          }
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
          console.error(`Could not preview / publish ${path}`);
          if (doReject) {
            reject(false);
          } else {
            resolve(false);
          }
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

export function sanitize(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getPathsFromFolder(root, pathname) {
  const cwd = `${root}${pathname}`;
  const entries = await fg('**/*.{docx,md}', {
    cwd,
  });

  const IGNORED = [
    'document',
    'documento',
    'dokument',
  ];

  const rows = [];

  entries.forEach((e) => {
    const noExt = e.substring(0, e.lastIndexOf('.'));
    const folders = noExt.substring(0, noExt.lastIndexOf('/'));
    const filename = sanitize(noExt.replace(`${folders}/`, '').toLowerCase());
    const path = `${pathname}/${folders}/${filename}`;

    if (!IGNORED.includes(filename)) {
      const src = `/${pathname}/${e}`;
      rows.push({
        src,
        path,
      });
    } else {
      console.warn('ignoring', path);
    }
  });
  return rows;
}
