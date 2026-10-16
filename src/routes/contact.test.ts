import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { TEST_ENV } from "../../test/env";
import { mailgunErrorHandler, mailgunRequests, resetMailgunRequests, server } from "../../test/msw/handlers";
import type { Env } from "../env";
import app from "../index";

const VALID_PAYLOAD = { name: "Sykez", email: "hello@sykez.com", message: "Ko k?" };

function post(body: Record<string, unknown>, env: Env = TEST_ENV) {
    return app.request(
        "/contact",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
        env
    );
}

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
    server.resetHandlers();
    resetMailgunRequests();
});
afterAll(() => server.close());

describe("POST /contact", () => {
    it("sends the email and returns 200 on a valid payload", async () => {
        const res = await post(VALID_PAYLOAD);

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ success: true });
        expect(mailgunRequests).toHaveLength(1);
    });

    it("returns 502 when Mailgun rejects the send", async () => {
        server.use(mailgunErrorHandler);

        const res = await post(VALID_PAYLOAD);

        expect(res.status).toBe(502);
        await expect(res.json()).resolves.toEqual({ error: "Failed to send email" });
    });

    it("returns 400 and never calls Mailgun when a required field is missing", async () => {
        const res = await post({ name: "Sykez", message: "Ko k?" });

        expect(res.status).toBe(400);
        expect(mailgunRequests).toHaveLength(0);
    });

    it("returns 400 and never calls Mailgun when the honeypot is filled", async () => {
        const res = await post({ ...VALID_PAYLOAD, website: "https://bot.sykez.com" });

        expect(res.status).toBe(400);
        expect(mailgunRequests).toHaveLength(0);
    });

    it("returns 400 on invalid JSON", async () => {
        const res = await app.request(
            "/contact",
            { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" },
            TEST_ENV
        );

        expect(res.status).toBe(400);
    });

    it("skips validation and reaches Mailgun when DISABLE_VALIDATION is \"true\"", async () => {
        // Honeypot filled would normally be rejected (see the 400 test above);
        // with validation disabled it should sail through to Mailgun instead.
        const res = await post({ ...VALID_PAYLOAD, website: "https://bot.sykez.com" }, { ...TEST_ENV, DISABLE_VALIDATION: "true" });

        expect(mailgunRequests).toHaveLength(1);
        expect(res.status).toBe(200);
    });

    it("returns Hono's default 404 for other methods", async () => {
        const res = await app.request("/contact", { method: "GET" }, TEST_ENV);

        expect(res.status).toBe(404);
    });
});
