import fg from 'fast-glob';
import fs from 'fs-extra';
import Excel from 'exceljs';
import siteconfig from '../config';

import { config } from 'dotenv';
config();

const AUTHORS_PATH = '/authors';

async function main(lang) {
  const entries = await fg('**/*.{docx,md}', {
    cwd: `${process.env.BLOGTOBLOG_SRC_FOLDER}/${lang}${AUTHORS_PATH}`,
  });

  const rows = [];
  rows.push([
    'currentPath',
    'newPath',
    'name',
  ]);
  entries.forEach((e) => {
    const currentPath = `${AUTHORS_PATH}/${e.split('.')[0]}`;

    const [filename, dirname] = currentPath.split('/').reverse();
    const [basename] = filename.split('.');

    const selectorBasename = (basename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectorDirname = (dirname || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const name = e.split('.')[0].toLowerCase();

    const newPath = currentPath.replace(/ /g, '-').toLowerCase();

    // tslint:disable-next-line: no-console
    // console.log(currentPath, newPath, name);

    rows.push([
      currentPath,
      newPath,
      name,
    ]);
  });

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/blogtoblog/${lang}/drafts/import/`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/authors.xlsx`);
}

siteconfig.LOCALES.forEach(l => main(l));
