import { Hono } from "hono";
import type { Env } from "../env";
import { ContactFormMailer, type ContactFormPayload } from "../mailers/contact-form-mailer";
import { ValidationError } from "../mailers/validation-error";
import { resolveTransport } from "../providers/resolve-transport";

const route = new Hono<{ Bindings: Env }>();
const mailer = new ContactFormMailer();

route.post("/", async c => {
    const form = await c.req.json<ContactFormPayload>().catch(() => null);
    if (!form) {
        return c.json({ error: "Invalid JSON" }, 400);
    }

    try {
        const receipt = await mailer.process(form, c.env, resolveTransport(c.env));
        if (!receipt.successful) {
            console.log(receipt.errorMessages);
            return c.json({ error: "Failed to send email" }, 502);
        }
        return c.json({ success: true });
    } catch (err) {
        if (err instanceof ValidationError) {
            return c.json({ error: err.message }, 400);
        }
        console.log(err);
        return c.json({ error: "Failed to send email" }, 500);
    }
});

export default route;
