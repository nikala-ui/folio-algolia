# @nikala-ui/folio-algolia

Algolia search adapter for [Folio](https://github.com/nikala-ui/folio)
documentation sites.

The package connects Folio's search contract to an Algolia index. It keeps
site configuration in `docs.config.ts`, sends only search requests from the
browser, and maps Algolia hits back to the canonical pages already known by
Folio.

## Requirements

- Folio `0.13.2` or newer;
- an Algolia index containing the same page URLs used by Folio;
- an Algolia Search-Only API key.

Never expose an Algolia Admin API key or a key that can write/delete records
in a browser application.

## Installation

```bash
bun add @nikala-ui/folio @nikala-ui/folio-algolia
```

The package also works with npm, pnpm, and yarn.

## Configuration

Keep the adapter import and provider selection in `docs.config.ts`:

```ts
import { algoliaAdapter } from "@nikala-ui/folio-algolia";

export default {
  search: {
    enabled: true,
    provider: algoliaAdapter,
  },
};
```

The adapter implements Folio's `SearchAdapter` contract. The configuration
contains no Algolia request logic and no indexing code.

## Environment variables

Create a `.env` file in the documentation project:

```bash
VITE_ALGOLIA_APP_ID=your_application_id
VITE_ALGOLIA_SEARCH_KEY=your_search_only_key
VITE_ALGOLIA_INDEX=your_index_name
```

The adapter also accepts the equivalent server/runtime names:

```bash
ALGOLIA_APP_ID=your_application_id
ALGOLIA_SEARCH_KEY=your_search_only_key
ALGOLIA_INDEX=your_index_name
```

`VITE_*` variables are required when the adapter runs in the browser. They
are public by design; use only a Search-Only key.

## Index records

Use the Folio page URL as Algolia's stable object ID. The helper preserves the
page metadata needed by Folio:

```ts
import { toAlgoliaRecord } from "@nikala-ui/folio-algolia";

const record = toAlgoliaRecord(page);
```

The generated record contains `objectID`, `url`, `slug`, `title`,
`description`, `metadata` (frontmatter), and `headings` (table-of-contents
text).

Indexing is intentionally not part of this package. Run indexing from a
separate trusted server or CI job with an Algolia Admin key.

## Manual adapter construction

Use the factory when credentials come from another runtime configuration
system:

```ts
import { createAlgoliaAdapter } from "@nikala-ui/folio-algolia";

const adapter = createAlgoliaAdapter({
  appId: "your_application_id",
  apiKey: "your_search_only_key",
  indexName: "your_index_name",
});
```

For environment-based setup, the equivalent factory is available:

```ts
import { createAlgoliaAdapterFromEnv } from "@nikala-ui/folio-algolia";

const adapter = createAlgoliaAdapterFromEnv();
```

Most Folio sites should use the exported `algoliaAdapter` instance instead.

## Matching behavior

Folio passes the query and its local page catalog to the adapter. Algolia
performs the remote search, then the adapter matches returned hits by
`objectID`, `url`, or `slug`. Hits that do not belong to the current Folio
site are ignored, preventing an index from displaying routes that do not exist
in the running documentation project.

The empty query never makes a network request and returns Folio's current page
catalog.

## Errors

Remote failures throw `AlgoliaSearchError`, which includes the HTTP status when
one is available:

```ts
import { AlgoliaSearchError } from "@nikala-ui/folio-algolia";
```

Folio owns the UI behavior for displaying or handling search failures.

## Development

```bash
bun install
bun run typecheck
bun test tests
bun run build
```

The package contains the Folio adapter contract, Algolia query client,
environment resolution, and record mapping. Index creation, crawling, admin
credentials, and deployment belong in the consuming project or a separate
indexing service.

## License

MIT
