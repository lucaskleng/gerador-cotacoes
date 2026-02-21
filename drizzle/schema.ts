import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, bigint } from "drizzle-orm/mysql-core";

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

// ─── Quotation Line Item (JSON shape stored in quotations.items) ────────────
export interface QuotationLineItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

// ─── Commercial Conditions (JSON shape) ─────────────────────────────────────
export interface QuotationConditions {
  paymentTerms: string;
  deliveryTime: string;
  freight: string;
  freightValue: number;
  warranty: string;
}

// ─── Formatting Texts (JSON shape) ──────────────────────────────────────────
export interface QuotationTexts {
  headerText: string;
  introNotes: string;
  commercialNotes: string;
  technicalNotes: string;
  closingNotes: string;
  footerText: string;
}

/**
 * Quotations table — stores all quotation data.
 * Line items, conditions, and texts are stored as JSON columns for flexibility.
 */
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),

  /** Owner user ID (foreign key to users) */
  userId: int("userId").notNull(),

  /** Auto-generated quotation number (e.g., COT-2026-0001) */
  quotationNumber: varchar("quotationNumber", { length: 32 }).notNull().unique(),

  /** Status of the quotation */
  status: mysqlEnum("status", ["draft", "sent", "approved", "rejected", "expired"])
    .default("draft")
    .notNull(),

  // ─── Customer Info ──────────────────────────────────────────────────────
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  customerCompany: varchar("customerCompany", { length: 255 }),
  customerCNPJ: varchar("customerCNPJ", { length: 20 }),
  customerAddress: text("customerAddress"),

  // ─── Quotation Details ──────────────────────────────────────────────────
  reference: varchar("reference", { length: 500 }),
  validityDays: int("validityDays").default(30).notNull(),
  quotationDate: varchar("quotationDate", { length: 10 }).notNull(), // YYYY-MM-DD
  notes: text("notes"),

  // ─── Line Items (JSON array) ────────────────────────────────────────────
  items: json("items").$type<QuotationLineItem[]>().notNull(),

  // ─── Commercial Conditions (JSON object) ────────────────────────────────
  conditions: json("conditions").$type<QuotationConditions>().notNull(),

  // ─── Formatting Texts (JSON object) ─────────────────────────────────────
  texts: json("texts").$type<QuotationTexts>().notNull(),

  // ─── Computed Totals ────────────────────────────────────────────────────
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  totalDiscount: decimal("totalDiscount", { precision: 12, scale: 2 }).default("0").notNull(),
  grandTotal: decimal("grandTotal", { precision: 12, scale: 2 }).default("0").notNull(),

  // ─── Timestamps ─────────────────────────────────────────────────────────
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;
