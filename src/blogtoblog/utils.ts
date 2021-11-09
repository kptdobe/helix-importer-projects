import fg from 'fast-glob';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';

import config from './config';

import { Utils } from '@adobe/helix-importer';

// tslint:disable: no-console

export async function preview(p, index = 0, total?) {
  const url = `https://admin.hlx3.page/preview/${config.OWNER}/${config.REPO}/${config.BRANCH}${p}`;
  try {
    console.log(`${index}${total ? `/${total}`: ''} - Previewing ${url}`);
    const r = await fetch(url, { method: 'POST' });
    if (!r.ok) {
      console.error(`Preview problem - something wrong with ${url} - ${r.headers.get('x-error')}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Preview error - something wrong with ${url}: ${error.message}`);
    return false;
  }
}

export async function publish(p, index = 0, total?) {
  const url = `https://admin.hlx3.page/live/${config.OWNER}/${config.REPO}/${config.BRANCH}${p}`;
  try {
    console.log(`${index}${total ? `/${total}`: ''} - Publishing ${url}`);
    const r = await fetch(url, { method: 'POST' });
    if (!r.ok) {
      console.error(`Publish problem - something wrong with ${url} - ${r.headers.get('x-error')}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Publish error - something wrong with ${url}: ${error.message}`);
    return false;
  }
}

export async function pp(p, index = 0, total?) {
  if (await preview(p, index, total)) {
    return await publish(p, index, total);
  }
  return false;
}

const BATCH_SIZE = 3;

export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function batchPreviewPublish(paths, startIndex = -1, doReject = true, doPublish = true) {
  let promises = [];
  let total = 0;
  await Utils.asyncForEach(paths, async (p, index) => {
    if (index >= startIndex && p) {
      promises.push(new Promise(async (resolve, reject) => {
        let success = false;
        let retry = 0;
        do {
          if (doPublish) {
            success = await pp(p, index, paths.length);
          } else {
            success = await preview(p, index, paths.length);
          }
          if (!success) {
            console.log(`Retrying ${p}...`);
            // pause 1s to let the system cool down (maybe...)
            await delay(1000);
            retry += 1;
          } else {
            retry = 3;
          }
        } while (retry < 3);

        if (!success) {
          console.error(`Could not preview / publish ${p}`);
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
    const p = `${pathname}/${folders}/${filename}`;

    if (!IGNORED.includes(filename)) {
      const src = `/${pathname}/${e}`;
      rows.push({
        src,
        path: p,
      });
    } else {
      console.warn('ignoring', p);
    }
  });
  return rows;
}

export async function getModifiedSince(root, pathname, since) {
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

  const modified = [];

  entries.forEach((e) => {
    if (e.stats.mtimeMs > since) {
      const name = sanitize(e.path.substring(e.path.lastIndexOf('/') + 1, e.path.lastIndexOf('.')));
      const parent = e.path.substring(0, e.path.lastIndexOf('/'));
      const p = `${pathname}/${parent}/${name}`.replace('//', '/');
      const source = `${cwd}/${e.path}`;
      modified.push({
        entry: e,
        path: p,
        oldSource: `/${e.path}`,
        newSource: `${p}.docx`,
        absoluteSource: source,
        originalName: e.name,
        date: e.stats.mtimeMs,
      });
    }
  });

  console.log(`Found ${modified.length}/${entries.length} in ${cwd} since ${new Date(since)}`);
  return modified;
}

export async function copyFile(src, dest, simulation = true) {
  // console.log(`copying from ${src} to ${dest}`);
  if (!await fs.exists(src)) {
    console.error(`${src} does not exist!`);
  } else if (!simulation) {
    await fs.ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
  }
}

export async function migrateContent(folders, srcRoot, destRoot, simulation = true) {
  await Utils.asyncForEach(folders, async (f) => {
    const cwd = `${destRoot}${f}`;
    const entries = await fg('**/*.{docx,md}', {
      cwd,
      ignore: [
        `**/_*.*`,
      ],
    });
    await Utils.asyncForEach(entries, async (e) => {
      const theblogSrc = `${f}/${e}`;

      const ext = theblogSrc.substring(theblogSrc.lastIndexOf('.') + 1);
      const noExt = theblogSrc.substring(0, theblogSrc.lastIndexOf('.'));
      const parent = noExt.substring(0, noExt.lastIndexOf('/'));
      const theblogFilename = noExt.replace(`${parent}/`, '');
      const blogFilename = sanitize(theblogFilename);
      if (blogFilename !== '') {
        const blogSrc = `${parent}/${blogFilename}.docx`;

        if (ext === 'md' || blogFilename !== theblogFilename) {
          const oldName = path.join(destRoot, theblogSrc);
          const newName = path.join(destRoot, blogSrc);
          // console.log(`renaming first - from ${oldName} to ${newName}`);
          if (!simulation) {
            await fs.rename(oldName, newName);
          }
        }
        try {
          await copyFile(path.join(srcRoot, blogSrc), path.join(destRoot, blogSrc), simulation);
        } catch(error) {
          console.error(error.message);
        }
      } else {
        console.log(`Ignoring file ${theblogSrc}`);
      }
    });
  });
}
