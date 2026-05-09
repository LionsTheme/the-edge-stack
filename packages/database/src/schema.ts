import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export * from "./auth-schema";

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: text("authorId").notNull(), // Referencia al ID de Better Auth
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const postsRelations = relations(posts, ({ one }) => {
  void one; // Required by Drizzle's API -- configure when adding relations
  return {};
});