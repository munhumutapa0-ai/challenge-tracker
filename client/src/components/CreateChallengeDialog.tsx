import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Strategy = "compound" | "take-profit";

export default function CreateChallengeDialog({ open, onOpenChange }: CreateChallengeDialogProps) {
  const [name, setName] = useState("");
  const [initialStake, setInitialStake] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [odds, setOdds] = useState("1.3");
  const [daysTotal, setDaysTotal] = useState("15");
  const [strategy, setStrategy] = useState<Strategy>("compound");
  const [showCalculator, setShowCalculator] = useState(false);

  // Calculator state
  const [calcStake, setCalcStake] = useState("");
  const [calcTarget, setCalcTarget] = useState("");
  const [calcOdds, setCalcOdds] = useState("1.3");
  const [calcDays, setCalcDays] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const createMutation = trpc.challenge.create.useMutation({
    onSuccess: () => {
      toast.success("Challenge created successfully!");
      utils.challenge.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create challenge");
    },
  });

  const resetForm = () => {
    setName("");
    setInitialStake("");
    setTargetAmount("");
    setOdds("1.3");
    setDaysTotal("15");
    setStrategy("compound");
  };

  const calculateDaysNeeded = () => {
    const stake = parseFloat(calcStake);
    const target = parseFloat(calcTarget);
    const oddsValue = parseFloat(calcOdds);

    if (isNaN(stake) || stake <= 0) {
      toast.error("Please enter a valid initial stake");
      return;
    }

    if (isNaN(target) || target <= stake) {
      toast.error("Target must be greater than initial stake");
      return;
    }

    if (isNaN(oddsValue) || oddsValue <= 1) {
      toast.error("Odds must be greater than 1.0");
      return;
    }

    // Calculate days needed for compound growth
    // Formula: finalAmount = initialStake * (odds ^ days)
    // days = log(finalAmount / initialStake) / log(odds)
    const daysNeeded = Math.ceil(Math.log(target / stake) / Math.log(oddsValue));
    setCalcDays(daysNeeded);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stake = parseFloat(initialStake);
    const target = parseFloat(targetAmount);
    const oddsValue = parseFloat(odds);
    const days = parseInt(daysTotal);

    if (!name.trim()) {
      toast.error("Please enter a challenge name");
      return;
    }

    if (isNaN(stake) || stake <= 0) {
      toast.error("Please enter a valid initial stake");
      return;
    }

    if (isNaN(target) || target <= stake) {
      toast.error("Target amount must be greater than initial stake");
      return;
    }

    if (isNaN(oddsValue) || oddsValue <= 1) {
      toast.error("Odds must be greater than 1.0");
      return;
    }

    if (isNaN(days) || days <= 0) {
      toast.error("Please enter a valid number of days");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      initialStake: stake,
      targetAmount: target,
      odds: oddsValue,
      daysTotal: days,
      strategy: strategy,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Set up your betting challenge with flexible strategies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Challenge Name</Label>
              <Input
                id="name"
                placeholder="e.g., 15-Day Challenge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialStake">Initial Stake (R)</Label>
                <Input
                  id="initialStake"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="10.00"
                  value={initialStake}
                  onChange={(e) => setInitialStake(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (R)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1000.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odds">Odds</Label>
                <Input
                  id="odds"
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.3"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysTotal">Number of Days</Label>
                <Input
                  id="daysTotal"
                  type="number"
                  min="1"
                  placeholder="15"
                  value={daysTotal}
                  onChange={(e) => setDaysTotal(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Strategy</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStrategy("compound")}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    strategy === "compound"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-sm text-foreground">Compound</p>
                  <p className="text-xs text-muted-foreground">Reinvest stake + profit</p>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy("take-profit")}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    strategy === "take-profit"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-sm text-foreground">Take Profit</p>
                  <p className="text-xs text-muted-foreground">Keep stake, accumulate profit</p>
                </button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-2 text-foreground">Strategy Details:</p>
              {strategy === "compound" ? (
                <p>Each winning bet: reinvest entire balance (stake + profit) at {odds || "1.3"}x odds</p>
              ) : (
                <p>Each winning bet: keep initial stake fixed, accumulate profit separately until target reached</p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCalculator(!showCalculator)}
              className="w-full"
            >
              {showCalculator ? "Hide" : "Show"} Days Calculator
            </Button>

            {showCalculator && (
              <div className="border rounded-lg p-4 space-y-3 bg-background">
                <p className="text-sm font-semibold text-foreground">Calculate Days Needed</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Stake (R)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="50"
                      value={calcStake}
                      onChange={(e) => setCalcStake(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Target (R)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="5000"
                      value={calcTarget}
                      onChange={(e) => setCalcTarget(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Odds</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1.01"
                      placeholder="1.3"
                      value={calcOdds}
                      onChange={(e) => setCalcOdds(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button type="button" onClick={calculateDaysNeeded} size="sm" className="w-full">
                  Calculate
                </Button>
                {calcDays !== null && (
                  <div className="bg-primary/10 border border-primary rounded p-2 text-center">
                    <p className="text-xs text-muted-foreground">Days needed:</p>
                    <p className="text-2xl font-bold text-primary">{calcDays}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Challenge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
