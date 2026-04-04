/**
 * Technical Proposal Word Generator
 * Generates .docx files with professional WEG-style layout.
 * Uses the `docx` npm package for server-side Word generation.
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  TableOfContents,
  PageBreak,
  VerticalAlign,
  Packer,
} from "docx";
import type { CompanyBranding, ProposalDesign } from "../shared/designDefaults";
import { DEFAULT_COMPANY, DEFAULT_PROPOSAL_DESIGN } from "../shared/designDefaults";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PanelItem {
  pos: number;
  description: string;
  qty: number;
  code?: string;
  observation?: string;
}

export interface Panel {
  name: string;
  items: PanelItem[];
}

export interface TechnicalProposalData {
  proposalNumber: string;
  proposalDate: string;
  validityDays: number;
  revision: string;

  // Customer
  customerName: string;
  customerCNPJ?: string;
  customerContact?: string;
  customerAddress?: string;

  // Project
  projectName: string;
  projectAddress?: string;

  // Content sections
  introText: string;
  presentationText: string;
  normsText: string;
  technicalComments: string;
  supplyLimits: string;
  environmentConditions: string;
  referenceDocuments: string;
  documentation: string;

  // Panels with items
  panels: Panel[];

  // Additional sections
  fieldServices: string;
  factoryInspection: string;
  pricesText: string;
  deliveryText: string;
  warrantyText: string;
  effectiveText: string;

  // Signatory
  signatoryName: string;
  signatoryRole: string;
}

export interface TechnicalProposalOptions {
  company: CompanyBranding;
  design: ProposalDesign;
}

// ─── Color Helpers ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  return hex.replace("#", "");
}

// ─── Fetch image as buffer ──────────────────────────────────────────────────

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// ─── Table Helpers ──────────────────────────────────────────────────────────

const THIN_BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "E2E2EA",
};

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};

function createPanelHeaderRow(panelName: string, headerBg: string, headerText: string, colCount: number): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: colCount,
        shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        borders: {
          top: THIN_BORDER,
          bottom: THIN_BORDER,
          left: THIN_BORDER,
          right: THIN_BORDER,
        },
        children: [
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: panelName,
                bold: true,
                size: 20,
                color: hexToRgb(headerText),
                font: "Calibri",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createItemRow(item: PanelItem, isStriped: boolean, stripedBg: string, hasCode: boolean, hasObs: boolean): TableRow {
  const bgColor = isStriped ? hexToRgb(stripedBg) : "FFFFFF";
  const textColor = "1A1A2E";

  const cells: TableCell[] = [
    // Pos
    new TableCell({
      width: { size: 800, type: WidthType.DXA },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: String(item.pos), size: 18, color: textColor, font: "Calibri" }),
          ],
        }),
      ],
    }),
    // Description
    new TableCell({
      width: { size: hasCode ? 4500 : (hasObs ? 5500 : 7200), type: WidthType.DXA },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
      children: [
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: item.description, size: 18, color: textColor, font: "Calibri" }),
          ],
        }),
      ],
    }),
    // Qty
    new TableCell({
      width: { size: 800, type: WidthType.DXA },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: String(item.qty), size: 18, color: textColor, font: "Calibri" }),
          ],
        }),
      ],
    }),
  ];

  if (hasCode) {
    cells.push(
      new TableCell({
        width: { size: 2200, type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
        children: [
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: item.code || "", size: 16, color: "6B7280", font: "Calibri" }),
            ],
          }),
        ],
      })
    );
  }

  if (hasObs) {
    cells.push(
      new TableCell({
        width: { size: 2200, type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
        children: [
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: item.observation || "", size: 16, color: "6B7280", font: "Calibri" }),
            ],
          }),
        ],
      })
    );
  }

  return new TableRow({ children: cells });
}

function createColumnHeaderRow(accentColor: string, hasCode: boolean, hasObs: boolean): TableRow {
  const headerBg = hexToRgb(accentColor);
  const headers = ["Item", "Descrição", "Qtd"];
  const widths = [800, hasCode ? 4500 : (hasObs ? 5500 : 7200), 800];
  if (hasCode) {
    headers.push("Código");
    widths.push(2200);
  }
  if (hasObs) {
    headers.push("Observação");
    widths.push(2200);
  }

  return new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: headerBg, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: h, bold: true, size: 18, color: "FFFFFF", font: "Calibri" }),
            ],
          }),
        ],
      })
    ),
  });
}

// ─── Section Heading ────────────────────────────────────────────────────────

function sectionHeading(number: string, title: string, accentColor: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 200 },
    shading: { fill: hexToRgb(accentColor), type: ShadingType.CLEAR },
    children: [
      new TextRun({
        text: `  ${number}. ${title.toUpperCase()}`,
        bold: true,
        size: 24,
        color: "FFFFFF",
        font: "Calibri",
      }),
    ],
  });
}

function subSectionHeading(number: string, title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: `${number} ${title}`,
        bold: true,
        size: 22,
        color: "1A1A2E",
        font: "Calibri",
      }),
    ],
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text,
        size: 20,
        color: "1A1A2E",
        font: "Calibri",
      }),
    ],
  });
}

function multiLineText(text: string): Paragraph[] {
  return text.split("\n").filter(l => l.trim()).map(line =>
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text: line.trim(),
          size: 20,
          color: "1A1A2E",
          font: "Calibri",
        }),
      ],
    })
  );
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export async function generateTechnicalProposal(
  data: TechnicalProposalData,
  options?: Partial<TechnicalProposalOptions>
): Promise<Buffer> {
  const company = options?.company ?? DEFAULT_COMPANY;
  const design = options?.design ?? DEFAULT_PROPOSAL_DESIGN;

  const headerBg = design.headerBgColor;
  const headerText = design.headerTextColor;
  const accent = design.accentColor;
  const stripedBg = design.tableStripedBg;

  // Detect if panels have codes or observations
  const hasCode = data.panels.some(p => p.items.some(i => i.code && i.code.trim()));
  const hasObs = data.panels.some(p => p.items.some(i => i.observation && i.observation.trim()));

  // Try to fetch logo
  let logoBuffer: Buffer | null = null;
  if (company.logoUrl) {
    logoBuffer = await fetchImageBuffer(company.logoUrl);
  }

  // ─── Build sections ──────────────────────────────────────────────────

  const sections: any[] = [];

  // ─── COVER PAGE ──────────────────────────────────────────────────────

  const coverChildren: any[] = [];

  // Header table (company info + badge)
  const headerCells: TableCell[] = [
    new TableCell({
      width: { size: 6000, type: WidthType.DXA },
      shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: [
        new Paragraph({
          spacing: { before: 100, after: 0 },
          children: [
            new TextRun({
              text: company.companyName.toUpperCase(),
              bold: true,
              size: 28,
              color: hexToRgb(headerText),
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 100 },
          children: [
            new TextRun({
              text: company.companySubtitle,
              size: 16,
              color: hexToRgb(headerText),
              font: "Calibri",
            }),
          ],
        }),
      ],
    }),
    new TableCell({
      width: { size: 3000, type: WidthType.DXA },
      shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 60, after: 0 },
          children: [
            new TextRun({
              text: "PROPOSTA",
              bold: true,
              size: 24,
              color: hexToRgb(accent),
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text: "TÉCNICA",
              bold: true,
              size: 24,
              color: hexToRgb(accent),
              font: "Calibri",
            }),
          ],
        }),
      ],
    }),
  ];

  coverChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: headerCells })],
    })
  );

  // Accent line
  coverChildren.push(
    new Paragraph({
      spacing: { before: 0, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: hexToRgb(accent) } },
      children: [],
    })
  );

  // Info bar
  const infoItems = [
    ["Proposta", data.proposalNumber],
    ["Tipo", "Técnica"],
    ["Data", data.proposalDate],
    ["Validade", `${data.validityDays} dias`],
    ["Revisão", data.revision],
  ];

  coverChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: infoItems.map(([label, value]) =>
            new TableCell({
              width: { size: Math.floor(100 / infoItems.length), type: WidthType.PERCENTAGE },
              shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
              verticalAlign: VerticalAlign.CENTER,
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 0 },
                  children: [
                    new TextRun({ text: label, bold: true, size: 16, color: "6B7280", font: "Calibri" }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 40 },
                  children: [
                    new TextRun({ text: value, bold: true, size: 18, color: "1A1A2E", font: "Calibri" }),
                  ],
                }),
              ],
            })
          ),
        }),
      ],
    })
  );

  coverChildren.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));

  // Customer + Project info side by side
  const destRows = [
    ["Destinatário", data.customerName],
  ];
  if (data.customerCNPJ) destRows.push(["CNPJ", data.customerCNPJ]);
  if (data.customerContact) destRows.push(["A/C", data.customerContact]);
  if (data.customerAddress) destRows.push(["Endereço", data.customerAddress]);

  const projRows = [
    ["Empreendimento", data.projectName],
  ];
  if (data.projectAddress) projRows.push(["Local", data.projectAddress]);

  coverChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({ text: "  DESTINATÁRIO", bold: true, size: 18, color: hexToRgb(headerText), font: "Calibri" }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({ text: "  DADOS DA OBRA", bold: true, size: 18, color: hexToRgb(headerText), font: "Calibri" }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Data rows
        ...Array.from({ length: Math.max(destRows.length, projRows.length) }, (_, i) => {
          const dest = destRows[i];
          const proj = projRows[i];
          return new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
                children: dest
                  ? [
                      new Paragraph({
                        spacing: { before: 30, after: 30 },
                        children: [
                          new TextRun({ text: `  ${dest[0]}: `, bold: true, size: 18, color: "6B7280", font: "Calibri" }),
                          new TextRun({ text: dest[1], size: 18, color: "1A1A2E", font: "Calibri" }),
                        ],
                      }),
                    ]
                  : [new Paragraph({ children: [] })],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
                children: proj
                  ? [
                      new Paragraph({
                        spacing: { before: 30, after: 30 },
                        children: [
                          new TextRun({ text: `  ${proj[0]}: `, bold: true, size: 18, color: "6B7280", font: "Calibri" }),
                          new TextRun({ text: proj[1], size: 18, color: "1A1A2E", font: "Calibri" }),
                        ],
                      }),
                    ]
                  : [new Paragraph({ children: [] })],
              }),
            ],
          });
        }),
      ],
    })
  );

  coverChildren.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));

  // Introduction text
  if (data.introText) {
    coverChildren.push(...multiLineText(data.introText));
  }

  coverChildren.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));

  // Signatory
  coverChildren.push(
    new Paragraph({
      spacing: { before: 100, after: 0 },
      children: [
        new TextRun({ text: "Atenciosamente,", size: 20, color: "1A1A2E", font: "Calibri" }),
      ],
    })
  );
  coverChildren.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));
  coverChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: data.signatoryName, bold: true, size: 20, color: "1A1A2E", font: "Calibri" }),
      ],
    })
  );
  coverChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: data.signatoryRole, size: 18, color: "6B7280", font: "Calibri" }),
      ],
    })
  );

  // ─── SUMÁRIO ─────────────────────────────────────────────────────────

  coverChildren.push(new Paragraph({ children: [new PageBreak()] }));

  coverChildren.push(sectionHeading("", "SUMÁRIO", accent));
  coverChildren.push(new Paragraph({ spacing: { before: 100, after: 0 }, children: [] }));

  const summaryItems = [
    "1. Normas Aplicáveis",
    "2. Considerações Técnicas",
    "   2.1 Comentários",
    "   2.2 Limites de Fornecimento",
    "   2.3 Condições Ambientais",
    "   2.4 Documentos de Referência",
    "   2.5 Documentação",
    "   2.6 Lista de Materiais",
    "3. Serviços de Campo",
    "4. Inspeção dos Equipamentos em Fábrica",
    "5. Preços",
    "6. Prazo de Entrega",
    "7. Garantia",
    "8. Entrada em Vigor",
  ];

  for (const item of summaryItems) {
    coverChildren.push(
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: item,
            size: 20,
            color: "1A1A2E",
            font: "Calibri",
            bold: !item.startsWith("   "),
          }),
        ],
      })
    );
  }

  // ─── SECTION 1: NORMAS ───────────────────────────────────────────────

  coverChildren.push(new Paragraph({ children: [new PageBreak()] }));
  coverChildren.push(sectionHeading("1", "NORMAS APLICÁVEIS", accent));
  if (data.normsText) {
    coverChildren.push(...multiLineText(data.normsText));
  }

  // ─── SECTION 2: CONSIDERAÇÕES TÉCNICAS ───────────────────────────────

  coverChildren.push(new Paragraph({ children: [new PageBreak()] }));
  coverChildren.push(sectionHeading("2", "CONSIDERAÇÕES TÉCNICAS", accent));

  if (data.technicalComments) {
    coverChildren.push(subSectionHeading("2.1", "Comentários"));
    coverChildren.push(...multiLineText(data.technicalComments));
  }

  if (data.supplyLimits) {
    coverChildren.push(subSectionHeading("2.2", "Limites de Fornecimento"));
    coverChildren.push(...multiLineText(data.supplyLimits));
  }

  if (data.environmentConditions) {
    coverChildren.push(subSectionHeading("2.3", "Condições Ambientais"));
    coverChildren.push(...multiLineText(data.environmentConditions));
  }

  if (data.referenceDocuments) {
    coverChildren.push(subSectionHeading("2.4", "Documentos de Referência"));
    coverChildren.push(...multiLineText(data.referenceDocuments));
  }

  if (data.documentation) {
    coverChildren.push(subSectionHeading("2.5", "Documentação"));
    coverChildren.push(...multiLineText(data.documentation));
  }

  // ─── SECTION 2.6: LISTA DE MATERIAIS ─────────────────────────────────

  coverChildren.push(subSectionHeading("2.6", "Lista de Materiais"));
  coverChildren.push(
    new Paragraph({
      spacing: { before: 60, after: 100 },
      children: [
        new TextRun({
          text: `Total: ${data.panels.length} painéis | ${data.panels.reduce((sum, p) => sum + p.items.length, 0)} itens`,
          size: 18,
          color: "6B7280",
          font: "Calibri",
          italics: true,
        }),
      ],
    })
  );

  // Build material tables
  for (const panel of data.panels) {
    const colCount = 3 + (hasCode ? 1 : 0) + (hasObs ? 1 : 0);

    const rows: TableRow[] = [
      createPanelHeaderRow(panel.name, headerBg, headerText, colCount),
      createColumnHeaderRow(accent, hasCode, hasObs),
    ];

    panel.items.forEach((item, idx) => {
      rows.push(createItemRow(item, idx % 2 === 1, stripedBg, hasCode, hasObs));
    });

    coverChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      })
    );

    coverChildren.push(new Paragraph({ spacing: { before: 100, after: 0 }, children: [] }));
  }

  // ─── SECTION 3-8 ─────────────────────────────────────────────────────

  if (data.fieldServices) {
    coverChildren.push(sectionHeading("3", "SERVIÇOS DE CAMPO", accent));
    coverChildren.push(...multiLineText(data.fieldServices));
  }

  if (data.factoryInspection) {
    coverChildren.push(sectionHeading("4", "INSPEÇÃO DOS EQUIPAMENTOS EM FÁBRICA", accent));
    coverChildren.push(...multiLineText(data.factoryInspection));
  }

  if (data.pricesText) {
    coverChildren.push(sectionHeading("5", "PREÇOS", accent));
    coverChildren.push(...multiLineText(data.pricesText));
  }

  if (data.deliveryText) {
    coverChildren.push(sectionHeading("6", "PRAZO DE ENTREGA", accent));
    coverChildren.push(...multiLineText(data.deliveryText));
  }

  if (data.warrantyText) {
    coverChildren.push(sectionHeading("7", "GARANTIA", accent));
    coverChildren.push(...multiLineText(data.warrantyText));
  }

  if (data.effectiveText) {
    coverChildren.push(sectionHeading("8", "ENTRADA EM VIGOR", accent));
    coverChildren.push(...multiLineText(data.effectiveText));
  }

  // ─── REVISION TABLE ──────────────────────────────────────────────────

  coverChildren.push(new Paragraph({ spacing: { before: 300, after: 0 }, children: [] }));
  coverChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["REV", "Data", "Descrição", "Elaborado", "Aprovado"].map(h =>
            new TableCell({
              shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({ text: h, bold: true, size: 16, color: hexToRgb(headerText), font: "Calibri" }),
                  ],
                }),
              ],
            })
          ),
        }),
        new TableRow({
          children: [
            data.revision,
            data.proposalDate,
            "Emissão inicial",
            data.signatoryName.split(" ")[0],
            data.signatoryName.split(" ")[0],
          ].map(v =>
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 30, after: 30 },
                  children: [
                    new TextRun({ text: v, size: 16, color: "1A1A2E", font: "Calibri" }),
                  ],
                }),
              ],
            })
          ),
        }),
      ],
    })
  );

  // ─── Build Document ──────────────────────────────────────────────────

  // Footer content
  const footerParts = [company.companyName];
  if (company.cnpj) footerParts.push(`CNPJ ${company.cnpj}`);
  if (company.address) footerParts.push(company.address);
  const footerLine2Parts: string[] = [];
  if (company.email) footerLine2Parts.push(company.email);
  if (company.phone) footerLine2Parts.push(company.phone);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                        children: [
                          new Paragraph({
                            spacing: { before: 60, after: 0 },
                            children: [
                              new TextRun({
                                text: `  ${company.companyName.toUpperCase()}`,
                                bold: true,
                                size: 22,
                                color: hexToRgb(headerText),
                                font: "Calibri",
                              }),
                            ],
                          }),
                          new Paragraph({
                            spacing: { before: 0, after: 60 },
                            children: [
                              new TextRun({
                                text: `  ${company.companySubtitle}`,
                                size: 14,
                                color: hexToRgb(headerText),
                                font: "Calibri",
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        shading: { fill: hexToRgb(headerBg), type: ShadingType.CLEAR },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 40, after: 0 },
                            children: [
                              new TextRun({ text: "PROPOSTA  ", bold: true, size: 20, color: hexToRgb(accent), font: "Calibri" }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 40 },
                            children: [
                              new TextRun({ text: "TÉCNICA  ", bold: true, size: 20, color: hexToRgb(accent), font: "Calibri" }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 0 },
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E2EA" } },
                children: [
                  new TextRun({
                    text: footerParts.join("  |  "),
                    size: 14,
                    color: "6B7280",
                    font: "Calibri",
                  }),
                ],
              }),
              ...(footerLine2Parts.length > 0
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: footerLine2Parts.join("  |  "),
                          size: 14,
                          color: "6B7280",
                          font: "Calibri",
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
        },
        children: coverChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
