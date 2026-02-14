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
import { ArrowLeft, Sparkles, Mic } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function DocumentEditor() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isEditing = id !== 'new';
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<'markdown' | 'richtext'>('markdown');
  const [categoryId, setCategoryId] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const { data: document } = trpc.documents.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: isEditing }
  );
  const { data: categories } = trpc.categories.list.useQuery();
  
  const createMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      toast.success("文档已创建");
      setLocation('/documents');
    },
  });
  
  const updateMutation = trpc.documents.update.useMutation({
    onSuccess: () => {
      toast.success("文档已保存");
    },
  });
  
  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("文档已删除");
      setLocation('/documents');
    },
  });
  
  const improveWriting = trpc.ai.improveWriting.useMutation({
    onSuccess: (data) => {
      const improved = typeof data.improved === 'string' ? data.improved : '';
      setContent(improved);
      toast.success("内容已优化");
    },
  });

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setFormat(document.format);
      setCategoryId(document.categoryId?.toString() || "");
      setIsPublic(document.isPublic);
    }
  }, [document]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("请填写标题和内容");
      return;
    }

    const data = {
      title,
      content,
      format,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      isPublic,
    };

    if (isEditing) {
      updateMutation.mutate({ id: parseInt(id!), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("您的浏览器不支持语音录入");
      return;
    }

    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        // TODO: Upload to S3 and transcribe
        toast.info("语音转文本功能开发中");
        setIsRecording(false);
      };

      mediaRecorder.start();

      // Stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }
      }, 30000);
    } catch (error) {
      toast.error("无法访问麦克风");
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-foreground">
        <div className="container py-8">
          <Link href="/documents">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回文档列表
            </Button>
          </Link>
          
          <div className="flex items-start gap-6">
            <div className="accent-square flex-shrink-0"></div>
            <div>
              <h1 className="text-4xl font-bold">
                {isEditing ? "编辑文档" : "创建新文档"}
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
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-2 border-foreground"
                  placeholder="文档标题"
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
                <Label htmlFor="format">格式</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as 'markdown' | 'richtext')}>
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="richtext">富文本</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public">公开文档</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublic ? "所有人可见" : "仅自己可见"}
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>内容</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceInput}
                    disabled={isRecording}
                    className="border-2 border-foreground"
                  >
                    <Mic className={`w-4 h-4 mr-2 ${isRecording ? 'text-primary animate-pulse' : ''}`} />
                    {isRecording ? "录音中..." : "语音输入"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => improveWriting.mutate({ content })}
                    disabled={!content || improveWriting.isPending}
                    className="border-2 border-foreground"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 优化
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border-2 border-foreground font-mono"
                rows={20}
                placeholder={format === 'markdown' ? "使用 Markdown 编写..." : "编写文档内容..."}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="border-2 border-foreground"
            >
              {isEditing ? "保存更改" : "创建文档"}
            </Button>
            {isEditing && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("确定要删除这个文档吗?")) {
                    deleteMutation.mutate({ id: parseInt(id!) });
                  }
                }}
              >
                删除文档
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
