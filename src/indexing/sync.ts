import { toAlgoliaRecord } from "../records.js";
import type { FolioPage } from "../types.js";
import { uploadBatch } from "./client.js";
import { AlgoliaIndexingError } from "./errors.js";
import type {
  AlgoliaIndexer,
  AlgoliaIndexerOptions,
  AlgoliaSyncOptions,
  AlgoliaSyncSummary,
} from "./types.js";

const DEFAULT_BATCH_SIZE = 1000;

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new AlgoliaIndexingError(
      "Algolia indexing is server-only and cannot run in a browser",
    );
  }
}

function splitIntoBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

export function createAlgoliaIndexer(options: AlgoliaIndexerOptions): AlgoliaIndexer {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new TypeError("Algolia indexer batchSize must be a positive integer");
  }

  return {
    async sync(pages: FolioPage[], syncOptions: AlgoliaSyncOptions = {}): Promise<AlgoliaSyncSummary> {
      assertServerRuntime();

      const records = pages.map(toAlgoliaRecord);
      const batches = splitIntoBatches(records, batchSize);
      if (syncOptions.dryRun || records.length === 0) {
        return {
          total: records.length,
          batches: batches.length,
          uploaded: 0,
          dryRun: Boolean(syncOptions.dryRun),
        };
      }

      for (const batch of batches) {
        await uploadBatch(options, batch);
      }

      return {
        total: records.length,
        batches: batches.length,
        uploaded: records.length,
        dryRun: false,
      };
    },
  };
}
