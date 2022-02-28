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

export default class CC_Novedades extends PageImporter {
  async fetch(url): Promise<Response> {
    return fetch(url);
  }

  sanitizeURL(url: string) {
    return url
      .replace(/ /g, '%20')
      .replace(/Í/g, '%C3%8D')
      .replace(/ñ/g, '%C3%B1')
      .replace(/ú/g, '%C3%BA');
  }

  getModelData(el: Element) {
    if (el.getAttribute('data-model')) {
      try {
        const model = el.getAttribute('data-model');
        const data = JSON.parse(model);
        return data;
      } catch {
        return {};
      }
    }
    return {};
  }

  validateLinks(main: Element, document: Document, target: string) {
    const els = main.querySelectorAll('img, a');
    els.forEach((el) => {
      if (el.nodeName === 'IMG' && el.getAttribute('src')) {
        const src = this.sanitizeURL(el.getAttribute('src'));
        if (!src.startsWith('http')) {
          el.setAttribute('src', `${target}${src}`);
        }
      }
      if (el.nodeName === 'A' && el.getAttribute('href')) {
        const href = this.sanitizeURL(el.getAttribute('href'));
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

  rewriteLinks(main: Element, entries: any, target: string): void {
    main.querySelectorAll('a').forEach((a) => {
      const { href } = a;
      // TODO: use outer cdn URL
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

  buildMetadata(main: Element, document: Document, country: string): any {
    const meta = {};

    const title = main.querySelector('h1, .responsivegrid .title.content-area .tccc-cmp-title .cmp-title__text');
    if (title) {
      const text = title.textContent.trim();
      meta['Title'] = (text.endsWith(`: Coca-Cola ${country}`)) ? text : `${text}: Coca-Cola ${country}`;
    }

    const authorEl = main.querySelector('.text.author > div.tccc-cmp-text[data-model]');
    if (authorEl) {
      const model = this.getModelData(authorEl);
      if (model.text) {
        meta['Author'] = model.text;
      }
    }

    const dateEl = main.querySelector('.publish-date > div.tccc-cmp-text[data-model]');
    if (dateEl) {
      const model = this.getModelData(dateEl);
      if (model && model.text) {
        const date = new Date(model.text);
        const dd = date.getDate().toString().padStart(2, '0');
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        meta['Publication Date'] = `${dd}/${mm}/${year}`;
      }
    }

    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);

    return meta;
  }

  buildImageBlock(el: Element, document: Document) {
    const wrapper = document.createElement('div');
    const img = el.querySelector('img');
    wrapper.append(img);
    const caption = el.textContent.replace(/\n\t/g, '').trim();
    if (caption !== '') {
      const p = document.createElement('p');
      p.innerHTML = `<em>${caption}</em>`;
      wrapper.append(p);
    }
    const block = DOM.createTable([['Images'], [wrapper]], document);
    return block;
  }

  buildEmbedBlock(el: Element, document: Document) {
    const wrapper = document.createElement('div');
    const iframe = el.querySelector('iframe');
    const src = iframe.getAttribute('src');
    const { pathname } = new URL(src);
    const paths = pathname.split('/');
    const url = `https://www.youtube.com/watch?v=${paths[paths.length - 1]}`;
    const link = document.createElement('p');
    link.innerHTML = `<a href="${url}">${url}</a>`;
    wrapper.append(link);
    const caption = el.textContent.replace(/\n\t/g, '').trim();
    if (caption !== '') {
      const p = document.createElement('p');
      p.innerHTML = `<em>${caption}</em>`;
      wrapper.append(p);
    }
    const block = DOM.createTable([['Embed'], [wrapper]], document);
    return block;
  }

  transformCards(main: Element, document: Document) {
    const cards = main.querySelectorAll('.content-area .article-body .contentfragment .tccc-cmp-card[data-model]');
    cards.forEach((card) => {
      const wrapper = document.createElement('div');
      const model = this.getModelData(card);
      if (model && model.image && model.image.src) {
        wrapper.innerHTML = `<img src="${model.image.src}"
          ${model.altTextDAM ? `alt="${model.altTextDAM.replace(/"/g, '\'')}"` : ''}/>`;
        if (model.bodyText) {
          wrapper.innerHTML += `<p><em>${model.bodyText}</em></p>`;
        } else if (model.addText) {
          wrapper.innerHTML += `<p><em>${model.addText}</em></p>`;
        }
      }
      card.replaceWith(wrapper);
      wrapper.parentNode.classList.add('image');
    });
  }

  removeEmptyNodes(main: Element, document: Document) {
    const nodes = main.querySelectorAll('a, b, i, p, span');
    nodes.forEach((node) => {
      if (node.textContent.trim() === '') {
        node.replaceWith(document.createTextNode(' '));
      }
    });
  }

  setupArticleHeader(main: Element, document: Document, country: string): void {
    const wrapper = document.createElement('div');
    // HEADING
    let h1 = main.querySelector('h1, .responsivegrid .title.content-area .tccc-cmp-title .cmp-title__text');
    const h2 = main.querySelector('.responsivegrid .sub-title.content-area .tccc-cmp-title .cmp-title__text, h2');
    if (h1.nodeName !== 'H1') { // malformed title
      const newH1 = document.createElement('h1');
      newH1.textContent = h1.textContent;
      h1.replaceWith(newH1);
      h1 = newH1;
    }
    if (h1 && h2 && h1.textContent.trim() === h2.textContent.trim()) {
      h2.remove(); // remove duplicates
    } else if (h1 && h2 && [...h2.classList].includes('cmp-title__text')) {
      // genuine subtitle, move below header
      h2.remove();
      wrapper.append(h2);
    }
    if (h1 && h1.textContent.endsWith(`: Coca-Cola ${country}`)) {
      h1.textContent = h1.textContent.replace(`: Coca-Cola ${country}`, '');
    }
    wrapper.prepend(h1);
    const header = main.querySelector('.responsivegrid > div > .image > div');
    if (header && header.textContent) { // element containing header img
      // IMAGE
      const img = header.querySelector('img');
      wrapper.append(img);
      // CAPTION
      const caption = header.textContent.replace(/\n\t/g, '').trim();
      if (caption !== '') {
        const p = document.createElement('p');
        p.innerHTML = `<em>${caption}</em>`;
        wrapper.append(p);
      }
      header.replaceWith(wrapper);
    } else { // no header img element, search body
      const content = main.querySelector('.content-area > div > div.article-body > div div.contentfragment > div > div');
      if (content) {
        const first = content.firstElementChild.firstElementChild.firstElementChild;
        const imgEl = content.querySelector('.image');
        if (imgEl && first === imgEl) { // there is no content above the img, this becomes the feature img
          // IMAGE
          const img = imgEl.querySelector('img');
          wrapper.append(img);
          // CAPTION
          const caption = imgEl.textContent.replace(/\n\t/g, '').trim();
          if (caption !== '') {
            const p = document.createElement('p');
            p.innerHTML = `<em>${caption}</em>`;
            wrapper.append(p);
          }
          first.remove();
          main.prepend(wrapper);
        } else {
          main.prepend(wrapper);
        }
      }
    }
  }

  setupArticleContent(main: Element, document: Document): void {
    const content = main.querySelector('.content-area > div > div.article-body > div div.contentfragment > div > div');
    if (content) {
      const firstP = content.querySelector('p');
      const firstPI = content.querySelector('p i');
      if (firstP && firstPI && firstP.textContent.trim() === firstPI.textContent.trim()) {
        firstP.innerHTML = firstPI.innerHTML; // remove italics, might confuse article header
      }
      [...content.children].forEach((child) => {
        if (child.nodeName === 'DIV') {
          const iframe = child.querySelector('iframe');
          const img = child.querySelector('img');
          const video = child.querySelector('.tccc-cmp-video[data-model]');
          if (iframe) { // build embed
            const block = this.buildEmbedBlock(child, document);
            child.replaceWith(block);
          }
          if (img) { // build image
            const block = this.buildImageBlock(child, document);
            child.replaceWith(block);
          }
          if (video) { // build embed
            const wrapper = document.createElement('div');
            const model = this.getModelData(video);
            if (model && model.videoSrc) {
              const { pathname } = new URL(model.videoSrc);
              const paths = pathname.split('/');
              const url = `https://www.youtube.com/watch?v=${paths[paths.length - 1]}`;
              wrapper.innerHTML = `<p><a href="${url}">${url}</a></p>`;
              const block = DOM.createTable([['Embed'], [wrapper]], document);
              child.replaceWith(block);
            }
          }
          if (!iframe && !img && !video) {
            const contents = child.textContent.replace(/\n\t/g, '').trim().length;
            if (contents <= 0) {
              child.remove(); // empty aem nonsense
            }
          }
        } else if (child.nodeName === 'P') {
          const b = child.querySelector('b');
          // replace bold-only p with h2
          if (b && !b.textContent.includes('.') && child.textContent.trim() === b.textContent.trim()) {
            const h2 = document.createElement('h2');
            h2.innerHTML = b.innerHTML;
            child.replaceWith(h2);
          }
        }
      });
    }
  }

  async process(document: Document, url: string, entryParams?: any): Promise<PageImporterResource[]> {
    const main = document.querySelector('.root.responsivegrid > div > div > div');

    const meta = this.buildMetadata(main, document, entryParams.country);

    this.transformCards(main, document);
    this.removeEmptyNodes(main, document);
    this.setupArticleHeader(main, document, entryParams.country);
    this.setupArticleContent(main, document);
    this.validateLinks(main, document, entryParams.target);

    const u = new URL(url);
    const p = path.parse(u.pathname);
    const s = p.dir.split('/');
    const name = this.cleanupName(p.name);
    const subPath = s.filter((p, i) => i > 2).join('/');

    const pir = new PageImporterResource(name, subPath, main, null, {
      locale: entryParams.locale,
    });

    return [pir];
  }
}
