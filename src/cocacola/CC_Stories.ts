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
import { Stringify } from 'remark-stringify';

export default class CC_Stories extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  validateLinks(main: Element, document: Document, target: string) {
    const els = main.querySelectorAll('img, a');
    els.forEach((el) => {
      if (el.nodeName === 'IMG' && el.getAttribute('src')) {
        const src = el.getAttribute('src');
        if (!src.startsWith('http')) {
          el.setAttribute('src', `${target}${src}`);
        }
      }
      if (el.nodeName === 'A' && el.getAttribute('href')) {
        const href = el.getAttribute('href');
        if (!href.startsWith('http')) {
          if (href === el.textContent.trim()) {
            el.setAttribute('href', `${target}${href}`);
            el.textContent = `${target}${href}`;
          } else {
            el.setAttribute('href', `${target}${href}`);
          }
        }
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

  buildMetadata(head: Element, main: Element, document: Document, url: string, params: any): any {
    const meta = {};

    const title = main.querySelector('h1');
    if (title) {
      const text = title.textContent.trim();
      meta['Title'] = (text.endsWith(`| ${params.brand} ${params.country}`)) ? text : `${text} | ${params.brand} ${params.country}`;
    }

    const desc = head.querySelector('[name="description"]');
    if (desc) {
      meta['Description'] = desc.getAttribute('content').trim();
    }

    const keywords = head.querySelector('[name="keywords"]');
    const related = document.querySelector('.tags.category-tags');
    const { pathname } = new URL(url);
    const [category, ...paths] = pathname.replace(`/${params.folder}/`, '').split('/').slice(0, -1);
    if (category) {
      meta['Category'] = category.split('-').map(word => word[0].toUpperCase() + word.substring(1)).join(' ');
    }
    if (keywords || related || paths) {
      const tags = [];
      if (keywords) {
        keywords.getAttribute('content').trim().split(',').forEach(w => tags.push(w.trim()));
      }
      if (related) {
        const firstLi = related.querySelector('li');
        if (firstLi) {
          related.querySelectorAll('li').forEach((li) => {
            const tag = li.textContent.trim();
            if (!tags.includes(tag.toLowerCase())) {
              tags.push(li.textContent.trim());
            }
          });
        }
        related.remove();
      }
      if (paths.length) {
        paths.forEach((p) => {
          const tag = p.split('-').join(' ');
          if (!tags.includes(tag.toLowerCase())) {
            tags.push(tag.trim());
          }
        });
      }
      meta['Tags'] = tags.join(', ');
    }

    const byline = main.querySelector('.articleby.AuthorByLine');
    if (byline) {
      const author = byline.querySelector('a');
      if (author) {
        meta['Author'] = author.textContent.trim();
        author.remove();
      }
      if (byline.textContent.trim() !== '') {
        const date = byline.textContent.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g);
        if (date) {
          const [mm, dd, yyyy] = date[0].split('/');
          meta['Publication Date'] = `${yyyy}/${mm}/${dd}`;
        }
      }
      byline.remove();
    }

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  removeEmptyNodes(main: Element, document: Document) {
    const nodes = main.querySelectorAll('a, b, i, p, span, li, ul, ol');
    nodes.forEach((node) => {
      if (node.textContent.trim() === '') {
        node.replaceWith(document.createTextNode(' '));
      }
    });
  }

  rewriteLinks(main: Element): void {
    main.querySelectorAll('a').forEach((a) => {
      const { href } = a;
      if (!href || href === '') {
        a.remove();
      } else if (href.includes('/stories/')) {
        a.href = href.replace('/stories/', '/cn/news/');
        if (a.innerHTML.includes('/stories/')) {
          a.innerHTML = a.innerHTML.replace('/stories/', '/cn/news/');
        }
      } else if (href.includes('/press-centre/press-releases/')) {
        a.href = href.replace('/press-centre/press-releases/', '/cn/news/');
        if (a.innerHTML.includes('/press-centre/press-releases/')) {
          a.innerHTML = a.innerHTML.replace('/press-centre/press-releases/', '/cn/news/');
        }
      }
    });
  }

  setupArticleHeader(main: Element, document: Document, target: string): void {
    const wrapper = main.querySelector('.ArticleTitle');
    const lead = main.querySelector('.lead-media');
    if (wrapper && lead) {
      const img = lead.querySelector('img');
      if (img) {
        const newImg = document.createElement('img');
        const alt = img.getAttribute('alt');
        if (img.getAttribute('src')) {
          let src = img.getAttribute('src');
          if (!src.startsWith('http')) {
            src = `${target}${src}`;
          }
          let valid;
          try {
            const url = new URL(src);
            valid = true;
          } catch (e) {
            valid = false;
          }
          if (valid) {
            newImg.setAttribute('src', src);
            if (alt) {
              newImg.setAttribute('alt', alt);
            }
            wrapper.append(newImg);
          } else {
            img.remove();
          }
        }
      }
      const caption = lead.querySelector('.media-caption p');
      const item = lead.querySelector('.item');
      const credit = lead.querySelector('.media-credit');
      if (caption) {
        const newCap = document.createElement('em');
        newCap.textContent = caption.textContent.trim();
        if (item && credit) {
          const dataCred = item.getAttribute('data-credit');
          const media = item.querySelector('.media-credit');
          if (dataCred && media) {
            const i = media.textContent.indexOf(')');
            const fullCred = media.textContent.substring(0, i) + dataCred + media.textContent.substring(i);
            newCap.textContent += fullCred;
          }
        }
        const p = document.createElement('p');
        p.append(newCap);
        wrapper.append(p);
      }
      lead.remove();
    }
  }

  setupArticleContent(main: Element, document: Document, target: String): void {
    const article = main.querySelector('article');
    if (article) {
      const imgWrappers = article.querySelectorAll('.section.Image');
      if (imgWrappers) {
        imgWrappers.forEach((wrapper) => {
          const img = wrapper.querySelector('img');
          if (img) {
            const alt = img.getAttribute('alt');
            let src = img.getAttribute('src');
            if (!src.startsWith('http')) {
              src = `${target}${src}`;
            }
            let valid;
            try {
              const url = new URL(src);
              valid = true;
            } catch (e) {
              valid = false;
            }
            if (valid) {
              const temp = document.createElement('div');
              temp.innerHTML = `<img src="${src}" ${alt ? `alt="${alt}"` : ''}/>`;
              const cap = wrapper.querySelector('div > p');
              if (cap) {
                temp.innerHTML += `<p><em>${cap.innerHTML}</em></p>`;
              }
              const block = DOM.createTable([['Images'], [temp]], document);
              wrapper.firstChild.replaceWith(block);
            } else {
              wrapper.remove();
            }
          } else {
            wrapper.remove();
          }
        });
      }

      const iframes = article.querySelectorAll('iframe');
      if (iframes) {
        iframes.forEach((iframe) => {
          let src = iframe.getAttribute('src');
          if (src.startsWith('//')) { // malformed embed link
            src = src.replace('//', 'https://');
          }
          const temp = document.createElement('div');
          if (src && src.includes('youtu')) {
            const { pathname } = new URL(src);
            const paths = pathname.split('/');
            const url = `https://www.youtube.com/watch?v=${paths[paths.length - 1]}`;
            temp.innerHTML = `<p><a href="${url}">${url}</a></p>`;
            const block = DOM.createTable([['Embed'], [temp]], document);
            iframe.replaceWith(block);
          } else {
            iframe.remove();
          }
        });
      }

      const tagsContainer = article.querySelector('.tagsTopics-container');
      if (tagsContainer) {
        tagsContainer.remove();
      }

      const moreContent = article.querySelector('.more-content');
      if (moreContent) {
        const wrapper = document.createElement('div');
        const lia = moreContent.querySelector('li a');
        if (lia) {
          moreContent.querySelectorAll('li a').forEach((a) => {
            const href = a.getAttribute('href');
            if (href && href.startsWith('/stories/')) {
              const p = document.createElement('p');
              p.innerHTML = `<a href="${target}${href}">${target}${href}</a>`;
              wrapper.append(p);
            }
          });
        }
        if (wrapper.hasChildNodes()) {
          const block = DOM.createTable([['Recommended Articles'], [wrapper]], document);
          article.append(block);
        }
        moreContent.remove();
      }
    }
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    DOMUtils.remove(document, [
      '.share-container',
      '.botton-content',
      '.asides',
      '.rightRail',
      '.BaiduSharebar',
    ]);
    const head = document.querySelector('head');
    const main = document.querySelector('.wrapper .article-blog-template');
    let meta = {};

    if (head && main) {
      meta = this.buildMetadata(head, main, document, url, entryParams);
      this.setupArticleHeader(main, document, entryParams.target);
      this.setupArticleContent(main, document, entryParams.target);
      this.rewriteLinks(main);
      this.validateLinks(main, document, entryParams.target);
      this.removeEmptyNodes(main, document);
    }

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const subPath = meta['Category']
      ? meta['Category'].toLowerCase().split(' ').join('-')
      : s.filter((p, i) => i > 2).join('/');

    const pir = new PageImporterResource(name, subPath, main, null, {
      locale: entryParams.locale,
    });

    return [pir];
  }
}
