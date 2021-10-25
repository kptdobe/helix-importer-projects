import fetch from 'node-fetch';
import config from './config';

// tslint:disable: no-console

export async function preview(path, index = 0) {
  const url = `https://admin.hlx3.page/preview/${config.OWNER}/${config.REPO}/${config.BRANCH}${path}`;
  console.log(`${index} - Previewing ${url}`);
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Something wrong with ${url}`);
  }
}

export async function publish(path, index = 0) {
  const url = `https://admin.hlx3.page/live/${config.OWNER}/${config.REPO}/${config.BRANCH}${path}`;
  console.log(`${index} - Publishing ${url}`);
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) {
    console.error(`Something wrong with ${url}`);
  }
}

export async function pp(path, index = 0) {
  await preview(path, index);
  await publish(path, index);
}
