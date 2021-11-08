import { migrateContent } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console


async function main() {
  const srcRoot = process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER;

  const SIMULATION = true;
  const destRoot = process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER;

  const folders = [
    '/en/authors',
    '/en/topics',
    '/br/authors',
    '/br/topics',
    '/de/authors',
    '/de/topics',
    '/es/authors',
    '/es/topics',
    '/fr/authors',
    '/fr/topics',
    '/it/authors',
    '/it/topics',
    '/jp/authors',
    '/jp/topics',
    '/ko/authors',
    '/ko/topics',
  ];

  await migrateContent(folders, srcRoot, destRoot, SIMULATION);
}

main();
