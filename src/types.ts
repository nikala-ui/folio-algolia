import type { PageData, SearchAdapter } from "@nikala-ui/folio";

export interface AlgoliaAdapterOptions {
  appId: string;
  apiKey: string;
  indexName: string;
  endpoint?: string;
  hitsPerPage?: number;
  fetch?: typeof globalThis.fetch;
}

export interface AlgoliaHit {
  objectID?: string;
  slug?: string;
  url?: string;
}

export interface AlgoliaSearchResponse {
  hits?: AlgoliaHit[];
}

export type FolioSearchAdapter = SearchAdapter;
export type FolioPage = PageData;
