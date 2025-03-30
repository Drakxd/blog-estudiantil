import { 
  User, InsertUser, 
  Category, InsertCategory, 
  Post, InsertPost,
  Media, InsertMedia,
  users, categories, posts, media as mediaTable
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, and, isNotNull, asc, ne } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PostgresqlStore = connectPgSimple(session);

// Storage interface definition
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPublishedPosts(): Promise<Post[]>;
  getDraftPosts(): Promise<Post[]>;
  getPostsByCategory(categoryId: number): Promise<Post[]>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  getPostById(id: number): Promise<Post | undefined>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Media methods
  createMedia(media: InsertMedia): Promise<Media>;
  getMediaById(id: number): Promise<Media | undefined>;
  getMediaByUser(userId: number): Promise<Media[]>;
  
  // Session store
  sessionStore: any;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresqlStore({
      pool: pool as any,
      createTableIfMissing: true,
      tableName: 'session'
    });
    
    // Seed categories if none exist
    this.initializeCategories();
  }
  
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  private async initializeCategories() {
    const existingCategories = await this.getCategories();
    
    if (existingCategories.length === 0) {
      const defaultCategories: InsertCategory[] = [
        {
          name: "Tecnología",
          slug: "tecnologia",
          description: "Recursos sobre las últimas tendencias tecnológicas, innovaciones y su impacto en la sociedad actual.",
          icon: "RocketIcon"
        },
        {
          name: "Informática",
          slug: "informatica",
          description: "Fundamentos de programación, desarrollo de software, bases de datos y sistemas informáticos.",
          icon: "LaptopIcon"
        },
        {
          name: "Mercadeo",
          slug: "mercadeo",
          description: "Estrategias de marketing, comportamiento del consumidor, investigación de mercados y marketing digital.",
          icon: "TrendingUpIcon"
        },
        {
          name: "Legislación Laboral",
          slug: "legislacion-laboral",
          description: "Derechos y obligaciones laborales, contratos de trabajo, seguridad social y normativa laboral vigente.",
          icon: "FileTextIcon"
        },
        {
          name: "Legislación Comercial",
          slug: "legislacion-comercial",
          description: "Derecho mercantil, sociedades comerciales, contratos y regulación de las actividades comerciales.",
          icon: "ScalesIcon"
        },
        {
          name: "Administración",
          slug: "administracion",
          description: "Gestión empresarial, planificación estratégica, administración de recursos humanos y liderazgo organizacional.",
          icon: "ClipboardListIcon"
        }
      ];
      
      for (const category of defaultCategories) {
        await this.createCategory(category);
      }
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values([{
        ...insertUser,
        isAdmin: true // Default to admin for this application
      }])
      .returning();
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories)
      .values([insertCategory])
      .returning();
    return category;
  }
  
  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    // Obtener admin por defecto
    const [admin] = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
    
    // Verificar si el slug ya existe
    let uniqueSlug = insertPost.slug;
    let slugExists = true;
    let counter = 1;
    
    while (slugExists) {
      const existingPost = await db.select()
        .from(posts)
        .where(eq(posts.slug, uniqueSlug))
        .limit(1);
      
      if (existingPost.length === 0) {
        slugExists = false;
      } else {
        uniqueSlug = `${insertPost.slug}-${counter}`;
        counter++;
      }
    }
    
    // No necesitamos pasar createdAt aquí ya que se establece por defecto en la definición del esquema
    const [post] = await db.insert(posts)
      .values([{
        title: insertPost.title,
        slug: uniqueSlug, // Usar el slug único
        content: insertPost.content,
        categoryId: insertPost.categoryId,
        publishedAt: insertPost.publishedAt,
        isDraft: insertPost.isDraft,
        featuredImage: insertPost.featuredImage,
        authorId: admin ? admin.id : 1 // Usar el ID del admin o 1 como fallback
      }])
      .returning();
    return post;
  }
  
  async getPublishedPosts(): Promise<Post[]> {
    return db.select()
      .from(posts)
      .where(
        and(
          eq(posts.isDraft, false),
          isNotNull(posts.publishedAt)
        )
      )
      .orderBy(desc(posts.publishedAt));
  }
  
  async getDraftPosts(): Promise<Post[]> {
    return db.select()
      .from(posts)
      .where(eq(posts.isDraft, true))
      .orderBy(desc(posts.createdAt));
  }
  
  async getPostsByCategory(categoryId: number): Promise<Post[]> {
    return db.select()
      .from(posts)
      .where(
        and(
          eq(posts.categoryId, categoryId),
          eq(posts.isDraft, false),
          isNotNull(posts.publishedAt)
        )
      )
      .orderBy(desc(posts.publishedAt));
  }
  
  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const [post] = await db.select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.isDraft, false)
        )
      );
    return post;
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }
  
  async updatePost(id: number, updateData: Partial<InsertPost>): Promise<Post | undefined> {
    // Si se está actualizando el slug, verificar que no exista
    if (updateData.slug) {
      let uniqueSlug = updateData.slug;
      let slugExists = true;
      let counter = 1;
      
      while (slugExists) {
        const existingPost = await db.select()
          .from(posts)
          .where(
            and(
              eq(posts.slug, uniqueSlug),
              ne(posts.id, id) // Excluir el post actual
            )
          )
          .limit(1);
        
        if (existingPost.length === 0) {
          slugExists = false;
        } else {
          uniqueSlug = `${updateData.slug}-${counter}`;
          counter++;
        }
      }
      
      // Actualizar el slug con el valor único
      updateData.slug = uniqueSlug;
    }
    
    const [post] = await db.update(posts)
      .set(updateData)
      .where(eq(posts.id, id))
      .returning();
    return post;
  }
  
  async deletePost(id: number): Promise<boolean> {
    await db.delete(posts).where(eq(posts.id, id));
    // En este caso, simplemente asumimos que el post fue eliminado si no hay errores
    return true;
  }
  
  // Media methods
  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const [mediaItem] = await db.insert(mediaTable)
      .values([insertMedia])
      .returning();
    return mediaItem;
  }
  
  async getMediaById(id: number): Promise<Media | undefined> {
    const [mediaItem] = await db.select().from(mediaTable).where(eq(mediaTable.id, id));
    return mediaItem;
  }
  
  async getMediaByUser(userId: number): Promise<Media[]> {
    return db.select()
      .from(mediaTable)
      .where(eq(mediaTable.uploadedBy, userId))
      .orderBy(desc(mediaTable.uploadedAt));
  }
}

export const storage = new DatabaseStorage();
