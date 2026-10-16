import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from "msw";
import { setupServer } from "msw/node";
import mailgunError from "../fixtures/mailgun-error.json";
import mailgunSuccess from "../fixtures/mailgun-success.json";

// Fixture shapes match Mailgun's documented messages-endpoint responses
// (https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Messages/)
// — refresh the JSON files by hand if that response shape ever changes.
const MAILGUN_URL = "https://api.mailgun.net/v3/:domain/messages";

export const mailgunRequests: StrictRequest<DefaultBodyType>[] = [];

export function resetMailgunRequests(): void {
    mailgunRequests.length = 0;
}

export const mailgunSuccessHandler = http.post(MAILGUN_URL, ({ request }) => {
    mailgunRequests.push(request);
    return HttpResponse.json(mailgunSuccess, { status: 200 });
});

export const mailgunErrorHandler = http.post(MAILGUN_URL, ({ request }) => {
    mailgunRequests.push(request);
    return HttpResponse.json(mailgunError, { status: 401 });
});

export const server = setupServer(mailgunSuccessHandler);
