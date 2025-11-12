import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, challenges, bets, InsertChallenge, InsertBet } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Challenge queries
export async function createChallenge(challenge: InsertChallenge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(challenges).values(challenge);
  return result[0].insertId;
}

export async function getUserChallenges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(challenges).where(eq(challenges.userId, userId)).orderBy(desc(challenges.createdAt));
}

export async function getChallengeById(challengeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateChallengeStatus(challengeId: number, status: "active" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(challenges).set({ status }).where(eq(challenges.id, challengeId));
}

export async function deleteChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all bets first
  await db.delete(bets).where(eq(bets.challengeId, challengeId));
  // Then delete challenge
  await db.delete(challenges).where(eq(challenges.id, challengeId));
}

// Bet queries
export async function createBet(bet: InsertBet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bets).values(bet);
  return result[0].insertId;
}

export async function getChallengeBets(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bets).where(eq(bets.challengeId, challengeId)).orderBy(bets.dayNumber);
}

export async function updateBetResult(betId: number, result: "win" | "loss", profit: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bets).set({ result, profit }).where(eq(bets.id, betId));
}

export async function getBetById(betId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bets).where(eq(bets.id, betId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
