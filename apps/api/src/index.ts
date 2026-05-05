import { Hono } from "hono";
import { createAuth } from "@repo/auth";
import { getDb } from "@repo/database";

type Bindings = {
  DATABASE_URL: string;
  AUTH_SECRET: string;
  APP_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

// Security headers middleware
app.use("/*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
});

// Structured error logging
app.onError((err, c) => {
  console.error(JSON.stringify({
    level: "error",
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  }));
  return c.json({ error: "Internal Server Error" }, 500);
});

const route = app
  .get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
  })
  .get("/me", async (c) => {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    return c.json({ user: session?.user ?? null });
  })
  .get("/posts", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const allPosts = await db.query.posts.findMany();
    return c.json({ posts: allPosts });
  });

export type AppType = typeof route;
export default app;