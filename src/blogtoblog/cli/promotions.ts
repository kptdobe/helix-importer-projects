import fg from 'fast-glob';
import fs from 'fs-extra';
import Excel from 'exceljs';
import siteconfig from '../config';

import { config } from 'dotenv';
config();

const PROMOTIONS_PATH = '/promotions';

export async function getPromotions(lang) {
  const entries = await fg('**/*.{docx,md}', {
    cwd: `${process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER}/${lang}${PROMOTIONS_PATH}`,
  });

  const promotions = [];
  entries.forEach((e) => {
    const currentPath = `${PROMOTIONS_PATH}/${e.split('.')[0]}`;

    const [filename, dirname] = currentPath.split('/').reverse();
    const [basename] = filename.split('.');

    const selectorBasename = (basename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectorDirname = (dirname || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const selector = `embed embed-internal embed-internal-${selectorBasename} embed-internal-${selectorDirname}`;

    const newPath = currentPath.toLowerCase();
    promotions.push({
      currentPath,
      newPath,
      selector,
    });
  });

  return promotions;
}

async function main(lang) {
  const promotions = await getPromotions(lang);

  const rows = [];
  rows.push([
    'currentPath',
    'newPath',
    'selector',
  ]);

  promotions.forEach((p) => {
    rows.push([
      p.currentPath,
      p.newPath,
      p.selector,
    ]);
  });

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/blogtoblog/${lang}/drafts/import/`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/promotions.xlsx`);
}

// siteconfig.LOCALES.forEach(l => main(l));
