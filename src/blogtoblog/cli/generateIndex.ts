import fg from 'fast-glob';
import fs from 'fs-extra';
import Excel from 'exceljs';

import { getPathsFromFolder } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console


async function main(lang) {
  const files = await getPathsFromFolder(process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER, `/${lang}/publish`);

  const rows = [[
    'src',
    'path',
  ]];

  files.forEach((e) => {
    const { src, path } = e;
    rows.push([
      src,
      path,
    ]);
  });

  console.log(`Found ${rows.length - 1} in /${lang}/publish`);

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/blogtoblog/${lang}/drafts/import/`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/custom-index.xlsx`);
}

main('es');
