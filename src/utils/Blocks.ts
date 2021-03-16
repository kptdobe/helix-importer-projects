/*
 * Copyright 2021 Adobe. All rights reserved.
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

export default class Blocks {
  static getMetadataBlock(document: Document, metadata: any) {
    const table = document.createElement('table');

    let row = document.createElement('tr');
    table.append(row);

    const hCell = document.createElement('th');
    row.append(hCell);

    hCell.innerHTML = 'Metadata';
    hCell.setAttribute('colspan', 2);

    // tslint:disable-next-line: forin
    for(const key in metadata) {
      row = document.createElement('tr');
      table.append(row);
      const keyCell = document.createElement('td');
      row.append(keyCell);
      keyCell.textContent = key;
      const valueCell = document.createElement('td');
      row.append(valueCell);
      valueCell.textContent = metadata[key];
    }

    return table;
  }
}