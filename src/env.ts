type RuntimeEnv = Record<string, string | undefined>;

function getRuntimeEnv(): RuntimeEnv {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: RuntimeEnv };
    Bun?: { env: RuntimeEnv };
  };

  return runtime.process?.env
    ?? runtime.Bun?.env
    ?? (import.meta as ImportMeta & { env?: RuntimeEnv }).env
    ?? {};
}

export function requiredEnv(...names: string[]): string {
  const env = getRuntimeEnv();
  for (const name of names) {
    if (env[name]) return env[name];
  }
  throw new Error(`Missing required environment variable: ${names.join(" or ")}`);
}

export function getAlgoliaEnv() {
  return {
    appId: requiredEnv("ALGOLIA_APP_ID", "VITE_ALGOLIA_APP_ID"),
    apiKey: requiredEnv("ALGOLIA_SEARCH_KEY", "VITE_ALGOLIA_SEARCH_KEY"),
    indexName: requiredEnv("ALGOLIA_INDEX", "VITE_ALGOLIA_INDEX"),
  };
}
