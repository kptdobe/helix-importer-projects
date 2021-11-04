import { Utils } from '@adobe/helix-importer';

import { pp } from '../utils';
import siteconfig from '../config';

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
  '/uk',
  '/apac',
  '/emea',
  '/latam',
];

async function main(lang) {
  await Utils.asyncForEach(RESOURCES, async (r, index) => {
    await pp(`/${lang}${r}`, index);
  });
}

siteconfig.LOCALES.forEach(l => main(l));
// main('en');
