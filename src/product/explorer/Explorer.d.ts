import { Response } from 'node-fetch';
import { Document } from 'jsdom';

export interface Explorer {
  explore(settings: Object): Promise<Object[]>;
  fetch(page: Number): Promise<Response>;
  process(document: Document, entries: Object[]): Object[];

}

export interface ExplorerParams {
  url: String;
}