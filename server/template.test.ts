import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ────────────────────────────────────────────────────────────────

const mockTemplates: any[] = [];
let nextId = 1;

vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    listTemplates: vi.fn(async (userId: number) =>
      mockTemplates.filter((t) => t.userId === userId)
    ),
    getTemplate: vi.fn(async (id: number) =>
      mockTemplates.find((t) => t.id === id) || null
    ),
    createTemplate: vi.fn(async (data: any) => {
      const id = nextId++;
      mockTemplates.push({ id, ...data, createdAt: new Date(), updatedAt: new Date() });
      return id;
    }),
    updateTemplate: vi.fn(async (id: number, userId: number, data: any) => {
      const idx = mockTemplates.findIndex((t) => t.id === id && t.userId === userId);
      if (idx === -1) return false;
      mockTemplates[idx] = { ...mockTemplates[idx], ...data, updatedAt: new Date() };
      return true;
    }),
    deleteTemplate: vi.fn(async (id: number, userId: number) => {
      const idx = mockTemplates.findIndex((t) => t.id === id && t.userId === userId);
      if (idx === -1) return false;
      mockTemplates.splice(idx, 1);
      return true;
    }),
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@test.com`,
      name: `User ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

const sampleConditions = {
  paymentTerms: "30 dias",
  deliveryTime: "15 dias úteis",
  freight: "CIF",
  freightValue: 0,
  warranty: "12 meses",
};

const sampleTexts = {
  headerText: "PROPOSTA COMERCIAL",
  introNotes: "Prezado cliente...",
  commercialNotes: "Condições...",
  technicalNotes: "Notas técnicas...",
  closingNotes: "Atenciosamente...",
  footerText: "KL Engenharia",
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Template CRUD", () => {
  beforeEach(() => {
    mockTemplates.length = 0;
    nextId = 1;
  });

  it("creates a template", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.template.create({
      name: "Proposta Industrial",
      quotationType: "products",
      validityDays: 30,
      conditions: sampleConditions,
      texts: sampleTexts,
    });

    expect(result.id).toBe(1);
    expect(mockTemplates).toHaveLength(1);
    expect(mockTemplates[0].name).toBe("Proposta Industrial");
  });

  it("creates a template with default items", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.template.create({
      name: "Manutenção Preventiva",
      quotationType: "services",
      validityDays: 15,
      conditions: sampleConditions,
      texts: sampleTexts,
      defaultItems: [
        { description: "Mão de obra", unit: "hr", quantity: 8, unitPrice: 150, discount: 0 },
        { description: "Deslocamento", unit: "km", quantity: 50, unitPrice: 3, discount: 0 },
      ],
    });

    expect(result.id).toBe(1);
    expect(mockTemplates[0].defaultItems).toHaveLength(2);
  });

  it("lists templates for a user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await caller.template.create({
      name: "Template A",
      quotationType: "products",
      validityDays: 30,
      conditions: sampleConditions,
      texts: sampleTexts,
    });
    await caller.template.create({
      name: "Template B",
      quotationType: "services",
      validityDays: 15,
      conditions: sampleConditions,
      texts: sampleTexts,
    });

    const list = await caller.template.list();
    expect(list).toHaveLength(2);
  });

  it("gets a single template", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.template.create({
      name: "Template C",
      quotationType: "products",
      validityDays: 30,
      conditions: sampleConditions,
      texts: sampleTexts,
    });

    const template = await caller.template.get({ id });
    expect(template).not.toBeNull();
    expect(template!.name).toBe("Template C");
  });

  it("updates a template", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.template.create({
      name: "Old Name",
      quotationType: "products",
      validityDays: 30,
      conditions: sampleConditions,
      texts: sampleTexts,
    });

    const result = await caller.template.update({ id, name: "New Name" });
    expect(result.success).toBe(true);
    expect(mockTemplates[0].name).toBe("New Name");
  });

  it("deletes a template", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.template.create({
      name: "To Delete",
      quotationType: "products",
      validityDays: 30,
      conditions: sampleConditions,
      texts: sampleTexts,
    });

    const result = await caller.template.delete({ id });
    expect(result.success).toBe(true);
    expect(mockTemplates).toHaveLength(0);
  });

  it("fails to delete another user's template", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    const { id } = await caller1.template.create({
      name: "User 1 Template",
      quotationType: "products",
      validityDays: 30,
      conditions: sampleConditions,
      texts: sampleTexts,
    });

    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(caller2.template.delete({ id })).rejects.toThrow();
  });

  it("fails to update another user's template", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    const { id } = await caller1.template.create({
      name: "User 1 Template",
      quotationType: "products",
      validityDays: 30,
      conditions: sampleConditions,
      texts: sampleTexts,
    });

    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(caller2.template.update({ id, name: "Hacked" })).rejects.toThrow();
  });
});
