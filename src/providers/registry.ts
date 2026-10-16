import type { Transport } from "@upyo/core";
import { MailgunTransport } from "@upyo/mailgun";
import type { Env } from "../env";

// Each factory returns a configured Transport, or null if its env vars aren't set.
export const PROVIDER_FACTORIES: Record<string, (env: Env) => Transport | null> = {
    mailgun: env =>
        env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN
            ? new MailgunTransport({
                  apiKey: env.MAILGUN_API_KEY,
                  domain: env.MAILGUN_DOMAIN,
                  region: env.MAILGUN_REGION || "us"
              })
            : null
};
