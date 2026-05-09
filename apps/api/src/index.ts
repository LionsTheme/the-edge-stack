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
		origin: (origin) => {
			const allowed = ["http://localhost:3000"];
			return allowed.includes(origin) ? origin : allowed[0];
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
	const auth = createAuth({
		DATABASE_URL: c.env.DATABASE_URL,
		AUTH_SECRET: c.env.AUTH_SECRET,
		APP_URL: c.env.APP_URL,
		DASHBOARD_URL: c.env.DASHBOARD_URL,
		GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
	});
	return auth.handler(c.req.raw);
});

app.use("*", async (c, next) => {
	const auth = createAuth({
		DATABASE_URL: c.env.DATABASE_URL,
		AUTH_SECRET: c.env.AUTH_SECRET,
		APP_URL: c.env.APP_URL,
		DASHBOARD_URL: c.env.DASHBOARD_URL,
		GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
	});

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
