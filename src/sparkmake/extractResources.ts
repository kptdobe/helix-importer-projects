import { FSHandler, CSV, Utils } from '@adobe/helix-importer';
import fetch from 'node-fetch';
import { config } from 'dotenv';

/* tslint:disable: no-console */

config();

const API = 'https://sprout-va6.cloud.adobe.io/sprout/api/resources';

const getProperty = (obj, path) => {
  const paths = path.split('/');
  let current = obj;

  for (const p of paths) {
    if (current[p] === undefined) {
      return '';
    } else {
      current = current[p];
    }
  }
  return current.trim().replace(/\;/gm, ',').replace(/\n/gm, ' ');
}

async function main() {
  const handler = new FSHandler('output/sparkmake', console);

  let key = null;
  let res;
  let more = false;

  const LANGUAGES = [
    'en-US',
    'de-DE',
    'ko-KR',
    'pt-BR',
    'es-ES',
    'it-IT',
    'nl-NL',
    'fr-FR',
    'zh-Hant-TW',
    'da-DK'
  ];

  let output = `id;route;name;type;`;
  LANGUAGES.forEach(l => {
    output += `${l}/Title;${l}/Description;${l}/Design Name;`;
  });
  output += '\n';

  const importKeys = {};
  do {
    more = false;
    let url = API;
    if (key) {
      url = `${API}?lastKey=${key}`
    }
    res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && json.resources && json.resources.length > 0) {
        if (key !== json.lastKey && !importKeys[json.lastKey]) {
          key = json.lastKey;
          importKeys[key] = true;
          more = true;
          json.resources.forEach(d => {
            const { id, route, name, type } = d;
            output += `${id};${route};${name};${type};`;

            LANGUAGES.forEach(l => {
              output += `${getProperty(d.directives, `${l}/meta/title`)};${getProperty(d.directives, `${l}/meta/description`)};${getProperty(d.directives, `${l}/meta/designName`)};`;
            });
            output += '\n';

          });
          await handler.put('resources.csv', output);
        }
      }
    } else {
      more = false;
    }
  } while(more);
}

main();
