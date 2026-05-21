import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

const routes = new Hono<{ Bindings: { DASH_URL?: string } }>()
	.use(
		cors({
			origin: (origin, c) => {
				const dashUrl = c.env?.DASH_URL;
				const allowed = dashUrl
					? [dashUrl, "http://localhost:3000"]
					: ["http://localhost:3000"];
				return allowed.includes(origin) ? origin : allowed[0];
			},
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["GET", "OPTIONS"],
			credentials: true,
		}),
	)
	.get("/health", (c) => c.json({ status: "ok" }))
	.get(
		"/message",
		zValidator(
			"query",
			z.object({
				name: z.string().optional(),
			}),
		),
		(c) => {
			const { name } = c.req.valid("query");
			return c.json({ message: `Hello ${name ?? "Hono"}!` });
		},
	);

export default routes;
export type AppType = typeof routes;
