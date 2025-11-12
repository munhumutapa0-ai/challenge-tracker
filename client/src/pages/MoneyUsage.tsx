import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Wallet } from "lucide-react";
import { useState } from "react";

const EXPENSE_CATEGORIES = ["Betting", "Food", "Transport", "Entertainment", "Utilities", "Other"];

export default function MoneyUsage() {
  const { isAuthenticated, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "Betting",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { data: expenses, isLoading: expensesLoading, refetch } = trpc.expense.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createExpenseMutation = trpc.expense.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setFormData({
        category: "Betting",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
    },
  });

  const handleCreateExpense = async () => {
    if (!formData.amount) return;

    createExpenseMutation.mutate({
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      date: new Date(formData.date),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate totals by category
  const categoryTotals = (expenses || []).reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-3 sm:py-4 flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Money Usage Tracking</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Log Expense</DialogTitle>
                <DialogDescription>Track where your money is being spent</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount (R)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Football betting"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <Button onClick={handleCreateExpense} disabled={createExpenseMutation.isPending} className="w-full">
                  {createExpenseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Log Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Spending Overview</h2>
            <p className="text-muted-foreground">Monitor your expenses across different categories</p>
          </div>

          {/* Total Spent Card */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">R{totalSpent.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-2">{(expenses || []).length} transactions</p>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {Object.keys(categoryTotals).length > 0 && (
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = (amount / totalSpent) * 100;
                    return (
                      <div key={category}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm font-bold text-primary">R{amount.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(0)}% of total</div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* Recent Expenses */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Your latest spending transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !expenses || expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No expenses logged yet</p>
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{expense.category}</p>
                        {expense.description && <p className="text-sm text-muted-foreground">{expense.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-bold text-primary">R{expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
