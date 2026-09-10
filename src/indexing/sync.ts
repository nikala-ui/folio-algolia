import { toAlgoliaRecord } from "../records.js";
import type { FolioPage } from "../types.js";
import { browseObjectIDs, deleteBatch, uploadBatch } from "./client.js";
import { AlgoliaIndexingError } from "./errors.js";
import type {
  AlgoliaIndexer,
  AlgoliaIndexerOptions,
  AlgoliaSyncOptions,
  AlgoliaSyncMode,
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

function createSummary(
  total: number,
  batches: number,
  dryRun: boolean,
): AlgoliaSyncSummary {
  return {
    total,
    batches,
    uploaded: 0,
    deleted: 0,
    deleteBatches: 0,
    failed: 0,
    dryRun,
  };
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
      const mode: AlgoliaSyncMode = syncOptions.mode ?? "upsert";
      const summary = createSummary(records.length, batches.length, Boolean(syncOptions.dryRun));

      for (const batch of batches) {
        if (syncOptions.dryRun) continue;
        try {
          await uploadBatch(options, batch);
          summary.uploaded += batch.length;
        } catch (error) {
          summary.failed += batch.length;
          if (!syncOptions.continueOnError) throw error;
        }
      }

      if (mode !== "full" || summary.failed > 0) return summary;

      const remoteObjectIDs = await browseObjectIDs(options);
      const desiredObjectIDs = new Set(records.map((record) => String(record.objectID)));
      const staleObjectIDs = remoteObjectIDs.filter((objectID) => !desiredObjectIDs.has(objectID));
      const deleteBatches = splitIntoBatches(staleObjectIDs, batchSize);
      summary.deleteBatches = deleteBatches.length;

      for (const deleteBatchObjectIDs of deleteBatches) {
        if (syncOptions.dryRun) continue;
        try {
          await deleteBatch(options, deleteBatchObjectIDs);
          summary.deleted += deleteBatchObjectIDs.length;
        } catch (error) {
          summary.failed += deleteBatchObjectIDs.length;
          if (!syncOptions.continueOnError) throw error;
        }
      }

      if (syncOptions.dryRun) summary.deleted = staleObjectIDs.length;
      return summary;
    },
  };
}
