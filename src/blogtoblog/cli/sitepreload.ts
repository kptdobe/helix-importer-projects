import { Utils } from '@adobe/helix-importer';

import { pp } from '../utils';

// tslint:disable: no-console

const RESOURCES = [
  '/index',
  '/gnav',
  '/footer',
  '/query-index.json',
  '/metadata.json',
  '/placeholders.json',
  '/redirects.json',
  '/topics/taxonomy.json',
];

async function main(lang) {
  await Utils.asyncForEach(RESOURCES, async (r, index) => {
    await pp(`/${lang}${r}`, index);
  });
}

main('en');
