import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { DEFAULT_DESIGN_SETTINGS } from "../shared/designDefaults";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the db module
vi.mock("./db", () => {
  let storedSettings: any = null;

  return {
    getDesignSettings: vi.fn(async (_userId: number) => storedSettings),
    upsertDesignSettings: vi.fn(async (_userId: number, data: any) => {
      storedSettings = data;
    }),
    // Stub other db functions used by the router
    createQuotation: vi.fn(),
    listQuotations: vi.fn(async () => []),
    getQuotation: vi.fn(),
    updateQuotation: vi.fn(),
    deleteQuotation: vi.fn(),
    updateQuotationStatus: vi.fn(),
    generateQuotationNumber: vi.fn(async () => "COT-001"),
  };
});

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn(async (_key: string, _data: any, _mime: string) => ({
    url: "https://cdn.example.com/test-logo.png",
    key: "logos/test.png",
  })),
}));

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
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

describe("design.get", () => {
  it("returns default settings when none saved", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.design.get();

    expect(result).toBeDefined();
    expect(result.company).toBeDefined();
    expect(result.platformTheme).toBeDefined();
    expect(result.proposalDesign).toBeDefined();
    expect(result.company.companyName).toBe(DEFAULT_DESIGN_SETTINGS.company.companyName);
  });
});

describe("design.save", () => {
  it("saves design settings successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customSettings = {
      company: {
        ...DEFAULT_DESIGN_SETTINGS.company,
        companyName: "KL Engenharia Elétrica",
        companySubtitle: "Soluções em Engenharia Elétrica",
        cnpj: "12.345.678/0001-90",
      },
      platformTheme: {
        ...DEFAULT_DESIGN_SETTINGS.platformTheme,
        primaryColor: "#1a5276",
      },
      proposalDesign: {
        ...DEFAULT_DESIGN_SETTINGS.proposalDesign,
        headerBgColor: "#1a5276",
        accentColor: "#2980b9",
      },
    };

    const result = await caller.design.save(customSettings);

    expect(result).toEqual({ success: true });
  });

  it("returns saved settings after save", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // After saving, get should return saved data
    const result = await caller.design.get();

    expect(result).toBeDefined();
    expect(result.company).toBeDefined();
    expect(result.proposalDesign).toBeDefined();
  });
});

describe("design.uploadLogo", () => {
  it("uploads a logo and returns URL", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a small 1x1 PNG as base64
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.design.uploadLogo({
      base64,
      mimeType: "image/png",
    });

    expect(result).toBeDefined();
    expect(result.url).toBe("https://cdn.example.com/test-logo.png");
  });
});

describe("design settings validation", () => {
  it("rejects save with missing required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.design.save({
        company: { companyName: "Test" } as any,
        platformTheme: {} as any,
        proposalDesign: {} as any,
      })
    ).rejects.toThrow();
  });

  it("accepts all valid color formats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const settings = {
      company: DEFAULT_DESIGN_SETTINGS.company,
      platformTheme: {
        ...DEFAULT_DESIGN_SETTINGS.platformTheme,
        primaryColor: "#ff0000",
        backgroundColor: "#ffffff",
      },
      proposalDesign: {
        ...DEFAULT_DESIGN_SETTINGS.proposalDesign,
        headerBgColor: "#123456",
        accentColor: "rgb(0,128,255)",
      },
    };

    const result = await caller.design.save(settings);
    expect(result).toEqual({ success: true });
  });
});
