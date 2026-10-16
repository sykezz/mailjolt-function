import { createMessage } from "@upyo/core";
import type { Env } from "../env";
import { Mailer } from "./mailer";
import { ValidationError } from "./validation-error";

// Payload is untrusted JSON from the request body, so every field is optional
// here -- validate() is what guarantees the required ones are present before
// buildMessage() trusts them.
export interface ContactFormPayload {
    name?: string;
    email?: string;
    message?: string;
    website?: string;
    [key: string]: unknown;
}

const REQUIRED_FIELDS = ["name", "email", "message"] as const;
// Fake "your website" field — hidden via CSS on the real form, so only bots fill it in.
const HONEYPOT_FIELD = "website";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ContactFormMailer extends Mailer<ContactFormPayload> {
    validate(form: ContactFormPayload): void {
        if (form[HONEYPOT_FIELD]) {
            throw new ValidationError("Invalid submission");
        }

        for (const field of REQUIRED_FIELDS) {
            if (!form[field] || typeof form[field] !== "string") {
                throw new ValidationError(`${field} is required`);
            }
        }

        if (!EMAIL_PATTERN.test(form.email as string)) {
            throw new ValidationError("Invalid email address");
        }

        if (/[\r\n]/.test(form.name as string) || /[\r\n]/.test(form.email as string)) {
            throw new ValidationError("Invalid submission");
        }
    }

    buildMessage(form: ContactFormPayload, env: Env) {
        return createMessage({
            from: env.FROM_ADDRESS,
            to: env.TO_ADDRESS,
            replyTo: form.email as string,
            subject: `New contact form message from ${form.name}`,
            content: {
                html: `
                    <p><strong>Name:</strong> ${form.name}</p>
                    <p><strong>Email:</strong> ${form.email}</p>
                    <p><strong>Message:</strong></p>
                    <p>${(form.message as string).replace(/\r\n|\r|\n/g, "<br>")}</p>
                `
            }
        });
    }
}
