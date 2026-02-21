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
 */
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  quotationNumber: varchar("quotationNumber", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "sent", "approved", "rejected", "expired"])
    .default("draft")
    .notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  customerCompany: varchar("customerCompany", { length: 255 }),
  customerCNPJ: varchar("customerCNPJ", { length: 20 }),
  customerAddress: text("customerAddress"),
  reference: varchar("reference", { length: 500 }),
  validityDays: int("validityDays").default(30).notNull(),
  quotationDate: varchar("quotationDate", { length: 10 }).notNull(),
  notes: text("notes"),
  items: json("items").$type<QuotationLineItem[]>().notNull(),
  conditions: json("conditions").$type<QuotationConditions>().notNull(),
  texts: json("texts").$type<QuotationTexts>().notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  totalDiscount: decimal("totalDiscount", { precision: 12, scale: 2 }).default("0").notNull(),
  grandTotal: decimal("grandTotal", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

// ─── Design Settings Interfaces ─────────────────────────────────────────────

/** Company branding info */
export interface CompanyBranding {
  companyName: string;
  companySubtitle: string;
  logoUrl: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

/** Platform theme colors (applied to the app UI) */
export interface PlatformTheme {
  primaryColor: string;       // Main accent color (hex)
  primaryForeground: string;  // Text on primary (hex)
  backgroundColor: string;    // Page background (hex)
  cardColor: string;          // Card/surface background (hex)
  foregroundColor: string;    // Main text color (hex)
  mutedColor: string;         // Muted/secondary text (hex)
  borderColor: string;        // Border color (hex)
}

/** Proposal/quotation document design settings */
export interface ProposalDesign {
  headerBgColor: string;       // Header background (hex)
  headerTextColor: string;     // Header text color (hex)
  accentColor: string;         // Accent for borders, table headers (hex)
  bodyBgColor: string;         // Document body background (hex)
  bodyTextColor: string;       // Document body text (hex)
  tableBorderColor: string;    // Table border color (hex)
  tableHeaderBgColor: string;  // Table header background (hex)
  tableHeaderTextColor: string;// Table header text (hex)
  tableStripedBg: string;      // Striped row background (hex)
  titleFont: string;           // Font family for titles
  bodyFont: string;            // Font family for body text
  monoFont: string;            // Font family for monetary values
  fontSize: string;            // Base font size: "small" | "medium" | "large"
  showLogo: boolean;           // Show logo in proposal header
  showBorderLines: boolean;    // Show decorative border lines
  headerLayout: string;        // "left" | "center" | "right" — logo/header alignment
  paperSize: string;           // "A4" | "Letter"
}

/**
 * Design settings table — one row per user.
 * Stores company branding, platform theme, and proposal design as JSON.
 */
export const designSettings = mysqlTable("design_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),

  /** Company branding info */
  company: json("company").$type<CompanyBranding>().notNull(),

  /** Platform UI theme */
  platformTheme: json("platformTheme").$type<PlatformTheme>().notNull(),

  /** Proposal document design */
  proposalDesign: json("proposalDesign").$type<ProposalDesign>().notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DesignSettings = typeof designSettings.$inferSelect;
export type InsertDesignSettings = typeof designSettings.$inferInsert;
