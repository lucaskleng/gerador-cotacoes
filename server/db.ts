import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, quotations, InsertQuotation, Quotation } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

// ─── Quotation Helpers ──────────────────────────────────────────────────────

/**
 * Generate the next quotation number in the format COT-YYYY-NNNN
 */
export async function generateQuotationNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  const prefix = `COT-${year}-`;

  // Count existing quotations for this year
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(quotations)
    .where(sql`${quotations.quotationNumber} LIKE ${prefix + '%'}`);

  const count = Number(result[0]?.count ?? 0);
  const nextNum = String(count + 1).padStart(4, "0");
  return `${prefix}${nextNum}`;
}

/**
 * Create a new quotation
 */
export async function createQuotation(data: InsertQuotation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quotations).values(data);
  return Number(result[0].insertId);
}

/**
 * List all quotations for a user, newest first
 */
export async function listQuotations(userId: number): Promise<Quotation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(quotations)
    .where(eq(quotations.userId, userId))
    .orderBy(desc(quotations.createdAt));
}

/**
 * Get a single quotation by ID (must belong to user)
 */
export async function getQuotation(id: number, userId: number): Promise<Quotation | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(quotations)
    .where(and(eq(quotations.id, id), eq(quotations.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update a quotation
 */
export async function updateQuotation(
  id: number,
  userId: number,
  data: Partial<InsertQuotation>
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(quotations)
    .set(data)
    .where(and(eq(quotations.id, id), eq(quotations.userId, userId)));

  return (result[0]?.affectedRows ?? 0) > 0;
}

/**
 * Delete a quotation
 */
export async function deleteQuotation(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(quotations)
    .where(and(eq(quotations.id, id), eq(quotations.userId, userId)));

  return (result[0]?.affectedRows ?? 0) > 0;
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(
  id: number,
  userId: number,
  status: "draft" | "sent" | "approved" | "rejected" | "expired"
): Promise<boolean> {
  return updateQuotation(id, userId, { status });
}
