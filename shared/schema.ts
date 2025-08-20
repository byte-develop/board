import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const boards = pgTable("boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Добавляем привязку к пользователю
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const columns = pgTable("columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull(),
  userId: varchar("user_id").notNull(), // Добавляем привязку к пользователю
  title: text("title").notNull(),
  position: integer("position").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  columnId: varchar("column_id").notNull(),
  userId: varchar("user_id").notNull(), // Добавляем привязку к пользователю
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("backlog"), // backlog, in-progress, review, done
  progress: integer("progress").notNull().default(0), // 0-100
  dueDate: timestamp("due_date"),
  tags: text("tags").array().default([]),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dependencies = pgTable("dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromTaskId: varchar("from_task_id").notNull(),
  toTaskId: varchar("to_task_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull(),
  userId: varchar("user_id").notNull(), // Добавляем привязку к пользователю
  content: text("content").notNull(),
  author: text("author").notNull().default("You"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBoardSchema = createInsertSchema(boards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertColumnSchema = createInsertSchema(columns).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDependencySchema = createInsertSchema(dependencies).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export type Board = typeof boards.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Dependency = typeof dependencies.$inferSelect;
export type Comment = typeof comments.$inferSelect;

export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type InsertColumn = z.infer<typeof insertColumnSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertDependency = z.infer<typeof insertDependencySchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
