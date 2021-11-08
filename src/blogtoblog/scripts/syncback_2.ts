import { migrateContent } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console


async function main() {
  const srcRoot = process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER;

  const SIMULATION = true;
  const destRoot = process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER;

  const folders = [
    '/en/publish/2021/11',
    '/br/publish/2021/11',
    '/de/publish/2021/11',
    '/es/publish/2021/11',
    '/fr/publish/2021/11',
    '/it/publish/2021/10',
    '/jp/publish/2021/11',
    '/ko/publish/2021/11',
  ];

  await migrateContent(folders, srcRoot, destRoot, SIMULATION);
}

main();
