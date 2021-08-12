/*
 * Copyright 2010 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import BlogToBlogImporter from '../../src/blogtoblog/BlogToBlogImporter';

import { strictEqual } from 'assert';
import { describe, it } from "mocha";

import { JSDOM } from 'jsdom';

const getImporter = (): BlogToBlogImporter => {
  return new BlogToBlogImporter({
    storageHandler: null,
    blobHandler: null,
  });
}

describe('BlogToBlogImporter#convertBlocksToTables tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    getImporter().convertBlocksToTables(document, document);
    strictEqual(document.body.innerHTML, expected);
  };

  const div = '<div></div>'; // ignored div for the tests

  it('convertBlocksToTables basic block', () => {
    // TODO
    test(
      `<main>${div}${div}${div}<div><div class="block-1"><div>header cell</div><div>first row one cell</div></div></main>`,
      `<main>${div}${div}${div}<div><table><tr><th>block-1</th></tr></table></div></main>`);
  });
});

describe('BlogToBlogImporter#createTable tests', () => {
  const test = (data: string[][], expected: string) => {
    const { document } = (new JSDOM()).window;
    const table = getImporter().createTable(data, document);
    strictEqual(table.outerHTML, expected);
  };

  const div = '<div></div>'; // ignored div for the tests

  it('convertBlocksToTables - basic tables', () => {
    test(
      [[]],
      `<table><tr></tr></table>`);
    test(
      [['header']],
      `<table><tr><th>header</th></tr></table>`);
    test(
      [['header'], ['cell']],
      `<table><tr><th>header</th></tr><tr><td>cell</td></tr></table>`);
    test(
      [['header1', 'header2'], ['cell11', 'cell12'], ['cell21', 'cell22']],
      `<table><tr><th>header1</th><th>header2</th></tr><tr><td>cell11</td><td>cell12</td></tr><tr><td>cell21</td><td>cell22</td></tr></table>`);
    // TODO deal with colspan ?
    test(
      [['header1'], ['cell11', 'cell12'], ['cell21', 'cell22']],
      `<table><tr><th>header1</th></tr><tr><td>cell11</td><td>cell12</td></tr><tr><td>cell21</td><td>cell22</td></tr></table>`);
  });

  it('convertBlocksToTables - deals with Elements', () => {
    const { document } = (new JSDOM()).window;

    const img = document.createElement('img');
    img.src = 'https://www.sample.com/image.jpeg';

    const a = document.createElement('a');
    a.href = 'https://www.sample.com/';

    test(
      [['header'], [ img ]],
      `<table><tr><th>header</th></tr><tr><td><img src="https://www.sample.com/image.jpeg"></td></tr></table>`);
    test(
      [['header'], [ img, a, 'some text' ]],
      `<table><tr><th>header</th></tr><tr><td><img src="https://www.sample.com/image.jpeg"></td><td><a href="https://www.sample.com/"></a></td><td>some text</td></tr></table>`);
  });
});