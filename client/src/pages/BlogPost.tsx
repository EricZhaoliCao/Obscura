import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { Heart, Eye, ArrowLeft, MessageCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const [commentContent, setCommentContent] = useState("");
  
  const { data: post, isLoading } = trpc.blog.getBySlug.useQuery({ slug: slug! });
  const { data: comments } = trpc.comments.listByPost.useQuery(
    { postId: post?.id || 0 },
    { enabled: !!post }
  );
  const { data: likesData } = trpc.likes.getByPost.useQuery(
    { postId: post?.id || 0 },
    { enabled: !!post }
  );
  const { data: categories } = trpc.categories.list.useQuery();
  
  const toggleLike = trpc.likes.toggle.useMutation({
    onSuccess: () => {
      utils.likes.getByPost.invalidate({ postId: post?.id || 0 });
    },
  });
  
  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.listByPost.invalidate({ postId: post?.id || 0 });
      setCommentContent("");
      toast.success("评论已发布");
    },
  });
  
  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      toast.success("文章已删除");
      setLocation("/blog");
    },
  });

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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="accent-square mx-auto"></div>
          <p className="text-xl">文章未找到</p>
          <Link href="/blog">
            <Button variant="outline" className="border-2 border-foreground">
              返回博客
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = categories?.find((c) => c.id === post.categoryId);
  const userLiked = likesData?.likes.some((like) => like.userId === user?.id);

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
          
          {user?.role === 'admin' && (
            <div className="flex gap-2 mb-4">
              <Link href={`/blog/edit/${post.id}`}>
                <Button variant="outline" className="border-2 border-foreground">
                  编辑
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("确定要删除这篇文章吗?")) {
                    deleteMutation.mutate({ id: post.id });
                  }
                }}
              >
                删除
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Article Content */}
      <article className="container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Title and Meta */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              {category && (
                <div
                  className="w-12 h-12"
                  style={{ backgroundColor: category.color || '#ef4444' }}
                ></div>
              )}
              <div>
                <h1 className="text-5xl font-bold mb-2">{post.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.viewCount} 浏览</span>
                  </div>
                  <span>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('zh-CN')
                      : '未发布'}
                  </span>
                </div>
              </div>
            </div>
            
            {post.coverImage && (
              <div className="aspect-video bg-secondary border-2 border-foreground overflow-hidden mb-8">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <Streamdown>{post.content}</Streamdown>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 py-8 border-t border-b border-foreground">
            <Button
              variant={userLiked ? "default" : "outline"}
              className="border-2 border-foreground"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error("请先登录");
                  return;
                }
                toggleLike.mutate({ postId: post.id });
              }}
            >
              <Heart className={`w-4 h-4 mr-2 ${userLiked ? 'fill-current' : ''}`} />
              {likesData?.count || 0} 点赞
            </Button>
            <Button variant="outline" className="border-2 border-foreground">
              <MessageCircle className="w-4 h-4 mr-2" />
              {comments?.length || 0} 评论
            </Button>
          </div>

          {/* Comments Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-8">评论</h2>
            
            {/* Comment Form */}
            {isAuthenticated ? (
              <Card className="border-2 border-foreground mb-8">
                <CardContent className="pt-6">
                  <Textarea
                    placeholder="写下你的评论..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="mb-4 border-2 border-foreground"
                    rows={4}
                  />
                  <Button
                    onClick={() => {
                      if (!commentContent.trim()) {
                        toast.error("请输入评论内容");
                        return;
                      }
                      createComment.mutate({
                        postId: post.id,
                        content: commentContent,
                      });
                    }}
                    disabled={createComment.isPending}
                  >
                    发布评论
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-foreground mb-8">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">登录后即可评论</p>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <Card key={comment.id} className="border border-foreground">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">用户 #{comment.authorId}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无评论</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
