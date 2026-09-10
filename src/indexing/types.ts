import type { FolioPage } from "../types.js";

export interface AlgoliaIndexerOptions {
  appId: string;
  adminApiKey: string;
  indexName: string;
  endpoint?: string;
  batchSize?: number;
  fetch?: typeof globalThis.fetch;
}

export interface AlgoliaSyncOptions {
  dryRun?: boolean;
}

export interface AlgoliaSyncSummary {
  total: number;
  batches: number;
  uploaded: number;
  dryRun: boolean;
}

export interface AlgoliaIndexer {
  sync(pages: FolioPage[], options?: AlgoliaSyncOptions): Promise<AlgoliaSyncSummary>;
}
