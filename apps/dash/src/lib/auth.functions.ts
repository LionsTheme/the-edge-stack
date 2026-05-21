import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

interface SessionUser {
	id: string;
	name?: string;
	email?: string;
	image?: string;
}

interface SessionResult {
	user: SessionUser;
}

/**
 * Server function that validates the current session by forwarding cookies to the API.
 *
 * Called from `beforeLoad` in protected routes. Uses `getRequest()` to access
 * the original SSR request headers and forward the session cookie to the API.
 * This is necessary because TanStack Start SSR runs on the server without
 * automatic browser cookie handling.
 *
 * The API URL is derived from the incoming request (same-origin) by default,
 * which works with the Gateway and reverse proxy setups. Override via
 * VITE_API_URL for standalone deployments.
 *
 * @returns The session user if authenticated, `null` otherwise.
 */
export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const request = getRequest();

			// Derive API base URL: explicit config wins, otherwise same origin
			const configured = import.meta.env.VITE_API_URL?.trim();
			// const requestUrl = new URL(request.url);
			// const apiUrl = configured || `${requestUrl.protocol}//${requestUrl.host}`;
			const apiUrl = configured;

			console.log("getSession: ", { configured: configured, apiUrl: apiUrl });

			if (!apiUrl) {
				throw new Error("API URL not configured");
			}

			const cookie = request.headers.get("cookie") ?? "";

			const res = await fetch(`${apiUrl}/api/auth/get-session`, {
				headers: cookie ? { cookie } : {},
			});

			if (!res.ok) return null;

			const data = (await res.json()) as { user: SessionUser };

			if (!data.user || typeof data.user.id !== "string") {
				return null;
			}

			return { user: data.user } satisfies SessionResult;
		} catch {
			return null;
		}
	},
);
