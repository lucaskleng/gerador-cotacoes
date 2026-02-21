import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock the database helpers ──────────────────────────────────────────────
vi.mock("./db", () => ({
  generateQuotationNumber: vi.fn().mockResolvedValue("COT-2026-0001"),
  createQuotation: vi.fn().mockResolvedValue(42),
  listQuotations: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      quotationNumber: "COT-2026-0001",
      status: "draft",
      customerName: "Empresa Teste",
      customerEmail: "teste@empresa.com",
      customerPhone: "(11) 99999-0000",
      customerCompany: "Empresa Teste Ltda",
      customerCNPJ: "12.345.678/0001-90",
      customerAddress: "Rua Teste, 123",
      reference: "Ref-001",
      validityDays: 30,
      quotationDate: "2026-02-21",
      notes: null,
      items: [
        {
          id: "item-1",
          description: "Motor WEG 5CV",
          unit: "un",
          quantity: 2,
          unitPrice: 1500,
          discount: 0,
          subtotal: 3000,
        },
      ],
      conditions: {
        paymentTerms: "30/60/90 dias",
        deliveryTime: "15 dias úteis",
        freight: "CIF",
        freightValue: 250,
        warranty: "12 meses",
      },
      texts: {
        headerText: "Empresa XYZ",
        introNotes: "Prezado(a) ${customerName}",
        commercialNotes: "Pagamento: ${paymentTerms}",
        technicalNotes: "Garantia: ${warranty}",
        closingNotes: "Atenciosamente",
        footerText: "Empresa XYZ - CNPJ 00.000.000/0001-00",
      },
      subtotal: "3000.00",
      totalDiscount: "0.00",
      grandTotal: "3250.00",
      createdAt: new Date("2026-02-21T10:00:00Z"),
      updatedAt: new Date("2026-02-21T10:00:00Z"),
    },
  ]),
  getQuotation: vi.fn().mockImplementation(async (id: number, userId: number) => {
    if (id === 1 && userId === 1) {
      return {
        id: 1,
        userId: 1,
        quotationNumber: "COT-2026-0001",
        status: "draft",
        customerName: "Empresa Teste",
        customerEmail: "teste@empresa.com",
        grandTotal: "3250.00",
        items: [],
        conditions: {},
        texts: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return undefined;
  }),
  updateQuotation: vi.fn().mockImplementation(async (id: number, userId: number) => {
    return id === 1 && userId === 1;
  }),
  deleteQuotation: vi.fn().mockImplementation(async (id: number, userId: number) => {
    return id === 1 && userId === 1;
  }),
  updateQuotationStatus: vi.fn().mockImplementation(async (id: number, userId: number) => {
    return id === 1 && userId === 1;
  }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const sampleCreateInput = {
  customerName: "Empresa Teste",
  customerEmail: "teste@empresa.com",
  customerPhone: "(11) 99999-0000",
  customerCompany: "Empresa Teste Ltda",
  customerCNPJ: "12.345.678/0001-90",
  customerAddress: "Rua Teste, 123",
  reference: "Ref-001",
  validityDays: 30,
  quotationDate: "2026-02-21",
  items: [
    {
      id: "item-1",
      description: "Motor WEG 5CV",
      unit: "un",
      quantity: 2,
      unitPrice: 1500,
      discount: 0,
      subtotal: 3000,
    },
  ],
  conditions: {
    paymentTerms: "30/60/90 dias",
    deliveryTime: "15 dias úteis",
    freight: "CIF",
    freightValue: 250,
    warranty: "12 meses",
  },
  texts: {
    headerText: "Empresa XYZ",
    introNotes: "Prezado(a) ${customerName}",
    commercialNotes: "Pagamento: ${paymentTerms}",
    technicalNotes: "Garantia: ${warranty}",
    closingNotes: "Atenciosamente",
    footerText: "Empresa XYZ - CNPJ 00.000.000/0001-00",
  },
  subtotal: 3000,
  totalDiscount: 0,
  grandTotal: 3250,
  status: "draft" as const,
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("quotation.create", () => {
  it("creates a quotation and returns id + quotationNumber", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.create(sampleCreateInput);

    expect(result).toEqual({
      id: 42,
      quotationNumber: "COT-2026-0001",
    });
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.quotation.create(sampleCreateInput)).rejects.toThrow();
  });

  it("rejects missing customerName", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.quotation.create({
        ...sampleCreateInput,
        customerName: "",
      })
    ).rejects.toThrow();
  });

  it("rejects empty items array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.quotation.create({
        ...sampleCreateInput,
        items: [],
      })
    ).rejects.toThrow();
  });
});

describe("quotation.list", () => {
  it("returns quotations for the authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].quotationNumber).toBe("COT-2026-0001");
    expect(result[0].customerName).toBe("Empresa Teste");
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.quotation.list()).rejects.toThrow();
  });
});

describe("quotation.get", () => {
  it("returns a quotation by ID for the owner", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.get({ id: 1 });

    expect(result).toBeDefined();
    expect(result.quotationNumber).toBe("COT-2026-0001");
  });

  it("throws when quotation does not exist", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.quotation.get({ id: 999 })).rejects.toThrow(
      "Cotação não encontrada"
    );
  });

  it("throws when user does not own the quotation", async () => {
    const ctx = createAuthContext(99); // different user
    const caller = appRouter.createCaller(ctx);

    await expect(caller.quotation.get({ id: 1 })).rejects.toThrow(
      "Cotação não encontrada"
    );
  });
});

describe("quotation.delete", () => {
  it("deletes a quotation owned by the user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });

  it("throws when deleting a non-existent quotation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.quotation.delete({ id: 999 })).rejects.toThrow(
      "Cotação não encontrada ou sem permissão"
    );
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.quotation.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("quotation.updateStatus", () => {
  it("updates the status of a quotation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.updateStatus({
      id: 1,
      status: "approved",
    });

    expect(result).toEqual({ success: true });
  });

  it("throws for non-existent quotation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.quotation.updateStatus({ id: 999, status: "approved" })
    ).rejects.toThrow("Cotação não encontrada ou sem permissão");
  });
});

describe("quotation.update", () => {
  it("updates quotation fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quotation.update({
      id: 1,
      customerName: "Empresa Atualizada",
      status: "sent",
    });

    expect(result).toEqual({ success: true });
  });

  it("throws for non-existent quotation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.quotation.update({ id: 999, customerName: "Teste" })
    ).rejects.toThrow("Cotação não encontrada ou sem permissão");
  });
});
