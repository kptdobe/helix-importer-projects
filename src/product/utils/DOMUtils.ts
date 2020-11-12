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

import { JSDOM, Document } from 'jsdom';

export default class DOMUtils {
  static reviewInlineElement(document: Document, tagName: string) {
    // collaspe consecutive <tag>
    // and make sure element does not start ends with spaces while it is before / after some text
    const tags = [...document.querySelectorAll(tagName)];
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      if (tag.textContent === '') {
        tag.remove();
      } else if (tag.innerHTML === '&nbsp;') {
          tag.replaceWith(JSDOM.fragment(' '));
      } else {
        let innerHTML = tag.innerHTML;
        if (tag.previousSibling) {
          const $previousSibling = tag.previousSibling;
          if (
            tag.previousSibling.tagName &&
            tag.previousSibling.tagName.toLowerCase() === tagName &&
            (!tag.previousSibling.href ||
              tag.previousSibling.href === tag.href
            )) {
            // previous sibling is an <tag>, merge current one inside the previous one
            $previousSibling.append(innerHTML);
            tag.remove();
          }
        } else {
          if (innerHTML) {
            if (innerHTML.lastIndexOf(' ') === innerHTML.length - 1) {
              // move trailing space to a new text node outside of current element
              innerHTML = tag.innerHTML = innerHTML.slice(0, innerHTML.length - 1);
              tag.after(JSDOM.fragment('<span> </span>'));
            }

            if (innerHTML.indexOf(' ') === 0) {
              // move leading space to a new text node outside of current element
              tag.innerHTML = innerHTML.slice(1);
              tag.before(JSDOM.fragment('<span> </span>'));
            }
          }
        }
      }
    }
  }

  static remove(document: Document, selectors: string[]) {
    selectors.forEach((s) => {
      document.querySelectorAll(s).forEach((n) => n.remove());
    });
  }
}