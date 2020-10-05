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
});

describe('DOMUtils#remove tests', () => {
  const test = (input: string, selectors, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.remove(document, selectors);
    strictEqual(document.body.innerHTML, expected);
  };

  it.only('remove elements', () => {
    test('<a>link</a>', ['a'], '');
    test('<a>link</a><a>link2</a>', ['a'], '');
    test('<a>link</a><p>paragraph</p><a>link2</a>', ['a'], '<p>paragraph</p>');
    test('<a>link</a><p>paragraph</p><a>link2</a>', ['p'], '<a>link</a><a>link2</a>');
    test('<a class="badlink">link</a><p>paragraph</p><a>link2</a>', ['.badlink'], '<p>paragraph</p><a>link2</a>');
  });
});