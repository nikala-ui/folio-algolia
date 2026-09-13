import { getAlgoliaEnv } from "./env.js";
import { searchAlgolia } from "./client.js";
import type { AlgoliaAdapterOptions, FolioSearchAdapter, FolioSearchContext } from "./types.js";

const BROWSER_RUNTIME_MODULE = "@nikala-ui/folio-algolia/browser";

function browserRuntime(options: AlgoliaAdapterOptions) {
  return {
    module: BROWSER_RUNTIME_MODULE,
    exportName: "createAlgoliaAdapter",
    options,
  };
}

export function createAlgoliaAdapter(options: AlgoliaAdapterOptions): FolioSearchAdapter {
  return {
    name: "algolia",
    runtime: browserRuntime(options),
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
  runtime: {
    module: BROWSER_RUNTIME_MODULE,
    exportName: "createAlgoliaAdapterFromEnv",
  },
  search(context) {
    return createAlgoliaAdapterFromEnv().search(context);
  },
};
