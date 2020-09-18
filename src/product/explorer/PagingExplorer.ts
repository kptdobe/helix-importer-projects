import { Explorer, ExplorerParams } from './Explorer';

import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';

export class PagingExplorerParams implements ExplorerParams {
  nbMaxPages: Number;
  url: String;
}

export abstract class PagingExplorer implements Explorer {
  params: PagingExplorerParams;

  constructor(params: PagingExplorerParams) {
      this.params = params;
  }

  async explore(): Promise<Array<Object>> {
    const startTime = new Date().getTime();
  
    let page = 1;

    let results = [];
  
    while(page <= this.params.nbMaxPages) {
      console.log(`${this.params.url}: Requesting page ${page}/${this.params.nbMaxPages}.`);
      
      const res = await this.fetch(page);
  
      if (!res.ok) {
        console.log(`${this.params.url}: Invalid response, considering no more results`);
        break;
      } else {
        const text = await res.text();
  
        if (text) {
          const { document } = (new JSDOM(text)).window;
  
          const entries = this.process(document, results);
          
          if (entries && entries.length > 0) {
            results = results.concat(entries);
          } else {
            console.log(`${this.params.url}: No entries found on page ${page}`);  
          }
          
        } else {
          console.log(`${this.params.url}: No more results`);
          break;
        }
  
        page += 1;
      }
    }
  
    console.log();
    console.log(`${this.params.url}: Process stopped at page ${page - 1} on ${this.params.nbMaxPages}.`);
    console.log(`${this.params.url}: Imported ${results.length} post entries.`);
    console.log(`${this.params.url}: Process took ${(new Date().getTime() - startTime) / 1000}s.`);

    return results;
  }

  abstract async fetch(page: Number): Promise<Response>;
  abstract process(document: Document, entries: Object[]): Object[];
}