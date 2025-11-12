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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AddBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: number;
  nextDayNumber: number;
  nextStake: number;
}

export default function AddBetDialog({
  open,
  onOpenChange,
  challengeId,
  nextDayNumber,
  nextStake,
}: AddBetDialogProps) {
  const [teamName, setTeamName] = useState("");
  const [matchDetails, setMatchDetails] = useState("");
  const [odds, setOdds] = useState("1.3");

  useEffect(() => {
    if (open) {
      setTeamName("");
      setMatchDetails("");
      setOdds("1.3");
    }
  }, [open]);

  const utils = trpc.useUtils();
  const addBetMutation = trpc.bet.add.useMutation({
    onSuccess: () => {
      toast.success("Bet added successfully!");
      utils.challenge.getById.invalidate({ id: challengeId });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add bet");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    const oddsValue = parseFloat(odds);
    if (isNaN(oddsValue) || oddsValue < 1.01 || oddsValue > 1.3) {
      toast.error("Odds must be between 1.01 and 1.3");
      return;
    }

    addBetMutation.mutate({
      challengeId,
      dayNumber: nextDayNumber,
      teamName: teamName.trim(),
      matchDetails: matchDetails.trim() || undefined,
      stakeAmount: nextStake,
      odds: oddsValue,
    });
  };

  const potentialReturn = odds && !isNaN(parseFloat(odds)) ? nextStake * parseFloat(odds) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Bet - Day {nextDayNumber}</DialogTitle>
            <DialogDescription>
              Record your bet for today. Stake amount: R{nextStake.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                placeholder="e.g., Manchester United"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchDetails">Match Details (Optional)</Label>
              <Textarea
                id="matchDetails"
                placeholder="e.g., Man United vs Liverpool, Premier League"
                value={matchDetails}
                onChange={(e) => setMatchDetails(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odds">Odds (1.01 - 1.3) *</Label>
              <Input
                id="odds"
                type="number"
                step="0.01"
                min="1.01"
                max="1.3"
                placeholder="1.3"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                required
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-2 text-foreground">Bet Summary:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  Staking <span className="font-semibold text-foreground">R{nextStake.toFixed(2)}</span> on{" "}
                  <span className="font-semibold text-foreground">{teamName || "your team"}</span>
                </p>
                <p>
                  At <span className="font-semibold text-foreground">{odds || "1.3"}x</span> odds
                </p>
                {potentialReturn > 0 && (
                  <p>
                    Potential return: <span className="font-semibold text-primary">R{potentialReturn.toFixed(2)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addBetMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addBetMutation.isPending}>
              {addBetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Bet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
