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
import moment from 'moment';
import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';
import Blocks from '../utils/Blocks';

const DEFAULT_MAIN_CATEGORY = '';
const IMPORT_TAG = 'Spark';

export default class SparkImporter extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  getDocumentFromSnippet(html: string) {
    const { document } = (new JSDOM(`<html><body>${html}</body></html>`)).window;
    return document.body;
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {

    const parsed = path.parse(new URL(`https://${entryParams.target}`).pathname);
    const targetDir = parsed.dir;
    const main = document.querySelector('main article');

    WPUtils.handleCaptions(main);
    DOMUtils.replaceEmbeds(main);

    // insta embeds
    main.querySelectorAll('.instagram-media').forEach(insta => {
      let link = insta.getAttribute('data-instgrm-permalink');
      if (!link) {
        const a = insta.querySelector('a:last-child')
        if (a) {
          link = a.href;
        }
      }

      if (link) {
        insta.after(DOMUtils.generateEmbed(link));
      }
      insta.remove();
    });

    main.querySelectorAll('.twitter-tweet p:last-child a').forEach(tweet => {
      const link = tweet.getAttribute('href');
      if (link) {
        tweet.parentNode.parentNode.after(DOMUtils.generateEmbed(link));
      }
      tweet.parentNode.parentNode.remove();
    });

    const heading = main.querySelector('h1.entry-title');
    // heading.after(JSDOM.fragment('<hr>'));

    const heroMeta = document.querySelector('meta[property="og:image"]')
    if (heroMeta) {
      const heroImage = heroMeta.getAttribute('content');
      if (heroImage && heading) {
        heading.append(JSDOM.fragment(`<img src="${heroImage}">`));
      }
    }

    // date
    const dateContainer = document.querySelector('.entry-time');
    let authoredDate = '';
    if (dateContainer) {
      const d = moment(dateContainer.textContent, 'MMM DD, YYYY');
      authoredDate = d.format('MM/DD/YYYY');
      dateContainer.remove();
    }

    const author = main.querySelector('[rel=author]').textContent;

    const resources = [];
    if (entryParams.knownResources.indexOf(`authors/${author}`) === -1) {
      entryParams.knownResources.push(`authors/${author}`);
      let html = `<h1>${author}</h1>`;
      const avatar = main.querySelector('img.photo');
      if (avatar) {
        html += avatar.outerHTML;
      }

      resources.push(new PageImporterResource(author, `${targetDir}/authors`, this.getDocumentFromSnippet(html), null));
    }

    const cat = main.querySelector('.cat-link');
    let category = '';
    if (cat) {
      category = cat.textContent;
    }

    const tagList = main.querySelectorAll('[rel=tag]');
    const tags = [];
    tagList.forEach(t => {
      const tag = t.textContent.trim();
      tags.push(tag);

      if (entryParams.knownResources.indexOf(`tags/${tag}`) === -1) {
        entryParams.knownResources.push(`tags/${tags}`);
        let html = `<h1>${tag}</h1>`;
        html += `<table><tr><th>Blog Posts</th></tr><tr><td>Tags</td><td>${tag}</td></tr></table>`;

        resources.push(new PageImporterResource(tag, `${targetDir}/tags`, this.getDocumentFromSnippet(html), null));
      }
    })

    const findTOCNode = (doc) => {
      let parent = null;
      doc.querySelectorAll('b,strong').forEach(b => {
        const txt = b.textContent ? b.textContent.trim().toLowerCase().replace(/[\.\:]/gm, '') : null;
        if ('table of contents' === txt) {
          parent = b.parentNode;
        }
      });
      return parent;
    }

    const toc = findTOCNode(main);
    if (toc) {
      toc.before(JSDOM.fragment(`<table><tr><th>Table of Contents</th></tr><tr><td>Levels</td><td>1</td></tr></table>`));
      const list = toc.nextElementSibling;
      if (list && (list.tagName === 'UL' || list.tagName === 'OL')) {
        list.remove();
      }
      toc.remove();
    }

    const relatedArticles = main.querySelectorAll('.related-posts-list li > a:first-child');
    if (relatedArticles && entryParams.entries) {
      let rows = '';
      relatedArticles.forEach(a => {
        rows += `<tr><td><a href="${a.href}">${a.href}</a></td></tr>`;
      });
      const table = JSDOM.fragment(`<table><tr><th>Blog Posts</th></tr>${rows}</table>`)
      main.append(table);
    }

    main.append(Blocks.getMetadataBlock(document, {
      'Author': author,
      'Publication Date': authoredDate,
      'Category': category,
      'Tags': tags
    }));

    if (entryParams.knownResources.indexOf(`category/${category}`) === -1) {
      entryParams.knownResources.push(`category/${category}`);
      let html = `<h1>${category}</h1>`;
      html += `<table><tr><th>Blog Posts</th></tr><tr><td>Tags</td><td>${category}</td></tr></table>`;

      resources.push(new PageImporterResource(category, `${targetDir}/category`, this.getDocumentFromSnippet(html), null));
    }

    // final cleanup
    DOMUtils.remove(main, [
      '.aspark-breadcrumb',
      '.entry-meta',
      '.entry-footer',
    ]);

    WPUtils.genericDOMCleanup(main);

    main.querySelectorAll('a').forEach(a => {
      const target = entryParams.urlMapping[a.href];
      if (target) {
        if (a.textContent === a.href) {
          // also update the link text
          a.textContent = target;
        }
        a.href = target;
      }
    });

    main.querySelectorAll('img').forEach(img => {
      // img is in a link
      const parent = img.parentNode;
      if (parent && parent.tagName === 'A') {
        parent.before(img);
        parent.before(JSDOM.fragment('<br>'));
        parent.after(JSDOM.fragment('<br>'));
        if (parent.textContent === '') {
          // set text content to be the link
          parent.textContent = parent.href;
        }
      }
    });

    
    const name = parsed.name;

    resources.push(new PageImporterResource(name, targetDir, main, null, {
      tags,
      author,
      date: authoredDate,
    }));

    return resources;
  }
}
