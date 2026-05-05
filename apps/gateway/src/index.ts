export interface Env {
  API: Fetcher;
  DASHBOARD: Fetcher;
  BLOG: Fetcher;
  LANDING: Fetcher;
  DOCS: Fetcher;
}

export default {
  async fetch(
    req: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/")) {
      return env.API.fetch(req.clone());
    }
    if (url.pathname.startsWith("/app/") || url.pathname === "/app") {
      return env.DASHBOARD.fetch(req.clone());
    }
    if (url.pathname.startsWith("/blog/")) {
      return env.BLOG.fetch(req.clone());
    }
    if (url.pathname.startsWith("/docs/")) {
      return env.DOCS.fetch(req.clone());
    }

    // Fallback: Landing page
    return env.LANDING.fetch(req.clone());
  },
};