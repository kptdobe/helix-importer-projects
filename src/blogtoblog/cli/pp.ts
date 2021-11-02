import fetch from 'node-fetch';

import { batchPreviewPublish, preview } from '../utils';
import config from '../config';

// tslint:disable: no-console


const START_INDEX = -1;

async function main(lang) {
  const INDEX_PATH = `/${lang}/drafts/import/output.json`;
  const INDEX_URL = `https://${config.BRANCH}--${config.REPO}--${config.OWNER}.hlx3.page${INDEX_PATH}`;

  // preview and publish the index file
  await preview(INDEX_PATH, -1);
  const res = await fetch(INDEX_URL);
  let total = 0;
  if (res.ok) {
    const json = await res.json();
    const paths = json.data.map(d => d.path);
    total = await batchPreviewPublish(paths);
  } else {
    console.error(`Invalid index: ${INDEX_URL}`);
  }
  console.log(`Done - previewed / published ${total} pages`);
}

main('fr');

