import { useQuery } from "@tanstack/react-query";
import { Post, Category } from "@shared/schema";
import { Link, useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const PostPage = () => {
  const { slug } = useParams();
  
  // Fetch the post details
  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: [`/api/posts/${slug}`],
  });
  
  // Fetch categories to display the category name
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const isLoading = postLoading || categoriesLoading;
  
  // Format the date as "15 de mayo, 2023"
  const formatDate = (dateString: Date | null | undefined) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      return "";
    }
  };
  
  // Get category name
  const getCategoryName = (categoryId: number | undefined) => {
    if (!categoryId || !categories) return "";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "";
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : post ? (
          <article className="py-12 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <Link href={post.categoryId ? `/category/${categories?.find(c => c.id === post.categoryId)?.slug || ''}` : '/'}>
                  <a className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Volver a {getCategoryName(post.categoryId)}
                  </a>
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
                <div className="flex items-center text-gray-600 text-sm mb-6">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span className="mx-2">•</span>
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5">
                    {getCategoryName(post.categoryId)}
                  </span>
                </div>
                {post.featuredImage && (
                  <img 
                    className="w-full h-auto rounded-lg mb-8" 
                    src={post.featuredImage} 
                    alt={`Imagen destacada de ${post.title}`} 
                  />
                )}
              </div>
              
              <div 
                className="prose prose-blue max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </article>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">La entrada no existe o ha sido eliminada.</p>
            <Link href="/">
              <a className="inline-flex items-center text-primary hover:text-blue-700">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Volver a inicio
              </a>
            </Link>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default PostPage;
