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

import os from 'os';
export default class CSV {
  static toCSV(entries: object[], delimiter = ';') {
    let ret = '';
    if (entries && entries.length > 0) {
      // headers
      const headers = [];
      for (const name in entries[0]) {
        if (entries[0].hasOwnProperty(name)) {
          headers.push(name);
          ret += name + delimiter;
        }
      }
      ret += os.EOL;

      entries.forEach((e) => {
        headers.forEach((h) => {
          ret += (e[h] || '') + delimiter;
        });
        ret += os.EOL;
      });
    }
    return ret;
  }

  static toArray(csv: string, delimiter = ';') {
    const rows = csv.split(os.EOL);
    // remove last element
    rows.pop();

    let headers = [];
    const array = [];

    rows.forEach((r, i) => {
      if (i === 0) {
        // headers
        headers = r.split(delimiter);
        // remove last element
        headers.pop();
      } else {
        const values = r.split(delimiter);
        // remove last element
        values.pop();

        const obj = {};
        values.forEach((v, index) => {
          obj[headers[index]] = v;
        });
        array.push(obj);
      }
    });
    return array;
  }
}