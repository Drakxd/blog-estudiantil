import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Categories for blog posts
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Users table (admin users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Blog posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  categoryId: integer("category_id").notNull(),
  authorId: integer("author_id").notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isDraft: boolean("is_draft").notNull().default(true),
  featuredImage: text("featured_image"),
});

// Schema básico para inserción (omitimos solo ID y createdAt)
const baseInsertPostSchema = createInsertSchema(posts).omit({ 
  id: true, 
  createdAt: true
});

// Extendemos el schema para hacer authorId opcional
export type PostInput = z.infer<typeof baseInsertPostSchema> & {
  authorId?: number;
};

// Mejorar el schema para manejar fechas correctamente
export const insertPostSchema = baseInsertPostSchema.transform((data) => {
  // Crear un nuevo objeto con la misma estructura
  const newData = { ...data };
  
  // Si hay una fecha de publicación en formato string, convertirla a objeto Date
  if (newData.publishedAt && typeof newData.publishedAt === 'string') {
    newData.publishedAt = new Date(newData.publishedAt);
  }
  
  // Si no es un borrador y no tiene fecha de publicación, establecerla a ahora
  if (!newData.isDraft && !newData.publishedAt) {
    newData.publishedAt = new Date();
  }
  
  return newData;
});

export type InsertPost = z.infer<typeof insertPostSchema> & { authorId?: number };
export type Post = typeof posts.$inferSelect;

// Media files
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  uploadedBy: integer("uploaded_by").notNull(),
});

export const insertMediaSchema = createInsertSchema(media).omit({ 
  id: true, 
  uploadedAt: true 
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;
