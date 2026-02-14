import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function BlogEditor() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isEditing = !!id;
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  
  const { data: post } = trpc.blog.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: isEditing }
  );
  const { data: categories } = trpc.categories.list.useQuery();
  
  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      toast.success("文章已创建");
      setLocation('/blog');
    },
  });
  
  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast.success("文章已保存");
    },
  });
  
  const generateSummary = trpc.ai.generateSummary.useMutation({
    onSuccess: (data) => {
      const summary = typeof data.summary === 'string' ? data.summary : '';
      setExcerpt(summary);
      toast.success("摘要已生成");
    },
  });
  
  const generateTags = trpc.ai.generateTags.useMutation({
    onSuccess: (data) => {
      toast.success(`标签建议: ${data.tags.join(", ")}`);
    },
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setContent(post.content);
      setExcerpt(post.excerpt || "");
      setCoverImage(post.coverImage || "");
      setCategoryId(post.categoryId?.toString() || "");
      setIsPublished(post.isPublished);
    }
  }, [post]);

  const handleSave = () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("请填写标题、Slug 和内容");
      return;
    }

    const data = {
      title,
      slug,
      content,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      isPublished,
    };

    if (isEditing) {
      updateMutation.mutate({ id: parseInt(id!), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-foreground">
        <div className="container py-8">
          <Link href="/blog">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回博客
            </Button>
          </Link>
          
          <div className="flex items-start gap-6">
            <div className="accent-square flex-shrink-0"></div>
            <div>
              <h1 className="text-4xl font-bold">
                {isEditing ? "编辑文章" : "创建新文章"}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Editor */}
      <div className="container py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Basic Info */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!isEditing && !slug) {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, ''));
                    }
                  }}
                  className="border-2 border-foreground"
                  placeholder="文章标题"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="border-2 border-foreground"
                  placeholder="article-slug"
                />
              </div>
              
              <div>
                <Label htmlFor="category">分类</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="coverImage">封面图片 URL</Label>
                <Input
                  id="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="border-2 border-foreground"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle>内容 (支持 Markdown)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border-2 border-foreground font-mono"
                rows={20}
                placeholder="使用 Markdown 编写文章内容..."
              />
            </CardContent>
          </Card>

          {/* Excerpt & AI Tools */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>摘要</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSummary.mutate({ content })}
                  disabled={!content || generateSummary.isPending}
                  className="border-2 border-foreground"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 生成摘要
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="border-2 border-foreground"
                rows={3}
                placeholder="文章摘要（可选）"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateTags.mutate({ content })}
                disabled={!content || generateTags.isPending}
                className="border-2 border-foreground"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI 标签建议
              </Button>
            </CardContent>
          </Card>

          {/* Publish Settings */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="publish">发布状态</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublished ? "文章已发布" : "保存为草稿"}
                  </p>
                </div>
                <Switch
                  id="publish"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="border-2 border-foreground"
            >
              {isEditing ? "保存更改" : "创建文章"}
            </Button>
            {isEditing && post && (
              <Link href={`/blog/${post.slug}`}>
                <Button variant="outline" className="border-2 border-foreground">
                  预览
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
