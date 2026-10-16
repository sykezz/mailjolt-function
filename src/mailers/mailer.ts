import type { Message, Receipt, Transport } from "@upyo/core";
import type { Env } from "../env";

// Generic base class for "validate a payload, compose an email, send it".
// No knowledge of forms, HTTP, or any particular provider — ContactFormMailer
// is one concrete use case.
export class Mailer<TPayload = unknown> {
    validate(payload: TPayload, env: Env): void {
        // No-op by default. Subclasses override to reject bad/spammy payloads.
    }

    buildMessage(payload: TPayload, env: Env): Message {
        throw new Error(`${this.constructor.name} must implement buildMessage()`);
    }

    async process(payload: TPayload, env: Env, transport: Pick<Transport, "send">): Promise<Receipt> {
        if (env.DISABLE_VALIDATION !== "true") {
            this.validate(payload, env);
        }
        const message = this.buildMessage(payload, env);
        return transport.send(message);
    }
}
