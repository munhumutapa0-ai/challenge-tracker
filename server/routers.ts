import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  challenge: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        initialStake: z.number().positive(),
        targetAmount: z.number().positive(),
        odds: z.number().positive(),
        daysTotal: z.number().int().positive(),
        strategy: z.enum(["compound", "take-profit"]).default("compound"),
      }))
      .mutation(async ({ ctx, input }) => {
        const challengeId = await db.createChallenge({
          userId: ctx.user.id,
          name: input.name,
          initialStake: Math.round(input.initialStake * 100), // convert to cents
          targetAmount: Math.round(input.targetAmount * 100),
          odds: Math.round(input.odds * 100), // 1.3 becomes 130
          daysTotal: input.daysTotal,
          strategy: input.strategy,
          status: "active",
        });
        return { id: challengeId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userChallenges = await db.getUserChallenges(ctx.user.id);
      return userChallenges.map(c => ({
        ...c,
        initialStake: c.initialStake / 100,
        targetAmount: c.targetAmount / 100,
        odds: c.odds / 100,
      }));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const challenge = await db.getChallengeById(input.id);
        if (!challenge) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
        }
        if (challenge.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your challenge" });
        }

        const challengeBets = await db.getChallengeBets(input.id);
        
        return {
          ...challenge,
          initialStake: challenge.initialStake / 100,
          targetAmount: challenge.targetAmount / 100,
          odds: challenge.odds / 100,
          bets: challengeBets.map(b => ({
            ...b,
            stakeAmount: b.stakeAmount / 100,
            profit: b.profit / 100,
          })),
        };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "completed", "failed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const challenge = await db.getChallengeById(input.id);
        if (!challenge || challenge.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateChallengeStatus(input.id, input.status);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const challenge = await db.getChallengeById(input.id);
        if (!challenge || challenge.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteChallenge(input.id);
        return { success: true };
      }),
  }),

  bet: router({
    add: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
        dayNumber: z.number().int().positive(),
        teamName: z.string().min(1),
        matchDetails: z.string().optional(),
        stakeAmount: z.number().positive(),
        odds: z.number().min(1.01),
      }))
      .mutation(async ({ ctx, input }) => {
        const challenge = await db.getChallengeById(input.challengeId);
        if (!challenge || challenge.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Validate odds don't exceed challenge maximum
        const maxOdds = challenge.odds / 100; // Convert from stored format
        if (input.odds > maxOdds) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Odds cannot exceed the challenge maximum of ${maxOdds.toFixed(2)}`,
          });
        }

        const betId = await db.createBet({
          challengeId: input.challengeId,
          dayNumber: input.dayNumber,
          teamName: input.teamName,
          matchDetails: input.matchDetails || null,
          stakeAmount: Math.round(input.stakeAmount * 100),
          odds: Math.round(input.odds * 100),
          result: "pending",
          profit: 0,
        });

        return { id: betId };
      }),

    updateResult: protectedProcedure
      .input(z.object({
        betId: z.number(),
        result: z.enum(["win", "loss"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const bet = await db.getBetById(input.betId);
        if (!bet) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const challenge = await db.getChallengeById(bet.challengeId);
        if (!challenge || challenge.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Calculate profit using bet-specific odds
        let profit = 0;
        if (input.result === "win") {
          // Profit = stake * (odds - 1)
          profit = Math.round(bet.stakeAmount * (bet.odds / 100 - 1));
        } else {
          // Loss = -stake
          profit = -bet.stakeAmount;
        }

        await db.updateBetResult(input.betId, input.result, profit);
        return { success: true, profit: profit / 100 };
      }),
  }),

  budget: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        amount: z.number().positive(),
        period: z.enum(["daily", "weekly", "monthly", "yearly"]),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const budgetId = await db.createBudget({
          userId: ctx.user.id,
          name: input.name,
          amount: Math.round(input.amount * 100),
          period: input.period,
          spent: 0,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "active",
        });
        return { id: budgetId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userBudgets = await db.getUserBudgets(ctx.user.id);
      return userBudgets.map(b => ({
        ...b,
        amount: b.amount / 100,
        spent: b.spent / 100,
      }));
    }),
  }),

  expense: router({
    create: protectedProcedure
      .input(z.object({
        budgetId: z.number().optional(),
        category: z.string().min(1),
        amount: z.number().positive(),
        description: z.string().optional(),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const expenseId = await db.createExpense({
          userId: ctx.user.id,
          budgetId: input.budgetId,
          category: input.category,
          amount: Math.round(input.amount * 100),
          description: input.description,
          date: input.date,
        });
        return { id: expenseId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userExpenses = await db.getUserExpenses(ctx.user.id);
      return userExpenses.map(e => ({
        ...e,
        amount: e.amount / 100,
      }));
    }),
  }),

  habits: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const habits = await db.getOrCreateGamblingHabits(ctx.user.id);
      return {
        ...habits,
        dailyLimit: habits.dailyLimit / 100,
        weeklyLimit: habits.weeklyLimit / 100,
        monthlyLimit: habits.monthlyLimit / 100,
        todaySpent: habits.todaySpent / 100,
        thisWeekSpent: habits.thisWeekSpent / 100,
        thisMonthSpent: habits.thisMonthSpent / 100,
      };
    }),

    update: protectedProcedure
      .input(z.object({
        dailyLimit: z.number().positive().optional(),
        weeklyLimit: z.number().positive().optional(),
        monthlyLimit: z.number().positive().optional(),
        enableAlerts: z.boolean().optional(),
        alertThreshold: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updates: any = {};
        if (input.dailyLimit) updates.dailyLimit = Math.round(input.dailyLimit * 100);
        if (input.weeklyLimit) updates.weeklyLimit = Math.round(input.weeklyLimit * 100);
        if (input.monthlyLimit) updates.monthlyLimit = Math.round(input.monthlyLimit * 100);
        if (input.enableAlerts !== undefined) updates.enableAlerts = input.enableAlerts;
        if (input.alertThreshold !== undefined) updates.alertThreshold = input.alertThreshold;

        await db.updateGamblingHabits(ctx.user.id, updates);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
