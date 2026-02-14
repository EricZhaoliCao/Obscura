import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState } from "react";
import { Search, FileText, Plus } from "lucide-react";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: documents } = trpc.documents.list.useQuery();
  const { data: searchResults } = trpc.documents.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );
  const { data: categories } = trpc.categories.list.useQuery();

  const displayDocs = searchQuery ? searchResults : documents;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <div className="flex items-start gap-6 mb-8">
            <div className="accent-square flex-shrink-0"></div>
            <div>
              <h1 className="text-5xl font-bold mb-4">工作文档</h1>
              <p className="text-xl text-muted-foreground">
                记录和管理项目文档
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 border-2 border-foreground focus:border-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Documents List */}
      <section className="container py-16">
        <div className="mb-8">
          <Link href="/documents/new">
            <Button className="border-2 border-foreground">
              <Plus className="w-4 h-4 mr-2" />
              创建新文档
            </Button>
          </Link>
        </div>

        {displayDocs && displayDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDocs.map((doc) => {
              const category = categories?.find((c) => c.id === doc.categoryId);
              return (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <Card className="border-2 border-foreground hover:border-primary transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <FileText className="w-8 h-8 text-primary" />
                        {category && (
                          <div
                            className="w-6 h-6"
                            style={{ backgroundColor: category.color || '#ef4444' }}
                          ></div>
                        )}
                      </div>
                      <CardTitle className="text-xl line-clamp-2">{doc.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-1 bg-secondary text-foreground">
                            {doc.format === 'markdown' ? 'Markdown' : '富文本'}
                          </span>
                          {doc.isPublic && (
                            <span className="px-2 py-1 bg-primary text-primary-foreground">
                              公开
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-foreground/70">
                          更新于 {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                        </p>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {doc.content.substring(0, 150)}...
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="accent-square mx-auto mb-4"></div>
            <p className="text-xl text-muted-foreground mb-4">暂无文档</p>
            <Link href="/documents/new">
              <Button className="border-2 border-foreground">
                创建第一个文档
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
