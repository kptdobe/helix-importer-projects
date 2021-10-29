import fetch from 'node-fetch';
import config from './config';

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
