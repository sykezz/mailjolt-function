export interface Env {
    EMAIL_PROVIDER: string;
    EMAIL_PROVIDER_FALLBACK?: string;
    MAILGUN_API_KEY?: string;
    MAILGUN_DOMAIN?: string;
    MAILGUN_REGION?: "us" | "eu";
    FROM_ADDRESS: string;
    TO_ADDRESS: string;
    DISABLE_VALIDATION?: string;
}
