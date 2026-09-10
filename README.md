# @nikala-ui/folio-algolia

Algolia search adapter for [Folio](https://github.com/nikala-ui/folio)
documentation sites.

The package connects Folio's search contract to an Algolia index. It keeps
site configuration in `docs.config.ts`, sends only search requests from the
browser, and maps Algolia hits back to the canonical pages already known by
Folio.

## Requirements

- Folio `0.14.0` or newer;
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

The indexing entrypoint is server-only. It accepts the page catalog produced by
Folio and uploads records with an Algolia Admin API key. Use the Folio page URL
as Algolia's stable object ID. The helper preserves the page metadata needed
by Folio:

```ts
import { toAlgoliaRecord } from "@nikala-ui/folio-algolia";

const record = toAlgoliaRecord(page);
```

The generated record contains `objectID`, `url`, `slug`, `title`,
`description`, `metadata` (frontmatter), and `headings` (table-of-contents
text).

## Synchronize the index

Create a script in the consuming Folio project, for example
`scripts/index-search.ts`:

```ts
import path from "node:path";
import { DEFAULT_DOCS_CONFIG, loadConfig } from "@nikala-ui/folio/config";
import { scanContent } from "@nikala-ui/folio/content";
import {
  createAlgoliaIndexer,
  getAlgoliaIndexerOptions,
} from "@nikala-ui/folio-algolia/indexing";

const projectRoot = process.cwd();
const config = await loadConfig(projectRoot);
const contentDir = path.resolve(
  projectRoot,
  config.contentDir ?? DEFAULT_DOCS_CONFIG.contentDir,
);
const pages = await scanContent(contentDir);
const indexer = createAlgoliaIndexer(getAlgoliaIndexerOptions());
const dryRun = process.argv.includes("--dry-run");
const summary = await indexer.sync(pages, { dryRun });

console.log(summary);
```

The indexing script runs outside the browser and reads these server-only
variables:

```bash
ALGOLIA_APP_ID=your_application_id
ALGOLIA_ADMIN_API_KEY=your_admin_key
ALGOLIA_INDEX=your_index_name
```

Run a write-free validation first, then perform the upload:

```bash
bun run scripts/index-search.ts --dry-run
bun run scripts/index-search.ts
```

The current sync operation uses Algolia's `updateObject` batch action, so
re-running it safely updates existing records and creates missing records.

Use full synchronization when records removed from the documentation should
also be removed from Algolia:

```ts
const summary = await indexer.sync(pages, {
  mode: "full",
});
```

Full synchronization browses existing Algolia `objectID` values, compares
them with the current Folio catalog, and deletes stale records. Transient
`408`, `429`, and `5xx` responses are retried automatically. Configure
`maxRetries` and `retryDelayMs` when the deployment environment needs a
different policy. Use `continueOnError: true` only when the caller wants a
summary containing failed batch counts instead of stopping at the first error.

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

Most Folio sites should use the exported `algoliaAdapter` instance instead.

## Migration from 0.1.x

Version `0.2.0` adds the server-only indexing entrypoint at
`@nikala-ui/folio-algolia/indexing` and requires Folio `0.14.0` or newer for
the configured content-directory workflow. Existing browser-side adapter
configuration remains compatible:

```ts
import { algoliaAdapter } from "@nikala-ui/folio-algolia";

export default {
  search: {
    enabled: true,
    provider: algoliaAdapter,
  },
};
```

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
server-side batch indexing, environment resolution, and record mapping.
Crawling and deployment orchestration remain in the consuming project or a
separate indexing service.

## License

MIT
