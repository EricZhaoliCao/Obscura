import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, BookOpen, Bell } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="accent-square mx-auto animate-pulse"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Red Accent */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-start gap-6">
                <div className="accent-square flex-shrink-0"></div>
                <div>
                  <h1 className="text-6xl font-bold mb-4">OBSCURA</h1>
                  <p className="text-2xl font-bold leading-relaxed mb-2">
                    潜在之形，悄然显现
                  </p>
                  <p className="text-lg font-light italic text-muted-foreground">
                    Where latent forms emerge
                  </p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={<FileText className="w-6 h-6" />}
                  label="工作文档"
                  value={stats?.documentCount || 0}
                />
                <StatCard
                  icon={<Upload className="w-6 h-6" />}
                  label="上传文件"
                  value={stats?.fileCount || 0}
                />
                <StatCard
                  icon={<BookOpen className="w-6 h-6" />}
                  label="博客文章"
                  value={stats?.blogPostCount || 0}
                />
                <StatCard
                  icon={<Bell className="w-6 h-6" />}
                  label="未读通知"
                  value={stats?.unreadNotifications || 0}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Categories */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <h2 className="text-3xl font-bold mb-8">业务领域</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories?.map((category) => (
              <Link key={category.id} href={`/blog?category=${category.slug}`}>
                <Card className="border-2 border-foreground hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div
                      className="w-12 h-12 mb-4"
                      style={{ backgroundColor: category.color || '#ef4444' }}
                    ></div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardDescription className="text-foreground/70">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <h2 className="text-3xl font-bold mb-8">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard
              title="创建文档"
              description="记录工作笔记和项目文档"
              href="/documents/new"
              icon={<FileText className="w-8 h-8" />}
            />
            <ActionCard
              title="上传文件"
              description="管理项目文件和资源"
              href="/files"
              icon={<Upload className="w-8 h-8" />}
            />
            <ActionCard
              title="发布博客"
              description="分享见解和技术文章"
              href="/blog/new"
              icon={<BookOpen className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* Recent Documents */}
      {stats?.recentDocuments && stats.recentDocuments.length > 0 && (
        <section className="border-b border-foreground">
          <div className="container py-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">最近文档</h2>
              <Link href="/documents">
                <Button variant="outline" className="border-2 border-foreground">
                  查看全部
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {stats.recentDocuments.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <Card className="border border-foreground hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>
                        更新于 {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="border-2 border-foreground">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-muted-foreground">{icon}</div>
          <div className="text-3xl font-bold">{value}</div>
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="border-2 border-foreground hover:border-primary transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="text-primary mb-4">{icon}</div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-foreground/70">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
