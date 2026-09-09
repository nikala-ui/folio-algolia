import type { PageData } from "@nikala-ui/folio";

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

export interface FolioSearchContext {
  query: string;
  pages: PageData[];
}

export interface FolioSearchAdapter {
  name: string;
  search: (context: FolioSearchContext) => PageData[] | Promise<PageData[]>;
}

export type FolioPage = PageData;
