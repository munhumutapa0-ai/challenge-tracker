import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Loader2, Plus, XCircle, Trophy, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";
import AddBetDialog from "@/components/AddBetDialog";
import { toast } from "sonner";

export default function ChallengeDetail() {
  const [, params] = useRoute("/challenge/:id");
  const challengeId = params?.id ? parseInt(params.id) : 0;
  const { isAuthenticated } = useAuth();
  const [addBetDialogOpen, setAddBetDialogOpen] = useState(false);

  const { data: challenge, isLoading } = trpc.challenge.getById.useQuery(
    { id: challengeId },
    { enabled: isAuthenticated && challengeId > 0 }
  );

  const utils = trpc.useUtils();
  const updateResultMutation = trpc.bet.updateResult.useMutation({
    onSuccess: () => {
      toast.success("Bet result updated!");
      utils.challenge.getById.invalidate({ id: challengeId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update bet result");
    },
  });

  const updateStatusMutation = trpc.challenge.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Challenge status updated!");
      utils.challenge.getById.invalidate({ id: challengeId });
      utils.challenge.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update challenge status");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Challenge not found</h2>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const bets = challenge.bets || [];
  const currentBalance = bets.reduce((acc, bet) => {
    if (bet.result === "win") return acc + bet.stakeAmount + bet.profit;
    if (bet.result === "loss") return acc - bet.stakeAmount;
    return acc;
  }, challenge.initialStake);

  // Calculate next stake based on strategy
  const nextStake = challenge.strategy === "compound" 
    ? currentBalance 
    : challenge.initialStake;
  
  // For take-profit strategy, track accumulated profit separately
  const accumulatedProfit = challenge.strategy === "take-profit"
    ? bets.reduce((acc, bet) => {
      if (bet.result === "win") return acc + bet.profit;
      if (bet.result === "loss") return acc - bet.stakeAmount;
      return acc;
    }, 0)
    : 0;
  
  // For take-profit strategy, total is stake + accumulated profit
  const displayBalance = challenge.strategy === "take-profit"
    ? challenge.initialStake + accumulatedProfit
    : currentBalance;

  const progress = Math.min((displayBalance / challenge.targetAmount) * 100, 100);
  const completedBets = bets.filter(b => b.result !== "pending").length;
  const wins = bets.filter(b => b.result === "win").length;
  const losses = bets.filter(b => b.result === "loss").length;

  const handleMarkResult = (betId: number, result: "win" | "loss") => {
    updateResultMutation.mutate({ betId, result });
  };

  const handleCompleteChallenge = () => {
    const status = displayBalance >= challenge.targetAmount ? "completed" : "failed";
    updateStatusMutation.mutate({ id: challengeId, status });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{challenge.name}</h1>
          </div>
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${
              challenge.status === "active"
                ? "bg-primary/10 text-primary"
                : challenge.status === "completed"
                ? "bg-green-500/10 text-green-600"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {challenge.status}
          </span>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardDescription>Current Balance</CardDescription>
              <CardTitle className="text-xl sm:text-2xl">R{displayBalance.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardDescription>Target Amount</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-primary">R{challenge.targetAmount.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-2xl">
                {completedBets > 0 ? ((wins / completedBets) * 100).toFixed(0) : 0}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardDescription>Progress</CardDescription>
              <CardTitle className="text-2xl">{completedBets}/{challenge.daysTotal}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <CardTitle>Challenge Progress</CardTitle>
                <CardDescription>
                  {progress.toFixed(1)}% to target • Next stake: R{nextStake.toFixed(2)}
                </CardDescription>
              </div>
              {challenge.status === "active" && completedBets < challenge.daysTotal && (
                <Button onClick={() => setAddBetDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bet
                </Button>
              )}
              {challenge.status === "active" && completedBets >= challenge.daysTotal && (
                <Button onClick={handleCompleteChallenge} variant="default">
                  <Trophy className="h-4 w-4 mr-2" />
                  Complete Challenge
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Strategy Info */}
        <Card className="bg-primary/5 border-primary/20 text-card-foreground">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{challenge.strategy === "compound" ? "Compound" : "Take Profit"} Strategy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-foreground">Odds:</span> {challenge.odds}x per bet
            </p>
            <p>
              <span className="font-semibold text-foreground">Strategy:</span> {challenge.strategy === "compound" ? "Reinvest entire balance (stake + profit) on each winning bet" : "Keep initial stake fixed, accumulate profit separately"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Current stake:</span> R{nextStake.toFixed(2)}
            </p>
            {challenge.strategy === "take-profit" && (
              <p>
                <span className="font-semibold text-foreground">Accumulated profit:</span> R{accumulatedProfit.toFixed(2)}
              </p>
            )}
            <p>
              <span className="font-semibold text-foreground">Note:</span> Each bet can have different odds (1.01 - 1.3)
            </p>
          </CardContent>
        </Card>

        {/* Bets List */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Daily Bets</CardTitle>
            <CardDescription>Track each day's bet and result</CardDescription>
          </CardHeader>
          <CardContent>
            {bets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No bets recorded yet. Add your first bet to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-background"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">Day {bet.dayNumber}</span>
                        <span className="text-foreground font-medium">{bet.teamName}</span>
                        {bet.result === "win" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {bet.result === "loss" && <XCircle className="h-5 w-5 text-destructive" />}
                      </div>
                      {bet.matchDetails && (
                        <p className="text-sm text-muted-foreground mt-1">{bet.matchDetails}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Stake: <span className="font-medium text-foreground">R{bet.stakeAmount.toFixed(2)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Odds: <span className="font-medium text-foreground">{bet.odds.toFixed(2)}x</span>
                        </span>
                        {bet.result !== "pending" && (
                          <span className="text-muted-foreground">
                            Result:{" "}
                            <span
                              className={`font-medium ${
                                bet.profit > 0 ? "text-green-600" : "text-destructive"
                              }`}
                            >
                              {bet.profit > 0 ? "+" : ""}R{bet.profit.toFixed(2)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {bet.result === "pending" && challenge.status === "active" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkResult(bet.id, "win")}
                          disabled={updateResultMutation.isPending}
                        >
                          Win
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleMarkResult(bet.id, "loss")}
                          disabled={updateResultMutation.isPending}
                        >
                          Loss
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddBetDialog
        open={addBetDialogOpen}
        onOpenChange={setAddBetDialogOpen}
        challengeId={challengeId}
        nextDayNumber={bets.length + 1}
        nextStake={nextStake}
      />
    </div>
  );
}
