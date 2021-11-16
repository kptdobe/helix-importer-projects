/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import PMIImporter from './PMIImporter';

import { FSHandler, Utils } from '@adobe/helix-importer';
import { BlobHandler } from '@adobe/helix-documents-support';

import { config } from 'dotenv';
import fs from 'fs-extra';
import Excel from 'exceljs';

// tslint:disable: no-console

config();

const TARGET_HOST = 'https://main--helix-pmi--adobe.hlx.page';


async function getEntries() {
  return [
    { URL: 'https://www.pmi.com/markets/italy/it/careers/lavora-con-noi' },
  { URL: 'https://www.pmi.com/markets/italy/it/careers/stage-e-internship' },
  { URL: 'https://www.pmi.com/markets/italy/it/careers/welfare-aziendale' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/la-nostra-presenza-in-italia' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/la-nostra-visione' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/manufacturing-technology-bo' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/nostri-prodotti' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/obiettivi-sviluppo-sostenibile-sdgs' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/pmi' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/digitalizzazione-imprese-cose-progetti-in-italia-philip-morris' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/filiera-integrata-e-investimenti-in-italia' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/il-nuovo-centro-per-l-eccellenza-industriale' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/la-sostenibilita-al-centro' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/parita-di-genere-in-italia-e-equal-salary' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/arriva-in-italia-veev-la-nuova-sigaretta-elettronica-di-pmi-lancio-pilota-a-milano-torino-e-genova-e-sul-canale-e-commerce' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/capacita-e-competenze-per-l-intelligent-manufacturing-lo-studio-realizzato-da-the-european-house-ambrosetti-in-collaborazione-con-philip-morris-italia' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/intesa-coldiretti-philip-morris-italia-per-la-sostenibilita-della-filiera-agricola-del-tabacco-italiano' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/la-food-and-drug-administration-autorizza-la-commercializzazione-di-iqos-come-prodotto-a-ridotta-esposizione' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/marco-hannappel-nuovo-amministratore-delegato-eugenio-sidoli-presidente-dell-affiliata' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/nasce-a-bologna-il-philip-morris-institute-for-manufacturing-competences' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/philip-morris-international-annuncia-di-aver-siglato-un-accordo-per-acquisire-vectura-group-plc' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/philip-morris-international-annuncia-l\'autorizzazione-della-food-and-drug-administration-statunitense-alla-vendita-di-iqos-negli-stati-uniti' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/philip-morris-international-annuncia-l-accordo-per-l-acquisizione-di-fertin-pharma' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/philip-morris-international-nomina-jacek-olczak-come-nuovo-chief-executive-officer' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/philip-morris-international-pubblicato-il-nuovo-report-kpmg-sull-impatto-del-commercio-illecito-di-sigarette-in-italia-e-in-unione-europea' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/rinnovo-accordo-sindacale-philip-morris-manufacturing-technology-bologna' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details/top-employer-anche-quest-anno-philip-morris-italia-e-philip-morris-manufacturing-technology-bologna-ricevono-la-certificazione' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/philip-morris-italia-inaugura-il-digital-information-service-center-disc-a-taranto' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/approccio-scientifico-di-philip-morris' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/gli-scienziati-e-la-nostra-ricerca-scientifica' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/metodo-scientifico-ricerca-e-sviluppo' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/prodotti-innovativi-per-i-fumatori' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/progetti-sostenibilita/cambiagesto' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/progetti-sostenibilita/mobilita-sostenibile' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/progetti-sostenibilita/plastic-free' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/agritech' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/buone-pratiche-agricole' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/gestione-delle-risorse-idriche' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/investimenti-filiera-del-tabacco-in-italia' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/una-filiera-sostenibile' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-sociale/diversita-e-inclusione' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-sociale/lotta-all\'illecito' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-sociale/pratiche-di-prevenzione-accesso-ai-minori' },
  ];
}

async function main() {
  // tslint:disable-next-line: no-empty
  const noop = () => {};

  const customLogger = {
    debug: noop,
    info: noop,
    log: noop,
    warn: () => console.log(...arguments),
    error: () => console.error(...arguments),
  };

  const handler = new FSHandler('output/pmi/import', customLogger);

  const blob = new BlobHandler({
    skipSchedule: true,
    azureBlobSAS: process.env.AZURE_BLOB_SAS,
    azureBlobURI: process.env.AZURE_BLOB_URI,
    log: customLogger,
  });

  const entries = await getEntries();

  const importer = new PMIImporter({
    storageHandler: handler,
    blobHandler: blob,
    cache: '.cache/pmi',
    skipAssetsUpload: true,
    // skipDocxConversion: true,
    skipMDFileCreation: true,
    logger: customLogger,
  });

  const rows = [[
    'source',
    'file',
    'category',
  ]];

  await Utils.asyncForEach(entries, async (e) => {
    try {
      const resources = await importer.import(e.URL, { target: TARGET_HOST, entries });

      resources.forEach((entry) => {
        console.log(`${entry.source} -> ${entry.docx}`);
        rows.push([
          entry.source,
          entry.docx,
          entry.extra.category,
        ]);
      });
    } catch(error) {
      console.error(`Could not import ${e.url}`, error);
    }
  });


  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = `output/pmi/`;
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/import.xlsx`);

  console.log('Done');
}

main();
