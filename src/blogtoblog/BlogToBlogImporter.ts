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
/* eslint-disable no-console */

import { PageImporter, PageImporterResource, DOMUtils, WPUtils } from '@adobe/helix-importer';

import fetch from 'node-fetch';
import path from 'path';
import { Response } from 'node-fetch';
import { Document } from 'jsdom';

import Blocks from '../utils/Blocks';
import DOM from '../utils/DOM';

export default class BlogToBlogImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  renameBlocks(element: Element, document: Document): void {
    element.querySelectorAll('main > div > table th').forEach((th) => {
      const blockName = th.innerHTML.trim().toLowerCase();
      if (blockName === 'linked image' || blockName === 'image 50') {
        th.innerHTML = 'Images';
      }
      if (blockName === 'promotion' || blockName.includes('embed internal')) {
        th.innerHTML = 'Banner';
      }
      if (blockName.startsWith('block embed')) {
        th.innerHTML = 'Embed';
      }
    });
  }

  findBanners(element: Element, document: Document): any {
    const banners = [];
    element.querySelectorAll('main > div > table th').forEach((th) => {
      if (th.innerHTML === 'Banner') {
        banners.push(th.parentElement.parentElement.querySelector('a').textContent);
      }
    });
    return banners.join(', ');
  }

  buildRecommendedArticlesTable(element: Element, document: Document): void {
    element.querySelectorAll('main > div > h2').forEach((h2) => {
      if (h2.textContent.toLowerCase().startsWith('featured posts')) {
        const linksContainer = h2.nextElementSibling;
        if (linksContainer) {
          const links = Array.from(linksContainer.querySelectorAll('a'));

          const table = document.createElement('table');
          const headRow = document.createElement('tr');
          table.append(headRow);

          const th = document.createElement('th');
          th.textContent = 'Recommended Articles';
          headRow.append(th);

          const bodyRow = document.createElement('tr');
          table.append(bodyRow);

          const td = document.createElement('td');
          links.forEach((a) => {
            td.append(a, `\n`);
          });
          bodyRow.append(td);

          h2.parentElement.replaceWith(table);
        }
      }
    });
  }

  buildMetadataTable(head: Element, main: Element, document: Document, params: any): any {
    const table = document.createElement('table');
    const headRow = document.createElement('tr');
    table.append(headRow);
    const th = document.createElement('th');
    th.textContent = 'Metadata';
    headRow.append(th);

    const metaDesc = head
      .querySelector('meta[name~="description"]')
      .getAttribute('content');
    if (metaDesc) {
      let descArr = [];
      main.querySelectorAll('div > p').forEach((p) => {
        if (descArr.length === 0) {
          const words = p.textContent.trim().split(/\s+/);
          if (words.length >= 10 || words.some(w => w.length > 25 && !w.startsWith('http'))) {
            descArr = descArr.concat(words);
          }
        }
      });
      const computedDesc = `${descArr.slice(0, 25).join(' ')}${descArr.length > 25 ? ' ...' : ''}`;
      if (metaDesc !== computedDesc) {
        const descRow = document.createElement('tr');
        table.append(descRow);
        const descTitle = document.createElement('td');
        descTitle.textContent = 'Description';
        descRow.append(descTitle);
        const descData = document.createElement('td');
        descData.textContent = metaDesc;
        descRow.append(descData);
      } else {
        // check if heading follows h1 in "article header" area
        const h1 = main.querySelector('h1');
        if (h1) {
          const h1Sibling = h1.nextElementSibling;
          if (h1Sibling.nodeName.startsWith('H')) {
            const descRow = document.createElement('tr');
            table.append(descRow);
            const descTitle = document.createElement('td');
            descTitle.textContent = 'Description';
            descRow.append(descTitle);
            const descData = document.createElement('td');
            descData.textContent = h1Sibling.textContent;
            descRow.append(descData);
            h1Sibling.remove();
          }
        }
      }
    }

    const [authorStr, dateStr] = Array
      .from(main.querySelectorAll('main > div:nth-child(3) > p'))
      .map(p => p.textContent);
    main.querySelector('main > div:nth-child(3)').remove();

    let author;
    let date;
    if (authorStr) {
      author = authorStr.replace('By ', '').replace('by ', '').trim();
      const authorRow = document.createElement('tr');
      table.append(authorRow);
      const authorTitle = document.createElement('td');
      authorTitle.textContent = 'Author';
      authorRow.append(authorTitle);
      const authorData = document.createElement('td');
      authorData.textContent = author;
      authorRow.append(authorData);
    }
    if (dateStr) {
      date = dateStr.toLowerCase().replace('posted on ', '').trim();
      const dateRow = document.createElement('tr');
      table.append(dateRow);
      const dateTitle = document.createElement('td');
      dateTitle.textContent = 'Publication Date';
      dateRow.append(dateTitle);
      const dateData = document.createElement('td');
      dateData.textContent = date;
      dateRow.append(dateData);
    }

    let category;
    let tags;

    if (params) {
      if (params.category) {
        const categoryRow = document.createElement('tr');
        table.append(categoryRow);
        const categoryTitle = document.createElement('td');
        categoryTitle.textContent = 'Category';
        categoryRow.append(categoryTitle);
        const categoryData = document.createElement('td');
        categoryData.textContent = params.category;
        categoryRow.append(categoryData);
        category = params.category;
      }

      if (params.tags) {
        const tagsRow = document.createElement('tr');
        table.append(tagsRow);
        const tagsTitle = document.createElement('td');
        tagsTitle.textContent = 'Tags';
        tagsRow.append(tagsTitle);
        const tagsData = document.createElement('td');
        tags = params.tags.replace(/\n/g, ' ');
        tagsData.textContent = tags;
        tagsRow.append(tagsData);
      }
    }

    const topicsArr = [];
    const [topicsStr, productsStr] = Array
      .from(main.querySelectorAll('main > div:last-child > p'))
      .map(p => p.textContent);
    if (topicsStr) {
      const allTopics = productsStr ? topicsStr + productsStr : topicsStr;
      allTopics
        .replace('Topics:', '')
        .replace('Products:', '')
        .split(',')
        .forEach((topic) => {
          if (topic.trim().length) {
            topicsArr.push(topic.trim());
          }
        });
      const topicsRow = document.createElement('tr');
      table.append(topicsRow);
      const topicsTitle = document.createElement('td');
      topicsTitle.textContent = 'Topics';
      topicsRow.append(topicsTitle);
      const topicsData = document.createElement('td');
      topicsData.textContent = topicsArr.join(', ');
      topicsRow.append(topicsData);
    }

    const lastDiv = document.querySelector('main > div:last-child');
    if (topicsStr || productsStr) {
      lastDiv.replaceWith(table);
    } else {
      // don't replace non-topics div
      lastDiv.parentNode.insertBefore(table, lastDiv.nextSibling);
    }

    return {
      author,
      date,
      topics: topicsArr.join(', '),
      category,
      tags,
    };
  }

  convertOldStylePromotions(main: Element, promoList: any, document: Document): void {
    const embeds = Array.from(main.querySelectorAll('.embed-internal'));
    for (let i = 0; i < embeds.length; i++) {
      const embed = embeds[i];
      const clazz = Array.from(embed.classList.values()).reverse();
      for (let j = 0; j < clazz.length; j++) {
        const url = promoList[clazz[j]];
        if (url) {
          // found a matching class name - replace with table banner
          embed.replaceWith(DOM.createTable([
            ['Banner'],
            [`<a href="${url}">${url}</a>`],
          ], document));
          return;
        }
      }
    }
  }

  convertESIEmbedsToTable(main: Element, document: Document): void {
    document.querySelectorAll('.embed[data-url]').forEach((embed) => {
      const url = embed.getAttribute('data-url');
      if (url) {
        embed.replaceWith(DOM.createTable([
          ['Embed'],
          [`<a href="${url}">${url}</a>`],
        ], document));
      }
    });
  }

  rewriteImgSrc(main: Element): void {
    main.querySelectorAll('img').forEach((img) => {
      const { src } = img;
      if (src && src.indexOf('?') !== -1) {
        img.src = src.split('?')[0];
      }
    });
  }

  rewriteLinks(main: Element): void {
    main.querySelectorAll('a').forEach((a) => {
      const { href, innerHTML } = a;
      // TODO: use outer cdn URL
      if (href.startsWith('https://blog.adobe.com/')) {
        a.href = href.replace('https://blog.adobe.com/', 'https://main--business-website--adobe.hlx3.page/');
        a.innerHTML = innerHTML.replace('https://blog.adobe.com/', 'https://main--business-website--adobe.hlx3.page/');
      }
    });
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      'header',
      'footer',
    ]);

    const head = document.querySelector('head');
    const main = document.querySelector('main');

    this.convertESIEmbedsToTable(main, document);
    this.convertOldStylePromotions(main, entryParams.promoList, document);

    Blocks.convertBlocksToTables(main, document);

    this.renameBlocks(main, document);
    const banners = this.findBanners(main, document);
    this.buildRecommendedArticlesTable(main, document);
    const meta = this.buildMetadataTable(head, main, document, entryParams);

    // TODO: replace URLs (old migrated blog urls -> new business urls)
    // TODO: remove the .html at the end of all urls
    // TODO: manage the recommanded article (imported vs non imported and URL rewrite)

    this.rewriteLinks(main);
    this.rewriteImgSrc(main);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = p.name;
    const lang = s[1];

    const pir = new PageImporterResource(name, `blog/${entryParams.category}`, main, null, {
      topics: meta.topics,
      tags: meta.tags,
      author: meta.author,
      category: meta.category,
      date: meta.date,
      lang,
      banners,
    });

    return [pir];
  }
}
