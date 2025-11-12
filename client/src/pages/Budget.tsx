import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function Budget() {
  const { isAuthenticated, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    period: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const { data: budgets, isLoading: budgetsLoading, refetch } = trpc.budget.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createBudgetMutation = trpc.budget.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setFormData({
        name: "",
        amount: "",
        period: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
    },
  });

  const handleCreateBudget = async () => {
    if (!formData.name || !formData.amount) return;

    createBudgetMutation.mutate({
      name: formData.name,
      amount: parseFloat(formData.amount),
      period: formData.period as "daily" | "weekly" | "monthly" | "yearly",
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const periodLabels = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-3 sm:py-4 flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Budget Management</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>Set up a new budget to track your spending</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget-name">Budget Name</Label>
                  <Input
                    id="budget-name"
                    placeholder="e.g., Monthly Betting Budget"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="budget-amount">Amount (R)</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    placeholder="1000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="budget-period">Period</Label>
                  <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateBudget} disabled={createBudgetMutation.isPending} className="w-full">
                  {createBudgetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Budgets</h2>
            <p className="text-muted-foreground">Set spending limits and track your budget usage</p>
          </div>

          {budgetsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !budgets || budgets.length === 0 ? (
            <Card className="bg-card text-card-foreground">
              <CardContent className="py-12 text-center">
                <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No budgets yet</p>
                <p className="text-sm text-muted-foreground mb-6">Create your first budget to start tracking spending</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => {
                const percentage = (budget.spent / budget.amount) * 100;
                const isExceeded = percentage > 100;

                return (
                  <Card key={budget.id} className="bg-card text-card-foreground">
                    <CardHeader>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {periodLabels[budget.period as keyof typeof periodLabels]} • {budget.status}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Spent</span>
                          <span className={`font-bold ${isExceeded ? "text-red-500" : "text-primary"}`}>
                            R{budget.spent.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${isExceeded ? "bg-red-500" : "bg-primary"}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          R{budget.amount.toFixed(2)} limit • {percentage.toFixed(0)}% used
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
