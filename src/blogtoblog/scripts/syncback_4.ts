import { migrateContent } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console


async function main() {
  const srcRoot = process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER;

  const SIMULATION = true;
  const destRoot = process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER;

  const folders = [
    '/en/publish/2021/10',
    '/en/publish/2021/09',
    '/en/publish/2021/08',
    '/en/publish/2021/07',
    '/en/publish/2021/06',
    '/en/publish/2021/05',
    '/en/publish/2021/04',
    '/en/publish/2021/03',
    '/en/publish/2021/02',
    '/en/publish/2021/01',

    '/br/publish/2021/10',
    '/br/publish/2021/09',
    '/br/publish/2021/08',
    '/br/publish/2021/07',
    '/br/publish/2021/06',
    '/br/publish/2021/05',
    '/br/publish/2021/04',
    '/br/publish/2021/03',
    '/br/publish/2021/02',
    '/br/publish/2021/01',

    '/de/publish/2021/10',
    '/de/publish/2021/09',
    '/de/publish/2021/08',
    '/de/publish/2021/07',
    '/de/publish/2021/06',
    '/de/publish/2021/05',
    '/de/publish/2021/04',
    '/de/publish/2021/03',
    '/de/publish/2021/02',
    '/de/publish/2021/01',

    '/es/publish/2021/10',
    '/es/publish/2021/09',
    '/es/publish/2021/08',
    '/es/publish/2021/07',
    '/es/publish/2021/06',
    '/es/publish/2021/05',
    '/es/publish/2021/04',
    '/es/publish/2021/03',
    '/es/publish/2021/02',
    '/es/publish/2021/01',

    '/fr/publish/2021/10',
    '/fr/publish/2021/09',
    '/fr/publish/2021/08',
    '/fr/publish/2021/07',
    '/fr/publish/2021/06',
    '/fr/publish/2021/05',
    '/fr/publish/2021/04',
    '/fr/publish/2021/03',
    '/fr/publish/2021/02',
    '/fr/publish/2021/01',

    '/it/publish/2021/09',
    '/it/publish/2021/07',
    '/it/publish/2021/06',
    '/it/publish/2021/04',
    '/it/publish/2021/03',
    '/it/publish/2021/02',
    '/it/publish/2021/01',

    '/jp/publish/2021/10',
    '/jp/publish/2021/09',
    '/jp/publish/2021/08',
    '/jp/publish/2021/07',
    '/jp/publish/2021/06',
    '/jp/publish/2021/05',
    '/jp/publish/2021/04',
    '/jp/publish/2021/03',
    '/jp/publish/2021/02',
    '/jp/publish/2021/01',

    '/ko/publish/2021/10',
    '/ko/publish/2021/09',
    '/ko/publish/2021/08',
    '/ko/publish/2021/07',
    '/ko/publish/2021/06',
    '/ko/publish/2021/05',
    '/ko/publish/2021/04',
    '/ko/publish/2021/03',
    '/ko/publish/2021/02',
    '/ko/publish/2021/01',
  ];

  await migrateContent(folders, srcRoot, destRoot, SIMULATION);
}

main();
