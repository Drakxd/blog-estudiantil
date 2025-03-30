import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertPostSchema, Post, Category } from "@shared/schema";
import { TipTap } from "@/components/ui/tiptap";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Eye, ArrowLeft, Trash2 } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

// Crear un schema específico para el formulario
const postFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
  slug: z.string().min(3, "El slug debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
  categoryId: z.number().min(1, "Debes seleccionar una categoría"),
  isDraft: z.boolean().default(true),
  publishedAt: z.date().nullable(),
  featuredImage: z.string().nullable(),
});

// Esto es lo que usamos en el formulario
type PostFormValues = z.infer<typeof postFormSchema>;

// Esto es lo que enviamos a la API
interface PostApiData extends Omit<PostFormValues, 'publishedAt'> {
  publishedAt: string | null;
}

const PostEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch post if editing
  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: [`/api/admin/posts/${id}`],
    enabled: !!id,
  });

  // Create a slug from title
  const createSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  // Initialize form with default values or existing post data
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      slug: "",
      categoryId: categories && categories.length > 0 ? categories[0].id : 1,
      isDraft: true,
      publishedAt: null,
      featuredImage: null,
    },
  });

  // Set form values when post data is loaded
  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
        slug: post.slug,
        categoryId: post.categoryId,
        isDraft: post.isDraft,
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        featuredImage: post.featuredImage || null,
      });
    }
  }, [post, form]);

  // Watch for title changes to update slug
  const title = form.watch("title");
  
  useEffect(() => {
    if (title && !isEditing && !form.getValues("slug")) {
      form.setValue("slug", createSlugFromTitle(title));
    }
  }, [title, form, isEditing]);

  // Create or update post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      // Convertir la fecha a formato ISO string para API
      const apiData = {
        ...data,
        publishedAt: data.publishedAt ? data.publishedAt.toISOString() : null
      };
      
      if (isEditing) {
        const res = await apiRequest("PUT", `/api/admin/posts/${id}`, apiData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/posts", apiData);
        return await res.json();
      }
    },
    onSuccess: (data: Post) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/category/${categories?.find(c => c.id === data.categoryId)?.slug}`] });
      
      toast({
        title: isEditing ? "Entrada actualizada" : "Entrada creada",
        description: isEditing 
          ? "La entrada ha sido actualizada correctamente" 
          : "La entrada ha sido creada correctamente",
      });
      
      navigate("/admin/posts");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo ${isEditing ? "actualizar" : "crear"} la entrada: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/posts/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Entrada eliminada",
        description: "La entrada ha sido eliminada correctamente",
      });
      
      navigate("/admin/posts");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la entrada: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Media upload handler
  const handleMediaUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/admin/media", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Error al subir el archivo");
      }
      
      const data = await response.json();
      form.setValue("featuredImage", data.path);
      
      toast({
        title: "Archivo subido",
        description: "La imagen destacada ha sido subida correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const onSubmit = (data: PostFormValues) => {
    // Si no es borrador y no tiene fecha de publicación, establecerla a ahora
    if (!data.isDraft && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    
    // No necesitamos convertir la fecha, el schema lo hará por nosotros
    createPostMutation.mutate(data);
  };

  // Handle publish now action
  const handlePublishNow = () => {
    const currentData = form.getValues();
    form.setValue("isDraft", false);
    form.setValue("publishedAt", new Date());
    
    // Trigger validation before submitting
    form.trigger().then(isValid => {
      if (isValid) {
        onSubmit({
          ...currentData,
          isDraft: false,
          publishedAt: new Date(),
        });
      }
    });
  };

  const isLoading = categoriesLoading || (isEditing && postLoading);
  const isPending = createPostMutation.isPending || deletePostMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/posts")} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Editar Entrada" : "Nueva Entrada"}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:block">
                <TabsList>
                  <TabsTrigger value="editor">
                    <Save className="h-4 w-4 mr-2" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Vista previa
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="block sm:hidden mb-4">
                      <TabsList className="w-full">
                        <TabsTrigger value="editor" className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Editor
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Vista previa
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <Card>
                      <CardContent className="p-6">
                        {activeTab === "editor" ? (
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Título</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Título de la entrada" 
                                      {...field} 
                                      className="text-xl font-semibold" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="slug"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Slug (URL)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="slug-de-la-entrada" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    URL amigable para la entrada (solo letras minúsculas, números y guiones)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contenido</FormLabel>
                                  <FormControl>
                                    <TipTap 
                                      content={field.value} 
                                      onChange={field.onChange} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : (
                          <div className="prose prose-blue max-w-none">
                            <h1>{form.getValues("title") || "Título de la entrada"}</h1>
                            {form.getValues("featuredImage") && (
                              <img 
                                src={String(form.getValues("featuredImage"))} 
                                alt="Imagen destacada" 
                                className="rounded-lg w-full h-auto mb-6"
                              />
                            )}
                            <div dangerouslySetInnerHTML={{ __html: form.getValues("content") || "<p>El contenido de la entrada aparecerá aquí...</p>" }} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Sidebar */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Publicación</CardTitle>
                        <CardDescription>Configura los detalles de la entrada</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoría</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value ? field.value.toString() : undefined}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una materia" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories && categories.length > 0 ? (
                                    categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem key="0" value="placeholder-value" disabled>
                                      No hay categorías disponibles
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="featuredImage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Imagen destacada</FormLabel>
                              {field.value ? (
                                <div className="relative mt-1 mb-2">
                                  <img 
                                    src={field.value} 
                                    alt="Imagen destacada" 
                                    className="rounded-lg w-full h-auto object-cover aspect-video"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => form.setValue("featuredImage", null)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <FileUpload 
                                  onUpload={handleMediaUpload} 
                                  accept="image/*"
                                  buttonText="Subir imagen destacada"
                                  allowedTypes={[
                                    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'
                                  ]}
                                />
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Separator />
                        
                        <FormField
                          control={form.control}
                          name="isDraft"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Estado</FormLabel>
                                <FormDescription>
                                  {field.value ? "Borrador" : "Publicado"}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={!field.value}
                                  onCheckedChange={(checked) => field.onChange(!checked)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="mt-4">
                          {form.getValues("isDraft") ? (
                            <>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button 
                                  type="submit" 
                                  className="flex-1"
                                  disabled={isPending}
                                >
                                  {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Guardar borrador
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="default" 
                                  className="flex-1"
                                  onClick={handlePublishNow}
                                  disabled={isPending}
                                >
                                  {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="mr-2 h-4 w-4" />
                                  )}
                                  Publicar ahora
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Button 
                              type="submit" 
                              className="w-full"
                              disabled={isPending}
                            >
                              {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Actualizar entrada
                            </Button>
                          )}
                        </div>
                        
                        {isEditing && (
                          <Button 
                            type="button" 
                            variant="destructive" 
                            className="w-full mt-2"
                            onClick={() => {
                              if (window.confirm("¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.")) {
                                deletePostMutation.mutate();
                              }
                            }}
                            disabled={isPending}
                          >
                            {deletePostMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Eliminar entrada
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PostEditor;
