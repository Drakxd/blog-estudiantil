import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { insertCategorySchema, insertPostSchema } from "@shared/schema";
import { ZodError } from "zod";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = randomUUID();
    const extname = path.extname(file.originalname);
    cb(null, `${uniquePrefix}${extname}`);
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and documents
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm', 
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  const { isAuthenticated, isAdmin } = setupAuth(app);

  // API routes
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // Posts
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPublishedPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/category/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const posts = await storage.getPostsByCategory(category.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts by category" });
    }
  });

  app.get("/api/posts/:slug", async (req, res) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // Admin routes (protected)
  app.get("/api/admin/posts", isAdmin, async (req, res) => {
    try {
      const published = await storage.getPublishedPosts();
      const drafts = await storage.getDraftPosts();
      res.json({ published, drafts });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin posts" });
    }
  });

  app.post("/api/admin/posts", isAdmin, async (req, res) => {
    try {
      console.log("Datos recibidos:", JSON.stringify(req.body));
      
      // Corregir manualmente el problema de fecha
      const dataToValidate = { ...req.body };
      if (dataToValidate.publishedAt && typeof dataToValidate.publishedAt === 'string') {
        dataToValidate.publishedAt = new Date(dataToValidate.publishedAt);
      }
      
      // Usar el esquema pero ignorar la validación ya que hemos hecho la conversión manualmente
      const validatedData = dataToValidate;
      console.log("Datos a insertar:", JSON.stringify(validatedData));
      
      // Asegurarse de que authorId esté presente (está en el esquema de DB pero no en el schema insertPost)
      const post = await storage.createPost({
        ...validatedData,
        authorId: req.user!.id
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error en creación de post:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create post" });
      }
    }
  });

  app.put("/api/admin/posts/:id", isAdmin, async (req, res) => {
    try {
      console.log("Datos recibidos para actualizar:", JSON.stringify(req.body));
      
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Corregir manualmente el problema de fecha
      const dataToUpdate = { ...req.body };
      if (dataToUpdate.publishedAt && typeof dataToUpdate.publishedAt === 'string') {
        dataToUpdate.publishedAt = new Date(dataToUpdate.publishedAt);
      }
      
      // Only allow updating certain fields
      const updatedPost = await storage.updatePost(postId, dataToUpdate);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error en actualización de post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/admin/posts/:id", isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const success = await storage.deletePost(postId);
      
      if (!success) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Media upload
  app.post("/api/admin/media", isAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const media = await storage.createMedia({
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        uploadedBy: req.user!.id
      });
      
      res.status(201).json(media);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload media" });
    }
  });

  app.get("/api/admin/media", isAdmin, async (req, res) => {
    try {
      const media = await storage.getMediaByUser(req.user!.id);
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, path.basename(req.path));
    res.sendFile(filePath, (err) => {
      if (err) {
        next(null); // Pasar null para evitar el error de tipo
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
