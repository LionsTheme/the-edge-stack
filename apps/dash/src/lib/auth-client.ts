import { createAuthClient } from "better-auth/react";

/**
 * API base URL for the Better Auth client.
 *
 * Defaults to "/api" which works with the Gateway (same origin),
 * reverse proxies (Vercel/Netlify rewrites), and any deployment
 * where the API is served from the same domain.
 *
 * Set VITE_API_URL for standalone deployments where the API
 * lives on a different subdomain or origin (e.g., https://api.example.com).
 */
const apiUrl = import.meta.env.VITE_API_URL?.trim() || "/api";

export const authClient = createAuthClient({
	baseURL: apiUrl,
});

export const { signIn, signOut, useSession } = authClient;
