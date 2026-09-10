import { AlgoliaIndexingError } from "./errors.js";
import type { AlgoliaIndexerOptions } from "./types.js";

const DEFAULT_INDEXING_ENDPOINT = "https://{appId}.algolia.net";

function createBatchUrl(endpoint: string, indexName: string): string {
  return `${endpoint.replace(/\/$/, "")}/1/indexes/${encodeURIComponent(indexName)}/batch`;
}

function resolveEndpoint(options: AlgoliaIndexerOptions): string {
  return options.endpoint
    ?? DEFAULT_INDEXING_ENDPOINT.replace("{appId}", options.appId);
}

export async function uploadBatch(
  options: AlgoliaIndexerOptions,
  records: Record<string, unknown>[],
): Promise<void> {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const response = await fetchImpl(createBatchUrl(resolveEndpoint(options), options.indexName), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": options.appId,
      "X-Algolia-API-Key": options.adminApiKey,
    },
    body: JSON.stringify({
      requests: records.map((record) => ({
        action: "updateObject",
        body: record,
      })),
    }),
  });

  if (!response.ok) {
    throw new AlgoliaIndexingError(
      `Algolia indexing failed with status ${response.status}`,
      response.status,
    );
  }
}
