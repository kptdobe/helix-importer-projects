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

import Blocks from '../../src/utils/Blocks';

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
    Blocks.convertBlocksToTables(document, document);
    strictEqual(document.body.innerHTML, expected);
  };

  const div = '<div></div>'; // ignored div for the tests

  it('convertBlocksToTables basic block', () => {
    // TODO
    test(
      `<main>${div}${div}${div}<div><div class="block-1"><div>header cell</div><div>first row one cell</div></div></main>`,
      `<main>${div}${div}${div}<div><table><tr><th>Block 1</th></tr><tr><td>header cell</td></tr><tr><td>first row one cell</td></tr></table></div></main>`);
  });
});

describe('BlogToBlogImporter#buildRecommendedArticlesTable tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    getImporter().buildRecommendedArticlesTable(document, document);
    strictEqual(document.body.innerHTML, expected);
  };

  const div = '<div></div>'; // ignored div for the tests

  it('buildRecommendedArticlesTable expected input', () => {
    test(
      `<main>${div}${div}${div}${div}<div><h2>Featured posts:</h2><ul><li><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></li><li><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></li><li><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></li></ul></div>${div}</main>`,
      `<main>${div}${div}${div}${div}<table><tr><th>Recommended Articles</th></tr><tr><td><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a>
<a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a>
<a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a>
</td></tr></table>${div}</main>`);
  });
  it('buildRecommendedArticlesTable unformatted title input', () => {
    test(
      `<main><div><h2>featured posts  </h2><ul><li><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></li></ul></div></main>`,
      `<main><table><tr><th>Recommended Articles</th></tr><tr><td><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a>
</td></tr></table></main>`);
  });
  it('buildRecommendedArticlesTable no input', () => {
    test(
      `<main>${div}${div}${div}${div}${div}</main>`,
      `<main>${div}${div}${div}${div}${div}</main>`);
  });
});

describe('BlogToBlogImporter#buildMetadataTable tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    getImporter().buildMetadataTable(document, document);
    strictEqual(document.body.innerHTML, expected);
  };

  const div = `<div></div>`;

  it('build metadata table with expected input', () => {
    test(
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${div}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${div}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alpha</td></tr><tr><td>Topics</td><td>Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });
  it('build metadata table, missing date', () => {
    test(
      `<main>${div}${div}<div><p>By Katie Sexton</p></div>${div}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${div}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Category</td><td>Alpha</td></tr><tr><td>Topics</td><td>Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
    });
  it('build metadata table, 1 topic', () => {
    test(
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${div}<div><p>Topics: Alpha,</p></div></main>`,
      `<main>${div}${div}${div}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alpha</td></tr></table></main>`);
  });
  it('build metadata table, 1 product', () => {
    test(
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${div}<div><p>Products: Alfa,</p></div></main>`,
      `<main>${div}${div}${div}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alfa</td></tr></table></main>`);
  });
  it('build metadata table, 1 topic & 1 product', () => {
    test(
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${div}<div><p>Topics: Alpha,</p><p>Products: Bravo,</p></div></main>`,
      `<main>${div}${div}${div}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alpha</td></tr><tr><td>Topics</td><td>Bravo</td></tr></table></main>`);
  });
  it('build metadata table, missing topics/category', () => {
    test(
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${div}<div><h2>Featured posts:</h2><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></div></main>`,
      `<main>${div}${div}${div}<div><h2>Featured posts:</h2><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></div><table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr></table></main>`);
  });
});
