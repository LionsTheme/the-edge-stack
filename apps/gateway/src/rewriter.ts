/**
 * HTML and CSS rewriter for VMFE gateway.
 * Rewrites asset paths in HTML and CSS responses to include the mount prefix.
 *
 * HTML: uses Cloudflare's streaming HTMLRewriter (zero buffering).
 * CSS:  uses a TransformStream that processes chunks incrementally,
 *        only buffering the tail of incomplete `url(` tokens.
 */

const DEFAULT_ASSET_PREFIXES = [
	"/assets/",
	"/static/",
	"/build/",
	"/_astro/",
	"/_vite/",
	"/fonts/",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shouldRewriteUrl(
	url: string,
	assetPrefixes: readonly string[],
): boolean {
	if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
		return false;
	}
	for (const prefix of assetPrefixes) {
		if (url.startsWith(prefix)) {
			return true;
		}
	}
	return false;
}

function rewriteUrl(url: string, prefix: string): string {
	const normalizedPrefix = prefix.startsWith("/") ? prefix : `/${prefix}`;
	const cleanPrefix = normalizedPrefix.replace(/\/$/, "");
	const cleanUrl = url.startsWith("/") ? url : `/${url}`;
	return `${cleanPrefix}${cleanUrl}`;
}

function rewriteSrcset(
	srcset: string,
	prefix: string,
	assetPrefixes: readonly string[],
): string {
	return srcset
		.split(",")
		.map((part) => {
			const trimmed = part.trim();
			if (!trimmed) return trimmed;

			const spaceIndex = trimmed.search(/\s/);
			let url: string;
			let descriptor = "";

			if (spaceIndex !== -1) {
				url = trimmed.slice(0, spaceIndex);
				descriptor = trimmed.slice(spaceIndex);
			} else {
				url = trimmed;
			}

			if (shouldRewriteUrl(url, assetPrefixes)) {
				url = rewriteUrl(url, prefix);
			}

			return `${url}${descriptor}`;
		})
		.join(", ");
}

// ---------------------------------------------------------------------------
// HTML rewriting (streaming — zero buffering)
// ---------------------------------------------------------------------------

export function rewriteHTML(
	response: Response,
	prefix: string,
	assetPrefixes: readonly string[] = DEFAULT_ASSET_PREFIXES,
): Response {
	// Collect first, modify after — avoids mutation during iteration
	function collectAndRewrite(
		element: Element,
		attrNames: string[],
		isSrcset = false,
	) {
		for (const name of attrNames) {
			const value = element.getAttribute(name);
			if (!value) continue;

			if (isSrcset) {
				element.setAttribute(
					name,
					rewriteSrcset(value, prefix, assetPrefixes),
				);
			} else if (shouldRewriteUrl(value, assetPrefixes)) {
				element.setAttribute(name, rewriteUrl(value, prefix));
			}
		}
	}

	const rewriter = new HTMLRewriter()
		// Standard URL attributes
		.on("a", {
			element(e) {
				collectAndRewrite(e, ["href"]);
			},
		})
		.on("img", {
			element(e) {
				collectAndRewrite(e, ["src"]);
				collectAndRewrite(e, ["srcset"], true);
			},
		})
		.on("video", {
			element(e) {
				collectAndRewrite(e, ["src", "poster"]);
			},
		})
		.on("source", {
			element(e) {
				collectAndRewrite(e, ["src"]);
				collectAndRewrite(e, ["srcset"], true);
			},
		})
		.on("script", {
			element(e) {
				collectAndRewrite(e, ["src"]);
			},
		})
		.on("link", {
			element(e) {
				collectAndRewrite(e, ["href"]);
			},
		})
		.on("form", {
			element(e) {
				collectAndRewrite(e, ["action"]);
			},
		})
		.on("iframe", {
			element(e) {
				collectAndRewrite(e, ["src"]);
			},
		})
		.on("embed", {
			element(e) {
				collectAndRewrite(e, ["src"]);
			},
		})
		.on("object", {
			element(e) {
				collectAndRewrite(e, ["data"]);
			},
		})
		// SVG <image> — different namespace, needs explicit selector
		.on("svg image", {
			element(e) {
				collectAndRewrite(e, ["href"]);
				const xlinkHref = e.getAttribute("xlink:href");
				if (xlinkHref && shouldRewriteUrl(xlinkHref, assetPrefixes)) {
					e.setAttribute("xlink:href", rewriteUrl(xlinkHref, prefix));
				}
			},
		})
		// xlink:href on any SVG element (e.g. <use>, <image>)
		.on("[xlink\\:href]", {
			element(e) {
				const value = e.getAttribute("xlink:href");
				if (value && shouldRewriteUrl(value, assetPrefixes)) {
					e.setAttribute("xlink:href", rewriteUrl(value, prefix));
				}
			},
		})
		// HTML5 elements that may contain URLs
		.on("audio", {
			element(e) {
				collectAndRewrite(e, ["src"]);
			},
		})
		.on("track", {
			element(e) {
				collectAndRewrite(e, ["src"]);
			},
		})
		.on("area", {
			element(e) {
				collectAndRewrite(e, ["href"]);
			},
		})
		.on("input[type=image]", {
			element(e) {
				collectAndRewrite(e, ["src"]);
			},
		})
		// Wildcard: data-* attributes and astro-component-url
		// Collect first, then modify to avoid mutation during iteration
		.on("*", {
			element(e) {
				const toRewrite: Array<{ name: string; value: string }> = [];

				for (const [name, value] of e.attributes) {
					if (!value) continue;

					if (
						name === "data-src" ||
						name === "data-href" ||
						name === "data-background"
					) {
						if (shouldRewriteUrl(value, assetPrefixes)) {
							toRewrite.push({ name, value });
						}
					} else if (name.startsWith("data-") && name.endsWith("-src")) {
						if (shouldRewriteUrl(value, assetPrefixes)) {
							toRewrite.push({ name, value });
						}
					} else if (name === "astro-component-url") {
						if (shouldRewriteUrl(value, assetPrefixes)) {
							toRewrite.push({ name, value });
						}
					}
				}

				// Apply modifications outside the iteration
				for (const attr of toRewrite) {
					e.setAttribute(attr.name, rewriteUrl(attr.value, prefix));
				}
			},
		});

	return rewriter.transform(response);
}

// ---------------------------------------------------------------------------
// CSS rewriting (streaming — only buffers incomplete url() tokens)
// ---------------------------------------------------------------------------

export function rewriteCSS(
	response: Response,
	prefix: string,
	assetPrefixes: readonly string[] = DEFAULT_ASSET_PREFIXES,
): Response {
	const contentType = response.headers.get("Content-Type") ?? "";
	if (!contentType.includes("text/css") && !contentType.includes("stylesheet")) {
		return response;
	}

	const originalBody = response.body;
	if (!originalBody) return response;

	const headers = new Headers(response.headers);
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();

	/** Rewrites url() tokens in a chunk that is guaranteed to be safe. */
	function processChunk(chunk: string): string {
		return chunk.replace(
			/url\(\s*([^)]*)\)/g,
			(_match: string, urlContent: string): string => {
				let url = urlContent.trim();
				let quote = "";

				if (
					(url.startsWith('"') && url.endsWith('"')) ||
					(url.startsWith("'") && url.endsWith("'"))
				) {
					quote = url[0];
					url = url.slice(1, -1);
				}

				if (shouldRewriteUrl(url, assetPrefixes)) {
					url = rewriteUrl(url, prefix);
				}

				const rewrittenUrl = quote ? `${quote}${url}${quote}` : url;
				return `url(${rewrittenUrl})`;
			},
		);
	}

	const stream = new ReadableStream({
		async start(controller) {
			const reader = originalBody.getReader();
			let tail = "";

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					let text = decoder.decode(value, { stream: true });
					text = tail + text;

					// If a `url(` is still open at the end, buffer it for the next chunk
					const lastUrlOpen = text.lastIndexOf("url(");
					const lastClose = text.lastIndexOf(")");

					if (lastUrlOpen !== -1 && lastClose < lastUrlOpen) {
						const emitUpTo = lastUrlOpen;
						const safe = text.slice(0, emitUpTo);
						tail = text.slice(emitUpTo);
						controller.enqueue(encoder.encode(processChunk(safe)));
					} else {
						controller.enqueue(encoder.encode(processChunk(text)));
						tail = "";
					}
				}

				if (tail.length > 0) {
					controller.enqueue(encoder.encode(processChunk(tail)));
				}
				controller.close();
			} catch (err) {
				controller.error(err);
			}
		},
	});

	return new Response(stream, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

// ---------------------------------------------------------------------------
// HTTP Header rewriting
// ---------------------------------------------------------------------------

/**
 * Normalizes a mount prefix to a clean path prefix without trailing slash.
 * "/docs"  -> "/docs"
 * "/docs/" -> "/docs"
 * "/"      -> ""
 * ""       -> ""
 */
function normalizePrefix(prefix: string): string {
	if (prefix === "/" || prefix === "") return "";
	return prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
}

/**
 * Checks if a Location header value needs rewriting.
 * External URLs (http://, https://, //) are left alone.
 * Everything else — relative paths with or without leading / — gets rewritten.
 */
function needsLocationRewrite(location: string): boolean {
	if (location.startsWith("http://")) return false;
	if (location.startsWith("https://")) return false;
	if (location.startsWith("//")) return false;
	return true;
}

/**
 * Rewrites the Location header to include the mount prefix.
 *
 * - /instalacion  + prefix /docs → /docs/instalacion
 * - api/login     + prefix /docs → /docs/api/login
 * - /docs/guia    + prefix /docs → /docs/guia  (no duplication)
 * - /docs         + prefix /docs → /docs        (exact match, no duplication)
 * - https://ext   + prefix /docs → https://ext  (external, untouched)
 * - /             + prefix /docs → /docs/
 */
function rewriteLocationHeader(location: string, prefix: string): string {
	if (!needsLocationRewrite(location)) return location;

	const cleanPrefix = normalizePrefix(prefix);

	// Ensure the location has a leading /
	const normalizedLocation = location.startsWith("/")
		? location
		: `/${location}`;

	// Root → mount point root
	if (normalizedLocation === "/") {
		return cleanPrefix ? `/${cleanPrefix}/` : "/";
	}

	// Avoid duplicating the prefix
	if (
		cleanPrefix &&
		(normalizedLocation === `/${cleanPrefix}` ||
			normalizedLocation.startsWith(`/${cleanPrefix}/`))
	) {
		return normalizedLocation;
	}

	if (cleanPrefix) {
		return `/${cleanPrefix}${normalizedLocation}`;
	}

	return normalizedLocation;
}

/**
 * Rewrites the Path attribute in a Set-Cookie header.
 *
 * - No Path attribute     → appends Path=/prefix
 * - Path=/                → left unchanged (valid for whole domain)
 * - Path= (empty)         → left unchanged
 * - Path=/api + /dash     → Path=/dash/api
 * - HttpOnly, Secure, etc. preserved untouched
 */
function rewriteSetCookiePath(cookie: string, prefix: string): string {
	const cleanPrefix = normalizePrefix(prefix);
	if (!cleanPrefix) return cookie;

	const pathMatch = cookie.match(/[Pp]ath=([^;]*)/i);

	// No Path attribute at all — append one scoped to the mount point
	if (!pathMatch) {
		return `${cookie}; Path=/${cleanPrefix}`;
	}

	const currentPath = pathMatch[1];

	// Root path or empty path → leave unchanged
	if (currentPath === "/" || currentPath === "") return cookie;

	// Prepend prefix to specific paths
	const newPath = `/${cleanPrefix}${currentPath}`;
	return cookie.replace(pathMatch[0], `Path=${newPath}`);
}

/**
 * Rewrites HTTP headers in the response for microfrontend mounting.
 *
 * Handles:
 * - Location: redirects (adds prefix to relative paths)
 * - Set-Cookie: session cookies (adjusts Path attribute)
 *
 * Only processes when prefix !== "/".
 */
export function rewriteHeaders(
	response: Response,
	prefix: string,
): Response {
	if (prefix === "/") return response;

	const headers = new Headers(response.headers);
	let modified = false;

	// Rewrite Location header for redirects
	const location = headers.get("Location");
	if (location) {
		const rewritten = rewriteLocationHeader(location, prefix);
		if (rewritten !== location) {
			headers.set("Location", rewritten);
			modified = true;
		}
	}

	// Rewrite Set-Cookie headers for session cookies
	// Set-Cookie can appear multiple times, so we get all values
	const setCookieValues = headers.getAll("Set-Cookie");
	if (setCookieValues.length > 0) {
		const rewrittenCookies: string[] = [];
		let hasChanges = false;

		for (const cookie of setCookieValues) {
			const rewritten = rewriteSetCookiePath(cookie, prefix);
			rewrittenCookies.push(rewritten);
			if (rewritten !== cookie) hasChanges = true;
		}

		if (hasChanges) {
			// Delete all existing Set-Cookie headers and add rewritten ones
			headers.delete("Set-Cookie");
			for (const cookie of rewrittenCookies) {
				headers.append("Set-Cookie", cookie);
			}
			modified = true;
		}
	}

	if (!modified) return response;

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function rewriteResponse(
	response: Response,
	prefix: string,
	assetPrefixes: readonly string[] = DEFAULT_ASSET_PREFIXES,
): Response {
	if (prefix === "/") return response;

	const contentType = response.headers.get("Content-Type") ?? "";

	if (contentType.includes("text/html")) {
		return rewriteHTML(response, prefix, assetPrefixes);
	}

	if (contentType.includes("text/css") || contentType.includes("stylesheet")) {
		return rewriteCSS(response, prefix, assetPrefixes);
	}

	return response;
}

// ---------------------------------------------------------------------------
// Config parsing
// ---------------------------------------------------------------------------

export function parseAssetPrefixes(envValue?: string): readonly string[] {
	if (!envValue) return DEFAULT_ASSET_PREFIXES;

	try {
		const parsed = JSON.parse(envValue);
		if (
			Array.isArray(parsed) &&
			parsed.every((item) => typeof item === "string")
		) {
			return parsed as readonly string[];
		}
		console.warn(
			JSON.stringify({
				level: "warn",
				message: "Invalid ASSET_PREFIXES format, using defaults",
				timestamp: new Date().toISOString(),
			}),
		);
		return DEFAULT_ASSET_PREFIXES;
	} catch {
		console.warn(
			JSON.stringify({
				level: "warn",
				message: "Failed to parse ASSET_PREFIXES, using defaults",
				timestamp: new Date().toISOString(),
			}),
		);
		return DEFAULT_ASSET_PREFIXES;
	}
}
