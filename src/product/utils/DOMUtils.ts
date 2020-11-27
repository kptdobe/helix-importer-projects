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
  static EMPTY_TAGS_TO_PRESERVE = ['img', 'video', 'iframe', 'div', 'picture'];

  static reviewInlineElement(document: Document, tagName: string) {
    const tags = [...document.querySelectorAll(tagName)];
    // first pass, remove empty nodes
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      if (tag.textContent === '') {
        tag.remove();
      }
    }

    // collaspe consecutive <tag>
    // and make sure element does not start ends with spaces while it is before / after some text
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      if (tag.innerHTML === '&nbsp;') {
          tag.replaceWith(JSDOM.fragment(' '));
      } else if (tag.innerHTML === '.' || tag.innerHTML === '. ' || tag.innerHTML === ':' || tag.innerHTML === ': ') {
          tag.replaceWith(JSDOM.fragment(tag.innerHTML));
      } else {
        tag.innerHTML = tag.innerHTML.replace(/\&nbsp;/gm, ' ');
        let innerHTML = tag.innerHTML;
        if (tag.previousSibling) {
          const $previousSibling = tag.previousSibling;
          if (
            tag.previousSibling.tagName &&
            tag.previousSibling.tagName.toLowerCase() === tagName &&
            (!tag.previousSibling.href ||
              tag.previousSibling.href === tag.href
            )) {
              if (tag.hasChildNodes()) {
                [...tag.childNodes].forEach(child => {
                  $previousSibling.append(child);
                });
              } else {
                // previous sibling is an <tag>, merge current one inside the previous one
                $previousSibling.append(innerHTML);
              }
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

  static reviewParagraphs(document: Document) {
    const tags = [...document.querySelectorAll('p')];
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      // remove useless paragraphs
      if ((tag.textContent === '' ||
        tag.textContent === ' ' ||
        tag.textContent === '&nbsp;' ||
        tag.textContent.charCodeAt(0) === 160) &&
        !tag.querySelector(DOMUtils.EMPTY_TAGS_TO_PRESERVE.join(','))) {
          tag.remove();
      }
    }
  }

  static escapeSpecialCharacters(document: Document) {
    document.body.innerHTML = document.body.innerHTML
      .replace(/\~/gm, '\\~');
  }

  static reviewHeadings(document: Document) {
    const tags = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      // remove useless strong tags
      tag.innerHTML = tag.innerHTML.replace(/\<strong\>|\<\\strong\>/gm,'');
      if (tag.innerHTML === '') {
        tag.remove();
      }
    }
  }

  static remove(document: Document, selectors: string[]) {
    selectors.forEach((s) => {
      document.querySelectorAll(s).forEach((n) => n.remove());
    });
  }
}