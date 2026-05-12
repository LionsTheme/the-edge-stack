// ---------------------------------------------------------------------------
// Microfrontend Gateway — based on the official Cloudflare
// "Vertical Microfrontend" template:
// https://github.com/cloudflare/templates/tree/main/microfrontend-template
//
// Routes requests to separate Worker services based on path patterns, with
// automatic URL rewriting so every microfrontend appears as part of a single
// unified application.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Environment (bindings + vars defined in wrangler.jsonc)
// ---------------------------------------------------------------------------

interface Env {
	API: Fetcher;
	DASH: Fetcher;
	BLOG: Fetcher;
	LANDING: Fetcher;
	DOCS: Fetcher;
	ROUTES: string;
	ASSET_PREFIXES?: string;
	ENABLE_VIEW_TRANSITIONS?: string;
}

// ---------------------------------------------------------------------------
// Default asset path prefixes that trigger URL-rewriting in HTML / CSS
// ---------------------------------------------------------------------------

const DEFAULT_ASSET_PREFIXES = [
	"/assets/",
	"/static/",
	"/build/",
	"/_astro/",
	"/_vite/",
	"/@vite/",
	"/@id/",
	"/@fs/",
	"/@react-refresh",
	"/@tanstack-start/",
	"/src/",
	"/node_modules/",
	"/fonts/",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensures a path starts with "/" and does NOT end with "/" (unless root). */
function normalizePath(p: string): string {
	let s = p.trim();
	if (!s.startsWith("/")) s = "/" + s;
	if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
	return s || "/";
}

/** Escape special regex characters inside a literal string. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Asset prefixes — defaults merged with ASSET_PREFIXES env var (JSON array)
// ---------------------------------------------------------------------------

function buildAssetPrefixes(envObj: Env): string[] {
	const defaults = [...DEFAULT_ASSET_PREFIXES];

	const raw = envObj.ASSET_PREFIXES;
	if (typeof raw !== "string") return defaults;

	try {
		const custom: unknown = JSON.parse(raw);
		if (!Array.isArray(custom)) return defaults;
		const normalized = custom
			.filter((p): p is string => typeof p === "string" && (p as string).trim() !== "")
			.map((p) => {
				let s = (p as string).trim();
				if (!s.startsWith("/")) s = "/" + s;
				if (!s.endsWith("/")) s = s + "/";
				return s;
			});
		return [...new Set([...defaults, ...normalized])];
	} catch {
		console.warn("Failed to parse ASSET_PREFIXES — using defaults only.");
		return defaults;
	}
}

// ---------------------------------------------------------------------------
// Route types & compilation
// ---------------------------------------------------------------------------

interface RouteConfig {
	binding: string;
	path: string;
	preload?: boolean;
}

interface RoutesConfig {
	smoothTransitions?: boolean;
	routes: RouteConfig[];
}

interface CompiledRoute {
	expr: string;
	binding: Fetcher;
	preload?: boolean;
	re: RegExp; // matches pathname; capture group 1 = mount prefix
	isStaticMount: boolean;
	staticMount: string | null;
	baseSpecificity: number;
}

/**
 * Compile a Cloudflare path expression into a regex.
 *
 *   /docs              →   ^(/docs)(?:/.*)?$
 *   /docs/:path*       →   ^(/docs)(?:/.*)?$
 *   /:tenant/app       →   ^(/[^/]+/app)(?:/.*)?$
 */
function compilePathExpr(expr: string): {
	re: RegExp;
	isStaticMount: boolean;
	staticMount: string | null;
} {
	if (expr.endsWith(":path*")) {
		const prefix = expr.slice(0, -":path*".length).replace(/\/$/, "") || "/";
		const pattern = `^(${escapeRegex(prefix)})(?:/.*)?$`;
		return {
			re: new RegExp(pattern),
			isStaticMount: !prefix.includes(":"),
			staticMount: prefix.includes(":") ? null : prefix,
		};
	}

	const segments = expr.split("/");
	const mountSegments: string[] = [];
	let hasParam = false;
	for (const seg of segments) {
		if (seg.startsWith(":")) {
			hasParam = true;
			continue;
		}
		if (hasParam) break;
		mountSegments.push(seg);
	}
	const mount = mountSegments.join("/") || "/";
	const pattern = `^(${escapeRegex(mount)})(?:/.*)?$`;
	return {
		re: new RegExp(pattern),
		isStaticMount: !hasParam,
		staticMount: hasParam ? null : mount || "/",
	};
}

function computeBaseSpecificity(expr: string): number {
	return expr.replace(/:\w+\*?/g, "").length;
}

function buildRoutes(envObj: Env): {
	routes: CompiledRoute[];
	smoothTransitions?: boolean;
} {
	const raw = envObj.ROUTES;
	if (typeof raw !== "string") {
		throw new Error("ROUTES environment variable is required.");
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (e) {
		throw new Error(
			`Failed to parse ROUTES: ${e instanceof Error ? e.message : String(e)}`,
		);
	}

	const smoothTransitions: boolean | undefined =
		parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? (parsed as RoutesConfig).smoothTransitions
			: undefined;

	const routeDefs: RouteConfig[] = Array.isArray(parsed)
		? parsed
		: Array.isArray((parsed as RoutesConfig)?.routes)
			? (parsed as RoutesConfig).routes
			: [];

	if (!routeDefs.length) {
		throw new Error("ROUTES must contain at least one route definition.");
	}

	const compiled: CompiledRoute[] = [];

	for (const r of routeDefs) {
		if (!r.binding || !r.path) {
			throw new Error(`Invalid route config: ${JSON.stringify(r)}`);
		}

		const fetcher = (envObj as unknown as Record<string, unknown>)[r.binding];
		if (!fetcher || typeof (fetcher as Fetcher).fetch !== "function") {
			throw new Error(
				`Binding "${r.binding}" not found or is not a valid service binding.`,
			);
		}

		const expr = normalizePath(r.path);
		const { re, isStaticMount, staticMount } = compilePathExpr(expr);

		compiled.push({
			expr,
			binding: fetcher as Fetcher,
			preload: r.preload,
			re,
			isStaticMount,
			staticMount:
				staticMount === "/"
					? "/"
					: staticMount
						? normalizePath(staticMount)
						: null,
			baseSpecificity: computeBaseSpecificity(expr),
		});
	}

	compiled.sort((a, b) => {
		if (b.baseSpecificity !== a.baseSpecificity)
			return b.baseSpecificity - a.baseSpecificity;
		return b.expr.length - a.expr.length;
	});

	return { routes: compiled, smoothTransitions };
}

// ---------------------------------------------------------------------------
// HTML attribute rewriting
// ---------------------------------------------------------------------------

function shouldRewrite(url: string, prefixes: string[]): boolean {
	if (
		url.startsWith("http://") ||
		url.startsWith("https://") ||
		url.startsWith("//")
	) {
		return false;
	}
	for (const p of prefixes) {
		if (url.startsWith(p)) return true;
	}
	return false;
}

function rewriteUrl(url: string, mount: string): string {
	const cleanMount = mount === "/" ? "" : mount;
	return `${cleanMount}${url}`;
}

function rewriteSrcset(
	srcset: string,
	mount: string,
	prefixes: string[],
): string {
	return srcset
		.split(",")
		.map((part) => {
			const trimmed = part.trim();
			if (!trimmed) return trimmed;
			const spaceIdx = trimmed.search(/\s/);
			let url: string;
			let descriptor = "";
			if (spaceIdx !== -1) {
				url = trimmed.slice(0, spaceIdx);
				descriptor = trimmed.slice(spaceIdx);
			} else {
				url = trimmed;
			}
			if (shouldRewrite(url, prefixes)) {
				url = rewriteUrl(url, mount);
			}
			return `${url}${descriptor}`;
		})
		.join(", ");
}

class AllAttributesRewriter {
	private mount: string;
	private prefixes: string[];

	constructor(mount: string, prefixes: string[]) {
		this.mount = mount;
		this.prefixes = prefixes;
	}

	element(el: Element) {
		const pending: Array<{ name: string; value: string }> = [];

		for (const [name, value] of el.attributes) {
			if (!value) continue;

			if (
				name === "href" ||
				name === "src" ||
				name === "action" ||
				name === "poster" ||
				name === "data"
			) {
				if (shouldRewrite(value, this.prefixes)) {
					pending.push({ name, value });
				}
			} else if (name === "srcset") {
				const rewritten = rewriteSrcset(value, this.mount, this.prefixes);
				if (rewritten !== value) {
					pending.push({ name, value: rewritten });
				}
			} else if (name === "xlink:href") {
				if (shouldRewrite(value, this.prefixes)) {
					pending.push({ name, value });
				}
			} else if (name === "astro-component-url") {
				if (shouldRewrite(value, this.prefixes)) {
					pending.push({ name, value });
				}
			} else if (name.startsWith("data-")) {
				if (
					name === "data-src" ||
					name === "data-href" ||
					name === "data-background" ||
					name.endsWith("-src")
				) {
					if (shouldRewrite(value, this.prefixes)) {
						pending.push({ name, value });
					}
				}
			}
		}

		for (const attr of pending) {
			el.setAttribute(attr.name, rewriteUrl(attr.value, this.mount));
		}
	}
}

// ---------------------------------------------------------------------------
// CSS url() rewriting
// ---------------------------------------------------------------------------

function rewriteCSS(css: string, mount: string, prefixes: string[]): string {
	const mountPrefix = mount === "/" ? "" : mount;

	const prefixPattern = prefixes
		.map((p) => p.slice(1, -1))
		.map((p) => escapeRegex(p))
		.join("|");
	const regex = new RegExp(
		`url\\(\\s*(['"]?)(/(?:${prefixPattern})/)`,
		"g",
	);

	return css.replace(regex, `url($1${mountPrefix}$2`);
}

// ---------------------------------------------------------------------------
// Redirect & cookie rewriting
// ---------------------------------------------------------------------------

function cloneHeadersForTransform(original: Headers): Headers {
	const headers = new Headers(original);
	headers.delete("content-length");
	headers.delete("etag");
	headers.delete("content-encoding");
	return headers;
}

function rewriteLocation(
	location: string,
	mount: string,
	requestUrl: URL,
): string {
	mount = normalizePath(mount);
	try {
		const url = new URL(location, requestUrl.origin);
		if (url.origin === requestUrl.origin && url.pathname.startsWith("/")) {
			url.pathname = mount === "/" ? url.pathname : mount + url.pathname;
			return url.toString();
		}
	} catch {
		// invalid URL — leave unchanged
	}
	return location;
}

function rewriteSetCookie(headers: Headers, mount: string): void {
	mount = normalizePath(mount);
	const getSetCookie = (
		headers as Headers & { getSetCookie?: () => string[] }
	).getSetCookie;
	if (!getSetCookie) return;

	const cookies = getSetCookie.call(headers);
	if (!cookies || cookies.length === 0) return;

	headers.delete("Set-Cookie");
	for (const cookie of cookies) {
		if (/;\s*Path=\//i.test(cookie)) {
			const newPath = mount === "/" ? "/" : `${mount}/`;
			headers.append(
				"Set-Cookie",
				cookie.replace(/;\s*Path=\//i, `; Path=${newPath}`),
			);
		} else {
			headers.append("Set-Cookie", cookie);
		}
	}
}

// ---------------------------------------------------------------------------
// View transitions CSS
// ---------------------------------------------------------------------------

const VIEW_TRANSITIONS_CSS = [
	"@supports (view-transition-name: none) {",
	"  ::view-transition-old(root),",
	"  ::view-transition-new(root) {",
	"    animation-duration: 0.3s;",
	"    animation-timing-function: ease-in-out;",
	"    animation-fill-mode: both;",
	"  }",
	"  main { view-transition-name: main-content; }",
	"  nav { view-transition-name: navigation; }",
	"}",
].join("");

// ---------------------------------------------------------------------------
// Speculation Rules & preload fallback
// ---------------------------------------------------------------------------

function generateSpeculationRules(preloadMounts: string[]): string {
	return JSON.stringify({
		prefetch: [{ urls: preloadMounts }],
	});
}

function getPreloadScriptResponse(preloadMounts: string[]): Response {
	const json = JSON.stringify(preloadMounts);
	const js =
		`(()=>{const routes=${json};` +
		`const run=()=>{for(const p of routes){fetch(p,{method:"GET",credentials:"same-origin",cache:"default"}).catch(()=>{});}};` +
		`if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",run,{once:true});}else{run();}` +
		`})();`;
	return new Response(js, {
		status: 200,
		headers: {
			"content-type": "application/javascript; charset=utf-8",
			"cache-control": "public, max-age=300",
		},
	});
}

function isChromiumBrowser(userAgent: string): boolean {
	if (!userAgent) return false;
	const ua = userAgent.toLowerCase();
	const hasChrome = ua.includes("chrome");
	const hasEdge = ua.includes("edg/");
	const hasOpera = ua.includes("opr/");
	const isFirefox = ua.includes("firefox");
	const isSafari = ua.includes("safari") && !ua.includes("chrome");
	return (hasChrome || hasEdge || hasOpera) && !isFirefox && !isSafari;
}

// ---------------------------------------------------------------------------
// Core proxy handler
// ---------------------------------------------------------------------------

async function handleMountedApp(
	request: Request,
	upstream: Fetcher,
	mount: string,
	assetPrefixes: string[],
	opts?: {
		smoothTransitions?: boolean;
		preloadStaticMounts?: string[];
	},
): Promise<Response> {
	mount = normalizePath(mount);

	const forwardUrl = new URL(request.url);

	// Strip the mount prefix before forwarding upstream
	if (mount !== "/") {
		if (forwardUrl.pathname === mount) {
			forwardUrl.pathname = "/";
		} else if (forwardUrl.pathname.startsWith(mount + "/")) {
			forwardUrl.pathname = forwardUrl.pathname.slice(mount.length) || "/";
		}
	}

	// Preload script is served by the gateway itself
	if (
		opts?.preloadStaticMounts?.length &&
		forwardUrl.pathname === "/__mf-preload.js"
	) {
		return getPreloadScriptResponse(opts.preloadStaticMounts);
	}

	const upstreamResp = await upstream.fetch(
		new Request(forwardUrl.toString(), request),
	);

	const headers = new Headers(upstreamResp.headers);
	const contentType = headers.get("content-type") ?? "";

	// --- Redirects ---
	if (upstreamResp.status >= 300 && upstreamResp.status < 400) {
		const loc = headers.get("location");
		if (loc) {
			headers.set(
				"location",
				rewriteLocation(loc, mount, new URL(request.url)),
			);
		}
		rewriteSetCookie(headers, mount);
		return new Response(null, { status: upstreamResp.status, headers });
	}

	// --- HTML ---
	if (contentType.includes("text/html")) {
		const htmlText = await upstreamResp.text();
		const headersOut = cloneHeadersForTransform(headers);
		rewriteSetCookie(headersOut, mount);

		const rewriter = new HTMLRewriter().on(
			"*",
			new AllAttributesRewriter(mount, assetPrefixes),
		);

		if (opts?.smoothTransitions) {
			rewriter.on("head", {
				element(el) {
					el.append(`<style>${VIEW_TRANSITIONS_CSS}</style>`, { html: true });
				},
			});
		}

		if (opts?.preloadStaticMounts?.length) {
			const userAgent = request.headers.get("user-agent") ?? "";
			if (isChromiumBrowser(userAgent)) {
				const rulesJson = generateSpeculationRules(opts.preloadStaticMounts);
				rewriter.on("head", {
					element(el) {
						el.append(
							`<script type="speculationrules">${rulesJson}</script>`,
							{ html: true },
						);
					},
				});
			} else {
				const scriptPath =
					mount === "/" ? "/__mf-preload.js" : `${mount}/__mf-preload.js`;
				rewriter.on("body", {
					element(el) {
						el.append(`<script src="${scriptPath}" defer></script>`, {
							html: true,
						});
					},
				});
			}
		}

		return rewriter.transform(
			new Response(htmlText, {
				status: upstreamResp.status,
				statusText: upstreamResp.statusText,
				headers: headersOut,
			}),
		);
	}

	// --- CSS ---
	if (contentType.includes("text/css")) {
		const cssText = await upstreamResp.text();
		const rewritten = rewriteCSS(cssText, mount, assetPrefixes);
		const headersOut = cloneHeadersForTransform(headers);
		rewriteSetCookie(headersOut, mount);

		return new Response(rewritten, {
			status: upstreamResp.status,
			statusText: upstreamResp.statusText,
			headers: headersOut,
		});
	}

	// --- Pass-through ---
	rewriteSetCookie(headers, mount);
	return new Response(upstreamResp.body, {
		status: upstreamResp.status,
		statusText: upstreamResp.statusText,
		headers,
	});
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Prevent Miniflare crash on WebSocket upgrade through service bindings.
		if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
			return new Response("WebSocket not supported through gateway", {
				status: 400,
				headers: {
					"Content-Type": "text/plain",
					"X-Content-Type-Options": "nosniff",
				},
			});
		}

		const url = new URL(request.url);
		const { routes, smoothTransitions } = buildRoutes(env);
		const assetPrefixes = buildAssetPrefixes(env);

		// Find best matching route via scoring
		let best: {
			route: CompiledRoute;
			mount: string;
			score: number;
		} | null = null;

		let rootRoute: CompiledRoute | null = null;

		for (const route of routes) {
			if (route.staticMount === "/" || route.expr === "/") {
				rootRoute = route;
			}

			const m = route.re.exec(url.pathname);
			if (!m) continue;

			const mount = normalizePath(m[1]);
			const score =
				mount.length * 1_000_000 +
				route.baseSpecificity * 1_000 +
				route.expr.length;

			if (!best || score > best.score) {
				best = { route, mount, score };
			}
		}

		// Fallback to root route
		if (!best && rootRoute) {
			best = { route: rootRoute, mount: "/", score: 0 };
		}

		if (!best) {
			return new Response("Not found", { status: 404 });
		}

		const preloadStaticMounts = routes
			.filter(
				(r) =>
					r.preload &&
					r.isStaticMount &&
					r.staticMount &&
					r.staticMount !== best!.mount,
			)
			.map((r) => normalizePath(r.staticMount!));

		return handleMountedApp(request, best.route.binding, best.mount, assetPrefixes, {
			smoothTransitions,
			preloadStaticMounts:
				preloadStaticMounts.length > 0 ? preloadStaticMounts : undefined,
		});
	},
} satisfies ExportedHandler<Env>;
