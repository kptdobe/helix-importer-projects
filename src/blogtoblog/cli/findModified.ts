import fg from 'fast-glob';
import fs from 'fs-extra';
import Excel from 'exceljs';

import { sanitize } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console


async function main(pathname) {
  const root = process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER;
  const cwd = `${root}${pathname}`;
  const entries = await fg('**/*.{docx,md}', {
    cwd,
    ignore: [
      '**/drafts/**',
      '**/documentation/**',
    ],
    stats: true,
  });

  const IGNORED = [
    'document',
    'documento',
    'dokument',
  ];

  const LAST_MODIFIED_AFTER = new Date(2021, 10, 4, 8, 0, 0, 0).getTime();
  const modified = [];

  entries.forEach((e) => {
    if (e.stats.mtimeMs > LAST_MODIFIED_AFTER) {
      modified.push(e);
      console.log('found', `${pathname}/${e.path}`);
    }
    // const noExt = e.substring(0, e.lastIndexOf('.'));
    // const folders = noExt.substring(0, noExt.lastIndexOf('/'));
    // const filename = sanitize(noExt.replace(`${folders}/`, '').toLowerCase());
    // const path = `${pathname}/${folders}/${filename}`;

    // if (!IGNORED.includes(filename)) {
    //   const src = `/${pathname}/${e}`;
    //   rows.push({
    //     src,
    //     path,
    //   });
    // } else {
    //   console.warn('ignoring', path);
    // }
  });

  console.log(`Found ${modified.length}/${entries.length} in ${pathname}`);
}

main('');
