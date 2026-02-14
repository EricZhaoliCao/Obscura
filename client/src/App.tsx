import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./pages/BlogEditor";
import Documents from "./pages/Documents";
import DocumentEditor from "./pages/DocumentEditor";
import Health from "./pages/Health";
import Finance from "./pages/Finance";
import { useAuth } from "./_core/hooks/useAuth";
import { Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import { trpc } from "./lib/trpc";

function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: notifications } = trpc.notifications.list.useQuery(
    { unreadOnly: true },
    { enabled: isAuthenticated }
  );
  
  // Display name: show "Eric" for admin, otherwise show user's name
  const displayName = user?.role === 'admin' ? 'Eric' : (user?.name || user?.email);

  return (
    <nav className="border-b-2 border-foreground bg-background sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-primary"></div>
              <span className="text-2xl font-bold">OBSCURA</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/">
              <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                首页
              </span>
            </Link>
            <Link href="/blog">
              <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                博客
              </span>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/documents">
                  <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                    文档
                  </span>
                </Link>
                <Link href="/health">
                  <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                    健康
                  </span>
                </Link>
                <Link href="/finance">
                  <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                    财务
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && (
              <>
                {notifications && notifications.length > 0 && (
                  <div className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs flex items-center justify-center rounded-full">
                      {notifications.length}
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {displayName}
                </span>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-foreground">
            <div className="flex flex-col gap-4">
              <Link href="/">
                <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                  首页
                </span>
              </Link>
              <Link href="/blog">
                <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                  博客
                </span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/documents">
                    <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                      文档
                    </span>
                  </Link>
                  <Link href="/health">
                    <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                      健康
                    </span>
                  </Link>
                  <Link href="/finance">
                    <span className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                      财务
                    </span>
                  </Link>
                </>
              )}
              <div className="pt-4 border-t border-foreground">
                {isAuthenticated && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {displayName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      {isAuthenticated && <Navigation />}
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/new" component={BlogEditor} />
        <Route path="/blog/edit/:id" component={BlogEditor} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/documents" component={Documents} />
        <Route path="/documents/new" component={DocumentEditor} />
        <Route path="/documents/:id" component={DocumentEditor} />
        <Route path="/health" component={Health} />
        <Route path="/finance" component={Finance} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
