import { useQuery } from "@tanstack/react-query";
import { Post, Category } from "@shared/schema";
import { Link, useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const CategoryPage = () => {
  const { slug } = useParams();
  
  // Fetch the category details
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${slug}`],
  });
  
  // Fetch posts for this category
  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: [`/api/posts/category/${slug}`],
    enabled: !!slug,
  });
  
  const isLoading = categoryLoading || postsLoading;
  
  // Format the date as "hace X días/horas/minutos"
  const formatDate = (dateString: Date | null | undefined) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      return "";
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Category Header */}
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : category ? (
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <h1 className="ml-3 text-3xl font-bold text-gray-900">{category.name}</h1>
                </div>
                <p className="text-gray-600 max-w-3xl">{category.description}</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Categoría no encontrada.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Category Posts */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200">
                    <Link href={`/post/${post.slug}`}>
                      <a className="block">
                        {post.featuredImage && (
                          <img 
                            className="h-48 w-full object-cover" 
                            src={post.featuredImage} 
                            alt={`Imagen destacada de ${post.title}`} 
                          />
                        )}
                        <div className="p-6">
                          <div className="flex items-center mb-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(post.publishedAt)}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <div className="text-gray-600 mb-4 line-clamp-3">
                            {/* This would render HTML which isn't safe, so we use a simple preview */}
                            {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </div>
                          <div className="flex items-center text-sm text-primary">
                            <span>Leer más</span>
                            <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </a>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay entradas publicadas en esta categoría.</p>
                <Link href="/">
                  <a className="inline-flex items-center mt-4 text-primary hover:text-blue-700">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Volver a inicio
                  </a>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoryPage;
