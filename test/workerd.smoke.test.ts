import { exports } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

// `Cloudflare.Exports` (the type of `exports`) only resolves to something
// concrete if `Cloudflare.GlobalProps.mainModule` is declared -- not worth
// wiring up for one test, so the shape we actually use is asserted directly.
const worker = exports.default as { fetch: (request: Request) => Promise<Response> };

// Runs inside the real Workers runtime (workerd), not Node — proves the
// Worker boots and responds correctly under the real runtime. Every branch
// of validate()/provider-selection/routing is already covered by the Node
// test suite, so this only checks the happy path.
//
// Tests execute in the same isolate as the Worker under test, so the
// Mailgun call (a plain `fetch()` inside @upyo/mailgun) can be stubbed the
// same way as in Node: by replacing `globalThis.fetch`.
describe("worker (workerd runtime)", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("boots inside workerd and sends a contact-form email end-to-end", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () =>
                new Response(JSON.stringify({ id: "<fake@test.sykez.com>", message: "Queued. Thank you." }), {
                    status: 200
                })
            )
        );

        const request = new Request("https://worker.example.com/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Sykez", email: "hello@sykez.com", message: "Ko k?" })
        });

        const response = await worker.fetch(request);

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ success: true });
        expect(fetch).toHaveBeenCalledOnce();
    });
});
