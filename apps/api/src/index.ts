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

app.onError((err, c) => {
  console.error(`[Error] ${err.message}`, {
    stack: err.stack,
    path: c.req.path,
  });
  return c.json({ error: "Internal Server Error" }, 500);
});

const route = app
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