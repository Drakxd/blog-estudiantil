import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import HomePage from "@/pages/home-page";
import CategoryPage from "@/pages/category-page";
import PostPage from "@/pages/post-page";
import AuthPage from "@/pages/auth-page";
import AboutPage from "@/pages/about-page";
import AdminDashboard from "@/pages/admin/dashboard";
import PostEditor from "@/pages/admin/post-editor";
import PostList from "@/pages/admin/post-list";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/post/:slug" component={PostPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/posts" component={PostList} />
      <ProtectedRoute path="/admin/posts/new" component={PostEditor} />
      <ProtectedRoute path="/admin/posts/edit/:id" component={PostEditor} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
