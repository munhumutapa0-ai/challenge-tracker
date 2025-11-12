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

export default function CreateChallengeDialog({ open, onOpenChange }: CreateChallengeDialogProps) {
  const [name, setName] = useState("");
  const [initialStake, setInitialStake] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [odds, setOdds] = useState("1.3");
  const [daysTotal, setDaysTotal] = useState("15");

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
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Set up your betting challenge with compound growth tracking
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

            <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-1 text-foreground">How it works:</p>
              <p>Each day, you'll bet your current balance at {odds || "1.3"}x odds. Winnings compound automatically!</p>
            </div>
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
