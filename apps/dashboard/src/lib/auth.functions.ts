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

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

/**
 * Server function that validates the current session by forwarding cookies to the API.
 *
 * Called from `beforeLoad` in protected routes. Uses `getRequest()` to access
 * the original SSR request headers and forward the session cookie to the API.
 * This is necessary because TanStack Start SSR runs on the server without
 * automatic browser cookie handling.
 *
 * @returns The session user if authenticated, `null` otherwise.
 */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
	try {
		const request = getRequest();
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
});
