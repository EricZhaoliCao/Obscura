import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

const COLORS = ['#ef4444', '#000000', '#666666', '#999999', '#cccccc'];

export default function Finance() {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: transactions } = trpc.finance.listTransactions.useQuery();
  const { data: balance } = trpc.finance.getLatestBalance.useQuery();
  const { data: balanceHistory } = trpc.finance.getBalanceHistory.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.finance.createTransaction.useMutation({
    onSuccess: () => {
      toast.success("交易记录已添加");
      utils.finance.listTransactions.invalidate();
      utils.finance.getLatestBalance.invalidate();
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.finance.deleteTransaction.useMutation({
    onSuccess: () => {
      toast.success("记录已删除");
      utils.finance.listTransactions.invalidate();
    },
  });

  const updateBalanceMutation = trpc.finance.updateBalance.useMutation({
    onSuccess: () => {
      toast.success("余额已更新");
      utils.finance.getLatestBalance.invalidate();
      utils.finance.getBalanceHistory.invalidate();
    },
  });

  const resetForm = () => {
    setType("expense");
    setCategory("");
    setAmount("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = () => {
    if (!category || !amount) {
      toast.error("请填写必填项");
      return;
    }

    createMutation.mutate({
      type,
      category,
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      description: description || undefined,
      date: new Date(date),
      currency: "CNY",
    });
  };

  const handleUpdateBalance = () => {
    const newBalance = prompt("请输入当前余额（元）：");
    if (newBalance) {
      updateBalanceMutation.mutate({
        amount: Math.round(parseFloat(newBalance) * 100),
        currency: "CNY",
        date: new Date(),
      });
    }
  };

  // Calculate statistics
  const totalIncome = transactions
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalExpense = transactions
    ?.filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  // Category breakdown
  const categoryData = transactions?.reduce((acc, t) => {
    const existing = acc.find((item) => item.name === t.category && item.type === t.type);
    if (existing) {
      existing.value += t.amount;
    } else {
      acc.push({ name: t.category, value: t.amount, type: t.type });
    }
    return acc;
  }, [] as { name: string; value: number; type: string }[]) || [];

  const expenseByCategory = categoryData
    .filter((item) => item.type === "expense")
    .map((item) => ({ name: item.name, value: item.value / 100 }));

  // Balance history chart
  const balanceChartData = balanceHistory
    ?.slice(0, 12)
    .reverse()
    .map((b) => ({
      date: format(new Date(b.date), "MM/dd", { locale: zhCN }),
      balance: b.amount / 100,
    })) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-foreground">
        <div className="container py-16">
          <div className="flex items-start gap-6 mb-8">
            <div className="accent-square flex-shrink-0"></div>
            <div>
              <h1 className="text-5xl font-bold mb-4">财务管理</h1>
              <p className="text-xl text-muted-foreground">
                记录和追踪公司财务状况
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setShowForm(!showForm)} className="border-2 border-foreground">
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? "取消" : "添加交易"}
            </Button>
            <Button onClick={handleUpdateBalance} variant="outline" className="border-2 border-foreground">
              <Wallet className="w-4 h-4 mr-2" />
              更新余额
            </Button>
          </div>
        </div>
      </section>

      {/* Form */}
      {showForm && (
        <section className="border-b border-foreground">
          <div className="container py-16">
            <Card className="border-2 border-foreground max-w-4xl">
              <CardHeader>
                <CardTitle>添加交易记录</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">类型</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger className="border-2 border-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">收入</SelectItem>
                        <SelectItem value="expense">支出</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">分类 *</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border-2 border-foreground"
                      placeholder="工资、投资、设备、服务等"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">金额（元）*</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-2 border-foreground"
                      placeholder="1000.00"
                    />
                  </div>
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
                </div>
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-2 border-foreground"
                    rows={3}
                    placeholder="交易详情说明"
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
          <h2 className="text-3xl font-bold mb-8">财务概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 border-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-8 h-8 text-primary" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">¥{balance ? (balance.amount / 100).toFixed(2) : "0.00"}</p>
                    <p className="text-sm text-muted-foreground">当前余额</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">¥{(totalIncome / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">总收入</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-8 h-8 text-red-600" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">¥{(totalExpense / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">总支出</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">¥{((totalIncome - totalExpense) / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">净收益</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Charts */}
      {(balanceChartData.length > 0 || expenseByCategory.length > 0) && (
        <section className="border-b border-foreground">
          <div className="container py-16">
            <h2 className="text-3xl font-bold mb-8">财务图表</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {balanceChartData.length > 0 && (
                <Card className="border-2 border-foreground">
                  <CardHeader>
                    <CardTitle>余额变化趋势</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={balanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="balance" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {expenseByCategory.length > 0 && (
                <Card className="border-2 border-foreground">
                  <CardHeader>
                    <CardTitle>支出分类占比</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ¥${entry.value.toFixed(0)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Transactions List */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8">交易记录</h2>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="border border-foreground">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <p className="font-semibold">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), "yyyy年MM月dd日", { locale: zhCN })}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`text-2xl font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "income" ? "+" : "-"}¥{(transaction.amount / 100).toFixed(2)}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("确定要删除这条记录吗？")) {
                            deleteMutation.mutate({ id: transaction.id });
                          }
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="accent-square mx-auto mb-4"></div>
            <p className="text-xl text-muted-foreground mb-4">暂无交易记录</p>
            <Button onClick={() => setShowForm(true)} className="border-2 border-foreground">
              添加第一条记录
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
