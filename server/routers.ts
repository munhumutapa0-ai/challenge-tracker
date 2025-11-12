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
        odds: z.number().min(1.01).max(1.3),
      }))
      .mutation(async ({ ctx, input }) => {
        const challenge = await db.getChallengeById(input.challengeId);
        if (!challenge || challenge.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
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
});

export type AppRouter = typeof appRouter;
