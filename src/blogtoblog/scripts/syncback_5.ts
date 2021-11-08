import { migrateContent } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console


async function main() {
  const srcRoot = process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER;
  // const destRoot = '/Users/acapt/work/dev/helix/helix-importer-projects/output/blogtoblog/playground';
  // const destRoot = '/Users/acapt/Adobe/AlexTest - Documents/websites/blog/en/drafts/alex/playground';

  const SIMULATION = true;
  const destRoot = process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER;

  const folders = [
    '/en/publish/2020',
    '/en/publish/2019',
    '/en/publish/2018',
    '/en/publish/2017',
    '/en/publish/2016',
    '/en/publish/2015',
    '/en/publish/2014',
    '/en/publish/2013',
    '/en/publish/2012',
    '/en/publish/2011',
    '/en/publish/2010',
    '/en/publish/2009',
    '/en/publish/2008',
    '/en/publish/2007',
    '/en/publish/2006',
    '/en/publish/2005',

    '/br/publish/2020',
    '/br/publish/2019',
    '/br/publish/2018',

    '/de/publish/2020',
    '/de/publish/2019',
    '/de/publish/2018',
    '/de/publish/2017',
    '/de/publish/2016',
    '/de/publish/2015',
    '/de/publish/2014',
    '/de/publish/2013',
    '/de/publish/2012',

    '/es/publish/2020',
    '/es/publish/2019',
    '/es/publish/2018',
    '/es/publish/2017',
    '/es/publish/2016',
    '/es/publish/2015',

    '/fr/publish/2020',
    '/fr/publish/2019',
    '/fr/publish/2018',
    '/fr/publish/2017',
    '/fr/publish/2016',
    '/fr/publish/2015',
    '/fr/publish/2014',
    '/fr/publish/2013',
    '/fr/publish/2012',

    '/it/publish/2020',
    '/it/publish/2019',
    '/it/publish/2018',
    '/it/publish/2017',
    '/it/publish/2016',
    '/it/publish/2015',

    '/jp/publish/2020',
    '/jp/publish/2019',
    '/jp/publish/2018',
    '/jp/publish/2017',
    '/jp/publish/2016',
    '/jp/publish/2015',
    '/jp/publish/2014',
    '/jp/publish/2013',
    '/jp/publish/2012',
    '/jp/publish/2011',
    '/jp/publish/2010',
    '/jp/publish/2009',
    '/jp/publish/2008',

    '/ko/publish/2020',
    '/ko/publish/2019',
    '/ko/publish/2018',
    '/ko/publish/2017',
    '/ko/publish/2016',
  ];

  await migrateContent(folders, srcRoot, destRoot, SIMULATION);
}

main();
