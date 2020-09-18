import { Response } from 'node-fetch';
import { Document } from 'jsdom';

export interface Explorer {
  explore(settings: Object): Promise<Array<Object>>;
  fetch(page: Number): Promise<Response>;
  process(document: Document): Array<Object>;
}

export interface ExplorerParams {
  url: String;
}