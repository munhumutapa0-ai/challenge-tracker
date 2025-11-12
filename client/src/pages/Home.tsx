import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Target, TrendingUp, LogOut } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import CreateChallengeDialog from "@/components/CreateChallengeDialog";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: challenges, isLoading: challengesLoading } = trpc.challenge.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card">
          <div className="container py-3 sm:py-4 flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{APP_TITLE}</h1>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted">
          <div className="container max-w-4xl text-center space-y-8 py-20">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                Track Your Betting Challenge
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Create compound betting challenges, track your progress, and reach your target amount with disciplined daily bets.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <Target className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Set Your Goal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Define your initial stake, target amount, and challenge duration
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Compound Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Reinvest your winnings automatically with each successful bet
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <Plus className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Track Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Monitor daily bets, calculate profits, and visualize your journey
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" asChild className="mt-8">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-3 sm:py-4 flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{APP_TITLE}</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Challenge
            </Button>
            <Button onClick={() => logout()} variant="outline" size="sm" title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Challenges</h2>
            <p className="text-muted-foreground">
              Manage your betting challenges and track your progress
            </p>
          </div>

          {challengesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : challenges && challenges.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => (
                <Link key={challenge.id} href={`/challenge/${challenge.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card text-card-foreground">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{challenge.name}</CardTitle>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
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
                      <CardDescription>
                        {challenge.daysTotal} days • {challenge.odds}x odds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Initial:</span>
                          <span className="font-semibold text-foreground">R{challenge.initialStake.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-semibold text-primary">R{challenge.targetAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-card text-card-foreground">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No challenges yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first betting challenge to get started
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <CreateChallengeDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
