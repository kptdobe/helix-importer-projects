const fs = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');

import { config } from 'dotenv';
import { batchPreviewPublish, delay } from '../utils';
config();

// tslint:disable: no-console

const SIMULATION = false;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
}

async function main(p, srcFolder, cacheFolder, targetFolder) {
  const entries = await fg('**/*.docx', {
    cwd: path.join(srcFolder, p),
    // ignore: ['**/drafts/**', '**/query-index.xlsx']
  });

  let copied = 0;

  const toPreview = [];
  await asyncForEach(entries, async (entry, index) => {
    const fullPath = path.join(p, entry);
    const sourcePath = path.join(srcFolder, fullPath);
    const cachePath = path.join(cacheFolder, fullPath);
    const targetPath = path.join(targetFolder, fullPath);

    console.log(`Copying file - ${sourcePath} to ${targetPath}.`);
    if (!SIMULATION) {
      // copy in cache
      await fs.ensureDir(path.dirname(cachePath));
      await fs.copyFile(sourcePath, cachePath);

      // copy to dest
      await fs.ensureDir(path.dirname(targetPath));
      await fs.copyFile(sourcePath, targetPath);

      toPreview.push(fullPath.replace('.docx', ''));
    }
    copied += 1;
  });

  // this assumes OneDrive sync in less than 10s...
  // folder large set of files, need to add a breakpoint here
  // and wait for sync to be done
  await delay(10000);
  await batchPreviewPublish(toPreview, -1, false, true);

  console.log(`${copied} copied, ${entries.length} total.`);
}


const PATH = '/it';

// WIP
main(
  PATH,
  `./output/blogtoblog`,
  `./output/blogtoblog/cache`,
  `${process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER}`,
);
