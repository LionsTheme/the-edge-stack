import {
	injectOptimizations,
	parseAssetPrefixes,
	rewriteHeaders,
	rewriteResponse,
} from "./rewriter";
import { matchRoute, parseRoutes, stripPath } from "./router";
import type { Env } from "./types";

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
			const assetPrefixes = parseAssetPrefixes(env.ASSET_PREFIXES);

			let response: Response;
			let prefix = "/";

			if (match) {
				const { route, prefix: matchedPrefix } = match;
				prefix = matchedPrefix;

				// Validate the service binding exists before calling .fetch()
				const fetcher = env[route.binding];
				if (!fetcher || typeof fetcher.fetch !== "function") {
					console.error(
						JSON.stringify({
							level: "error",
							message: `Service binding not found: ${route.binding}`,
							path: url.pathname,
							timestamp: new Date().toISOString(),
						}),
					);
					return new Response(
						JSON.stringify({ error: "Service unavailable" }),
						{
							status: 503,
							headers: {
								"Content-Type": "application/json",
								"X-Content-Type-Options": "nosniff",
							},
						},
					);
				}

				const stripped = stripPath(req, prefix);
				response = await fetcher.fetch(stripped);

				// Rewrite asset paths if the response is successful
				if (response.ok) {
					response = rewriteResponse(response, prefix, assetPrefixes);
				} else {
					console.log(
						JSON.stringify({
							level: "warn",
							message: `Upstream returned ${response.status}`,
							binding: route.binding,
							path: url.pathname,
							timestamp: new Date().toISOString(),
						}),
					);
				}
			} else {
				response = await env.LANDING.fetch(req);
			}

			// Rewrite headers (Location, Set-Cookie) for microfrontend mounting
			if (prefix !== "/") {
				response = rewriteHeaders(response, prefix);
			}

			// Inject View Transitions CSS and/or Speculation Rules for other microfrontends
			// Only applied when there is a route match (not on Landing fallback)
			if (match) {
				const enableViewTransitions = env.ENABLE_VIEW_TRANSITIONS !== "false";
				response = injectOptimizations(
					response,
					routes,
					url.pathname,
					enableViewTransitions,
				);
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
