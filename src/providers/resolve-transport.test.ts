import { PoolTransport } from "@upyo/pool";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TEST_ENV } from "../../test/env";
import type { Env } from "../env";

describe("resolveTransport", () => {
    afterEach(() => {
        vi.resetModules();
        vi.doUnmock("./registry");
    });

    it("throws when EMAIL_PROVIDER is not configured", async () => {
        const { resolveTransport } = await import("./resolve-transport");
        expect(() => resolveTransport({} as Env)).toThrow("EMAIL_PROVIDER is not configured");
    });

    it("throws when EMAIL_PROVIDER names a provider that doesn't exist", async () => {
        const { resolveTransport } = await import("./resolve-transport");
        expect(() => resolveTransport({ EMAIL_PROVIDER: "not-a-real-provider" } as Env)).toThrow(
            "Unknown email provider: not-a-real-provider"
        );
    });

    it("throws when EMAIL_PROVIDER names a provider missing its required env vars", async () => {
        const { resolveTransport } = await import("./resolve-transport");
        expect(() => resolveTransport({ EMAIL_PROVIDER: "mailgun" } as Env)).toThrow(
            'Email provider "mailgun" is not configured'
        );
    });

    it("returns the primary transport directly when no fallback is configured", async () => {
        const { resolveTransport } = await import("./resolve-transport");
        const transport = resolveTransport(TEST_ENV);
        expect(transport).not.toBeInstanceOf(PoolTransport);
        expect(transport.constructor.name).toBe("MailgunTransport");
    });

    it("combines primary and fallback into a priority-ordered PoolTransport", async () => {
        vi.doMock("./registry", () => ({
            PROVIDER_FACTORIES: {
                first: () => ({ id: "first", send: vi.fn() }),
                second: () => ({ id: "second", send: vi.fn() })
            }
        }));
        vi.resetModules();

        const { resolveTransport } = await import("./resolve-transport");
        const transport = resolveTransport({ EMAIL_PROVIDER: "first", EMAIL_PROVIDER_FALLBACK: "second" } as Env);

        expect(transport).toBeInstanceOf(PoolTransport);
    });

    it("throws when EMAIL_PROVIDER_FALLBACK names a provider that doesn't exist", async () => {
        const { resolveTransport } = await import("./resolve-transport");
        expect(() => resolveTransport({ ...TEST_ENV, EMAIL_PROVIDER_FALLBACK: "not-a-real-provider" })).toThrow(
            "Unknown email provider: not-a-real-provider"
        );
    });
});
