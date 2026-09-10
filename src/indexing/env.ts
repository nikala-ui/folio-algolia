import type { AlgoliaIndexerOptions } from "./types.js";

type RuntimeEnv = Record<string, string | undefined>;

function getRuntimeEnv(): RuntimeEnv {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: RuntimeEnv };
    Bun?: { env: RuntimeEnv };
  };

  return runtime.process?.env ?? runtime.Bun?.env ?? {};
}

function requiredIndexerEnv(name: string, env: RuntimeEnv): string {
  const value = env[name];
  if (value) return value;
  throw new Error(`Missing required indexing environment variable: ${name}`);
}

export function getAlgoliaIndexerOptions(
  env: RuntimeEnv = getRuntimeEnv(),
): Pick<AlgoliaIndexerOptions, "appId" | "adminApiKey" | "indexName"> {
  return {
    appId: requiredIndexerEnv("ALGOLIA_APP_ID", env),
    adminApiKey: requiredIndexerEnv("ALGOLIA_ADMIN_API_KEY", env),
    indexName: requiredIndexerEnv("ALGOLIA_INDEX", env),
  };
}
