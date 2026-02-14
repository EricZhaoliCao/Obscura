import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Moon, Utensils, Droplets, Activity, Smile } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Health() {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState<"poor" | "fair" | "good" | "excellent">("good");
  const [meals, setMeals] = useState("");
  const [water, setWater] = useState("");
  const [exercise, setExercise] = useState("");
  const [exerciseDuration, setExerciseDuration] = useState("");
  const [mood, setMood] = useState<"bad" | "okay" | "good" | "great">("good");
  const [notes, setNotes] = useState("");

  const { data: records, refetch } = trpc.health.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.health.create.useMutation({
    onSuccess: () => {
      toast.success("健康记录已添加");
      utils.health.list.invalidate();
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.health.delete.useMutation({
    onSuccess: () => {
      toast.success("记录已删除");
      utils.health.list.invalidate();
    },
  });

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setSleepHours("");
    setSleepQuality("good");
    setMeals("");
    setWater("");
    setExercise("");
    setExerciseDuration("");
    setMood("good");
    setNotes("");
  };

  const handleSubmit = () => {
    createMutation.mutate({
      date: new Date(date),
      sleepHours: sleepHours ? parseInt(sleepHours) : undefined,
      sleepQuality,
      meals: meals || undefined,
      water: water ? parseInt(water) : undefined,
      exercise: exercise || undefined,
      exerciseDuration: exerciseDuration ? parseInt(exerciseDuration) : undefined,
      mood,
      notes: notes || undefined,
    });
  };

  // Prepare chart data
  const chartData = records
    ?.slice(0, 14)
    .reverse()
    .map((record) => ({
      date: format(new Date(record.date), "MM/dd", { locale: zhCN }),
      sleep: record.sleepHours ? Math.round(record.sleepHours / 60 * 10) / 10 : 0,
      water: record.water ? record.water / 1000 : 0,
      exercise: record.exerciseDuration || 0,
    })) || [];

  const avgSleep = records && records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.sleepHours || 0), 0) / records.length / 60 * 10) / 10
    : 0;
  const avgWater = records && records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.water || 0), 0) / records.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <div className="flex items-start gap-6 mb-8">
            <div className="accent-square flex-shrink-0"></div>
            <div>
              <h1 className="text-5xl font-bold mb-4">健康管理</h1>
              <p className="text-xl text-muted-foreground">
                记录和追踪每日健康数据
              </p>
            </div>
          </div>

          <Button onClick={() => setShowForm(!showForm)} className="border-2 border-foreground">
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "取消" : "添加记录"}
          </Button>
        </div>
      </section>

      {/* Form */}
      {showForm && (
        <section className="border-b border-foreground">
          <div className="container py-16">
            <Card className="border-2 border-foreground max-w-4xl">
              <CardHeader>
                <CardTitle>添加健康记录</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">日期</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="border-2 border-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sleepHours">睡眠时长（分钟）</Label>
                    <Input
                      id="sleepHours"
                      type="number"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      className="border-2 border-foreground"
                      placeholder="480"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sleepQuality">睡眠质量</Label>
                    <Select value={sleepQuality} onValueChange={(v: any) => setSleepQuality(v)}>
                      <SelectTrigger className="border-2 border-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poor">差</SelectItem>
                        <SelectItem value="fair">一般</SelectItem>
                        <SelectItem value="good">良好</SelectItem>
                        <SelectItem value="excellent">优秀</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="water">饮水量（毫升）</Label>
                    <Input
                      id="water"
                      type="number"
                      value={water}
                      onChange={(e) => setWater(e.target.value)}
                      className="border-2 border-foreground"
                      placeholder="2000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise">运动类型</Label>
                    <Input
                      id="exercise"
                      value={exercise}
                      onChange={(e) => setExercise(e.target.value)}
                      className="border-2 border-foreground"
                      placeholder="跑步、游泳等"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exerciseDuration">运动时长（分钟）</Label>
                    <Input
                      id="exerciseDuration"
                      type="number"
                      value={exerciseDuration}
                      onChange={(e) => setExerciseDuration(e.target.value)}
                      className="border-2 border-foreground"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mood">心情</Label>
                    <Select value={mood} onValueChange={(v: any) => setMood(v)}>
                      <SelectTrigger className="border-2 border-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bad">糟糕</SelectItem>
                        <SelectItem value="okay">一般</SelectItem>
                        <SelectItem value="good">良好</SelectItem>
                        <SelectItem value="great">很棒</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="meals">饮食记录</Label>
                  <Textarea
                    id="meals"
                    value={meals}
                    onChange={(e) => setMeals(e.target.value)}
                    className="border-2 border-foreground"
                    rows={3}
                    placeholder="早餐：燕麦粥&#10;午餐：鸡胸肉沙拉&#10;晚餐：三文鱼配蔬菜"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border-2 border-foreground"
                    rows={2}
                    placeholder="其他备注信息"
                  />
                </div>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  保存记录
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Statistics */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <h2 className="text-3xl font-bold mb-8">健康统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Moon className="w-8 h-8 text-primary" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{avgSleep}h</p>
                    <p className="text-sm text-muted-foreground">平均睡眠</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="w-8 h-8 text-primary" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{avgWater}ml</p>
                    <p className="text-sm text-muted-foreground">平均饮水</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-primary" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{records?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">总记录数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Charts */}
      {chartData.length > 0 && (
        <section className="border-b border-foreground">
          <div className="container py-16">
            <h2 className="text-3xl font-bold mb-8">趋势图表</h2>
            <div className="space-y-8">
              <Card className="border-2 border-foreground">
                <CardHeader>
                  <CardTitle>睡眠时长趋势（小时）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sleep" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-2 border-foreground">
                <CardHeader>
                  <CardTitle>饮水量趋势（升）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="water" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-2 border-foreground">
                <CardHeader>
                  <CardTitle>运动时长趋势（分钟）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="exercise" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Records List */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8">历史记录</h2>
        {records && records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id} className="border border-foreground">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(new Date(record.date), "yyyy年MM月dd日", { locale: zhCN })}
                    </CardTitle>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("确定要删除这条记录吗?")) {
                          deleteMutation.mutate({ id: record.id });
                        }
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {record.sleepHours && (
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-muted-foreground" />
                        <span>{Math.round(record.sleepHours / 60 * 10) / 10}小时</span>
                      </div>
                    )}
                    {record.water && (
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-muted-foreground" />
                        <span>{record.water}ml</span>
                      </div>
                    )}
                    {record.exercise && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span>{record.exercise} {record.exerciseDuration}分钟</span>
                      </div>
                    )}
                    {record.mood && (
                      <div className="flex items-center gap-2">
                        <Smile className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {record.mood === 'bad' && '糟糕'}
                          {record.mood === 'okay' && '一般'}
                          {record.mood === 'good' && '良好'}
                          {record.mood === 'great' && '很棒'}
                        </span>
                      </div>
                    )}
                  </div>
                  {record.meals && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-1">饮食：</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.meals}</p>
                    </div>
                  )}
                  {record.notes && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-1">备注：</p>
                      <p className="text-sm text-muted-foreground">{record.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="accent-square mx-auto mb-4"></div>
            <p className="text-xl text-muted-foreground mb-4">暂无健康记录</p>
            <Button onClick={() => setShowForm(true)} className="border-2 border-foreground">
              添加第一条记录
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
