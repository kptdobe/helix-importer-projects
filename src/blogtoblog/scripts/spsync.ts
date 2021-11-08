import fs from 'fs-extra';
import path from 'path';

import { getModifiedSince, delay, batchPreviewPublish } from '../utils';
import { Utils } from '@adobe/helix-importer';
import doImport from '../import';

import { config } from 'dotenv';
config();

// tslint:disable: no-console

const SIMULATION = true;

async function copyFile(src, dest) {
  await fs.ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function syncSharepoints(entry, doBlog = false) {
  const oldSource = entry.oldSource;
  const newSource = entry.newSource;
  const fullOldSource = `${process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER}${oldSource}`;
  const fullNewSource = `./output/blogtoblog${newSource}`;
  // copy to cache
  const cacheDest = `./output/blogtoblog/cache${newSource}`;
  console.log(`Cache: copying from ${fullNewSource} to ${cacheDest}`);
  if (!SIMULATION) {
    await copyFile(fullNewSource, cacheDest);
  }

  if (doBlog) {
    // copy to blog
    const blogDest = `${process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER}${newSource}`;
    console.log(`Blog: copying from ${fullNewSource} to ${blogDest}`);
    if (!SIMULATION) {
      await copyFile(fullNewSource, blogDest);
    }
  }

  // copy to archive
  const archiveDest = `${process.env.BLOGTOBLOG_ARCHIVE_LOCAL_FOLDER}${oldSource}`;
  console.log(`Archive: copying from ${fullOldSource} to ${archiveDest}`);
  if (!SIMULATION) {
    await copyFile(fullOldSource, archiveDest);
  }
}

async function main() {
  const modified = await getModifiedSince(
    process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER,
    '',
    new Date(2021, 10, 4, 8, 0, 0, 0).getTime());

  const perLanguage = {};
  const manually = [];

  // split articles (automate) vs the rest (handle manually)
  modified.forEach((m) => {
    if (m.path.includes('/publish/')) {
      const l = m.path.split('/')[1];
      perLanguage[l] = perLanguage[l] || [];
      perLanguage[l].push(m);
    } else {
      manually.push(m);
    }
  });

  console.log('Files to handle manually:');
  manually.forEach((m) => {
    console.log(m.newSource);
  });

  console.log('_________________________');

  console.log('Syncing sharepoints for manual files:');
  await Utils.asyncForEach(manually, async (m) => {
    await syncSharepoints(m);
  });

  console.log('_________________________');

  // run import, copy, preview, publish for each article

  for (const lang in perLanguage) {
    if (perLanguage[lang]) {
      const paths = perLanguage[lang].map(e => e.path);

      console.log(`Importing paths for language ${lang}`, paths);

      if (!SIMULATION) {
        await doImport(lang, paths);
      }

      console.log('Syncing sharepoints for imported files:');
      await Utils.asyncForEach(perLanguage[lang], async (entry) => {
        await syncSharepoints(entry, true);
      });

      if (!SIMULATION) {
        await delay(10000);
        await batchPreviewPublish(paths, -1, false, true);
      }
    }
  }

  console.log('_________________________');
}

main();
