import type { Transport } from "@upyo/core";
import { PoolTransport } from "@upyo/pool";
import type { Env } from "../env";
import { PROVIDER_FACTORIES } from "./registry";

function createTransport(name: string, env: Env): Transport {
    const factory = PROVIDER_FACTORIES[name];
    if (!factory) {
        throw new Error(`Unknown email provider: ${name}`);
    }
    const transport = factory(env);
    if (!transport) {
        throw new Error(`Email provider "${name}" is not configured`);
    }
    return transport;
}

// EMAIL_PROVIDER picks the primary ESP by name. EMAIL_PROVIDER_FALLBACK is
// optional -- if set, the two are combined into a priority-ordered pool so
// the fallback is only used when the primary fails.
export function resolveTransport(env: Env): Transport {
    if (!env.EMAIL_PROVIDER) {
        throw new Error("EMAIL_PROVIDER is not configured");
    }

    const primary = createTransport(env.EMAIL_PROVIDER, env);
    if (!env.EMAIL_PROVIDER_FALLBACK) {
        return primary;
    }

    const fallback = createTransport(env.EMAIL_PROVIDER_FALLBACK, env);
    return new PoolTransport({
        strategy: "priority",
        transports: [
            { transport: primary, priority: 1 },
            { transport: fallback, priority: 0 }
        ]
    });
}
