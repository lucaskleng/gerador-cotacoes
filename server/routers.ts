import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createQuotation,
  listQuotations,
  getQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  generateQuotationNumber,
  getDesignSettings,
  upsertDesignSettings,
} from "./db";
import { storagePut } from "./storage";
import { DEFAULT_DESIGN_SETTINGS } from "../shared/designDefaults";

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  discount: z.number(),
  subtotal: z.number(),
});

const conditionsSchema = z.object({
  paymentTerms: z.string(),
  deliveryTime: z.string(),
  freight: z.string(),
  freightValue: z.number(),
  warranty: z.string(),
});

const textsSchema = z.object({
  headerText: z.string(),
  introNotes: z.string(),
  commercialNotes: z.string(),
  technicalNotes: z.string(),
  closingNotes: z.string(),
  footerText: z.string(),
});

const createQuotationInput = z.object({
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerCompany: z.string().optional(),
  customerCNPJ: z.string().optional(),
  customerAddress: z.string().optional(),
  reference: z.string().optional(),
  validityDays: z.number().default(30),
  quotationDate: z.string(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Pelo menos um item é obrigatório"),
  conditions: conditionsSchema,
  texts: textsSchema,
  subtotal: z.number(),
  totalDiscount: z.number(),
  grandTotal: z.number(),
  status: z.enum(["draft", "sent", "approved", "rejected", "expired"]).default("draft"),
});

const updateQuotationInput = z.object({
  id: z.number(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerCompany: z.string().optional(),
  customerCNPJ: z.string().optional(),
  customerAddress: z.string().optional(),
  reference: z.string().optional(),
  validityDays: z.number().optional(),
  quotationDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).optional(),
  conditions: conditionsSchema.optional(),
  texts: textsSchema.optional(),
  subtotal: z.number().optional(),
  totalDiscount: z.number().optional(),
  grandTotal: z.number().optional(),
  status: z.enum(["draft", "sent", "approved", "rejected", "expired"]).optional(),
});

// ─── Design Settings Schemas ────────────────────────────────────────────────

const companyBrandingSchema = z.object({
  companyName: z.string(),
  companySubtitle: z.string(),
  logoUrl: z.string(),
  cnpj: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  address: z.string(),
});

const platformThemeSchema = z.object({
  primaryColor: z.string(),
  primaryForeground: z.string(),
  backgroundColor: z.string(),
  cardColor: z.string(),
  foregroundColor: z.string(),
  mutedColor: z.string(),
  borderColor: z.string(),
});

const proposalDesignSchema = z.object({
  headerBgColor: z.string(),
  headerTextColor: z.string(),
  accentColor: z.string(),
  bodyBgColor: z.string(),
  bodyTextColor: z.string(),
  tableBorderColor: z.string(),
  tableHeaderBgColor: z.string(),
  tableHeaderTextColor: z.string(),
  tableStripedBg: z.string(),
  titleFont: z.string(),
  bodyFont: z.string(),
  monoFont: z.string(),
  fontSize: z.string(),
  showLogo: z.boolean(),
  showBorderLines: z.boolean(),
  headerLayout: z.string(),
  paperSize: z.string(),
});

const designSettingsInput = z.object({
  company: companyBrandingSchema,
  platformTheme: platformThemeSchema,
  proposalDesign: proposalDesignSchema,
});

// ─── Router ─────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  quotation: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return listQuotations(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const quotation = await getQuotation(input.id, ctx.user.id);
        if (!quotation) {
          throw new Error("Cotação não encontrada");
        }
        return quotation;
      }),

    create: protectedProcedure
      .input(createQuotationInput)
      .mutation(async ({ ctx, input }) => {
        const quotationNumber = await generateQuotationNumber(ctx.user.id);

        const id = await createQuotation({
          userId: ctx.user.id,
          quotationNumber,
          status: input.status,
          customerName: input.customerName,
          customerEmail: input.customerEmail ?? null,
          customerPhone: input.customerPhone ?? null,
          customerCompany: input.customerCompany ?? null,
          customerCNPJ: input.customerCNPJ ?? null,
          customerAddress: input.customerAddress ?? null,
          reference: input.reference ?? null,
          validityDays: input.validityDays,
          quotationDate: input.quotationDate,
          notes: input.notes ?? null,
          items: input.items,
          conditions: input.conditions,
          texts: input.texts,
          subtotal: String(input.subtotal),
          totalDiscount: String(input.totalDiscount),
          grandTotal: String(input.grandTotal),
        });

        return { id, quotationNumber };
      }),

    update: protectedProcedure
      .input(updateQuotationInput)
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};

        if (data.customerName !== undefined) updateData.customerName = data.customerName;
        if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
        if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
        if (data.customerCompany !== undefined) updateData.customerCompany = data.customerCompany;
        if (data.customerCNPJ !== undefined) updateData.customerCNPJ = data.customerCNPJ;
        if (data.customerAddress !== undefined) updateData.customerAddress = data.customerAddress;
        if (data.reference !== undefined) updateData.reference = data.reference;
        if (data.validityDays !== undefined) updateData.validityDays = data.validityDays;
        if (data.quotationDate !== undefined) updateData.quotationDate = data.quotationDate;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.items !== undefined) updateData.items = data.items;
        if (data.conditions !== undefined) updateData.conditions = data.conditions;
        if (data.texts !== undefined) updateData.texts = data.texts;
        if (data.subtotal !== undefined) updateData.subtotal = String(data.subtotal);
        if (data.totalDiscount !== undefined) updateData.totalDiscount = String(data.totalDiscount);
        if (data.grandTotal !== undefined) updateData.grandTotal = String(data.grandTotal);
        if (data.status !== undefined) updateData.status = data.status;

        const success = await updateQuotation(id, ctx.user.id, updateData);
        if (!success) {
          throw new Error("Cotação não encontrada ou sem permissão");
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteQuotation(input.id, ctx.user.id);
        if (!success) {
          throw new Error("Cotação não encontrada ou sem permissão");
        }
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["draft", "sent", "approved", "rejected", "expired"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const success = await updateQuotationStatus(input.id, ctx.user.id, input.status);
        if (!success) {
          throw new Error("Cotação não encontrada ou sem permissão");
        }
        return { success: true };
      }),
  }),

  // ─── Design Settings ────────────────────────────────────────────────────
  design: router({
    /** Get current user's design settings (returns defaults if none saved) */
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getDesignSettings(ctx.user.id);
      if (!settings) {
        return DEFAULT_DESIGN_SETTINGS;
      }
      return {
        company: settings.company,
        platformTheme: settings.platformTheme,
        proposalDesign: settings.proposalDesign,
      };
    }),

    /** Save/update design settings */
    save: protectedProcedure
      .input(designSettingsInput)
      .mutation(async ({ ctx, input }) => {
        await upsertDesignSettings(ctx.user.id, {
          company: input.company,
          platformTheme: input.platformTheme,
          proposalDesign: input.proposalDesign,
        });
        return { success: true };
      }),

    /** Upload company logo */
    uploadLogo: protectedProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "png";
        const suffix = Math.random().toString(36).slice(2, 10);
        const key = `logos/user-${ctx.user.id}-${suffix}.${ext}`;

        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
