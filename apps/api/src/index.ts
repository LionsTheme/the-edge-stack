import { createAuth } from "./lib/auth";
import type { SessionUser, SessionData } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import routes from "./routes";

const app = new Hono<{
	Bindings: CloudflareBindings;
	Variables: {
		user: SessionUser | null;
		session: SessionData | null;
	};
}>();

app.use(
	"/api/auth/*",
	cors({
		origin: (origin, c) => {
			const dashUrl = c.env?.DASH_URL;
			const allowedOrigins = dashUrl
				? [dashUrl, "http://localhost:3000"]
				: ["http://localhost:3000"];
			return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
		},
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
	return createAuth().handler(c.req.raw);
});

app.use("*", async (c, next) => {
	const auth = createAuth();

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
