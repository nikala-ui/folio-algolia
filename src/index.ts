export { algoliaAdapter, createAlgoliaAdapter, createAlgoliaAdapterFromEnv } from "./adapter.js";
export { AlgoliaSearchError, searchAlgolia } from "./client.js";
export { getAlgoliaEnv, requiredEnv } from "./env.js";
export { findFolioPage, toAlgoliaRecord } from "./records.js";
export type {
  AlgoliaAdapterOptions,
  AlgoliaHit,
  AlgoliaSearchResponse,
  FolioPage,
  FolioSearchAdapter,
  FolioSearchContext,
} from "./types.js";
