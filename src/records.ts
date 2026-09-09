import type { AlgoliaHit, FolioPage } from "./types.js";

export function toAlgoliaRecord(page: FolioPage): Record<string, unknown> {
  return {
    objectID: page.url,
    slug: page.slug,
    url: page.url,
    title: page.title,
    description: page.description,
    metadata: page.frontmatter,
    headings: page.toc.map((item) => item.text),
  };
}

export function findFolioPage(hit: AlgoliaHit, pages: FolioPage[]): FolioPage | undefined {
  const identifier = hit.objectID ?? hit.url ?? hit.slug;
  if (!identifier) return undefined;

  return pages.find((page) =>
    page.url === identifier || page.slug === identifier,
  );
}
