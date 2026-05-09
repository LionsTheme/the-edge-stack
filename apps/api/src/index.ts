import { createAuth } from "./lib/auth";
import type { SessionUser, SessionData } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import routes from "./routes";

// Extracted to avoid duplicating 6 env var accesses across middleware handlers.
function authEnv(c: { env: CloudflareBindings }) {
	return {
		DATABASE_URL: c.env.DATABASE_URL,
		BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
		DASHBOARD_URL: c.env.DASHBOARD_URL,
		GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
	};
}

const app = new Hono<{
	Bindings: CloudflareBindings;
	Variables: {
		user: SessionUser | null;
		session: SessionData | null;
	};
}>();

// CORS origin list — update with your frontend URL(s) for production.
const allowedOrigins = ["http://localhost:3000"];

app.use(
	"/api/auth/*",
	cors({
		origin: (origin) =>
			allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

// Per-request auth creation required for Workers I/O isolation.
// https://opennext.js.org/cloudflare/troubleshooting#error-cannot-perform-io-on-behalf-of-a-different-request
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return createAuth(authEnv(c)).handler(c.req.raw);
});

app.use("*", async (c, next) => {
	const auth = createAuth(authEnv(c));

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (session) {
		c.set("user", session.user);
		c.set("session", session.session);
	}

	await next();
});

app.route("/", routes);

export default app;
