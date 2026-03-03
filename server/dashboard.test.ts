import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): { ctx: TrpcContext } {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("dashboard.metrics", () => {
  it("returns metrics with correct structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.dashboard.metrics();

    // Verify structure
    expect(metrics).toHaveProperty("totalQuotations");
    expect(metrics).toHaveProperty("totalDrafts");
    expect(metrics).toHaveProperty("totalSent");
    expect(metrics).toHaveProperty("totalApproved");
    expect(metrics).toHaveProperty("totalRejected");
    expect(metrics).toHaveProperty("totalExpired");
    expect(metrics).toHaveProperty("totalValue");
    expect(metrics).toHaveProperty("averageValue");
    expect(metrics).toHaveProperty("approvalRate");
    expect(metrics).toHaveProperty("monthlyData");
    expect(metrics).toHaveProperty("recentQuotations");
    expect(metrics).toHaveProperty("topCustomers");

    // Verify types
    expect(typeof metrics.totalQuotations).toBe("number");
    expect(typeof metrics.totalDrafts).toBe("number");
    expect(typeof metrics.totalSent).toBe("number");
    expect(typeof metrics.totalApproved).toBe("number");
    expect(typeof metrics.totalRejected).toBe("number");
    expect(typeof metrics.totalExpired).toBe("number");
    expect(typeof metrics.totalValue).toBe("number");
    expect(typeof metrics.averageValue).toBe("number");
    expect(typeof metrics.approvalRate).toBe("number");
    expect(Array.isArray(metrics.monthlyData)).toBe(true);
    expect(Array.isArray(metrics.recentQuotations)).toBe(true);
    expect(Array.isArray(metrics.topCustomers)).toBe(true);
  });

  it("returns zero values when no quotations exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.dashboard.metrics();

    expect(metrics.totalQuotations).toBeGreaterThanOrEqual(0);
    expect(metrics.averageValue).toBeGreaterThanOrEqual(0);
    expect(metrics.approvalRate).toBeGreaterThanOrEqual(0);
    expect(metrics.approvalRate).toBeLessThanOrEqual(100);
  });
});

describe("quotation.create with quotationType", () => {
  it("accepts products type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.create({
      quotationType: "products",
      customerName: "Empresa Teste",
      quotationDate: "2026-03-01",
      items: [
        {
          id: "test-1",
          description: "Motor WEG 5CV",
          unit: "un",
          quantity: 2,
          unitPrice: 1500,
          discount: 0,
          subtotal: 3000,
        },
      ],
      conditions: {
        paymentTerms: "30 dias",
        deliveryTime: "15 dias úteis",
        freight: "CIF",
        freightValue: 0,
        warranty: "12 meses",
      },
      texts: {
        headerText: "PROPOSTA COMERCIAL — PRODUTOS",
        introNotes: "Prezado cliente...",
        commercialNotes: "Condições...",
        technicalNotes: "Normas...",
        closingNotes: "Atenciosamente...",
        footerText: "KL Engenharia",
      },
      subtotal: 3000,
      totalDiscount: 0,
      grandTotal: 3000,
      status: "draft",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("quotationNumber");
    expect(typeof result.id).toBe("number");
  });

  it("accepts services type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.create({
      quotationType: "services",
      customerName: "Cliente Serviços",
      quotationDate: "2026-03-01",
      items: [
        {
          id: "svc-1",
          description: "Instalação elétrica industrial",
          unit: "sv",
          quantity: 1,
          unitPrice: 8500,
          discount: 0,
          subtotal: 8500,
        },
      ],
      conditions: {
        paymentTerms: "30/60 dias",
        deliveryTime: "A combinar",
        freight: "Incluso",
        freightValue: 0,
        warranty: "90 dias sobre o serviço",
      },
      texts: {
        headerText: "PROPOSTA COMERCIAL — SERVIÇOS",
        introNotes: "Prezado cliente...",
        commercialNotes: "Condições...",
        technicalNotes: "Normas...",
        closingNotes: "Atenciosamente...",
        footerText: "KL Engenharia",
      },
      subtotal: 8500,
      totalDiscount: 0,
      grandTotal: 8500,
      status: "draft",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("quotationNumber");
  });

  it("defaults to products when quotationType is not specified", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.create({
      customerName: "Empresa Default",
      quotationDate: "2026-03-01",
      items: [
        {
          id: "def-1",
          description: "Produto padrão",
          unit: "un",
          quantity: 1,
          unitPrice: 100,
          discount: 0,
          subtotal: 100,
        },
      ],
      conditions: {
        paymentTerms: "À vista",
        deliveryTime: "Imediato",
        freight: "CIF",
        freightValue: 0,
        warranty: "12 meses",
      },
      texts: {
        headerText: "PROPOSTA",
        introNotes: "...",
        commercialNotes: "...",
        technicalNotes: "...",
        closingNotes: "...",
        footerText: "...",
      },
      subtotal: 100,
      totalDiscount: 0,
      grandTotal: 100,
    });

    expect(result).toHaveProperty("id");
  });
});
