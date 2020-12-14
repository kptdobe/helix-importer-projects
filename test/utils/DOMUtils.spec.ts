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

import DOMUtils from '../../src/product/utils/DOMUtils';

import { strictEqual } from 'assert';
import { describe, it } from "mocha";

import { JSDOM } from 'jsdom';

describe('DOMUtils#reviewInlineElement tests', () => {
  const test = (input: string, tag: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.reviewInlineElement(document, tag);
    strictEqual(document.body.innerHTML, expected);
  };

  it('reviewInlineElement does not change the DOM', () => {
    test('<a href="linkhref">linkcontent</a>', 'a', '<a href="linkhref">linkcontent</a>');
    test('<a href="linkhref">linkcontent</a><a href="linkhref2">linkcontent2</a>', 'a', '<a href="linkhref">linkcontent</a><a href="linkhref2">linkcontent2</a>');
  });

  it('reviewInlineElement merges nodes', () => {
    test('<a href="linkhref">linkcontent</a><a href="linkhref">linkcontent2</a>', 'a', '<a href="linkhref">linkcontentlinkcontent2</a>');
    test('<span>text</span><span> and more text</span>', 'span', '<span>text and more text</span>');
    test('<em>text</em><em> and more text</em>', 'em', '<em>text and more text</em>');
    test('<em> text</em><em> and more text</em>', 'em', '<span> </span><em>text and more text</em>');
    test('<em> text </em><em>and more text </em>', 'em', '<span> </span><em>text and more text</em><span> </span>');
  });

  it('reviewInlineElement filters out useless punctuation tags', () => {
    test('<a href="linkhref">linkcontent<strong>:</strong></a>', 'strong', '<a href="linkhref">linkcontent:</a>');
    test('<a href="linkhref">linkcontent<span>: </span></a>', 'span', '<a href="linkhref">linkcontent: </a>');
    test('<a href="linkhref">linkcontent</a><em>.</em>', 'em', '<a href="linkhref">linkcontent</a>.');
    test('<a href="linkhref">linkcontent</a><i>. </i>', 'i', '<a href="linkhref">linkcontent</a>. ');
  });

  it('reviewInlineElement cleans up &nbsp;', () => {
    test('<p><strong>So</strong><strong>me</strong><strong> – </strong><strong>complicated&nbsp;</strong><strong>setup&nbsp;</strong><strong>found&nbsp;</strong><strong>on&nbsp;</strong><strong>real site.</strong></p>', 'strong', '<p><strong>Some – complicated setup found on real site.</strong></p>');
  });

  it('reviewInlineElement nested tags', () => {
    const intermediate = '<p><strong><em>emphasis</em><em> space </em><em>another emphasis</em> <em>last emphasis</em></strong></p>';
    test('<p><strong><em>emphasis</em></strong><strong><em> space </em></strong><strong><em>another emphasis</em></strong> <strong><em>last emphasis</em></strong></p>', 'strong', intermediate);
    test(intermediate, 'em', '<p><strong><em>emphasis space another emphasis last emphasis</em></strong></p>');
  });

  it('reviewInlineElement removes empty tags', () => {
    test('<p><strong></strong><strong>only strong</strong></p>', 'strong', '<p><strong>only strong</strong></p>');
    test('<p><strong><em></em></strong><strong><em>only strong</em></strong></p>', 'strong', '<p><strong><em>only strong</em></strong></p>');
  });

  it('reviewInlineElement does not remove useful tags', () => {
    test('<p><a href="animage.jpg"><img src="animage.jpg"></a></p>', 'a', '<p><a href="animage.jpg"><img src="animage.jpg"></a></p>');
  });

  it('reviewInlineElement digests spaces', () => {
    test('<p><strong>Sentence</strong> <strong>must</strong> <strong>be</strong> <strong>strong!</strong></p>', 'strong', '<p><strong>Sentence must be strong!</strong></p>');
  });

});

describe('DOMUtils#reviewParagraphs tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.reviewParagraphs(document);
    strictEqual(document.body.innerHTML, expected);
  }

  it('reviewParagraphs remove useless paragraphs', () => {
    test('<p><strong><em>&nbsp;</em></strong></p><p>usefull</p>', '<p>usefull</p>');
    test('<p><em>&nbsp;</em></p><p>usefull</p>', '<p>usefull</p>');
    test('<p>usefull</p><p>&nbsp;</p>', '<p>usefull</p>');
    test('<p>usefull</p><p>&nbsp;</p><p>usefull too</p>', '<p>usefull</p><p>usefull too</p>');
  });

  it('reviewParagraphs does not remove usefull paragraphs', () => {
    test('<p><img src="animage.jpg"></p>', '<p><img src="animage.jpg"></p>');
    test('<p><a href="animage.jpg"><img src="animage.jpg"></a></p>', '<p><a href="animage.jpg"><img src="animage.jpg"></a></p>');
    test('<p><div></div></p>', '<div></div>');
    test('<p><video width="320" height="240" controls=""><source src="movie.mp4" type="video/mp4"></video></p>', '<p><video width="320" height="240" controls=""><source src="movie.mp4" type="video/mp4"></video></p>');
    test('<p><iframe src="www.iframe.com"></iframe></p>', '<p><iframe src="www.iframe.com"></iframe></p>');
  });
});

describe('DOMUtils#reviewHeadings tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.reviewHeadings(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('reviewHeadings filters headings', () => {
    test('<h1><strong>Super title</strong></h1>', '<h1>Super title</h1>');
  });

  it('reviewHeadings filters headings but keep the ones clean', () => {
    test('<h1><strong>Super title</strong></h1><h2><strong>Another title</strong></h2><h3>Do not touch this title</h3>', '<h1>Super title</h1><h2>Another title</h2><h3>Do not touch this title</h3>');
  });

  it('reviewHeadings filters headings but do not change other elements', () => {
    test('<h1><strong>Super title</strong></h1><p><strong>String text</strong></p>', '<h1>Super title</h1><p><strong>String text</strong></p>');
  });

  it('reviewHeadings filters all headings', () => {
    test('<h1><strong>H1</strong></h1><h2><strong>H2</strong></h2><h3><strong>H3</strong></h3><h4><strong>H4</strong></h4><h5><strong>H5</strong></h5><h6><strong>H6</strong></h6>', '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>');
  });

  it('reviewHeadings removes empty headings', () => {
    test('<h1><strong>H1</strong></h1><h2><strong></strong></h2><h3><strong>H3</strong></h3><h4></h4><h5><strong>H5</strong></h5><h6></h6>', '<h1>H1</h1><h3>H3</h3><h5>H5</h5>');
  });
});

describe('DOMUtils#escapeSpecialCharacters tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.escapeSpecialCharacters(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('escapeSpecialCharacters escape tidles', () => {
    test('<p>Paragraph with 2 tildes: 20~30 and 40~50</p>', '<p>Paragraph with 2 tildes: 20\\~30 and 40\\~50</p>');
  });
});

describe('DOMUtils#remove tests', () => {
  const test = (input: string, selectors, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.remove(document, selectors);
    strictEqual(document.body.innerHTML, expected);
  };

  it('remove elements', () => {
    test('<a>link</a>', ['a'], '');
    test('<a>link</a><a>link2</a>', ['a'], '');
    test('<a>link</a><p>paragraph</p><a>link2</a>', ['a'], '<p>paragraph</p>');
    test('<a>link</a><p>paragraph</p><a>link2</a>', ['p'], '<a>link</a><a>link2</a>');
    test('<a class="badlink">link</a><p>paragraph</p><a>link2</a>', ['.badlink'], '<p>paragraph</p><a>link2</a>');
  });
});