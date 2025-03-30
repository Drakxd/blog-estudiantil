import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Post, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash2, MoreVertical, FilePlus, Eye, Calendar, Search, Filter } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PostList = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch admin posts
  const { data: postsData, isLoading } = useQuery<{ published: Post[], drafts: Post[] }>({
    queryKey: ["/api/admin/posts"],
  });
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
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
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la entrada: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.")) {
      deletePostMutation.mutate(id);
    }
  };
  
  // Format the date as "15 de mayo, 2023"
  const formatDate = (dateString: Date | null | undefined) => {
    if (!dateString) return "No publicado";
    
    try {
      const date = new Date(dateString);
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };
  
  // Filter posts based on search term and selected category
  const filterPosts = (posts: Post[] | undefined) => {
    if (!posts) return [];
    
    return posts.filter(post => {
      const matchesSearch = searchTerm === "" || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === null || 
        post.categoryId.toString() === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };
  
  const filteredPublished = filterPosts(postsData?.published);
  const filteredDrafts = filterPosts(postsData?.drafts);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestionar Entradas</h1>
              <p className="mt-1 text-sm text-gray-500">Administra las entradas de tu blog</p>
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
          
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar entradas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Select
                    value={selectedCategory || "all"}
                    onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="published" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="published">
                    Publicadas ({filteredPublished?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="drafts">
                    Borradores ({filteredDrafts?.length || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="published">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                      <p className="mt-2 text-gray-500">Cargando entradas...</p>
                    </div>
                  ) : filteredPublished?.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Título
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredPublished.map((post) => {
                            const category = categories?.find(c => c.id === post.categoryId);
                            
                            return (
                              <tr key={post.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{post.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5">
                                    {category?.name || 'Sin categoría'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(post.publishedAt)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Link href={`/post/${post.slug}`}>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Link href={`/admin/posts/edit/${post.id}`}>
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <Link href={`/post/${post.slug}`}>
                                          <DropdownMenuItem>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver entrada
                                          </DropdownMenuItem>
                                        </Link>
                                        <Link href={`/admin/posts/edit/${post.id}`}>
                                          <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                          </DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Eliminar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay entradas publicadas que coincidan con los criterios de búsqueda.</p>
                      <Link href="/admin/posts/new">
                        <Button variant="outline" className="mt-2">Crear nueva entrada</Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="drafts">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                      <p className="mt-2 text-gray-500">Cargando borradores...</p>
                    </div>
                  ) : filteredDrafts?.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Título
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Última modificación
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredDrafts.map((post) => {
                            const category = categories?.find(c => c.id === post.categoryId);
                            
                            return (
                              <tr key={post.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{post.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5">
                                    {category?.name || 'Sin categoría'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(post.createdAt)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Link href={`/admin/posts/edit/${post.id}`}>
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <Link href={`/admin/posts/edit/${post.id}`}>
                                          <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                          </DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Eliminar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay borradores que coincidan con los criterios de búsqueda.</p>
                      <Link href="/admin/posts/new">
                        <Button variant="outline" className="mt-2">Crear nueva entrada</Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PostList;
