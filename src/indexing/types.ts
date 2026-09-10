import type { FolioPage } from "../types.js";

export interface AlgoliaIndexerOptions {
  appId: string;
  adminApiKey: string;
  indexName: string;
  endpoint?: string;
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fetch?: typeof globalThis.fetch;
}

export type AlgoliaSyncMode = "upsert" | "full";

export interface AlgoliaSyncOptions {
  dryRun?: boolean;
  mode?: AlgoliaSyncMode;
  continueOnError?: boolean;
}

export interface AlgoliaSyncSummary {
  total: number;
  batches: number;
  uploaded: number;
  deleted: number;
  deleteBatches: number;
  failed: number;
  dryRun: boolean;
}

export interface AlgoliaIndexer {
  sync(pages: FolioPage[], options?: AlgoliaSyncOptions): Promise<AlgoliaSyncSummary>;
}
