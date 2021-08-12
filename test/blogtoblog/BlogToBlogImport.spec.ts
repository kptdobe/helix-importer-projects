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
import { createStrictEquality } from 'typescript';

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
describe('BlogToBlogImporter#buildMetadataTable tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    getImporter().buildMetadataTable(document, document);
    strictEqual(document.body.innerHTML, expected);
  };

  const div = `<div></div>`;

  it('build metadata table', () => {
    test(
      `<main>
        ${div}
        ${div}
        <div>
          <p>By Katie Sexton</p>
          <p>Posted on 09-09-2019</p>
        </div>
        ${div}
        <div>
          <p>Topics: Alpha, Beta, Gamma</p>
          <p>Products: Delta, Echo, Foxtrot</p>
        </div>
      </main>`,
      `<main>
        ${div}
        ${div}
        ${div}
        <div>
          <table>
            <tr>
              <th>metadata</th>
            </tr>
            <tr>
              <td>Author</td>
              <td>Katie Sexton</td>
            </tr>
            <tr>
              <td>Publication Date</td>
              <td>09-09-2019</td>
            </tr>
            <tr>
              <td>Category</td>
              <td>Alpha</td>
            </tr>
            <tr>
              <td>Topics</td>
              <td>Beta, Gamma, Delta, Echo, Foxtrot</td>
            </tr>
          </table>
        </div>`);
  });
});
