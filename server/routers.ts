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
} from "./db";

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
    /** List all quotations for the current user */
    list: protectedProcedure.query(async ({ ctx }) => {
      return listQuotations(ctx.user.id);
    }),

    /** Get a single quotation by ID */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const quotation = await getQuotation(input.id, ctx.user.id);
        if (!quotation) {
          throw new Error("Cotação não encontrada");
        }
        return quotation;
      }),

    /** Create a new quotation */
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

    /** Update an existing quotation */
    update: protectedProcedure
      .input(updateQuotationInput)
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};

        // Only include fields that were provided
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

    /** Delete a quotation */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteQuotation(input.id, ctx.user.id);
        if (!success) {
          throw new Error("Cotação não encontrada ou sem permissão");
        }
        return { success: true };
      }),

    /** Update quotation status */
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
});

export type AppRouter = typeof appRouter;
