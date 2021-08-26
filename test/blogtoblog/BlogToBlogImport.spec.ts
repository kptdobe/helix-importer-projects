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
import { describe, it } from 'mocha';

import { JSDOM } from 'jsdom';

const getImporter = (): BlogToBlogImporter => new BlogToBlogImporter({
  storageHandler: null,
  blobHandler: null});

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
  const test = (inputHead: string, expectedHead: string, inputBody: string, expectedBody: string) => {
    const { document } = (new JSDOM(inputHead + inputBody)).window;
    const params = {
      category: 'news',
      tags: 'Creative Cloud,\nNews',
    };
    getImporter().buildMetadataTable(document, document, document, params);

    strictEqual(document.head.innerHTML, expectedHead);
    strictEqual(document.body.innerHTML, expectedBody);
  };

  const div = `<div></div>`;
  const longp = 'They looked but with divining eyes, they had not skill enough your worth to sing. For we which now behold these present days, have eyes to wonder, but lack tongues to praise.';
  const shortp = 'They looked but with divining eyes, they had not skill enough your worth to sing. For we which now behold these present days, have eyes ...';
  const pdiv = `<div><p>${longp}</p></div>`;

  it('build metadata table with expected input', () => {
    test(
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Description</td><td>lorem ipsum et cetera</td></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alpha, Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });

  it('build metadata table with expected input, lower case by', () => {
    test(
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<main>${div}${div}<div><p>by Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Description</td><td>lorem ipsum et cetera</td></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alpha</td></tr><tr><td>Topics</td><td>Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });

  it('build metadata table, constructed description omitted', () => {
    test(
      `<meta name="description" content="${shortp}"></head>`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alpha, Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });
  it('build metadata table, missing date', () => {
    test(
      `<meta name="description" content="${shortp}"></head>`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alpha, Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });
  it('build metadata table, missing category', () => {
    test(
      `<meta name="description" content="${shortp}"></head>`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alpha, Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });
  it('build metadata table, 1 topic', () => {
    test(
      `<meta name="description" content="${shortp}">`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alpha</td></tr></table></main>`);
  });

  it('build metadata table, 1 topic, no comma', () => {
    test(
      `<meta name="description" content="${shortp}">`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alpha</td></tr></table></main>`);
  });

  it('build metadata table, 1 topic, empty product', () => {
    test(
      `<meta name="description" content="${shortp}">`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha</p><p>Products:</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alpha</td></tr></table></main>`);
  });

  it('build metadata table, 1 product', () => {
    test(
      `<meta name="description" content="${shortp}">`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Products: Alfa,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alfa</td></tr></table></main>`);
  });

  it('build metadata table, 1 product, empty topic', () => {
    test(
      `<meta name="description" content="${shortp}">`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics:</p><p>Products: Alfa,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>Alfa</td></tr></table></main>`);
  });

  it('build metadata table, 1 topic & 1 product', () => {
    test(
      `<meta name="description" content="${shortp}">`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha,</p><p>Products: Bravo,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alpha, Bravo</td></tr></table></main>`);
  });
  it('build metadata table, missing topics/category', () => {
    test(
      `<meta name="description" content="${shortp}">`,
      `<meta name="description" content="${shortp}">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><h2>Featured posts:</h2><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></div></main>`,
      `<main>${div}${div}${pdiv}<div><h2>Featured posts:</h2><a href="https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air">https://blog.adobe.com/en/publish/2019/05/30/the-future-of-adobe-air</a></div><table><tr><th>Metadata</th></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr></table></main>`);
  });
});

describe('BlogToBlogImporter#buildMetadataTable category tests', () => {
  const test = (inputHead: string, expectedHead: string, inputBody: string, expectedBody: string) => {
    const { document } = (new JSDOM(inputHead + inputBody)).window;
    const params = {
      tags: 'Creative Cloud,\nNews',
    };
    getImporter().buildMetadataTable(document, document, document, params);

    strictEqual(document.head.innerHTML, expectedHead);
    strictEqual(document.body.innerHTML, expectedBody);
  };

  const div = `<div></div>`;
  const longp = 'They looked but with divining eyes, they had not skill enough your worth to sing. For we which now behold these present days, have eyes to wonder, but lack tongues to praise.';
  const pdiv = `<div><p>${longp}</p></div>`;

  it('build metadata table, no category', () => {
    test(
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Description</td><td>lorem ipsum et cetera</td></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Tags</td><td>Creative Cloud, News</td></tr><tr><td>Topics</td><td>Alpha, Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });
});

describe('BlogToBlogImporter#buildMetadataTable tags tests', () => {
  const test = (inputHead: string, expectedHead: string, inputBody: string, expectedBody: string) => {
    const { document } = (new JSDOM(inputHead + inputBody)).window;
    const params = {
      category: 'news',
    };
    getImporter().buildMetadataTable(document, document, document, params);

    strictEqual(document.head.innerHTML, expectedHead);
    strictEqual(document.body.innerHTML, expectedBody);
  };

  const div = `<div></div>`;
  const longp = 'They looked but with divining eyes, they had not skill enough your worth to sing. For we which now behold these present days, have eyes to wonder, but lack tongues to praise.';
  const pdiv = `<div><p>${longp}</p></div>`;

  it('build metadata table, no tags', () => {
    test(
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Description</td><td>lorem ipsum et cetera</td></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Category</td><td>news</td></tr><tr><td>Topics</td><td>Alpha, Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });
});

describe('BlogToBlogImporter#buildMetadataTable category/tags tests', () => {
  const test = (inputHead: string, expectedHead: string, inputBody: string, expectedBody: string) => {
    const { document } = (new JSDOM(inputHead + inputBody)).window;
    getImporter().buildMetadataTable(document, document, document, null);

    strictEqual(document.head.innerHTML, expectedHead);
    strictEqual(document.body.innerHTML, expectedBody);
  };

  const div = `<div></div>`;
  const longp = 'They looked but with divining eyes, they had not skill enough your worth to sing. For we which now behold these present days, have eyes to wonder, but lack tongues to praise.';
  const pdiv = `<div><p>${longp}</p></div>`;

  it('build metadata table, no params', () => {
    test(
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<meta name="description" content="lorem ipsum et cetera">`,
      `<main>${div}${div}<div><p>By Katie Sexton</p><p>Posted on 09-09-2019</p></div>${pdiv}<div><p>Topics: Alpha, Beta, Gamma,</p><p>Products: Delta, Echo, Foxtrot,</p></div></main>`,
      `<main>${div}${div}${pdiv}<table><tr><th>Metadata</th></tr><tr><td>Description</td><td>lorem ipsum et cetera</td></tr><tr><td>Author</td><td>Katie Sexton</td></tr><tr><td>Publication Date</td><td>09-09-2019</td></tr><tr><td>Topics</td><td>Alpha, Beta, Gamma, Delta, Echo, Foxtrot</td></tr></table></main>`);
  });
});

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
  it('renameBlocks linked embed interal > banner', () => {
    test(
      `<main><div><table><tbody><tr><th>Embed Embed Internal Embed Internal Adobestockcreativetrends Embed Internal Max</th></tr></tbody></table></div></main>`,
      `<main><div><table><tbody><tr><th>Banner</th></tr></tbody></table></div></main>`);
  });
  it('renameBlocks linked multiple blocks', () => {
    test(
      `<main><div><table><tbody><tr><th>Embed Embed Internal</th></tr></tbody></table></div><div><table><tbody><tr><th>Animation</th></tr></tbody></table></div><div><table><tbody><tr><th>Promotion</th></tr></tbody></table></div></main>`,
      `<main><div><table><tbody><tr><th>Banner</th></tr></tbody></table></div><div><table><tbody><tr><th>Animation</th></tr></tbody></table></div><div><table><tbody><tr><th>Banner</th></tr></tbody></table></div></main>`);
  });
});
