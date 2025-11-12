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

  useEffect(() => {
    if (open) {
      setTeamName("");
      setMatchDetails("");
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

    addBetMutation.mutate({
      challengeId,
      dayNumber: nextDayNumber,
      teamName: teamName.trim(),
      matchDetails: matchDetails.trim() || undefined,
      stakeAmount: nextStake,
    });
  };

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

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1 text-foreground">Bet Summary:</p>
              <p className="text-muted-foreground">
                Staking <span className="font-semibold text-foreground">R{nextStake.toFixed(2)}</span> on{" "}
                <span className="font-semibold text-foreground">{teamName || "your team"}</span>
              </p>
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
