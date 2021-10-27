import fg from 'fast-glob';
import fs from 'fs-extra';
import Excel from 'exceljs';
import siteconfig from '../config';

import { config } from 'dotenv';
config();

const PROMOTIONS_PATH = '/promotions';

async function main(lang) {
  const entries = await fg('**/*.{docx,,md}', {
    cwd: `${process.env.BLOGTOBLOG_SRC_FOLDER}/${lang}${PROMOTIONS_PATH}`,
  });

  const rows = [];
  rows.push([
    'currentPath',
    'newPath',
    'selector',
  ]);
  entries.forEach((e) => {
    const currentPath = `${PROMOTIONS_PATH}/${e.split('.')[0]}`;

    const [filename, dirname] = currentPath.split('/').reverse();
    const [basename] = filename.split('.');

    const selectorBasename = (basename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectorDirname = (dirname || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const selector = `embed embed-internal embed-internal-${selectorBasename} embed-internal-${selectorDirname}`;

    const newPath = currentPath.toLowerCase();

    // tslint:disable-next-line: no-console
    // console.log(currentPath, newPath, selector);

    rows.push([
      currentPath,
      newPath,
      selector,
    ]);
  });

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/blogtoblog/${lang}/drafts/import/`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/promotions.xlsx`);
}

siteconfig.LOCALES.forEach(l => main(l));
