import fg from 'fast-glob';
import { batchPreviewPublish } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console

const PATH_TO_PUBLISH = '/br/authors';

async function main() {
  const cwd = `${process.env.BLOGTOBLOG_BLOG_LOCAL_FOLDER}${PATH_TO_PUBLISH}`;
  const entries = await fg('**/*.docx', {
    cwd,
  });

  const paths = [];
  entries.reverse().forEach((e) => {
    const path = `${PATH_TO_PUBLISH}/${e.split('.')[0]}`.toLowerCase();
    paths.push(path);
  });

  const total = await batchPreviewPublish(paths, -1, false);
  console.log(`Previewed and published ${total} / ${entries.length} in ${cwd}`);
}

main();
