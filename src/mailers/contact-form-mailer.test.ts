import { describe, expect, it } from "vitest";
import { TEST_ENV } from "../../test/env";
import { ContactFormMailer, type ContactFormPayload } from "./contact-form-mailer";
import { ValidationError } from "./validation-error";

const VALID_FORM: ContactFormPayload = { name: "Sykez", email: "hello@sykez.com", message: "Ko k?" };

describe("ContactFormMailer#validate", () => {
    const mailer = new ContactFormMailer();

    it.each(["name", "email", "message"])("throws when %s is missing", field => {
        const form = { ...VALID_FORM, [field]: undefined };
        expect(() => mailer.validate(form)).toThrow(ValidationError);
    });

    it("throws on a malformed email", () => {
        const form = { ...VALID_FORM, email: "not-an-email" };
        expect(() => mailer.validate(form)).toThrow(ValidationError);
    });

    it("throws when the honeypot field is filled", () => {
        const form = { ...VALID_FORM, website: "https://bot.example.com" };
        expect(() => mailer.validate(form)).toThrow(ValidationError);
    });

    it.each(["name", "email"])("throws when %s contains a newline (header injection guard)", field => {
        const form = { ...VALID_FORM, [field]: `${VALID_FORM[field]}\r\nBcc: victim@example.com` };
        expect(() => mailer.validate(form)).toThrow(ValidationError);
    });

    it("passes for a well-formed submission", () => {
        expect(() => mailer.validate(VALID_FORM)).not.toThrow();
    });
});

describe("ContactFormMailer#buildMessage", () => {
    const mailer = new ContactFormMailer();

    it("builds a message addressed from/to the configured env addresses, replying to the submitter", () => {
        const message = mailer.buildMessage(VALID_FORM, TEST_ENV);
        if (!("html" in message.content)) throw new Error("expected HTML content");

        expect(message.sender.address).toBe(TEST_ENV.FROM_ADDRESS);
        expect(message.recipients.map(r => r.address)).toEqual([TEST_ENV.TO_ADDRESS]);
        expect(message.replyRecipients.map(r => r.address)).toEqual([VALID_FORM.email]);
        expect(message.subject).toContain(VALID_FORM.name);
        expect(message.content.html).toContain(VALID_FORM.name);
        expect(message.content.html).toContain(VALID_FORM.email);
        expect(message.content.html).toContain(VALID_FORM.message);
    });
});
