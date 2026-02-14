import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useSearch } from "wouter";
import { useState } from "react";
import { Search, Eye, Heart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Blog() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const categorySlug = searchParams.get('category');
  
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const { data: posts } = trpc.blog.listPublished.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: searchResults } = trpc.blog.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const displayPosts = searchQuery ? searchResults : posts;
  const filteredPosts = categorySlug
    ? displayPosts?.filter((post) => {
        const category = categories?.find((c) => c.id === post.categoryId);
        return category?.slug === categorySlug;
      })
    : displayPosts;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <div className="flex items-start gap-6 mb-8">
            <div className="accent-square flex-shrink-0"></div>
            <div>
              <h1 className="text-5xl font-bold mb-4">博客</h1>
              <p className="text-xl text-muted-foreground">
                技术见解与行业分析
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 border-2 border-foreground focus:border-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-foreground">
        <div className="container py-8">
          <div className="flex gap-4 flex-wrap">
            <Button
              variant={!categorySlug ? "default" : "outline"}
              onClick={() => setLocation('/blog')}
              className="border-2 border-foreground"
            >
              全部
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={categorySlug === category.slug ? "default" : "outline"}
                onClick={() => setLocation(`/blog?category=${category.slug}`)}
                className="border-2 border-foreground"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="container py-16">
        {user?.role === 'admin' && (
          <div className="mb-8">
            <Link href="/blog/new">
              <Button className="border-2 border-foreground">
                创建新文章
              </Button>
            </Link>
          </div>
        )}

        {filteredPosts && filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const category = categories?.find((c) => c.id === post.categoryId);
              return (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="border-2 border-foreground hover:border-primary transition-colors cursor-pointer h-full">
                    {post.coverImage && (
                      <div className="aspect-video bg-secondary border-b-2 border-foreground overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      {category && (
                        <div
                          className="w-8 h-8 mb-2"
                          style={{ backgroundColor: category.color || '#ef4444' }}
                        ></div>
                      )}
                      <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-3 text-foreground/70">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.viewCount}</span>
                        </div>
                        <span>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('zh-CN')
                            : '未发布'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="accent-square mx-auto mb-4"></div>
            <p className="text-xl text-muted-foreground">暂无文章</p>
          </div>
        )}
      </section>
    </div>
  );
}
