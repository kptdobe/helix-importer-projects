/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default class Loader {
  static async loadSitemap(sitemapURL) {
    const resp = await fetch(sitemapURL);
    const xml = await resp.text();
    const sitemap = new (new JSDOM()).window.DOMParser().parseFromString(xml, 'text/xml');
    const subSitemaps = [...sitemap.querySelectorAll('sitemap loc')];
    let urls = [];
    const promises = subSitemaps.map(loc => new Promise((resolve) => {
      const subSitemapURL = new URL(loc.textContent);
      Loader.loadSitemap(subSitemapURL.pathname).then((result) => {
        urls = urls.concat(result);
        resolve(true);
      });
    }));

    await Promise.all(promises);

    const urlLocs = sitemap.querySelectorAll('url loc');
    urlLocs.forEach((loc) => {
      urls.push(loc.textContent);
    });

    return urls;
  }
}
