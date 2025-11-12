import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Betting challenges table - tracks each betting challenge/plan
 */
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  initialStake: int("initialStake").notNull(), // in cents to avoid decimal issues
  targetAmount: int("targetAmount").notNull(), // in cents
  odds: int("odds").notNull(), // stored as 130 for 1.3 odds (multiply by 100)
  daysTotal: int("daysTotal").notNull(),
  strategy: mysqlEnum("strategy", ["compound", "take-profit"]).default("compound").notNull(), // compound: reinvest all, take-profit: keep stake fixed
  status: mysqlEnum("status", ["active", "completed", "failed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

/**
 * Individual bets within a challenge
 */
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  dayNumber: int("dayNumber").notNull(),
  teamName: varchar("teamName", { length: 255 }).notNull(),
  matchDetails: text("matchDetails"),
  stakeAmount: int("stakeAmount").notNull(), // in cents
  odds: int("odds").notNull(), // stored as 125 for 1.25 odds (multiply by 100)
  result: mysqlEnum("result", ["pending", "win", "loss"]).default("pending").notNull(),
  profit: int("profit").default(0).notNull(), // in cents, can be negative
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;
