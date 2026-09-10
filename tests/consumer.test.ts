import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DEFAULT_DOCS_CONFIG, loadConfig } from "@nikala-ui/folio/config";
import { scanContent } from "@nikala-ui/folio/content";
import { createAlgoliaIndexer } from "../src/indexing/index.js";

describe("Folio consumer indexing workflow", () => {
  test("uses the configured content directory", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "folio-algolia-consumer-"));

    try {
      const contentDir = "content-pages";
      const absoluteContentDir = path.join(projectRoot, contentDir);
      await mkdir(absoluteContentDir, { recursive: true });
      await writeFile(
        path.join(projectRoot, "docs.config.ts"),
        `export default { contentDir: ${JSON.stringify(contentDir)} };\n`,
      );
      await writeFile(
        path.join(absoluteContentDir, "guide.mdx"),
        "---\ntitle: Guide\ndescription: A guide\n---\n\n## Install\n",
      );

      const config = await loadConfig(projectRoot);
      const resolvedContentDir = path.resolve(
        projectRoot,
        config.contentDir ?? DEFAULT_DOCS_CONFIG.contentDir,
      );
      const pages = await scanContent(resolvedContentDir);
      const indexer = createAlgoliaIndexer({
        appId: "test-app",
        adminApiKey: "admin-key",
        indexName: "docs",
        fetch: async () => new Response("{}", { status: 200 }),
      });

      const summary = await indexer.sync(pages, { dryRun: true });
      expect(pages[0]?.url).toBe("/guide");
      expect(summary.total).toBe(1);
      expect(await readFile(path.join(absoluteContentDir, "guide.mdx"), "utf8")).toContain("Guide");
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
