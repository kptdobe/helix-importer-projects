const fs = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');

import { config } from 'dotenv';
config();

const SIMULATION = true;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
}

async function main(srcFolder, cacheFolder, targetFolder) {
  const entries = await fg('**/*.docx', {
    cwd: srcFolder,
    // ignore: ['**/drafts/**', '**/query-index.xlsx']
  });

  let copied = 0;

  await asyncForEach(entries, async (entry) => {
    const sourcePath = path.join(srcFolder, entry);
    const cachePath = path.join(cacheFolder, entry);
    const targetPath = path.join(targetFolder, entry);

    let diff = false;
    const sStat = await fs.stat(sourcePath);
    if (fs.existsSync(cachePath)) {
      const tStat = await fs.stat(cachePath);

      if (sStat.mtimeMs !== tStat.mtimeMs) {
        diff = true;
      }
    } else {
      diff = true;
    }

    if (!fs.existsSync(targetPath)) {
      diff = true;
    }

    if (diff) {
      console.log(`Copying file - ${sourcePath}.`);
      if (!SIMULATION) {
        // copy in cache
        await fs.ensureDir(path.dirname(cachePath));
        await fs.copyFile(sourcePath, cachePath);
        await fs.utimes(cachePath, sStat.atime, sStat.mtime);

        // copy in target (sharepoint touches the files after copy)
        await fs.ensureDir(path.dirname(targetPath));
        await fs.copyFile(sourcePath, targetPath);
        await fs.utimes(targetPath, sStat.atime, sStat.mtime);
      }
      copied += 1;
    }
  });
  console.log(`${copied} copied, ${entries.length} total.`);
}


const PATH = '/';

// WIP
main(
  `./output/blogtoblog/cache/${PATH}`,
  `./output/blogtoblog/cache/${PATH}`,
  `${process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER}${PATH}`,
);
