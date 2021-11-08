import path from 'path';
import { Utils } from '@adobe/helix-importer';
import { copyFile } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console

async function main() {
  const srcRoot = process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER;

  const SIMULATION = true;
  const destRoot = process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER;

  const resources = [
    // en
    '/index.docx',
    '/en/query-index.xlsx',
    '/en/placeholders.xlsx',
    '/en/gnav.docx',
    '/en/footer.docx',
    '/en/topics/taxonomy.xlsx',
    '/en/uk.docx',
    '/en/apac.docx',

    // br
    '/br/index.docx',
    '/br/query-index.xlsx',
    '/br/placeholders.xlsx',
    '/br/gnav.docx',
    '/br/footer.docx',
    '/br/topics/taxonomy.xlsx',

    // de
    '/de/index.docx',
    '/de/query-index.xlsx',
    '/de/placeholders.xlsx',
    '/de/gnav.docx',
    '/de/footer.docx',
    '/de/topics/taxonomy.xlsx',

    // es
    '/es/index.docx',
    '/es/query-index.xlsx',
    '/es/placeholders.xlsx',
    '/es/gnav.docx',
    '/es/footer.docx',
    '/es/topics/taxonomy.xlsx',
    '/es/emea.docx',
    '/es/latam.docx',

    // fr
    '/fr/index.docx',
    '/fr/query-index.xlsx',
    '/fr/placeholders.xlsx',
    '/fr/gnav.docx',
    '/fr/footer.docx',
    '/fr/topics/taxonomy.xlsx',

    // it
    '/it/index.docx',
    '/it/query-index.xlsx',
    '/it/placeholders.xlsx',
    '/it/gnav.docx',
    '/it/footer.docx',
    '/it/topics/taxonomy.xlsx',

    // jp
    '/jp/index.docx',
    '/jp/query-index.xlsx',
    '/jp/placeholders.xlsx',
    '/jp/gnav.docx',
    '/jp/footer.docx',
    '/jp/topics/taxonomy.xlsx',

    // ko
    '/ko/index.docx',
    '/ko/query-index.xlsx',
    '/ko/placeholders.xlsx',
    '/ko/gnav.docx',
    '/ko/footer.docx',
    '/ko/topics/taxonomy.xlsx',
  ];

  await Utils.asyncForEach(resources, async (r) => {
    await copyFile(path.join(srcRoot, r), path.join(destRoot, r), SIMULATION);
  });
}

main();
