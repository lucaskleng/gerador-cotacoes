/**
 * PDF Generator for Quotations — Professional Layout
 * Inspired by WEG technical proposal format.
 * Uses PDFKit to generate professional quotation PDFs with full branding.
 */

import PDFDocument from "pdfkit";
import type {
  QuotationLineItem,
  QuotationConditions,
  QuotationTexts,
} from "../drizzle/schema";
import type {
  CompanyBranding,
  ProposalDesign,
} from "../shared/designDefaults";
import {
  DEFAULT_COMPANY,
  DEFAULT_PROPOSAL_DESIGN,
} from "../shared/designDefaults";
import https from "https";
import http from "http";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QuotationPDFData {
  quotationNumber: string;
  quotationDate: string;
  validityDays: number;
  quotationType?: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCompany?: string | null;
  customerCNPJ?: string | null;
  customerAddress?: string | null;
  reference?: string | null;
  notes?: string | null;
  items: QuotationLineItem[];
  conditions: QuotationConditions;
  texts: QuotationTexts;
  subtotal: string;
  totalDiscount: string;
  grandTotal: string;
}

export interface PDFOptions {
  company: CompanyBranding;
  design: ProposalDesign;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function hexToRGB(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function fetchImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          return fetchImage(res.headers.location).then(resolve).catch(reject);
        }
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function getFontSize(base: string): { title: number; section: number; body: number; small: number; mono: number } {
  switch (base) {
    case "small":
      return { title: 16, section: 11, body: 8, small: 7, mono: 8 };
    case "large":
      return { title: 22, section: 14, body: 10.5, small: 9, mono: 10.5 };
    default: // medium
      return { title: 20, section: 12.5, body: 9.5, small: 8, mono: 9.5 };
  }
}

function interpolateVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] || "");
}

function lightenColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRGB(hex);
  const lr = Math.min(255, Math.round(r + (255 - r) * factor));
  const lg = Math.min(255, Math.round(g + (255 - g) * factor));
  const lb = Math.min(255, Math.round(b + (255 - b) * factor));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

// ─── Page Header/Footer Helpers ─────────────────────────────────────────────

interface PageLayoutConfig {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  fs: ReturnType<typeof getFontSize>;
  company: CompanyBranding;
  design: ProposalDesign;
  data: QuotationPDFData;
  logoBuffer: Buffer | null;
  headerHeight: number;
  footerHeight: number;
}

function drawPageHeader(doc: PDFKit.PDFDocument, cfg: PageLayoutConfig, pageNum: number, totalPages: number) {
  const { pageWidth, margin, contentWidth, fs, company, design, data, logoBuffer, headerHeight } = cfg;

  // Header background
  doc.rect(0, 0, pageWidth, headerHeight).fill(design.headerBgColor);

  // Logo on the right
  let companyTextWidth = contentWidth;
  if (logoBuffer && design.showLogo) {
    try {
      const logoSize = 42;
      const logoX = pageWidth - margin - logoSize;
      const logoY = (headerHeight - logoSize) / 2;
      doc.image(logoBuffer, logoX, logoY, { width: logoSize, height: logoSize });
      companyTextWidth = contentWidth - logoSize - 16;
    } catch (e) {
      console.warn("[PDF] Failed to embed logo:", e);
    }
  }

  // Company name (bold, large)
  doc
    .fillColor(design.headerTextColor)
    .fontSize(fs.title - 2)
    .font("Helvetica-Bold")
    .text(company.companyName, margin, 12, { width: companyTextWidth });

  // Subtitle
  if (company.companySubtitle) {
    doc
      .fontSize(fs.body)
      .font("Helvetica")
      .fillColor(design.headerTextColor)
      .text(company.companySubtitle, margin, 12 + fs.title, { width: companyTextWidth });
  }

  // Info bar below header
  const barY = headerHeight;
  const barH = 18;
  const barBg = lightenColor(design.headerBgColor, 0.85);
  doc.rect(0, barY, pageWidth, barH).fill(barBg);

  // Accent line below bar
  if (design.showBorderLines) {
    doc.rect(0, barY + barH, pageWidth, 2).fill(design.accentColor);
  }

  // Info bar text
  const proposalType = data.quotationType === "services" ? "Técnica (Serviços)" : "Técnica (Produtos)";
  doc.fillColor(design.bodyTextColor).fontSize(fs.small).font("Helvetica");
  doc.text(`Proposta: ${data.quotationNumber}`, margin, barY + 4, { width: 180 });
  doc.text(proposalType, margin + 180, barY + 4, { width: 120, align: "center" });
  doc.text(`Data: ${data.quotationDate}`, margin + 300, barY + 4, { width: 120, align: "center" });
  doc.text(`Pág.: ${pageNum} | ${totalPages}`, pageWidth - margin - 80, barY + 4, { width: 80, align: "right" });
}

function drawPageFooter(doc: PDFKit.PDFDocument, cfg: PageLayoutConfig) {
  const { pageWidth, pageHeight, margin, contentWidth, fs, company, design, data } = cfg;

  // Footer separator line
  const footerLineY = pageHeight - cfg.footerHeight;
  if (design.showBorderLines) {
    doc
      .strokeColor(design.accentColor)
      .lineWidth(0.8)
      .moveTo(margin, footerLineY)
      .lineTo(pageWidth - margin, footerLineY)
      .stroke();
  }

  // Company info left
  const footerY = footerLineY + 5;
  doc.fillColor(design.bodyTextColor).fontSize(fs.small - 1).font("Helvetica-Bold");
  doc.text(company.companyName, margin, footerY, { width: contentWidth / 2 });
  doc.font("Helvetica").fontSize(fs.small - 1.5);
  if (company.address) {
    doc.text(company.address, margin, footerY + 9, { width: contentWidth / 2 });
  }
  if (company.cnpj) {
    doc.text(`CNPJ: ${company.cnpj}`, margin, footerY + 18, { width: contentWidth / 2 });
  }

  // Contact info right
  doc.fontSize(fs.small - 1.5).font("Helvetica");
  const rightX = pageWidth - margin - contentWidth / 2;
  if (company.email) {
    doc.text(`E-mail: ${company.email}`, rightX, footerY, { width: contentWidth / 2, align: "right" });
  }
  if (company.phone) {
    doc.text(`Tel.: ${company.phone}`, rightX, footerY + 9, { width: contentWidth / 2, align: "right" });
  }
}

// ─── PDF Generator ──────────────────────────────────────────────────────────

export async function generateQuotationPDF(
  data: QuotationPDFData,
  options?: Partial<PDFOptions>
): Promise<Buffer> {
  const company = options?.company ?? DEFAULT_COMPANY;
  const design = options?.design ?? DEFAULT_PROPOSAL_DESIGN;
  const fs = getFontSize(design.fontSize);

  const pageWidth = design.paperSize === "Letter" ? 612 : 595.28;
  const pageHeight = design.paperSize === "Letter" ? 792 : 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;
  const headerHeight = 55;
  const infoBarHeight = 20;
  const footerHeight = 40;
  const contentStartY = headerHeight + infoBarHeight + 15;

  const doc = new PDFDocument({
    size: design.paperSize === "Letter" ? "LETTER" : "A4",
    margins: { top: margin, bottom: margin, left: margin, right: margin },
    bufferPages: true,
    info: {
      Title: `Proposta ${data.quotationNumber}`,
      Author: company.companyName,
      Subject: `Proposta Técnico-Comercial - ${data.customerName}`,
      Creator: "KL Engenharia - Quotation Generator",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // ─── Variable interpolation map
  const vars: Record<string, string> = {
    customerName: data.customerName,
    customerCompany: data.customerCompany || "",
    customerEmail: data.customerEmail || "",
    customerPhone: data.customerPhone || "",
    quotationNumber: data.quotationNumber,
    quotationDate: data.quotationDate,
    validityDays: String(data.validityDays),
    grandTotal: formatCurrency(data.grandTotal),
    subtotal: formatCurrency(data.subtotal),
    totalDiscount: formatCurrency(data.totalDiscount),
    companyName: company.companyName,
    companyPhone: company.phone,
    companyEmail: company.email,
  };

  // ─── Fetch logo
  let logoBuffer: Buffer | null = null;
  if (design.showLogo && company.logoUrl) {
    try {
      logoBuffer = await fetchImage(company.logoUrl);
    } catch (e) {
      console.warn("[PDF] Failed to fetch logo:", e);
    }
  }

  const cfg: PageLayoutConfig = {
    pageWidth, pageHeight, margin, contentWidth, fs, company, design, data, logoBuffer, headerHeight, footerHeight,
  };

  // Helper: draw section header with accent bar
  function sectionHeader(title: string, sectionNum: number) {
    if (y > pageHeight - 120) {
      doc.addPage();
      y = contentStartY;
    }
    // Accent line
    doc.rect(margin, y, contentWidth, 1.5).fill(design.accentColor);
    y += 5;
    doc
      .fillColor(design.accentColor)
      .fontSize(fs.section + 1)
      .font("Helvetica-Bold")
      .text(`${sectionNum}.  ${title.toUpperCase()}`, margin, y, { width: contentWidth });
    y += fs.section + 10;
    // Thin line below
    doc
      .strokeColor(design.accentColor)
      .lineWidth(0.5)
      .moveTo(margin, y)
      .lineTo(margin + contentWidth, y)
      .stroke();
    y += 8;
  }

  // Helper: sub-section header
  function subSectionHeader(title: string, parentNum: number, subNum: number) {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = contentStartY;
    }
    doc
      .fillColor(design.accentColor)
      .fontSize(fs.body + 1)
      .font("Helvetica-Bold")
      .text(`${parentNum}.${subNum}  ${title}`, margin + 8, y, { width: contentWidth - 16 });
    y += fs.body + 8;
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER / INTRO
  // ════════════════════════════════════════════════════════════════════════

  let y = contentStartY;

  // ─── DESTINATÁRIO ─────────────────────────────────────────────────────
  doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica-Bold");
  doc.text("Para:", margin, y, { continued: true });
  doc.font("Helvetica").text(`  ${data.customerCompany || data.customerName}`);
  y = doc.y + 4;

  if (data.customerCNPJ) {
    doc.font("Helvetica-Bold").text("CNPJ:", margin, y, { continued: true });
    doc.font("Helvetica").text(`  ${data.customerCNPJ}`);
    y = doc.y + 4;
  }

  y += 8;

  // ─── REFERÊNCIA ───────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(fs.body);
  doc.text("Ref.:", margin, y, { continued: true });
  doc.font("Helvetica").text(
    `  Proposta ${data.quotationType === "services" ? "Técnica de Serviços" : "Técnica de Produtos"} para ${data.reference || `projeto ${data.customerCompany || data.customerName}`}`
  );
  y = doc.y + 14;

  // ─── INTRO TEXT ───────────────────────────────────────────────────────
  if (data.texts.headerText) {
    const headerText = interpolateVars(data.texts.headerText, vars);
    doc.fontSize(fs.body).font("Helvetica").fillColor(design.bodyTextColor);
    doc.text(headerText, margin, y, { width: contentWidth, lineGap: 3 });
    y = doc.y + 8;
  }

  if (data.texts.introNotes) {
    const introText = interpolateVars(data.texts.introNotes, vars);
    doc.fontSize(fs.body).font("Helvetica").fillColor(design.bodyTextColor);
    doc.text(introText, margin, y, { width: contentWidth, lineGap: 3 });
    y = doc.y + 8;
  }

  y += 8;

  // ─── REVISION TABLE (bottom of page 1) ────────────────────────────────
  // Push to bottom area
  const revTableY = pageHeight - footerHeight - 80;
  if (y < revTableY) {
    y = revTableY;
  }

  const revColWidths = [50, 80, contentWidth - 130];
  const revH = 18;

  // Header row
  doc.rect(margin, y, contentWidth, revH).fill(design.tableHeaderBgColor);
  doc.fillColor(design.tableHeaderTextColor).fontSize(fs.small).font("Helvetica-Bold");
  let rx = margin;
  doc.text("REV", rx + 4, y + 4, { width: revColWidths[0], align: "center" }); rx += revColWidths[0];
  doc.text("DATA", rx + 4, y + 4, { width: revColWidths[1], align: "center" }); rx += revColWidths[1];
  doc.text("DESCRIÇÃO", rx + 4, y + 4, { width: revColWidths[2] });
  y += revH;

  // Data row
  doc.rect(margin, y, contentWidth, revH).fill(lightenColor(design.headerBgColor, 0.92));
  doc.fillColor(design.bodyTextColor).fontSize(fs.small).font("Helvetica");
  rx = margin;
  doc.text("00", rx + 4, y + 4, { width: revColWidths[0], align: "center" }); rx += revColWidths[0];
  doc.text(data.quotationDate, rx + 4, y + 4, { width: revColWidths[1], align: "center" }); rx += revColWidths[1];
  doc.text("Emissão inicial", rx + 4, y + 4, { width: revColWidths[2] });
  y += revH;

  // Empty row for future revisions
  doc.rect(margin, y, contentWidth, revH).strokeColor(design.tableBorderColor).lineWidth(0.5).stroke();
  y += revH;

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 2+ — SUMÁRIO (if document is long enough)
  // ════════════════════════════════════════════════════════════════════════

  // Build section list
  const sections: string[] = [];
  sections.push("Dados do Cliente");
  if (data.texts.introNotes || data.texts.headerText) sections.push("Escopo da Proposta");
  sections.push("Lista de Materiais / Itens");
  sections.push("Condições Comerciais");
  if (data.texts.technicalNotes) sections.push("Observações Técnicas");
  if (data.texts.commercialNotes) sections.push("Observações Comerciais");
  sections.push("Encerramento e Validade");

  // Only add summary page if there are enough items
  if (data.items.length > 5) {
    doc.addPage();
    y = contentStartY;

    // SUMÁRIO title
    doc.rect(margin, y, contentWidth, 1.5).fill(design.accentColor);
    y += 5;
    doc
      .fillColor(design.accentColor)
      .fontSize(fs.section + 2)
      .font("Helvetica-Bold")
      .text("SUMÁRIO", margin, y, { width: contentWidth, align: "center" });
    y += fs.section + 15;

    doc.fillColor(design.bodyTextColor).fontSize(fs.body + 0.5).font("Helvetica");
    sections.forEach((s, i) => {
      const num = `${i + 1}.`;
      const dots = ".".repeat(Math.max(3, 80 - s.length - num.length));
      doc.font("Helvetica-Bold").text(num, margin + 20, y, { continued: true, width: 25 });
      doc.font("Helvetica").text(`  ${s} ${dots}`, { continued: true });
      doc.text("", { width: 30 }); // line break
      y = doc.y + 3;
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 1 — DADOS DO CLIENTE
  // ════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = contentStartY;
  let sectionNum = 1;

  sectionHeader("Dados do Cliente", sectionNum);

  doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");

  const customerFields = [
    { label: "Razão Social / Nome", value: data.customerName },
    { label: "Empresa", value: data.customerCompany },
    { label: "CNPJ", value: data.customerCNPJ },
    { label: "E-mail", value: data.customerEmail },
    { label: "Telefone", value: data.customerPhone },
    { label: "Endereço", value: data.customerAddress },
  ];

  for (const field of customerFields) {
    if (field.value) {
      doc.font("Helvetica-Bold").text(`${field.label}: `, margin + 8, y, { continued: true }).font("Helvetica").text(String(field.value));
      y = doc.y + 3;
    }
  }
  y += 14;

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 2 — ESCOPO (optional)
  // ════════════════════════════════════════════════════════════════════════

  if (data.texts.introNotes || data.texts.headerText) {
    sectionNum++;
    sectionHeader("Escopo da Proposta", sectionNum);

    doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");

    if (data.texts.headerText) {
      const text = interpolateVars(data.texts.headerText, vars);
      doc.text(text, margin + 8, y, { width: contentWidth - 16, lineGap: 2.5 });
      y = doc.y + 8;
    }
    if (data.texts.introNotes) {
      const text = interpolateVars(data.texts.introNotes, vars);
      doc.text(text, margin + 8, y, { width: contentWidth - 16, lineGap: 2.5 });
      y = doc.y + 8;
    }
    y += 6;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 3 — LISTA DE MATERIAIS / ITENS
  // ════════════════════════════════════════════════════════════════════════

  sectionNum++;
  sectionHeader("Lista de Materiais / Itens", sectionNum);

  // Table column widths
  const colWidths = {
    num: 28,
    desc: contentWidth - 28 - 35 - 45 - 60 - 45 - 65,
    unit: 35,
    qty: 45,
    price: 60,
    disc: 45,
    total: 65,
  };

  // Draw table header
  function drawTableHeader() {
    const tableHeaderH = fs.small + 10;
    doc.rect(margin, y, contentWidth, tableHeaderH).fill(design.tableHeaderBgColor);

    let tx = margin;
    const thY = y + 5;
    doc.fillColor(design.tableHeaderTextColor).fontSize(fs.small).font("Helvetica-Bold");
    doc.text("Item", tx + 2, thY, { width: colWidths.num, align: "center" }); tx += colWidths.num;
    doc.text("Descrição", tx + 4, thY, { width: colWidths.desc }); tx += colWidths.desc;
    doc.text("Un.", tx, thY, { width: colWidths.unit, align: "center" }); tx += colWidths.unit;
    doc.text("Qtd.", tx, thY, { width: colWidths.qty, align: "center" }); tx += colWidths.qty;
    doc.text("Valor Un.", tx, thY, { width: colWidths.price, align: "right" }); tx += colWidths.price;
    doc.text("Desc.%", tx, thY, { width: colWidths.disc, align: "center" }); tx += colWidths.disc;
    doc.text("Subtotal", tx, thY, { width: colWidths.total, align: "right" });

    y += tableHeaderH;
  }

  drawTableHeader();

  // Table rows
  data.items.forEach((item, idx) => {
    // Calculate row height based on description length
    doc.fontSize(fs.small).font("Helvetica");
    const descHeight = doc.heightOfString(item.description, { width: colWidths.desc - 8 });
    const rowH = Math.max(fs.small + 8, descHeight + 8);

    // Check page break — redraw header on new page
    if (y + rowH > pageHeight - footerHeight - 20) {
      doc.addPage();
      y = contentStartY;
      drawTableHeader();
    }

    // Striped background
    if (idx % 2 === 0) {
      doc.rect(margin, y, contentWidth, rowH).fill(design.tableStripedBg);
    }

    // Row border bottom
    doc
      .strokeColor(design.tableBorderColor)
      .lineWidth(0.3)
      .moveTo(margin, y + rowH)
      .lineTo(margin + contentWidth, y + rowH)
      .stroke();

    const rowY = y + 4;
    let tx = margin;
    doc.fillColor(design.bodyTextColor).fontSize(fs.small).font("Helvetica");
    doc.text(String(idx + 1), tx + 2, rowY, { width: colWidths.num, align: "center" }); tx += colWidths.num;
    doc.text(item.description, tx + 4, rowY, { width: colWidths.desc - 8 }); tx += colWidths.desc;
    doc.text(item.unit, tx, rowY, { width: colWidths.unit, align: "center" }); tx += colWidths.unit;
    doc.text(String(item.quantity), tx, rowY, { width: colWidths.qty, align: "center" }); tx += colWidths.qty;
    doc.font("Helvetica").text(formatCurrency(item.unitPrice), tx, rowY, { width: colWidths.price, align: "right" }); tx += colWidths.price;
    doc.text(item.discount > 0 ? `${item.discount}%` : "-", tx, rowY, { width: colWidths.disc, align: "center" }); tx += colWidths.disc;
    doc.font("Helvetica-Bold").text(formatCurrency(item.subtotal), tx, rowY, { width: colWidths.total, align: "right" });

    y += rowH;

    // ─── SUBITEMS (components within this item) ───────────────────────
    const subItems = Array.isArray((item as any).subItems) ? (item as any).subItems : [];
    if (subItems.length > 0) {
      const subIndent = 20;
      const subTableX = margin + subIndent;
      const subTableW = contentWidth - subIndent - 10;
      const hasCode = subItems.some((si: any) => si.code);
      const hasObs = subItems.some((si: any) => si.observation);

      // Sub-table column widths
      const subCols = {
        num: 22,
        desc: 0, // calculated below
        qty: 32,
        unit: 30,
        code: hasCode ? 80 : 0,
        obs: hasObs ? 70 : 0,
      };
      subCols.desc = subTableW - subCols.num - subCols.qty - subCols.unit - subCols.code - subCols.obs;

      // Sub-table header
      const subHeaderH = fs.small + 5;
      if (y + subHeaderH + 20 > pageHeight - footerHeight - 20) {
        doc.addPage();
        y = contentStartY;
        drawTableHeader();
      }

      const accentLight = lightenColor(design.accentColor, 0.88);
      doc.rect(subTableX, y, subTableW, subHeaderH).fill(accentLight);
      doc.fillColor(design.bodyTextColor).fontSize(fs.small - 1).font("Helvetica-Bold");
      let sx = subTableX;
      doc.text("#", sx + 2, y + 2, { width: subCols.num, align: "center" }); sx += subCols.num;
      doc.text("Componente", sx + 2, y + 2, { width: subCols.desc }); sx += subCols.desc;
      doc.text("Qtd.", sx, y + 2, { width: subCols.qty, align: "center" }); sx += subCols.qty;
      doc.text("Un.", sx, y + 2, { width: subCols.unit, align: "center" }); sx += subCols.unit;
      if (hasCode) { doc.text("Código", sx + 2, y + 2, { width: subCols.code }); sx += subCols.code; }
      if (hasObs) { doc.text("Obs.", sx + 2, y + 2, { width: subCols.obs }); }
      y += subHeaderH;

      // Sub-table rows
      subItems.forEach((si: any, siIdx: number) => {
        doc.fontSize(fs.small - 1).font("Helvetica");
        const siDescH = doc.heightOfString(si.description || "", { width: subCols.desc - 6 });
        const siRowH = Math.max(fs.small + 4, siDescH + 5);

        if (y + siRowH > pageHeight - footerHeight - 20) {
          doc.addPage();
          y = contentStartY;
          drawTableHeader();
          // Re-draw sub-table header on new page
          doc.rect(subTableX, y, subTableW, subHeaderH).fill(accentLight);
          doc.fillColor(design.bodyTextColor).fontSize(fs.small - 1).font("Helvetica-Bold");
          let sx2 = subTableX;
          doc.text("#", sx2 + 2, y + 2, { width: subCols.num, align: "center" }); sx2 += subCols.num;
          doc.text("Componente", sx2 + 2, y + 2, { width: subCols.desc }); sx2 += subCols.desc;
          doc.text("Qtd.", sx2, y + 2, { width: subCols.qty, align: "center" }); sx2 += subCols.qty;
          doc.text("Un.", sx2, y + 2, { width: subCols.unit, align: "center" }); sx2 += subCols.unit;
          if (hasCode) { doc.text("Código", sx2 + 2, y + 2, { width: subCols.code }); sx2 += subCols.code; }
          if (hasObs) { doc.text("Obs.", sx2 + 2, y + 2, { width: subCols.obs }); }
          y += subHeaderH;
        }

        // Alternating background for sub-rows
        if (siIdx % 2 === 1) {
          doc.rect(subTableX, y, subTableW, siRowH).fill(design.tableStripedBg);
        }

        // Sub-row border
        doc.strokeColor(design.tableBorderColor).lineWidth(0.2)
          .moveTo(subTableX, y + siRowH).lineTo(subTableX + subTableW, y + siRowH).stroke();

        const siY = y + 2;
        let sx3 = subTableX;
        doc.fillColor(design.bodyTextColor).fontSize(fs.small - 1).font("Helvetica");
        doc.text(String(siIdx + 1), sx3 + 2, siY, { width: subCols.num, align: "center" }); sx3 += subCols.num;
        doc.text(si.description || "", sx3 + 2, siY, { width: subCols.desc - 6 }); sx3 += subCols.desc;
        doc.text(String(si.quantity ?? ""), sx3, siY, { width: subCols.qty, align: "center" }); sx3 += subCols.qty;
        doc.text(si.unit || "", sx3, siY, { width: subCols.unit, align: "center" }); sx3 += subCols.unit;
        if (hasCode) { doc.text(si.code || "", sx3 + 2, siY, { width: subCols.code - 4 }); sx3 += subCols.code; }
        if (hasObs) { doc.text(si.observation || "", sx3 + 2, siY, { width: subCols.obs - 4 }); }

        y += siRowH;
      });

      y += 4; // spacing after sub-table
    }
  });

  // ─── TOTALS BOX ───────────────────────────────────────────────────────
  y += 8;
  if (y > pageHeight - footerHeight - 100) {
    doc.addPage();
    y = contentStartY;
  }

  const totalsBoxW = 220;
  const totalsBoxX = margin + contentWidth - totalsBoxW;

  doc.fontSize(fs.body).font("Helvetica").fillColor(design.bodyTextColor);

  // Subtotal
  doc.text("Subtotal:", totalsBoxX, y, { width: totalsBoxW - 85, align: "right" });
  doc.text(formatCurrency(data.subtotal), totalsBoxX + totalsBoxW - 85, y, { width: 85, align: "right" });
  y += fs.body + 4;

  // Discount
  if (parseFloat(data.totalDiscount) > 0) {
    doc.text("Desconto:", totalsBoxX, y, { width: totalsBoxW - 85, align: "right" });
    doc.fillColor("#DC2626").text(`-${formatCurrency(data.totalDiscount)}`, totalsBoxX + totalsBoxW - 85, y, { width: 85, align: "right" });
    y += fs.body + 4;
    doc.fillColor(design.bodyTextColor);
  }

  // Freight
  if (data.conditions.freightValue > 0) {
    doc.text("Frete:", totalsBoxX, y, { width: totalsBoxW - 85, align: "right" });
    doc.text(formatCurrency(data.conditions.freightValue), totalsBoxX + totalsBoxW - 85, y, { width: 85, align: "right" });
    y += fs.body + 4;
  }

  // Grand total box
  y += 4;
  const totalBoxH = fs.section + 12;
  doc.rect(totalsBoxX - 6, y - 2, totalsBoxW + 6, totalBoxH).fill(design.accentColor);
  doc
    .fillColor("#FFFFFF")
    .fontSize(fs.section)
    .font("Helvetica-Bold")
    .text("TOTAL:", totalsBoxX, y + 3, { width: totalsBoxW - 85, align: "right" })
    .text(formatCurrency(data.grandTotal), totalsBoxX + totalsBoxW - 85, y + 3, { width: 85, align: "right" });

  y += totalBoxH + 20;

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 4 — CONDIÇÕES COMERCIAIS
  // ════════════════════════════════════════════════════════════════════════

  sectionNum++;
  sectionHeader("Condições Comerciais", sectionNum);

  doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");

  const isService = data.quotationType === "services";
  const condFields = [
    { label: "Pagamento", value: data.conditions.paymentTerms },
    { label: isService ? "Prazo de Execução" : "Prazo de Entrega", value: data.conditions.deliveryTime },
    { label: isService ? "Deslocamento" : "Frete", value: data.conditions.freight + (data.conditions.freightValue > 0 ? ` (${formatCurrency(data.conditions.freightValue)})` : "") },
    { label: "Garantia", value: data.conditions.warranty },
    { label: "Validade da Proposta", value: `${data.validityDays} dias` },
  ];

  for (const field of condFields) {
    if (field.value) {
      doc.font("Helvetica-Bold").text(`${field.label}: `, margin + 8, y, { continued: true }).font("Helvetica").text(field.value);
      y = doc.y + 3;
    }
  }
  y += 14;

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 5 — OBSERVAÇÕES TÉCNICAS (optional)
  // ════════════════════════════════════════════════════════════════════════

  if (data.texts.technicalNotes) {
    sectionNum++;
    sectionHeader("Observações Técnicas", sectionNum);

    const text = interpolateVars(data.texts.technicalNotes, vars);
    doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");
    doc.text(text, margin + 8, y, { width: contentWidth - 16, lineGap: 2.5 });
    y = doc.y + 14;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 6 — OBSERVAÇÕES COMERCIAIS (optional)
  // ════════════════════════════════════════════════════════════════════════

  if (data.texts.commercialNotes) {
    sectionNum++;
    sectionHeader("Observações Comerciais", sectionNum);

    const text = interpolateVars(data.texts.commercialNotes, vars);
    doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");
    doc.text(text, margin + 8, y, { width: contentWidth - 16, lineGap: 2.5 });
    y = doc.y + 14;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 7 — ENCERRAMENTO E VALIDADE
  // ════════════════════════════════════════════════════════════════════════

  sectionNum++;
  sectionHeader("Encerramento e Validade", sectionNum);

  doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");

  if (data.texts.closingNotes) {
    const text = interpolateVars(data.texts.closingNotes, vars);
    doc.text(text, margin + 8, y, { width: contentWidth - 16, lineGap: 2.5 });
    y = doc.y + 16;
  } else {
    doc.text(
      `Sem mais para o momento, colocamo-nos ao dispor para quaisquer esclarecimentos que se fizerem necessário.`,
      margin + 8, y, { width: contentWidth - 16, lineGap: 2.5 }
    );
    y = doc.y + 16;
  }

  doc.text("Atenciosamente,", margin + 8, y);
  y = doc.y + 30;

  // Signature line
  doc
    .strokeColor(design.bodyTextColor)
    .lineWidth(0.5)
    .moveTo(margin + 8, y)
    .lineTo(margin + 200, y)
    .stroke();
  y += 5;

  doc.fontSize(fs.small).font("Helvetica-Bold");
  doc.text(company.companyName, margin + 8, y, { width: 200 });
  y = doc.y + 2;
  doc.font("Helvetica").fontSize(fs.small - 0.5);
  if (company.phone) doc.text(`Tel.: ${company.phone}`, margin + 8, y); y = doc.y;
  if (company.email) doc.text(`E-mail: ${company.email}`, margin + 8, y);

  // ─── FOOTER TEXT (custom) ─────────────────────────────────────────────
  if (data.texts.footerText) {
    y = doc.y + 20;
    if (y > pageHeight - footerHeight - 40) {
      doc.addPage();
      y = contentStartY;
    }
    const footerText = interpolateVars(data.texts.footerText, vars);
    doc.fillColor(design.bodyTextColor).fontSize(fs.small).font("Helvetica");
    doc.text(footerText, margin + 8, y, { width: contentWidth - 16 });
  }

  // ════════════════════════════════════════════════════════════════════════
  // APPLY HEADERS AND FOOTERS TO ALL PAGES
  // ════════════════════════════════════════════════════════════════════════

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    drawPageHeader(doc, cfg, i + 1, pages.count);
    drawPageFooter(doc, cfg);
  }

  // ─── Finalize ─────────────────────────────────────────────────────────
  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
