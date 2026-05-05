import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import app from "./index";

describe("API", () => {
  it("returns user as null when unauthenticated", async () => {
    const client = testClient(app);
    const res = await client.api.me.$get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: null });
  });

  it("returns empty posts array", async () => {
    const client = testClient(app);
    const res = await client.api.posts.$get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ posts: [] });
  });
});