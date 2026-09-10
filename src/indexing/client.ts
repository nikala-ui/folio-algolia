import { AlgoliaIndexingError } from "./errors.js";
import type { AlgoliaIndexerOptions } from "./types.js";

const DEFAULT_INDEXING_ENDPOINT = "https://{appId}.algolia.net";
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 250;

type BatchRequest = {
  action: "updateObject" | "deleteObject";
  body: Record<string, unknown>;
};

interface BrowseResponse {
  hits?: Array<{ objectID?: string }>;
  cursor?: string;
}

function createBatchUrl(endpoint: string, indexName: string): string {
  return `${endpoint.replace(/\/$/, "")}/1/indexes/${encodeURIComponent(indexName)}/batch`;
}

function resolveEndpoint(options: AlgoliaIndexerOptions): string {
  return options.endpoint
    ?? DEFAULT_INDEXING_ENDPOINT.replace("{appId}", options.appId);
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createHeaders(options: AlgoliaIndexerOptions): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Algolia-Application-Id": options.appId,
    "X-Algolia-API-Key": options.adminApiKey,
  };
}

async function requestWithRetry(
  options: AlgoliaIndexerOptions,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const fetchImpl = options.fetch ?? globalThis.fetch;

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetchImpl(url, init);
    if (response.ok || !isRetryableStatus(response.status) || attempt >= maxRetries) {
      return response;
    }
    await wait(retryDelayMs * (attempt + 1));
  }
}

async function sendBatch(
  options: AlgoliaIndexerOptions,
  requests: BatchRequest[],
): Promise<void> {
  const response = await requestWithRetry(
    options,
    createBatchUrl(resolveEndpoint(options), options.indexName),
    {
      method: "POST",
      headers: createHeaders(options),
      body: JSON.stringify({ requests }),
    },
  );

  if (!response.ok) {
    throw new AlgoliaIndexingError(
      `Algolia indexing failed with status ${response.status}`,
      response.status,
    );
  }
}

export async function uploadBatch(
  options: AlgoliaIndexerOptions,
  records: Record<string, unknown>[],
): Promise<void> {
  await sendBatch(options, records.map((body) => ({ action: "updateObject", body })));
}

export async function deleteBatch(
  options: AlgoliaIndexerOptions,
  objectIDs: string[],
): Promise<void> {
  await sendBatch(options, objectIDs.map((objectID) => ({
    action: "deleteObject",
    body: { objectID },
  })));
}

export async function browseObjectIDs(options: AlgoliaIndexerOptions): Promise<string[]> {
  const objectIDs: string[] = [];
  let cursor: string | undefined;

  do {
    const response = await requestWithRetry(
      options,
      `${resolveEndpoint(options).replace(/\/$/, "")}/1/indexes/${encodeURIComponent(options.indexName)}/browse`,
      {
        method: "POST",
        headers: createHeaders(options),
        body: JSON.stringify(cursor ? { cursor } : { attributesToRetrieve: ["objectID"] }),
      },
    );

    if (!response.ok) {
      throw new AlgoliaIndexingError(
        `Algolia browse failed with status ${response.status}`,
        response.status,
      );
    }

    const data = await response.json() as BrowseResponse;
    for (const hit of data.hits ?? []) {
      if (typeof hit.objectID === "string") objectIDs.push(hit.objectID);
    }
    cursor = data.cursor;
  } while (cursor);

  return objectIDs;
}
