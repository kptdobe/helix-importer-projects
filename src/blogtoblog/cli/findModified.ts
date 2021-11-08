import { getModifiedSince } from '../utils';

import { config } from 'dotenv';
config();

// tslint:disable: no-console

async function main() {
  const modified = await getModifiedSince(process.env.BLOGTOBLOG_THEBLOG_LOCAL_FOLDER, '', new Date(2021, 10, 4, 8, 0, 0, 0).getTime());
  modified.forEach((m) => {
    console.log(m.path);
  });
}

main();
