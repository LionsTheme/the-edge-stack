import type { BindingKey, Env, RouteConfig } from "./types";

const BINDING_KEYS = new Set<BindingKey>([
	"API",
	"DASH",
	"BLOG",
	"LANDING",
	"DOCS",
]);

/**
 * Parses the ROUTES env var (JSON string) into an array of RouteConfig,
 * sorted by path specificity (longer paths first, then static > dynamic).
 */
export function parseRoutes(env: Env): RouteConfig[] {
	try {
		const raw: { routes: RouteConfig[] } = JSON.parse(env.ROUTES);
		const routes = raw.routes.filter(
			(r) => BINDING_KEYS.has(r.binding) && r.path.length > 0,
		);
		return routes.sort(compareRoutes);
	} catch (err) {
		console.error(
			JSON.stringify({
				level: "error",
				message: "Failed to parse ROUTES env var",
				error: err instanceof Error ? err.message : String(err),
				timestamp: new Date().toISOString(),
			}),
		);
		return [];
	}
}

/**
 * Sorts routes: longer specific paths first, then wildcards.
 */
function compareRoutes(a: RouteConfig, b: RouteConfig): number {
	const aLen = a.path.replace(/:\w+\*?$/, "").length;
	const bLen = b.path.replace(/:\w+\*?$/, "").length;
	if (bLen !== aLen) return bLen - aLen;

	// Static paths before dynamic ones
	const aDynamic = a.path.includes(":");
	const bDynamic = b.path.includes(":");
	if (aDynamic !== bDynamic) return aDynamic ? 1 : -1;

	return 0;
}

/**
 * Matches a pathname against a route pattern.
 * Supports static paths, :param, and :path* wildcards.
 * Returns the matched prefix or null.
 */
function matchPattern(pathname: string, pattern: string): string | null {
	const parts = pattern.split("/");
	const pathParts = pathname.split("/");

	// Wildcard match (e.g., "/docs/:path*")
	if (pattern.endsWith(":path*")) {
		const prefix = pattern.slice(0, -":path*".length).replace(/\/$/, "");
		if (
			pathname === prefix ||
			pathname.startsWith(`${prefix}/`) ||
			(pathname === "/" && prefix === "")
		) {
			return prefix || "/";
		}
		return null;
	}

	// Exact match or prefix match with param support
	for (let i = 0; i < parts.length; i++) {
		if (i >= pathParts.length) return null;

		const part = parts[i];
		const pathPart = pathParts[i];

		if (part.startsWith(":")) continue; // Dynamic param matches anything
		if (part !== pathPart) return null;
	}

	// All pattern parts matched
	return `/${parts.slice(1).join("/")}`;
}

/**
 * Finds the best matching route for a given pathname.
 * Returns the matched route and the prefix that should be stripped.
 */
export function matchRoute(
	pathname: string,
	routes: RouteConfig[],
): { route: RouteConfig; prefix: string } | null {
	for (const route of routes) {
		const prefix = matchPattern(pathname, route.path);
		if (prefix !== null) {
			return { route, prefix };
		}
	}
	return null;
}

/**
 * Strips the mount prefix from the request URL so the target Worker
 * receives the request as if it were at its own root.
 * /docs/instalacion → /instalacion
 */
export function stripPath(request: Request, prefix: string): Request {
	const url = new URL(request.url);

	if (prefix === "/") return request;

	url.pathname = url.pathname.slice(prefix.length) || "/";

	return new Request(url, request);
}
