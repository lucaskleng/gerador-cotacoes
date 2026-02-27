import { describe, expect, it } from "vitest";
import { generateQuotationPDF } from "./pdfGenerator";
import type { QuotationPDFData } from "./pdfGenerator";
import { DEFAULT_COMPANY, DEFAULT_PROPOSAL_DESIGN } from "../shared/designDefaults";

const sampleData: QuotationPDFData = {
  quotationNumber: "COT-2026-0001",
  quotationDate: "2026-02-27",
  validityDays: 30,
  customerName: "Empresa Teste Ltda",
  customerEmail: "contato@teste.com",
  customerPhone: "(61) 99999-0000",
  customerCompany: "Empresa Teste Ltda",
  customerCNPJ: "12.345.678/0001-90",
  customerAddress: "SIA Trecho 3, Lote 1500, Brasília/DF",
  reference: "Projeto Elétrico #123",
  notes: "Cotação de teste",
  items: [
    {
      id: "item-1",
      description: "Motor WEG 220V 5CV",
      unit: "un",
      quantity: 3,
      unitPrice: 1500,
      discount: 10,
      subtotal: 4050,
    },
    {
      id: "item-2",
      description: "Cabo flexível 10mm² (metro)",
      unit: "m",
      quantity: 100,
      unitPrice: 12.5,
      discount: 0,
      subtotal: 1250,
    },
  ],
  conditions: {
    paymentTerms: "30/60/90 dias",
    deliveryTime: "15 dias úteis",
    freight: "CIF",
    freightValue: 350,
    warranty: "12 meses",
  },
  texts: {
    headerText: "Prezado(a) ${customerName},",
    introNotes: "Apresentamos nossa proposta comercial conforme solicitado.",
    commercialNotes: "Valores sujeitos a alteração sem aviso prévio.",
    technicalNotes: "Todos os produtos atendem às normas ABNT vigentes.",
    closingNotes: "Agradecemos a oportunidade e ficamos à disposição.",
    footerText: "KL Engenharia Elétrica | (61) 3234-5678 | contato@klengenharia.com.br",
  },
  subtotal: "5300",
  totalDiscount: "450",
  grandTotal: "5200",
};

describe("PDF Generator", () => {
  it("generates a valid PDF buffer with default settings", async () => {
    const buffer = await generateQuotationPDF(sampleData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF magic bytes: %PDF
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates PDF with custom company and design options", async () => {
    const buffer = await generateQuotationPDF(sampleData, {
      company: {
        ...DEFAULT_COMPANY,
        companyName: "Empresa Custom Ltda",
        companySubtitle: "Soluções Elétricas",
      },
      design: {
        ...DEFAULT_PROPOSAL_DESIGN,
        headerBgColor: "#003366",
        accentColor: "#FF6600",
        fontSize: "large",
      },
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates PDF with small font size", async () => {
    const buffer = await generateQuotationPDF(sampleData, {
      design: {
        ...DEFAULT_PROPOSAL_DESIGN,
        fontSize: "small",
      },
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates PDF with Letter paper size", async () => {
    const buffer = await generateQuotationPDF(sampleData, {
      design: {
        ...DEFAULT_PROPOSAL_DESIGN,
        paperSize: "Letter",
      },
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates PDF with minimal data (no optional fields)", async () => {
    const minimalData: QuotationPDFData = {
      quotationNumber: "COT-2026-0002",
      quotationDate: "2026-02-27",
      validityDays: 15,
      customerName: "Cliente Simples",
      items: [
        {
          id: "item-1",
          description: "Produto teste",
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
        freight: "FOB",
        freightValue: 0,
        warranty: "6 meses",
      },
      texts: {
        headerText: "",
        introNotes: "",
        commercialNotes: "",
        technicalNotes: "",
        closingNotes: "",
        footerText: "",
      },
      subtotal: "100",
      totalDiscount: "0",
      grandTotal: "100",
    };

    const buffer = await generateQuotationPDF(minimalData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates PDF without border lines", async () => {
    const buffer = await generateQuotationPDF(sampleData, {
      design: {
        ...DEFAULT_PROPOSAL_DESIGN,
        showBorderLines: false,
        showLogo: false,
      },
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates PDF with center header layout", async () => {
    const buffer = await generateQuotationPDF(sampleData, {
      design: {
        ...DEFAULT_PROPOSAL_DESIGN,
        headerLayout: "center",
      },
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates PDF with right header layout", async () => {
    const buffer = await generateQuotationPDF(sampleData, {
      design: {
        ...DEFAULT_PROPOSAL_DESIGN,
        headerLayout: "right",
      },
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  });
});
