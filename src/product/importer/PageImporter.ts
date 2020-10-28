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

 /* tslint:disable: no-console */

import Importer from './Importer';
import PageImporterParams from './PageImporterParams';
import PageImporterResource from './PageImporterResource';

import FileUtils from '../utils/FileUtils';
import DOMUtils from '../utils/DOMUtils';
import Utils from '../utils/Utils';

import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';
import { Logger } from 'tslint/lib/runner';

import path from 'path';
import unified from 'unified';
import parse from 'rehype-parse';
import rehype2remark from 'rehype-remark';
import stringify from 'remark-stringify';
import all from 'hast-util-to-mdast/lib/all';

export default abstract class PageImporter implements Importer {
  params: PageImporterParams;
  logger: Logger;

  constructor(params: PageImporterParams) {
      this.params = params;
      this.logger = console;
  }

  async createMarkdownFile(resource: PageImporterResource) {
    const name = resource.name;
    const directory = resource.directory;
    const sanitizedName = FileUtils.sanitizeFilename(name);
    const imageLocation = false;
    this.logger.log(`Creating a new MD file: ${directory}/${sanitizedName}.md`);

    const processor = unified()
      .use(parse, { emitParseErrors: true})
      .use(rehype2remark, {
        handlers: {
          hlxembed: (h, node) => h(node, 'hlxembed', node.children[0].value),
          u: (h, node) => h(node, 'u', all(h, node)),
        },
      })
      .use(stringify, {
        bullet: '-',
        fence: '`',
        fences: true,
        incrementListMarker: true,
        rule: '-',
        ruleRepetition: 3,
        ruleSpaces: false,
      })
      .use(() => {
        // use custom tag and rendering because text is always encoded by default
        // we need the raw url
        processor.Compiler.prototype.visitors.hlxembed = (node) => node.value;
      })
      .use(() => {
        processor.Compiler.prototype.visitors.u = (node) => {
          // u handling: remove the u is the first element is a link
          if (node.children && node.children.length > 0) {
            const children = node.children.map((child) => processor.stringify(child));
            if (node.children[0].type === 'link') {
              // first element in the <u> is a link: remove the <u> - unsupported case
              return `${children.join()}`;
            }
            return `<u>${children.join()}</u>`;
          }
          return '';
        };
      })
      .use(() => {
        const originalEmphasis = processor.Compiler.prototype.visitors.emphasis;
        processor.Compiler.prototype.visitors.emphasis = (node) => {
          // @ts-ignore
          const ori = originalEmphasis.apply(processor.Compiler(), [node]);
          return ori;
        };
      });

    const file = await processor.process(resource.document.innerHTML);
    const p = `${directory}/${sanitizedName}.md`;
    let contents = file.contents.toString();

    // process image links
    const document = resource.document;
    const imgs = document.querySelectorAll('img');
    if (imgs && imgs.length > 0) {
      await Utils.asyncForEach(imgs, async (img, index) => {
        const src = img.src;
        const isEmbed = img.classList.contains('hlx-embed');
        if (!isEmbed && src && src !== '' && contents.indexOf(src) !== -1) {
          let newSrc = '';
          if (!imageLocation) {
            // copy img to blob handler

            const usedCache = false;
            // if (this.cache) {
            //   // check first in local cache if image can be found
            //   const localAssets = path.resolve(`${this.cache}/assets`);
            //   const imgPath = new URL(src).pathname;
            //   const localPathToImg = path.resolve(`${localAssets}/${imgPath.replace(/\/files/gm, '').replace(/\/wp-content\/uploads/gm, '')}`);
            //   if (await fs.exists(localPathToImg)) {
            //     const buffer = await fs.readFile(localPathToImg);
            //     // eslint-disable-next-line max-len
            //     const resource = this.blobHandler.createExternalResource(buffer, null, null, localPathToImg);
            //     if (!await this.blobHandler.checkBlobExists(resource)) {
            //       await this.blobHandler.upload(resource);
            //     }
            //     newSrc = resource.uri;
            //     usedCache = true;
            //   }
            // }

            if (!usedCache) {
              // use direct url
              let blob;
              try {
                blob = await this.params.blobHandler.getBlob(encodeURI(src));
              } catch (error) {
                // ignore non exiting images, otherwise throw an error
                if (error.message.indexOf('StatusCodeError: 404') === -1) {
                  this.logger.error(`Cannot upload blob for ${src}: ${error.message}`);
                  throw new Error(`Cannot upload blob for ${src}: ${error.message}`);
                }
              }
              if (blob) {
                newSrc = blob.uri;
              } else {
                this.logger.error(`Image could not be copied to blob handler: ${src}`);
              }
            }
          } else {
            let response;
            try {
              response = await this.fetch(src);
            } catch (error) {
              // ignore 404 images but throw an error for other issues
              if (error.statusCode !== 404) {
                this.logger.error(`Cannot download image for ${src}: ${error.message}`);
                throw new Error(`Cannot download image for ${src}: ${error.message}`);
              }
            }

            if (response) {
              let { ext } = path.parse(src);
              if (!ext) {
                const dispo = response.headers['content-disposition'];
                if (dispo) {
                  // content-disposition:"inline; filename="xyz.jpeg""
                  try {
                    // eslint-disable-next-line prefer-destructuring
                    ext = `.${dispo.match(/\.(.*)"/)[1]}`;
                  } catch (e) {
                    this.logger.error(`Cannot find extension for ${src} with content-disposition`);
                  }
                } else {
                  // use content-type
                  const type = response.headers['content-type'];
                  try {
                    // eslint-disable-next-line prefer-destructuring
                    ext = `.${type.match(/\/(.*)/)[1]}`;
                  } catch (e) {
                    this.logger.error(`Cannot find an extension for ${src} with content-type`);
                  }
                }
              }
              const imgName = `${sanitizedName}${index > 0 ? `-${index}` : ''}${ext}`;
              newSrc = `${imageLocation}/${imgName}`;
              await this.params.storageHandler.put(newSrc, response.body);
              this.logger.log(`Image file created: ${newSrc}`);
              // absolute link
              newSrc = `/${newSrc}`;
            }
          }
          contents = contents.replace(new RegExp(`${src.replace('.', '\\.')}`, 'gm'), newSrc);
        }
      });
    }
    if (resource.prepend) {
      contents = resource.prepend + contents;
    }

    await this.params.storageHandler.put(p, contents);
    this.logger.log(`MD file created: ${p}`);

    return p;
  }

  cleanup(document: Document) {
    DOMUtils.remove(document, ['script', 'style', 'hr']);
    // remove html comments
    document.body.innerHTML = document.body.innerHTML.replace(/<!--(?!>)[\S\s]*?-->/gm, '');
  }

  preProcess(document: Document) {
    this.cleanup(document);
    ['a', 'b', 'big', 'code', 'em', 'i', 'label', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'var']
      .forEach((tag) => DOMUtils.reviewInlineElement(document, tag));
  }

  async import(url: string) {
    const startTime = new Date().getTime();

    const res = await this.fetch(url);

    const results = [];
    if (!res.ok) {
      console.error(`${url}: Invalid response`, res);
      throw new Error(`${url}: Invalid response - ${res.statusText}`)
    } else {
      const text = await res.text();

      if (text) {
        const { document } = (new JSDOM(text)).window;

        this.preProcess(document)
        const entries = this.process(document, url);

        await Utils.asyncForEach(entries, async (entry) => {
          const file = await this.createMarkdownFile(entry);
          results.push(file);
        });
      }
    }

    console.log();
    console.log(`${url}: Process took ${(new Date().getTime() - startTime) / 1000}s.`);

    return results;
  }

  abstract async fetch(url: string): Promise<Response>;
  abstract process(document: Document, url: string): PageImporterResource[];
}