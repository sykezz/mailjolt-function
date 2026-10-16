import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import contactRoute from "./routes/contact";

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());
app.route("/contact", contactRoute);

export default app;
