import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";
// This file is loaded by Vite's native config loader, which (unlike the
// regular transform pipeline every other file in this project goes through)
// requires an explicit extension on relative imports.
import { TEST_ENV } from "./test/env.js";

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: "unit",
                    environment: "node",
                    include: ["src/**/*.test.ts"]
                }
            },
            {
                plugins: [
                    cloudflareTest({
                        wrangler: { configPath: "./wrangler.jsonc" },
                        miniflare: {
                            bindings: TEST_ENV
                        }
                    })
                ],
                test: {
                    name: "workerd",
                    include: ["test/workerd.smoke.test.ts"],
                    // Vitest 5's fsModuleCache races with this (prerelease) plugin's
                    // Node<->workerd module loading: "no such file or directory,
                    // readAll .../node_modules/.vitest-cache/<hash>". Disable it here only.
                    fsModuleCache: false
                }
            }
        ]
    }
});
