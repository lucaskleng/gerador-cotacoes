import { describe, it, expect } from "vitest";
import { generateTechnicalProposal } from "./technicalProposalGenerator";
import type { TechnicalProposalData } from "./technicalProposalGenerator";

const sampleData: TechnicalProposalData = {
  proposalNumber: "KL-TEST-001",
  proposalDate: "04/04/2026",
  validityDays: 30,
  revision: "00",
  customerName: "EMPRESA TESTE LTDA",
  customerCNPJ: "12.345.678/0001-90",
  customerContact: "Eng. Teste",
  customerAddress: "Rua Teste, 123 - Brasília/DF",
  projectName: "ED. TESTE TOWER",
  projectAddress: "SQNW 123 - Brasília/DF",
  introText: "Apresentamos nossa proposta técnica para fornecimento de painéis elétricos.",
  presentationText: "",
  normsText: "ABNT NBR IEC 61439-1\nABNT NBR IEC 61439-3\nABNT NBR 5410",
  technicalComments: "Sistema pro E Power ABB",
  supplyLimits: "Incluso: fabricação e montagem\nNão incluso: transporte",
  environmentConditions: "Temperatura: 0°C a 40°C\nUmidade: até 50%",
  referenceDocuments: "Projeto elétrico rev. 03",
  documentation: "Diagrama unifilar\nLista de materiais",
  panels: [
    {
      name: "QGBT-01",
      items: [
        { pos: 1, description: "Disjuntor tripolar 100A", qty: 1, code: "ABB-001" },
        { pos: 2, description: "Contator 3P 25A", qty: 3 },
        { pos: 3, description: "Relé térmico 18-25A", qty: 3, observation: "Marca ABB" },
      ],
    },
    {
      name: "QFL-5SS-A",
      items: [
        { pos: 1, description: "Disjuntor monopolar 16A", qty: 6 },
        { pos: 2, description: "Disjuntor monopolar 20A", qty: 4 },
        { pos: 3, description: "IDR 2P 40A 30mA", qty: 2 },
      ],
    },
  ],
  fieldServices: "Não incluso nesta proposta.",
  factoryInspection: "Disponível mediante agendamento.",
  pricesText: "Conforme proposta comercial.",
  deliveryText: "45 a 60 dias úteis.",
  warrantyText: "12 meses contra defeitos de fabricação.",
  effectiveText: "Válida conforme indicado na capa.",
  signatoryName: "Lucas Lessa",
  signatoryRole: "Diretor Executivo",
};

describe("Technical Proposal Generator", () => {
  it("should generate a valid .docx buffer", async () => {
    const buffer = await generateTechnicalProposal(sampleData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("should produce a valid docx file (ZIP magic bytes)", async () => {
    const buffer = await generateTechnicalProposal(sampleData);
    // DOCX files are ZIP archives, starting with PK (0x50, 0x4B)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it("should handle empty panels gracefully", async () => {
    const data = { ...sampleData, panels: [] };
    const buffer = await generateTechnicalProposal(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("should handle panels with codes and observations", async () => {
    const data = {
      ...sampleData,
      panels: [
        {
          name: "QGBT-TEST",
          items: [
            { pos: 1, description: "Item com código", qty: 2, code: "ABC-123", observation: "Nota teste" },
            { pos: 2, description: "Item sem código", qty: 1 },
          ],
        },
      ],
    };
    const buffer = await generateTechnicalProposal(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("should handle custom design options", async () => {
    const buffer = await generateTechnicalProposal(sampleData, {
      company: {
        companyName: "KL ENGENHARIA ELÉTRICA LTDA",
        companySubtitle: "Painéis Elétricos | Quadros de Comando",
        logoUrl: "",
        cnpj: "00.000.000/0001-00",
        phone: "(61) 3333-3333",
        email: "contato@klengenharia.com.br",
        website: "www.klengenharia.com.br",
        address: "Brasília/DF",
      },
      design: {
        headerBgColor: "#1A1A2E",
        headerTextColor: "#FFFFFF",
        accentColor: "#FF4B4B",
        bodyBgColor: "#FFFFFF",
        bodyTextColor: "#1A1A2E",
        tableBorderColor: "#E2E2EA",
        tableHeaderBgColor: "#1A1A2E",
        tableHeaderTextColor: "#FFFFFF",
        tableStripedBg: "#F8F8FC",
        titleFont: "DM Sans",
        bodyFont: "DM Sans",
        monoFont: "DM Mono",
        fontSize: "medium",
        showLogo: true,
        showBorderLines: true,
        headerLayout: "left",
        paperSize: "A4",
      },
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("should handle large number of panels", async () => {
    const manyPanels = Array.from({ length: 20 }, (_, i) => ({
      name: `QFL-${i + 1}`,
      items: Array.from({ length: 10 }, (_, j) => ({
        pos: j + 1,
        description: `Disjuntor ${j + 1}A`,
        qty: j + 1,
      })),
    }));
    const data = { ...sampleData, panels: manyPanels };
    const buffer = await generateTechnicalProposal(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);
  });
});
