import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Vitest's config loader runs in a context that doesn't reliably inherit
// Bun's own .env auto-load (it only lands in the top-level bun process), so
// .env is parsed here directly. Real process.env values (e.g. from CI
// secrets) still take precedence over .env.
const ENV_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");

try {
    const contents = readFileSync(ENV_PATH, "utf8");
    for (const line of contents.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^(["'])(.*)\1$/, "$2");
    }
} catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

// Shared test env, sourced from process.env. Fail fast with a clear message
// rather than letting a missing var surface later as a cryptic
// "No email provider is configured".
const REQUIRED_KEYS = ["EMAIL_PROVIDER", "MAILGUN_API_KEY", "MAILGUN_DOMAIN", "FROM_ADDRESS", "TO_ADDRESS"] as const;

export const TEST_ENV = Object.fromEntries(REQUIRED_KEYS.map(key => [key, process.env[key]])) as Record<
    (typeof REQUIRED_KEYS)[number],
    string
>;

const missing = REQUIRED_KEYS.filter(key => !TEST_ENV[key]);
if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")} in the environment — set them in .env before running tests`);
}
