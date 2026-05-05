export interface Env {
  API: Fetcher;
  DASHBOARD: Fetcher;
  BLOG: Fetcher;
  LANDING: Fetcher;
  DOCS: Fetcher;
}

// Security headers applied to all responses
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
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(req.url);
    const startTime = Date.now();

    try {
      let response: Response;

      if (url.pathname.startsWith("/api/")) {
        response = await env.API.fetch(req.clone());
      } else if (url.pathname.startsWith("/app/") || url.pathname === "/app") {
        response = await env.DASHBOARD.fetch(req.clone());
      } else if (url.pathname.startsWith("/blog/")) {
        response = await env.BLOG.fetch(req.clone());
      } else if (url.pathname.startsWith("/docs/")) {
        response = await env.DOCS.fetch(req.clone());
      } else {
        // Fallback: Landing page
        response = await env.LANDING.fetch(req.clone());
      }

      // Log structured request info
      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: "info",
        method: req.method,
        path: url.pathname,
        status: response.status,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      }));

      return withSecurityHeaders(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(JSON.stringify({
        level: "error",
        message: error.message,
        path: url.pathname,
        timestamp: new Date().toISOString(),
      }));

      return new Response(
        JSON.stringify({ error: "Gateway Error" }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }
  },
};