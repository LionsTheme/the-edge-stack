import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Seed script for development data.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx src/seed.ts
 *
 * Or from the package directory:
 *   pnpm db:seed
 */
async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🌱 Seeding database...");

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  // Insert sample posts
  await db.insert(schema.posts).values([
    {
      title: "Welcome to The Edge Stack",
      content: "This is a sample post created by the seed script. You can delete it and create your own!",
      authorId: "system",
    },
    {
      title: "Getting Started with Hono",
      content: "Hono is a lightweight web framework that works great with Cloudflare Workers.",
      authorId: "system",
    },
    {
      title: "Why Edge-First Architecture?",
      content: "Deploying at the edge reduces latency and improves user experience globally.",
      authorId: "system",
    },
  ]);

  console.log("✅ Seeding complete! Created 3 sample posts.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});