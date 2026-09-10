import { describe, expect, test } from "bun:test";
import { createAlgoliaIndexer } from "../src/indexing/index.js";
import type { PageData } from "@nikala-ui/folio";

const pages = [
  {
    slug: "getting-started",
    url: "/getting-started",
    filePath: "docs/getting-started.mdx",
    frontmatter: { order: 1, badge: "New" },
    toc: [{ id: "install", text: "Install", depth: 2 }],
    title: "Getting Started",
    description: "Start here",
  },
] satisfies PageData[];

describe("Algolia indexer", () => {
  test("uploads page records in bounded batches with the Admin key", async () => {
    const requests: Request[] = [];
    const indexer = createAlgoliaIndexer({
      appId: "test-app",
      adminApiKey: "admin-key",
      indexName: "docs",
      batchSize: 1,
      endpoint: "https://algolia.test",
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return new Response("{}", { status: 200 });
      },
    });

    const summary = await indexer.sync([...pages, ...pages]);
    expect(summary).toEqual({ total: 2, batches: 2, uploaded: 2, dryRun: false });
    expect(requests).toHaveLength(2);
    expect(requests[0].url).toBe("https://algolia.test/1/indexes/docs/batch");
    expect(requests[0].headers.get("X-Algolia-API-Key")).toBe("admin-key");
    expect((await requests[0].json()).requests[0].action).toBe("updateObject");
  });

  test("supports a write-free dry run", async () => {
    let requests = 0;
    const indexer = createAlgoliaIndexer({
      appId: "test-app",
      adminApiKey: "admin-key",
      indexName: "docs",
      fetch: async () => {
        requests += 1;
        return new Response("{}", { status: 200 });
      },
    });

    const summary = await indexer.sync(pages, { dryRun: true });
    expect(summary).toEqual({ total: 1, batches: 1, uploaded: 0, dryRun: true });
    expect(requests).toBe(0);
  });

  test("does not write an empty catalog", async () => {
    let requests = 0;
    const indexer = createAlgoliaIndexer({
      appId: "test-app",
      adminApiKey: "admin-key",
      indexName: "docs",
      fetch: async () => {
        requests += 1;
        return new Response("{}", { status: 200 });
      },
    });

    const summary = await indexer.sync([]);
    expect(summary).toEqual({ total: 0, batches: 0, uploaded: 0, dryRun: false });
    expect(requests).toBe(0);
  });
});
