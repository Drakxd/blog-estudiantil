import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Post, Category } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, FilePlus, FileText, Layers, List, Database } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch admin posts
  const { data: postsData } = useQuery<{ published: Post[], drafts: Post[] }>({
    queryKey: ["/api/admin/posts"],
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const totalPublished = postsData?.published.length || 0;
  const totalDrafts = postsData?.drafts.length || 0;
  const totalCategories = categories?.length || 0;

  // Get counts by category
  const getPostsCountByCategory = () => {
    if (!postsData?.published || !categories) return [];
    
    return categories.map(category => {
      const count = postsData.published.filter(post => post.categoryId === category.id).length;
      return { ...category, count };
    });
  };

  const categoryCounts = getPostsCountByCategory();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="mt-1 text-sm text-gray-500">Gestiona el contenido de tu blog estudiantil</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href="/admin/posts/new">
                <Button className="flex items-center">
                  <FilePlus className="mr-2 h-4 w-4" />
                  Nueva Entrada
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Entradas Publicadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="ml-4">
                    <div className="text-3xl font-bold">{totalPublished}</div>
                    <button onClick={() => navigate("/admin/posts")} className="text-sm text-primary hover:underline flex items-center bg-transparent border-0 p-0 cursor-pointer">
                      Ver todas
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Borradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Layers className="h-8 w-8 text-amber-500" />
                  <div className="ml-4">
                    <div className="text-3xl font-bold">{totalDrafts}</div>
                    <button onClick={() => navigate("/admin/posts")} className="text-sm text-primary hover:underline flex items-center bg-transparent border-0 p-0 cursor-pointer">
                      Ver todos
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Categorías</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <div className="text-3xl font-bold">{totalCategories}</div>
                    <span className="text-sm text-gray-500">Materias académicas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Entradas Recientes</CardTitle>
                <CardDescription>Las últimas publicaciones en tu blog</CardDescription>
              </CardHeader>
              <CardContent>
                {postsData?.published && postsData.published.length > 0 ? (
                  <ul className="space-y-4">
                    {postsData.published.slice(0, 5).map((post) => {
                      const category = categories?.find(c => c.id === post.categoryId);
                      
                      return (
                        <li key={post.id} className="border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <button 
                                onClick={() => navigate(`/post/${post.slug}`)} 
                                className="font-medium text-gray-900 hover:text-primary bg-transparent border-0 p-0 cursor-pointer text-left w-full"
                              >
                                {post.title}
                              </button>
                              <div className="flex items-center mt-1">
                                {category && (
                                  <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 mr-2">
                                    {category.name}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('es-ES') : 'Sin fecha'}
                                </span>
                              </div>
                            </div>
                            <Link href={`/admin/posts/edit/${post.id}`}>
                              <Button variant="ghost" size="sm">Editar</Button>
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay entradas publicadas todavía.</p>
                    <Link href="/admin/posts/new">
                      <Button variant="outline" className="mt-2">Crear nueva entrada</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Materia</CardTitle>
                <CardDescription>Entradas publicadas por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryCounts.length > 0 ? (
                  <ul className="space-y-3">
                    {categoryCounts.map((category) => (
                      <li key={category.id}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                          <span className="text-sm text-gray-500">{category.count} entradas</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.max(5, (category.count / Math.max(1, totalPublished)) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay datos suficientes para mostrar estadísticas.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/admin/posts/new">
                    <Button variant="outline" className="w-full flex items-center justify-center h-20">
                      <div className="flex flex-col items-center">
                        <FilePlus className="h-6 w-6 mb-1" />
                        <span>Nueva Entrada</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/admin/posts">
                    <Button variant="outline" className="w-full flex items-center justify-center h-20">
                      <div className="flex flex-col items-center">
                        <List className="h-6 w-6 mb-1" />
                        <span>Gestionar Entradas</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full flex items-center justify-center h-20">
                      <div className="flex flex-col items-center">
                        <svg className="h-6 w-6 mb-1 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <span>Ver Blog</span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
