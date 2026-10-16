import type { Message, Receipt } from "@upyo/core";
import { describe, expect, it, vi } from "vitest";
import type { Env } from "../env";
import { Mailer } from "./mailer";

const FAKE_ENV = { EMAIL_PROVIDER: "test", FROM_ADDRESS: "from@test.com", TO_ADDRESS: "to@test.com" } satisfies Env;
const FAKE_MESSAGE = { fake: "message" } as unknown as Message;

class RecordingMailer extends Mailer {
    calls: string[] = [];

    validate(payload: unknown, env: Env): void {
        this.calls.push("validate");
    }

    buildMessage(payload: unknown, env: Env): Message {
        this.calls.push("buildMessage");
        return FAKE_MESSAGE;
    }
}

function fakeTransport(receipt: Receipt = { successful: true, messageId: "fake-id" } as Receipt) {
    return { send: vi.fn(async () => receipt) };
}

describe("Mailer#process", () => {
    it("calls validate() then buildMessage() then transport.send(), in order", async () => {
        const mailer = new RecordingMailer();
        const transport = fakeTransport();

        const receipt = await mailer.process({}, FAKE_ENV, transport);

        expect(mailer.calls).toEqual(["validate", "buildMessage"]);
        expect(transport.send).toHaveBeenCalledWith(FAKE_MESSAGE);
        expect(receipt).toEqual({ successful: true, messageId: "fake-id" });
    });

    it('skips validate() when env.DISABLE_VALIDATION is "true"', async () => {
        class ThrowingMailer extends Mailer {
            validate(): void {
                throw new Error("should not be called");
            }

            buildMessage(): Message {
                return FAKE_MESSAGE;
            }
        }
        const mailer = new ThrowingMailer();
        const transport = fakeTransport();

        await expect(mailer.process({}, { ...FAKE_ENV, DISABLE_VALIDATION: "true" }, transport)).resolves.toBeDefined();
        expect(transport.send).toHaveBeenCalled();
    });

    it("base Mailer#buildMessage throws when not overridden", () => {
        const mailer = new Mailer();
        expect(() => mailer.buildMessage({}, FAKE_ENV)).toThrow(/must implement buildMessage/);
    });
});
