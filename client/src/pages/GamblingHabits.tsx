import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GamblingHabits() {
  const { isAuthenticated, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: habits, isLoading: habitsLoading, refetch } = trpc.habits.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [formData, setFormData] = useState({
    dailyLimit: habits?.dailyLimit.toString() || "500",
    weeklyLimit: habits?.weeklyLimit.toString() || "3000",
    monthlyLimit: habits?.monthlyLimit.toString() || "10000",
    enableAlerts: habits?.enableAlerts ?? true,
    alertThreshold: habits?.alertThreshold ?? 80,
  });

  const updateHabitsMutation = trpc.habits.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditing(false);
      toast.success("Gambling limits updated successfully");
    },
    onError: () => {
      toast.error("Failed to update gambling limits");
    },
  });

  const handleSave = async () => {
    updateHabitsMutation.mutate({
      dailyLimit: parseFloat(formData.dailyLimit),
      weeklyLimit: parseFloat(formData.weeklyLimit),
      monthlyLimit: parseFloat(formData.monthlyLimit),
      enableAlerts: formData.enableAlerts,
      alertThreshold: formData.alertThreshold,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (habitsLoading || !habits) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dailyPercentage = (habits.todaySpent / habits.dailyLimit) * 100;
  const weeklyPercentage = (habits.thisWeekSpent / habits.weeklyLimit) * 100;
  const monthlyPercentage = (habits.thisMonthSpent / habits.monthlyLimit) * 100;

  const isDailyExceeded = dailyPercentage > 100;
  const isWeeklyExceeded = weeklyPercentage > 100;
  const isMonthlyExceeded = monthlyPercentage > 100;

  const isDailyAlert = dailyPercentage >= habits.alertThreshold;
  const isWeeklyAlert = weeklyPercentage >= habits.alertThreshold;
  const isMonthlyAlert = monthlyPercentage >= habits.alertThreshold;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-3 sm:py-4 flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gambling Habits Control
          </h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="sm">
              Edit Limits
            </Button>
          )}
        </div>
      </header>

      <main className="container py-6 sm:py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Responsible Gambling</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Set and monitor your betting limits to maintain healthy gambling habits</p>
          </div>

          {/* Alert Settings */}
          {isEditing && (
            <Card className="bg-card text-card-foreground border-primary/50">
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>Configure when you want to receive spending alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-alerts" className="text-base font-medium">
                      Enable Spending Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">Get notified when approaching your limits</p>
                  </div>
                  <Switch
                    id="enable-alerts"
                    checked={formData.enableAlerts}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableAlerts: checked })}
                  />
                </div>

                {formData.enableAlerts && (
                  <div>
                    <Label htmlFor="alert-threshold">Alert Threshold: {formData.alertThreshold}%</Label>
                    <Input
                      id="alert-threshold"
                      type="range"
                      min="0"
                      max="100"
                      value={formData.alertThreshold}
                      onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You'll be alerted when you reach {formData.alertThreshold}% of your limit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Spending Limits */}
          {isEditing ? (
            <Card className="bg-card text-card-foreground border-primary/50">
              <CardHeader>
                <CardTitle>Set Your Limits</CardTitle>
                <CardDescription>Define your daily, weekly, and monthly betting budgets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-limit" className="text-sm font-medium">Daily Limit (R)</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekly-limit" className="text-sm font-medium">Weekly Limit (R)</Label>
                  <Input
                    id="weekly-limit"
                    type="number"
                    value={formData.weeklyLimit}
                    onChange={(e) => setFormData({ ...formData, weeklyLimit: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-limit" className="text-sm font-medium">Monthly Limit (R) - Max 10,000</Label>
                  <Input
                    id="monthly-limit"
                    type="number"
                    max="10000"
                    value={formData.monthlyLimit}
                    onChange={(e) => {
                      const val = Math.min(parseFloat(e.target.value) || 0, 10000);
                      setFormData({ ...formData, monthlyLimit: val.toString() });
                    }}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">Maximum monthly limit is R10,000</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={updateHabitsMutation.isPending} className="flex-1">
                    {updateHabitsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Daily Limit */}
              <Card className={`bg-card text-card-foreground ${isDailyExceeded ? "border-red-500/50" : isDailyAlert ? "border-yellow-500/50" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Limit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Spent Today</span>
                      <span className={`font-bold ${isDailyExceeded ? "text-red-500" : "text-primary"}`}>
                        R{habits.todaySpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isDailyExceeded ? "bg-red-500" : isDailyAlert ? "bg-yellow-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      R{habits.dailyLimit.toFixed(2)} limit • {dailyPercentage.toFixed(0)}% used
                    </div>
                  </div>
                  {isDailyExceeded && (
                    <div className="flex gap-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-500">Daily limit exceeded</span>
                    </div>
                  )}
                  {isDailyAlert && !isDailyExceeded && (
                    <div className="flex gap-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-yellow-500">Approaching daily limit</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Limit */}
              <Card className={`bg-card text-card-foreground ${isWeeklyExceeded ? "border-red-500/50" : isWeeklyAlert ? "border-yellow-500/50" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Limit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Spent This Week</span>
                      <span className={`font-bold ${isWeeklyExceeded ? "text-red-500" : "text-primary"}`}>
                        R{habits.thisWeekSpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isWeeklyExceeded ? "bg-red-500" : isWeeklyAlert ? "bg-yellow-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(weeklyPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      R{habits.weeklyLimit.toFixed(2)} limit • {weeklyPercentage.toFixed(0)}% used
                    </div>
                  </div>
                  {isWeeklyExceeded && (
                    <div className="flex gap-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-500">Weekly limit exceeded</span>
                    </div>
                  )}
                  {isWeeklyAlert && !isWeeklyExceeded && (
                    <div className="flex gap-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-yellow-500">Approaching weekly limit</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Limit */}
              <Card className={`bg-card text-card-foreground ${isMonthlyExceeded ? "border-red-500/50" : isMonthlyAlert ? "border-yellow-500/50" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Limit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Spent This Month</span>
                      <span className={`font-bold ${isMonthlyExceeded ? "text-red-500" : "text-primary"}`}>
                        R{habits.thisMonthSpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isMonthlyExceeded ? "bg-red-500" : isMonthlyAlert ? "bg-yellow-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      R{habits.monthlyLimit.toFixed(2)} limit • {monthlyPercentage.toFixed(0)}% used
                    </div>
                  </div>
                  {isMonthlyExceeded && (
                    <div className="flex gap-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-500">Monthly limit exceeded</span>
                    </div>
                  )}
                  {isMonthlyAlert && !isMonthlyExceeded && (
                    <div className="flex gap-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-yellow-500">Approaching monthly limit</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Responsible Gambling Tips */}
          <Card className="bg-primary/10 text-card-foreground border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Responsible Gambling Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p>✓ <strong>Set realistic limits:</strong> Only bet money you can afford to lose</p>
                <p>✓ <strong>Take breaks:</strong> Step away from betting regularly to maintain perspective</p>
                <p>✓ <strong>Track spending:</strong> Monitor your bets and winnings/losses consistently</p>
                <p>✓ <strong>Avoid chasing losses:</strong> Never increase bets to recover losses quickly</p>
                <p>✓ <strong>Use daily limits:</strong> Stick to your daily betting budget strictly</p>
                <p>✓ <strong>Seek support:</strong> If gambling becomes problematic, reach out for help</p>
              </div>
              <div className="pt-4 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">
                  If you're struggling with gambling, please contact the National Gambling Board or a mental health professional.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
