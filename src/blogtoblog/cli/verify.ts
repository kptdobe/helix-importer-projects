import fg from 'fast-glob';
import fetch from 'node-fetch';
import { preview } from '../utils';
import { Utils } from '@adobe/helix-importer';

import siteconfig from '../config';

import { config } from 'dotenv';
config();

// tslint:disable: no-console

const PATH_TO_VERIFY = '/it/publish';

const BATCH_SIZE = 20;

async function main() {
  const cwd = `${process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER}${PATH_TO_VERIFY}`;
  const entries = await fg('**/*.docx', {
    cwd,
  });

  const paths = [];
  entries.reverse().forEach((e) => {
    const path = `${PATH_TO_VERIFY}/${e.split('.')[0]}`.toLowerCase();
    paths.push(path);
  });

  let promises = [];
  const startIndex = -1;
  console.log(`Verifying ${paths.length} pages from ${PATH_TO_VERIFY}`);
  await Utils.asyncForEach(paths, async (path, index) => {
    if (index >= startIndex && path) {
      promises.push(new Promise(async (resolve, reject) => {
        const url = `https://${siteconfig.BRANCH}--${siteconfig.REPO}--${siteconfig.OWNER}.hlx3.page${path}`;
        // console.log(`Verifying ${url}...`);
        const res = await fetch(url);
        if (!res.ok) {
          console.log(`URL ${url} not ok.`);
          let success = false;
          let retry = 0;
          do {
            console.log(`Fixing ${path}...`);
            success = await preview(path, index, paths.length);
            if (!success) {
              console.log(`Retrying ${path}...`);
              retry += 1;
            } else {
              console.log(`Fixed ${path}...`);
              retry = 3;
            }
          } while (retry < 3);

          if (!success) {
            console.error(`Could not fix ${path}`);
          }
        }
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

  console.log(`Done verifying the ${paths.length} pages from ${PATH_TO_VERIFY}`);
}

main();
