import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Business categories for organizing content
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#ef4444"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Work documents with rich text and markdown support
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  format: mysqlEnum("format", ["markdown", "richtext"]).default("markdown").notNull(),
  categoryId: int("categoryId").references(() => categories.id, { onDelete: "set null" }),
  authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tags: text("tags"), // JSON array of tags
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorIdx: index("author_idx").on(table.authorId),
  categoryIdx: index("category_idx").on(table.categoryId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * File uploads with S3 storage references
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"), // in bytes
  uploaderId: int("uploaderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: int("documentId").references(() => documents.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uploaderIdx: index("uploader_idx").on(table.uploaderId),
  documentIdx: index("document_idx").on(table.documentId),
}));

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;

/**
 * Blog posts with category and tag support
 */
export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("coverImage"),
  categoryId: int("categoryId").references(() => categories.id, { onDelete: "set null" }),
  authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tags: text("tags"), // JSON array of tags
  viewCount: int("viewCount").default(0).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorIdx: index("author_idx").on(table.authorId),
  categoryIdx: index("category_idx").on(table.categoryId),
  publishedAtIdx: index("published_at_idx").on(table.publishedAt),
  slugIdx: index("slug_idx").on(table.slug),
}));

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Comments for blog posts with nested reply support
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  postId: int("postId").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: int("parentId").references((): any => comments.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  postIdx: index("post_idx").on(table.postId),
  authorIdx: index("author_idx").on(table.authorId),
  parentIdx: index("parent_idx").on(table.parentId),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Likes for blog posts
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postIdx: index("post_idx").on(table.postId),
  userIdx: index("user_idx").on(table.userId),
}));

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Notifications for user activities
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["comment", "like", "document", "system"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  relatedId: int("relatedId"), // ID of related entity (post, document, etc)
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  isReadIdx: index("is_read_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Health records for tracking daily wellness
 */
export const healthRecords = mysqlTable("healthRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // Date of the record
  sleepHours: int("sleepHours"), // Sleep duration in minutes
  sleepQuality: mysqlEnum("sleepQuality", ["poor", "fair", "good", "excellent"]),
  meals: text("meals"), // JSON array of meal descriptions
  water: int("water"), // Water intake in ml
  exercise: text("exercise"), // Exercise description
  exerciseDuration: int("exerciseDuration"), // Exercise duration in minutes
  mood: mysqlEnum("mood", ["bad", "okay", "good", "great"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  dateIdx: index("date_idx").on(table.date),
}));

export type HealthRecord = typeof healthRecords.$inferSelect;
export type InsertHealthRecord = typeof healthRecords.$inferInsert;

/**
 * Financial transactions for company finance tracking
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "salary", "investment", "equipment", "service"
  amount: int("amount").notNull(), // Amount in cents to avoid floating point issues
  currency: varchar("currency", { length: 10 }).default("CNY").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  typeIdx: index("type_idx").on(table.type),
  dateIdx: index("date_idx").on(table.date),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Company balance snapshots
 */
export const balances = mysqlTable("balances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: int("amount").notNull(), // Current balance in cents
  currency: varchar("currency", { length: 10 }).default("CNY").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  dateIdx: index("date_idx").on(table.date),
}));

export type Balance = typeof balances.$inferSelect;
export type InsertBalance = typeof balances.$inferInsert;
