import type { Env } from "./types";
import { matchRoute, parseRoutes, stripPath } from "./router";

function withSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("X-Frame-Options", "DENY");
	headers.set("X-XSS-Protection", "1; mode=block");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export default {
	async fetch(
		req: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(req.url);
		const startTime = Date.now();

		try {
			const routes = parseRoutes(env);
			const match = matchRoute(url.pathname, routes);

			let response: Response;

			if (match) {
				const { route, prefix } = match;
				const stripped = stripPath(req, prefix);
				response = await env[route.binding].fetch(stripped);
			} else {
				// Fallback to Landing
				response = await env.LANDING.fetch(req);
			}

			const duration = Date.now() - startTime;
			console.log(
				JSON.stringify({
					level: "info",
					method: req.method,
					path: url.pathname,
					status: response.status,
					duration_ms: duration,
					timestamp: new Date().toISOString(),
				}),
			);

			return withSecurityHeaders(response);
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			console.error(
				JSON.stringify({
					level: "error",
					message: error.message,
					path: url.pathname,
					timestamp: new Date().toISOString(),
				}),
			);

			return new Response(JSON.stringify({ error: "Gateway Error" }), {
				status: 502,
				headers: {
					"Content-Type": "application/json",
					"X-Content-Type-Options": "nosniff",
				},
			});
		}
	},
};
