import { describe, expect, test } from "bun:test";
import { createAlgoliaAdapter, toAlgoliaRecord } from "../src/index.js";
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

describe("Algolia adapter", () => {
  test("preserves complete Folio metadata when indexing", () => {
    expect(toAlgoliaRecord(pages[0])).toEqual({
      objectID: "/getting-started",
      slug: "getting-started",
      url: "/getting-started",
      title: "Getting Started",
      description: "Start here",
      metadata: { order: 1, badge: "New" },
      headings: ["Install"],
    });
  });

  test("maps Algolia hits back to canonical Folio pages", async () => {
    const adapter = createAlgoliaAdapter({
      appId: "test-app",
      apiKey: "test-key",
      indexName: "docs",
      fetch: async () => new Response(JSON.stringify({
        hits: [{ objectID: "/getting-started" }],
      }), { status: 200 }),
    });

    const results = await adapter.search({ query: "install", pages });
    expect(results).toEqual(pages);
  });

  test("does not request the remote index for an empty query", async () => {
    let requests = 0;
    const adapter = createAlgoliaAdapter({
      appId: "test-app",
      apiKey: "test-key",
      indexName: "docs",
      fetch: async () => {
        requests += 1;
        return new Response("{}", { status: 200 });
      },
    });

    expect(await adapter.search({ query: "  ", pages })).toEqual(pages);
    expect(requests).toBe(0);
  });
});
