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

function getEntries() {
  return [
  { URL: 'https://www.pmi.com/markets/italy/it/careers' },
  { URL: 'https://www.pmi.com/markets/italy/it/careers/lavora-con-noi' },
  { URL: 'https://www.pmi.com/markets/italy/it/careers/stage-e-internship' },
  { URL: 'https://www.pmi.com/markets/italy/it/careers/welfare-aziendale' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/la-nostra-presenza-in-italia' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/la-nostra-visione' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/manufacturing-technology-bo' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/nostri-prodotti' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/obiettivi-sviluppo-sostenibile-sdgs' },
  { URL: 'https://www.pmi.com/markets/italy/it/chi-siamo/pmi' },
  { URL: 'https://www.pmi.com/markets/italy/it/documenti-legali' },
  { URL: 'https://www.pmi.com/markets/italy/it/news' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/digitalizzazione-imprese-cose-progetti-in-italia-philip-morris' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/filiera-integrata-e-investimenti-in-italia' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/il-nuovo-centro-per-l-eccellenza-industriale' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/la-sostenibilita-al-centro' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/blog-detail/parita-di-genere-in-italia-e-equal-salary' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/details' },
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
  { URL: 'https://www.pmi.com/markets/italy/it/news/news-all' },
  { URL: 'https://www.pmi.com/markets/italy/it/news/philip-morris-italia-inaugura-il-digital-information-service-center-disc-a-taranto' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/approccio-scientifico-di-philip-morris' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/gli-scienziati-e-la-nostra-ricerca-scientifica' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/metodo-scientifico-ricerca-e-sviluppo' },
  { URL: 'https://www.pmi.com/markets/italy/it/scienza-innovazione/prodotti-innovativi-per-i-fumatori' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/progetti-sostenibilita' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/progetti-sostenibilita/cambiagesto' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/progetti-sostenibilita/mobilita-sostenibile' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/progetti-sostenibilita/plastic-free' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/agritech' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/buone-pratiche-agricole' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/gestione-delle-risorse-idriche' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/investimenti-filiera-del-tabacco-in-italia' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-ambientale/una-filiera-sostenibile' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-sociale' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-sociale/diversita-e-inclusione' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-sociale/lotta-all\'illecito' },
  { URL: 'https://www.pmi.com/markets/italy/it/sostenibilita/sostenibilita-sociale/pratiche-di-prevenzione-accesso-ai-minori' },
  { URL: 'https://www.pmi.com/markets/italy/en/about-us' },
  { URL: 'https://www.pmi.com/markets/italy/en/about-us/our-vision' },
  { URL: 'https://www.pmi.com/markets/italy/en/science-and-innovation/scientific-approach-of-philip-morris' },
  { URL: 'https://www.pmi.com/markets/italy/en/sustainability/environmental-sustainability' },
  { URL: 'https://www.pmi.com/markets/italy/en/about-us/our-presence-in-italy' },
  { URL: 'https://www.pmi.com/markets/italy/en/about-us/manufacturing-technology-bo' },
  { URL: 'https://www.pmi.com/markets/italy/en/careers' },
  { URL: 'https://www.pmi.com/markets/italy/en/overview' },
  ];
}

export default getEntries;
