import { useQuery } from "@tanstack/react-query";
import { Post, Category } from "@shared/schema";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const HomePage = () => {
  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const isLoading = postsLoading || categoriesLoading;

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
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Blog académico para compartir conocimiento
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-6">
                Un espacio dedicado a compilar y compartir recursos educativos en diferentes áreas académicas.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#categorias" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white">
                  Explorar materias
                </a>
                <a href="#reciente" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 bg-opacity-60 hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white">
                  Contenido reciente
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="categorias" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Materias</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories?.map((category) => (
                  <div key={category.id} className="group block h-full">
                    <Link href={`/category/${category.slug}`} className="group block h-full">
                      <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200 h-full flex flex-col">
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                              </svg>
                            </div>
                            <h3 className="ml-3 text-xl font-semibold text-gray-900 group-hover:text-primary transition duration-200">{category.name}</h3>
                          </div>
                          <p className="text-gray-600 mb-4 flex-grow">{category.description}</p>
                          <div className="flex items-center text-sm text-primary">
                            <span>Ver contenido</span>
                            <svg className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Posts Section */}
        <section id="reciente" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Contenido reciente</h2>
              <Link href="/" className="text-primary hover:text-blue-700 flex items-center text-sm font-medium">
                Ver todo el contenido
                <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(0, 6).map((post) => {
                  const category = categories?.find(cat => cat.id === post.categoryId);
                  
                  return (
                    <article key={post.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200">
                      <Link href={`/post/${post.slug}`} className="block">
                        {post.featuredImage && (
                          <img 
                            className="h-48 w-full object-cover" 
                            src={post.featuredImage} 
                            alt={`Imagen destacada de ${post.title}`} 
                          />
                        )}
                        <div className="p-6">
                          <div className="flex items-center mb-2">
                            {category && (
                              <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5">
                                {category.name}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 ml-2">
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
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay entradas publicadas todavía.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
