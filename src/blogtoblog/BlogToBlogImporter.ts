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

    const metaDescTag = head.querySelector('meta[name~="description"]');
    let metaDesc;
    if (metaDesc) {
      metaDesc = metaDescTag.getAttribute('content');
    }
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
          if (h1Sibling) {
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
    }

    let [authorPTag, datePTag] = Array
      .from(main.querySelectorAll('main > div:nth-child(3) > p'));
      // .map(p => p.textContent);
    main.querySelector('main > div:nth-child(3)').remove();

    let author;
    let date;
    if (authorPTag && authorPTag.textContent.toLowerCase().includes('posted ')) {
      datePTag = authorPTag;
      authorPTag = null;
    }
    if (authorPTag) {
      author = authorPTag.textContent.replace('By ', '').replace('by ', '').trim();
      const authorRow = document.createElement('tr');
      table.append(authorRow);
      const authorTitle = document.createElement('td');
      authorTitle.textContent = 'Author';
      authorRow.append(authorTitle);
      const authorData = document.createElement('td');
      authorData.textContent = author;
      authorRow.append(authorData);

      const a = authorPTag.querySelector('a');
      if (a && a.href) {
        const authorURLRow = document.createElement('tr');
        table.append(authorURLRow);
        const authorURLTitle = document.createElement('td');
        authorURLTitle.textContent = 'Author URL';
        authorURLRow.append(authorURLTitle);
        const authorURLData = document.createElement('td');
        authorURLData.textContent = a.href.toLowerCase().replace('.html', '');
        authorURLRow.append(authorURLData);
      }
    }
    if (datePTag) {
      date = /\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}/.exec(datePTag.textContent)[0];
      const dateRow = document.createElement('tr');
      table.append(dateRow);
      const dateTitle = document.createElement('td');
      dateTitle.textContent = 'Publication Date';
      dateRow.append(dateTitle);
      const dateData = document.createElement('td');
      dateData.textContent = date;
      dateRow.append(dateData);
    }

    const topicsArr = [];
    const [topicsStr, productsStr] = Array
      .from(main.querySelectorAll('main > div:last-child > p'))
      .map(p => p.textContent);
    if (topicsStr) {
      const allTopics = productsStr ? topicsStr + productsStr : topicsStr;
      allTopics
        .replace('Topics:', '')
        .replace('Products:', ',')
        .split(',')
        .forEach((topic) => {
          const t = topic.trim();
          if (t.length && !topicsArr.includes(t)) {
            topicsArr.push(t);
          }
        });
      const taxonomy = params.taxonomy;
      if (taxonomy && topicsArr.length > 1) {
        // make sure the first topic is a visible one.
        // Otherwise move the first one to the top of the list
        const first = topicsArr.findIndex((topic) => {
          const t = taxonomy[topic];
          return t && t.isVisible;
        });
        if (first > 0) {
          const firstTopic = topicsArr[first];
          topicsArr.splice(first, 1);
          topicsArr.unshift(firstTopic);
        }
      }

      const topicsRow = document.createElement('tr');
      table.append(topicsRow);
      const topicsTitle = document.createElement('td');
      topicsTitle.textContent = 'Tags';
      topicsRow.append(topicsTitle);
      const topicsData = document.createElement('td');
      topicsData.textContent = topicsArr.join(', ');
      topicsRow.append(topicsData);
    }

    const lastDiv = document.querySelector('main > div:last-child');
    if (lastDiv) {
      if (topicsStr || productsStr) {
        // remove p tags
        main.querySelectorAll('main > div:last-child > p').forEach(p => p.remove());
      }
      lastDiv.parentNode.append(table);
    } else {
      throw new Error('Potential invalid document structure, no last div found');
    }

    return {
      author,
      date,
      tags: topicsArr.join(', '),
    };
  }

  convertOldStylePromotions(main: Element, promoList: any, document: Document): void {
    const embeds = Array.from(main.querySelectorAll('.embed-internal'));
    for (let i = 0; i < embeds.length; i++) {
      const embed = embeds[i];
      const p = promoList[embed.className];
      if (p) {
        // found a matching class name - replace with table banner
        embed.replaceWith(DOM.createTable([
            ['Banner'],
            [`<a href="${p}">${p}</a>`],
        ], document));
      } else {
        embed.remove();
        this.logger.warn(`No matching promotion found for internal embed "${embed.className}"`);
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
      if (src) {
        if (
          src.startsWith('/Users') ||
          src.startsWith('https://blogsimages.adobe.com') ||
          src.startsWith('http://blogsimages.adobe.com') ||
          src.startsWith('https://theblogimages.adobe.com') ||
          src.startsWith('http://theblogimages.adobe.com') ||
          src.startsWith('http://blogs.adobe.com') ||
          src.startsWith('https://blogs.adobe.com')) {
          // remove broken images
          img.remove();
        } else {
          const s = src.split('?')[0];
          img.src = `${s}?auto=webp&format=pjpg&width=2000`;
        }
      }
    });
  }

  rewriteLinks(main: Element, target: string): void {
    main.querySelectorAll('a').forEach((a) => {
      a.href.replace('https://master--theblog--adobe.hlx.page/', 'https://blog.adobe.com/');

      if (a.href.startsWith('https://blog.adobe.com/')) {
        a.href = a.href
          .toLowerCase()
          .replace('.html', '');
        a.innerHTML = a.innerHTML
          .toLowerCase()
          .replace('.html', '');
      }
      if (a.href.includes('hlx.blob.core')) {
        const { pathname } = new URL(a.href);
        const helixId = pathname.split('/')[2];
        const type = a.href.includes('.mp4') ? 'mp4' : 'gif';
        a.href = `${target}/media_${helixId}.${type}`;
        a.innerHTML = `${target}/media_${helixId}.${type}`;
      }
    });
  }

  cleanupName(name: string): string {
    const firstChar = name.charAt(0);
    const lastChar = name.charAt(name.length - 1);
    if (!/[A-Za-z0-9]/.test(firstChar)) {
      name = name.substring(1);
    }
    if (!/[A-Za-z0-9]/.test(lastChar)) {
      name = name.slice(0, -1);
    }
    return name;
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
    const meta = this.buildMetadataTable(head, main, document, entryParams);
    this.buildRecommendedArticlesTable(main, document);

    this.rewriteLinks(main, entryParams.target);
    this.rewriteImgSrc(main);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const lang = s[1];

    const pir = new PageImporterResource(name, `${p.dir}`, main, null, {
      path: `${p.dir}/${name}`,
      tags: meta.tags,
      author: meta.author,
      date: meta.date,
      lang,
      banners,
    });

    return [pir];
  }
}
