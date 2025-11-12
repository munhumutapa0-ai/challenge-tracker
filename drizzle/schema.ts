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

/**
 * Budget management - track monthly/weekly budgets
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Monthly Betting Budget"
  amount: int("amount").notNull(), // in cents
  period: mysqlEnum("period", ["daily", "weekly", "monthly", "yearly"]).default("monthly").notNull(),
  spent: int("spent").default(0).notNull(), // in cents
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "completed", "exceeded"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Money usage tracking - log where money is spent
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  budgetId: int("budgetId"),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Betting", "Food", "Transport"
  amount: int("amount").notNull(), // in cents
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Gambling habits tracking - monitor and control gambling behavior
 */
export const gamblingHabits = mysqlTable("gamblingHabits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dailyLimit: int("dailyLimit").notNull(), // in cents
  weeklyLimit: int("weeklyLimit").notNull(), // in cents
  monthlyLimit: int("monthlyLimit").notNull(), // in cents
  todaySpent: int("todaySpent").default(0).notNull(), // in cents
  thisWeekSpent: int("thisWeekSpent").default(0).notNull(), // in cents
  thisMonthSpent: int("thisMonthSpent").default(0).notNull(), // in cents
  enableAlerts: boolean("enableAlerts").default(true).notNull(),
  alertThreshold: int("alertThreshold").default(80).notNull(), // percentage (0-100)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GamblingHabit = typeof gamblingHabits.$inferSelect;
export type InsertGamblingHabit = typeof gamblingHabits.$inferInsert;
