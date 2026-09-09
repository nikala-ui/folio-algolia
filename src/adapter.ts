import { getAlgoliaEnv } from "./env.js";
import { searchAlgolia } from "./client.js";
import type { AlgoliaAdapterOptions, FolioSearchAdapter, FolioSearchContext } from "./types.js";

export function createAlgoliaAdapter(options: AlgoliaAdapterOptions): FolioSearchAdapter {
  return {
    name: "algolia",
    async search({ query, pages }: FolioSearchContext) {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return pages;
      return searchAlgolia(options, normalizedQuery, pages);
    },
  };
}

export function createAlgoliaAdapterFromEnv(): FolioSearchAdapter {
  return createAlgoliaAdapter(getAlgoliaEnv());
}

export const algoliaAdapter: FolioSearchAdapter = {
  name: "algolia",
  search(context) {
    return createAlgoliaAdapterFromEnv().search(context);
  },
};
