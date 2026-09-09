import type { AlgoliaAdapterOptions, AlgoliaSearchResponse, FolioPage } from "./types.js";
import { findFolioPage } from "./records.js";

export class AlgoliaSearchError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AlgoliaSearchError";
    this.status = status;
  }
}

function createSearchUrl(endpoint: string, indexName: string): string {
  return `${endpoint.replace(/\/$/, "")}/1/indexes/${encodeURIComponent(indexName)}/query`;
}

export async function searchAlgolia(
  options: Required<Pick<AlgoliaAdapterOptions, "appId" | "apiKey" | "indexName">> & Pick<AlgoliaAdapterOptions, "endpoint" | "hitsPerPage" | "fetch">,
  query: string,
  pages: FolioPage[],
): Promise<FolioPage[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const endpoint = options.endpoint ?? `https://${options.appId}-dsn.algolia.net`;
  const response = await fetchImpl(createSearchUrl(endpoint, options.indexName), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": options.appId,
      "X-Algolia-API-Key": options.apiKey,
    },
    body: JSON.stringify({
      params: new URLSearchParams({
        query,
        hitsPerPage: String(options.hitsPerPage ?? 20),
      }).toString(),
    }),
  });

  if (!response.ok) {
    throw new AlgoliaSearchError(
      `Algolia search failed with status ${response.status}`,
      response.status,
    );
  }

  const data = await response.json() as AlgoliaSearchResponse;
  if (!Array.isArray(data.hits)) {
    throw new AlgoliaSearchError("Algolia search returned an invalid response");
  }

  const results: FolioPage[] = [];
  const seen = new Set<string>();
  for (const hit of data.hits) {
    const page = findFolioPage(hit, pages);
    if (page && !seen.has(page.url)) {
      seen.add(page.url);
      results.push(page);
    }
  }

  return results;
}
