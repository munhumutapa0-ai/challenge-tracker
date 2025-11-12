import { useAuth } from "@/_core/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Target, Zap, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Analytics() {
  const { isAuthenticated, loading } = useAuth();

  const { data: challenges, isLoading: challengesLoading } = trpc.challenge.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: expenses, isLoading: expensesLoading } = trpc.expense.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate challenge balance
  const getChallengeBalance = (challenge: any) => {
    let balance = challenge.initialStake;
    const bets = (challenge as any).bets || [];
    bets.forEach((bet: any) => {
      if (bet.result === "win" || bet.result === "loss") {
        balance += bet.profit;
      }
    });
    return balance;
  };

  // Calculate analytics
  const calculateAnalytics = () => {
    if (!challenges || challenges.length === 0) {
      return {
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        winRate: 0,
        totalBets: 0,
        winBets: 0,
        roi: 0,
        totalStaked: 0,
      };
    }

    let totalProfit = 0;
    let totalLoss = 0;
    let totalBets = 0;
    let winBets = 0;
    let totalStaked = 0;

    challenges.forEach((challenge: any) => {
      totalStaked += challenge.initialStake;
      const bets = (challenge as any).bets || [];
      bets.forEach((bet: any) => {
        totalBets++;
        if (bet.result === "win") {
          winBets++;
          totalProfit += bet.profit;
        } else if (bet.result === "loss") {
          totalLoss += Math.abs(bet.profit);
        }
      });
    });

    const netProfit = totalProfit - totalLoss;
    const winRate = totalBets > 0 ? (winBets / totalBets) * 100 : 0;
    const roi = totalStaked > 0 ? ((netProfit / totalStaked) * 100) : 0;

    return {
      totalProfit,
      totalLoss,
      netProfit,
      winRate,
      totalBets,
      winBets,
      roi,
      totalStaked,
    };
  };

  const analytics = calculateAnalytics();

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 200, 100);
    doc.text("Challenge Tracker - Analytics Report", pageWidth / 2, 20, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });

    let yPosition = 40;

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0, 200, 100);
    doc.text("Summary", 15, yPosition);
    yPosition += 10;

    const summaryData = [
      ["Metric", "Value"],
      ["Total Bets", analytics.totalBets.toString()],
      ["Winning Bets", analytics.winBets.toString()],
      ["Win Rate", `${analytics.winRate.toFixed(2)}%`],
      ["Total Staked", `R${analytics.totalStaked.toFixed(2)}`],
      ["Total Profit", `R${analytics.totalProfit.toFixed(2)}`],
      ["Total Loss", `R${analytics.totalLoss.toFixed(2)}`],
      ["Net Profit/Loss", `R${analytics.netProfit.toFixed(2)}`],
      ["ROI", `${analytics.roi.toFixed(2)}%`],
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      margin: { left: 15, right: 15 },
      theme: "grid",
      headStyles: { fillColor: [0, 200, 100], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Challenges Section
    if (challenges && challenges.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 200, 100);
      doc.text("Challenges", 15, yPosition);
      yPosition += 10;

      const challengeData = [
        ["Challenge", "Days", "Initial Stake", "Target", "Status", "Current Balance"],
        ...challenges.map((c) => [
          c.name,
          c.daysTotal.toString(),
          `R${c.initialStake.toFixed(2)}`,
          `R${c.targetAmount.toFixed(2)}`,
          c.status,
          `R${getChallengeBalance(c).toFixed(2)}`,
        ]),
      ];

      autoTable(doc, {
        head: [challengeData[0]],
        body: challengeData.slice(1),
        startY: yPosition,
        margin: { left: 15, right: 15 },
        theme: "grid",
        headStyles: { fillColor: [0, 200, 100], textColor: [255, 255, 255] },
        bodyStyles: { textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Expenses Section
    if (expenses && expenses.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 200, 100);
      doc.text("Expenses", 15, 20);

      const expenseData = [
        ["Category", "Amount", "Date", "Description"],
        ...expenses.slice(0, 50).map((e: any) => [
          e.category,
          `R${e.amount.toFixed(2)}`,
          new Date(e.date).toLocaleDateString(),
          e.description || "-",
        ]),
      ];

      autoTable(doc, {
        head: [expenseData[0]],
        body: expenseData.slice(1),
        startY: 30,
        margin: { left: 15, right: 15 },
        theme: "grid",
        headStyles: { fillColor: [0, 200, 100], textColor: [255, 255, 255] },
        bodyStyles: { textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
    }

    doc.save(`challenge-tracker-analytics-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (challengesLoading || expensesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Analytics Dashboard" description="View your betting performance metrics" />
      <div className="container py-4 flex justify-end">
        <Button onClick={exportToPDF} size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <main className="container py-6 sm:py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Performance</h2>
            <p className="text-muted-foreground">Comprehensive analysis of your betting challenges and results</p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Net Profit */}
            <Card className="bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${analytics.netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
                  Net Profit/Loss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  R{analytics.netProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total earnings</p>
              </CardContent>
            </Card>

            {/* Win Rate */}
            <Card className="bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{analytics.winRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.winBets} wins out of {analytics.totalBets} bets
                </p>
              </CardContent>
            </Card>

            {/* ROI */}
            <Card className="bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.roi >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {analytics.roi.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Return on investment</p>
              </CardContent>
            </Card>

            {/* Total Staked */}
            <Card className="bg-card text-card-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R{analytics.totalStaked.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Initial investments</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Profit Breakdown */}
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Profit Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Profit</span>
                    <span className="font-bold text-green-500">R{analytics.totalProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Loss</span>
                    <span className="font-bold text-red-500">R{analytics.totalLoss.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between">
                    <span className="font-medium">Net Result</span>
                    <span className={`font-bold ${analytics.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      R{analytics.netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bet Statistics */}
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Bet Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Bets</span>
                    <span className="font-bold">{analytics.totalBets}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Winning Bets</span>
                    <span className="font-bold text-green-500">{analytics.winBets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Losing Bets</span>
                    <span className="font-bold text-red-500">{analytics.totalBets - analytics.winBets}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-lg font-bold text-primary">{analytics.winRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-1">ROI</p>
                  <p className={`text-lg font-bold ${analytics.roi >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {analytics.roi.toFixed(2)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Challenges Summary */}
          {challenges && challenges.length > 0 && (
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>Active Challenges</CardTitle>
                <CardDescription>Overview of your current betting challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {challenges.map((challenge) => {
                    const balance = getChallengeBalance(challenge);
                    return (
                      <div key={challenge.id} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-foreground">{challenge.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {challenge.daysTotal} days • {(challenge.odds / 100).toFixed(2)}x odds • {challenge.status}
                            </p>
                          </div>
                          <span className={`text-sm font-bold ${balance >= challenge.targetAmount ? "text-green-500" : "text-primary"}`}>
                            R{balance.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min((balance / challenge.targetAmount) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Target: R{challenge.targetAmount.toFixed(2)} • Progress: {((balance / challenge.targetAmount) * 100).toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
