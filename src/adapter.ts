import type { SearchAdapter, SearchContext } from "@nikala-ui/folio";
import { getAlgoliaEnv } from "./env.js";
import { searchAlgolia } from "./client.js";
import type { AlgoliaAdapterOptions } from "./types.js";

export function createAlgoliaAdapter(options: AlgoliaAdapterOptions): SearchAdapter {
  return {
    name: "algolia",
    async search({ query, pages }: SearchContext) {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return pages;
      return searchAlgolia(options, normalizedQuery, pages);
    },
  };
}

export function createAlgoliaAdapterFromEnv(): SearchAdapter {
  return createAlgoliaAdapter(getAlgoliaEnv());
}

export const algoliaAdapter: SearchAdapter = {
  name: "algolia",
  search(context) {
    return createAlgoliaAdapterFromEnv().search(context);
  },
};
