import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const routes = new Hono()
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
