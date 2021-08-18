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
import { describe, it } from 'mocha';

import { JSDOM } from 'jsdom';

const getImporter = (): BlogToBlogImporter => new BlogToBlogImporter({
  storageHandler: null,
  blobHandler: null});

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
}

describe('BlogToBlogImporter#renameBlocks tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    getImporter().renameBlocks(document, document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('renameBlocks no change', () => {
    test(
      `<main><div><table><tbody><tr><th>Animation</th></tr></tbody></table></div></main>`,
      `<main><div><table><tbody><tr><th>Animation</th></tr></tbody></table></div></main>`);
  });
  it('renameBlocks promotion > banner', () => {
    test(
      `<main><div><table><tbody><tr><th>Promotion</th></tr></tbody></table></div></main>`,
      `<main><div><table><tbody><tr><th>Banner</th></tr></tbody></table></div></main>`);
  });
  it('renameBlocks linked image > images', () => {
    test(
      `<main><div><table><tbody><tr><th>Linked Image</th></tr></tbody></table></div></main>`,
      `<main><div><table><tbody><tr><th>Images</th></tr></tbody></table></div></main>`);
  });
  it('renameBlocks linked embed interal > video', () => {
    test(
      `<main><div><table><tbody><tr><th>Embed Embed Internal Embed Internal Adobestockcreativetrends Embed Internal Max</th></tr></tbody></table></div></main>`,
      `<main><div><table><tbody><tr><th>Video</th></tr></tbody></table></div></main>`);
  });
  it('renameBlocks linked multiple blocks', () => {
    test(
      `<main><div><table><tbody><tr><th>Embed Embed Internal</th></tr></tbody></table></div><div><table><tbody><tr><th>Animation</th></tr></tbody></table></div><div><table><tbody><tr><th>Promotion</th></tr></tbody></table></div></main>`,
      `<main><div><table><tbody><tr><th>Video</th></tr></tbody></table></div><div><table><tbody><tr><th>Animation</th></tr></tbody></table></div><div><table><tbody><tr><th>Banner</th></tr></tbody></table></div></main>`);
  });
});
