import { describe, expect, test } from "bun:test";
import { getAlgoliaIndexerOptions } from "../src/indexing/index.js";

describe("Algolia indexing environment", () => {
  test("reads server-only credentials without VITE fallbacks", () => {
    expect(getAlgoliaIndexerOptions({
      ALGOLIA_APP_ID: "app",
      ALGOLIA_ADMIN_API_KEY: "admin",
      ALGOLIA_INDEX: "docs",
      VITE_ALGOLIA_SEARCH_KEY: "search-only",
    })).toEqual({
      appId: "app",
      adminApiKey: "admin",
      indexName: "docs",
    });
  });

  test("requires the Admin API key explicitly", () => {
    expect(() => getAlgoliaIndexerOptions({
      ALGOLIA_APP_ID: "app",
      ALGOLIA_INDEX: "docs",
      VITE_ALGOLIA_SEARCH_KEY: "search-only",
    })).toThrow("ALGOLIA_ADMIN_API_KEY");
  });
});
