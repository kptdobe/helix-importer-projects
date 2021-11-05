import fg from 'fast-glob';
import fs from 'fs-extra';
import Excel from 'exceljs';
import siteconfig from '../config';

import { config } from 'dotenv';
config();

const TOPICS_PATH = '/tags';

async function main() {
  const entries = await fg('**/*.{docx,md}', {
    cwd: `${process.env.BLOGTOBLOG_SRC_FOLDER}/blog${TOPICS_PATH}`,
  });

  const rows = [];
  rows.push([
    'currentPath',
    'newPath',
    'topic',
  ]);
  entries.forEach((e) => {
    const currentPath = `${TOPICS_PATH}/${e.split('.')[0]}`;

    const [filename, dirname] = currentPath.split('/').reverse();
    const [basename] = filename.split('.');

    const selectorBasename = (basename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectorDirname = (dirname || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const topic = e.split('.')[0].toLowerCase();

    const newPath = currentPath.replace(/ /g, '-').toLowerCase();

    // tslint:disable-next-line: no-console
    // console.log(currentPath, newPath, topic);

    rows.push([
      currentPath,
      newPath,
      topic,
    ]);
  });

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/blogtobusiness/drafts/import/`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/tags.xlsx`);
}

// siteconfig.LOCALES.forEach(l => main(l));
main();
