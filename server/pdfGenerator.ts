/**
 * PDF Generator for Quotations
 * Uses PDFKit to generate professional quotation PDFs with full branding.
 *
 * Design: Navy (#1A1A2E) + Coral (#FF4B4B) identity with customizable settings.
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
      return { title: 18, section: 12, body: 8, small: 7, mono: 8 };
    case "large":
      return { title: 24, section: 16, body: 11, small: 9, mono: 11 };
    default: // medium
      return { title: 22, section: 14, body: 9.5, small: 8, mono: 9.5 };
  }
}

function interpolateVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] || "");
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
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const doc = new PDFDocument({
    size: design.paperSize === "Letter" ? "LETTER" : "A4",
    margins: { top: margin, bottom: margin, left: margin, right: margin },
    bufferPages: true,
    info: {
      Title: `Cotação ${data.quotationNumber}`,
      Author: company.companyName,
      Subject: `Proposta Comercial - ${data.customerName}`,
      Creator: "Quotation Generator",
    },
  });

  // Collect PDF into buffer
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // ─── Variable interpolation map ───────────────────────────────────────
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

  // ─── Fetch logo ───────────────────────────────────────────────────────
  let logoBuffer: Buffer | null = null;
  if (design.showLogo && company.logoUrl) {
    try {
      logoBuffer = await fetchImage(company.logoUrl);
    } catch (e) {
      console.warn("[PDF] Failed to fetch logo:", e);
    }
  }

  // ─── HEADER ───────────────────────────────────────────────────────────
  const headerHeight = 80;
  doc
    .rect(0, 0, pageWidth, headerHeight)
    .fill(design.headerBgColor);

  // Decorative accent line
  if (design.showBorderLines) {
    doc
      .rect(0, headerHeight, pageWidth, 3)
      .fill(design.accentColor);
  }

  // Logo + Company name in header
  let headerTextX = margin;
  if (logoBuffer && design.showLogo) {
    try {
      const logoSize = 45;
      const logoY = (headerHeight - logoSize) / 2;
      let logoX = margin;
      if (design.headerLayout === "center") {
        logoX = (pageWidth - logoSize) / 2 - 80;
      } else if (design.headerLayout === "right") {
        logoX = pageWidth - margin - logoSize;
      }
      doc.image(logoBuffer, logoX, logoY, { width: logoSize, height: logoSize });
      headerTextX = design.headerLayout === "right" ? margin : logoX + logoSize + 12;
    } catch (e) {
      console.warn("[PDF] Failed to embed logo:", e);
    }
  }

  // Company name
  const companyNameY = headerHeight / 2 - fs.title / 2 - 2;
  doc
    .fillColor(design.headerTextColor)
    .fontSize(fs.title)
    .font("Helvetica-Bold")
    .text(company.companyName, headerTextX, companyNameY, {
      width: contentWidth - (headerTextX - margin),
      align: design.headerLayout === "right" ? "left" : "left",
    });

  // Subtitle
  if (company.companySubtitle) {
    doc
      .fontSize(fs.small)
      .font("Helvetica")
      .fillColor(design.headerTextColor)
      .text(company.companySubtitle, headerTextX, companyNameY + fs.title + 2, {
        width: contentWidth - (headerTextX - margin),
      });
  }

  // ─── QUOTATION INFO BAR ───────────────────────────────────────────────
  let y = headerHeight + (design.showBorderLines ? 3 : 0) + 15;

  // Quotation number and date row
  doc
    .fillColor(design.bodyTextColor)
    .fontSize(fs.section)
    .font("Helvetica-Bold")
    .text(`PROPOSTA COMERCIAL`, margin, y, { width: contentWidth, align: "center" });
  y += fs.section + 8;

  doc
    .fontSize(fs.body)
    .font("Helvetica")
    .fillColor(design.bodyTextColor);

  // Info grid
  const infoCol1 = margin;
  const infoCol2 = margin + contentWidth / 2;

  doc.font("Helvetica-Bold").text("Nº:", infoCol1, y, { continued: true }).font("Helvetica").text(` ${data.quotationNumber}`);
  doc.font("Helvetica-Bold").text("Data:", infoCol2, y, { continued: true }).font("Helvetica").text(` ${data.quotationDate}`);
  y += fs.body + 6;

  doc.font("Helvetica-Bold").text("Validade:", infoCol1, y, { continued: true }).font("Helvetica").text(` ${data.validityDays} dias`);
  if (data.reference) {
    doc.font("Helvetica-Bold").text("Ref.:", infoCol2, y, { continued: true }).font("Helvetica").text(` ${data.reference}`);
  }
  y += fs.body + 12;

  // ─── CUSTOMER SECTION ─────────────────────────────────────────────────
  // Section header with accent
  doc
    .rect(margin, y, contentWidth, fs.section + 10)
    .fill(design.tableHeaderBgColor);
  doc
    .fillColor(design.tableHeaderTextColor)
    .fontSize(fs.section - 2)
    .font("Helvetica-Bold")
    .text("DADOS DO CLIENTE", margin + 8, y + 5, { width: contentWidth - 16 });
  y += fs.section + 16;

  doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");

  const customerFields = [
    { label: "Cliente", value: data.customerName },
    { label: "Empresa", value: data.customerCompany },
    { label: "CNPJ", value: data.customerCNPJ },
    { label: "E-mail", value: data.customerEmail },
    { label: "Telefone", value: data.customerPhone },
    { label: "Endereço", value: data.customerAddress },
  ];

  for (const field of customerFields) {
    if (field.value) {
      doc.font("Helvetica-Bold").text(`${field.label}: `, margin + 4, y, { continued: true }).font("Helvetica").text(field.value);
      y += fs.body + 4;
    }
  }
  y += 12;

  // ─── INTRO TEXT ───────────────────────────────────────────────────────
  if (data.texts.headerText) {
    const headerText = interpolateVars(data.texts.headerText, vars);
    doc.fontSize(fs.body).font("Helvetica").fillColor(design.bodyTextColor);
    doc.text(headerText, margin + 4, y, { width: contentWidth - 8 });
    y = doc.y + 10;
  }

  if (data.texts.introNotes) {
    const introText = interpolateVars(data.texts.introNotes, vars);
    doc.fontSize(fs.body).font("Helvetica").fillColor(design.bodyTextColor);
    doc.text(introText, margin + 4, y, { width: contentWidth - 8 });
    y = doc.y + 12;
  }

  // ─── ITEMS TABLE ──────────────────────────────────────────────────────
  // Check if we need a new page
  if (y > pageHeight - 250) {
    doc.addPage();
    y = margin;
  }

  // Table header
  const colWidths = {
    num: 25,
    desc: contentWidth - 25 - 40 - 55 - 55 - 50 - 65,
    unit: 40,
    qty: 55,
    price: 55,
    disc: 50,
    total: 65,
  };

  const tableHeaderH = fs.body + 10;
  doc
    .rect(margin, y, contentWidth, tableHeaderH)
    .fill(design.tableHeaderBgColor);

  let tx = margin;
  const thY = y + 5;
  doc.fillColor(design.tableHeaderTextColor).fontSize(fs.small).font("Helvetica-Bold");
  doc.text("#", tx + 2, thY, { width: colWidths.num, align: "center" }); tx += colWidths.num;
  doc.text("Descrição", tx + 2, thY, { width: colWidths.desc }); tx += colWidths.desc;
  doc.text("Un.", tx, thY, { width: colWidths.unit, align: "center" }); tx += colWidths.unit;
  doc.text("Qtd.", tx, thY, { width: colWidths.qty, align: "center" }); tx += colWidths.qty;
  doc.text("Valor Un.", tx, thY, { width: colWidths.price, align: "right" }); tx += colWidths.price;
  doc.text("Desc.%", tx, thY, { width: colWidths.disc, align: "center" }); tx += colWidths.disc;
  doc.text("Subtotal", tx, thY, { width: colWidths.total, align: "right" });

  y += tableHeaderH;

  // Table rows
  data.items.forEach((item, idx) => {
    // Check page break
    if (y > pageHeight - 80) {
      doc.addPage();
      y = margin;
    }

    const rowH = fs.body + 8;
    // Striped background
    if (idx % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowH).fill(design.tableStripedBg);
    }

    // Row border bottom
    doc
      .strokeColor(design.tableBorderColor)
      .lineWidth(0.5)
      .moveTo(margin, y + rowH)
      .lineTo(margin + contentWidth, y + rowH)
      .stroke();

    const rowY = y + 4;
    tx = margin;
    doc.fillColor(design.bodyTextColor).fontSize(fs.small).font("Helvetica");
    doc.text(String(idx + 1), tx + 2, rowY, { width: colWidths.num, align: "center" }); tx += colWidths.num;
    doc.text(item.description, tx + 2, rowY, { width: colWidths.desc - 4 }); tx += colWidths.desc;
    doc.text(item.unit, tx, rowY, { width: colWidths.unit, align: "center" }); tx += colWidths.unit;
    doc.font("Helvetica").text(String(item.quantity), tx, rowY, { width: colWidths.qty, align: "center" }); tx += colWidths.qty;
    doc.font("Helvetica").text(formatCurrency(item.unitPrice), tx, rowY, { width: colWidths.price, align: "right" }); tx += colWidths.price;
    doc.text(item.discount > 0 ? `${item.discount}%` : "-", tx, rowY, { width: colWidths.disc, align: "center" }); tx += colWidths.disc;
    doc.font("Helvetica-Bold").text(formatCurrency(item.subtotal), tx, rowY, { width: colWidths.total, align: "right" });

    y += rowH;
  });

  // ─── TOTALS ───────────────────────────────────────────────────────────
  y += 6;
  const totalsX = margin + contentWidth - 200;
  const totalsW = 200;

  doc.fontSize(fs.body).font("Helvetica").fillColor(design.bodyTextColor);

  // Subtotal
  doc.text("Subtotal:", totalsX, y, { width: totalsW - 80, align: "right" });
  doc.font("Helvetica").text(formatCurrency(data.subtotal), totalsX + totalsW - 80, y, { width: 80, align: "right" });
  y += fs.body + 4;

  // Discount
  if (parseFloat(data.totalDiscount) > 0) {
    doc.font("Helvetica").text("Desconto:", totalsX, y, { width: totalsW - 80, align: "right" });
    doc.fillColor("#DC2626").text(`-${formatCurrency(data.totalDiscount)}`, totalsX + totalsW - 80, y, { width: 80, align: "right" });
    y += fs.body + 4;
    doc.fillColor(design.bodyTextColor);
  }

  // Freight
  if (data.conditions.freightValue > 0) {
    doc.font("Helvetica").text("Frete:", totalsX, y, { width: totalsW - 80, align: "right" });
    doc.text(formatCurrency(data.conditions.freightValue), totalsX + totalsW - 80, y, { width: 80, align: "right" });
    y += fs.body + 4;
  }

  // Grand total
  y += 2;
  doc
    .rect(totalsX - 4, y - 2, totalsW + 4, fs.section + 10)
    .fill(design.accentColor);
  doc
    .fillColor(design.headerTextColor)
    .fontSize(fs.section)
    .font("Helvetica-Bold")
    .text("TOTAL:", totalsX, y + 2, { width: totalsW - 80, align: "right" })
    .text(formatCurrency(data.grandTotal), totalsX + totalsW - 80, y + 2, { width: 80, align: "right" });

  y += fs.section + 18;

  // ─── CONDITIONS ───────────────────────────────────────────────────────
  if (y > pageHeight - 200) {
    doc.addPage();
    y = margin;
  }

  doc
    .rect(margin, y, contentWidth, fs.section + 10)
    .fill(design.tableHeaderBgColor);
  doc
    .fillColor(design.tableHeaderTextColor)
    .fontSize(fs.section - 2)
    .font("Helvetica-Bold")
    .text("CONDIÇÕES COMERCIAIS", margin + 8, y + 5, { width: contentWidth - 16 });
  y += fs.section + 16;

  doc.fillColor(design.bodyTextColor).fontSize(fs.body).font("Helvetica");

  const condFields = [
    { label: "Pagamento", value: data.conditions.paymentTerms },
    { label: "Prazo de Entrega", value: data.conditions.deliveryTime },
    { label: "Frete", value: data.conditions.freight + (data.conditions.freightValue > 0 ? ` (${formatCurrency(data.conditions.freightValue)})` : "") },
    { label: "Garantia", value: data.conditions.warranty },
  ];

  for (const field of condFields) {
    if (field.value) {
      doc.font("Helvetica-Bold").text(`${field.label}: `, margin + 4, y, { continued: true }).font("Helvetica").text(field.value);
      y += fs.body + 4;
    }
  }
  y += 12;

  // ─── ADDITIONAL TEXTS ─────────────────────────────────────────────────
  const textSections = [
    { title: "Observações Comerciais", content: data.texts.commercialNotes },
    { title: "Observações Técnicas", content: data.texts.technicalNotes },
    { title: "Encerramento", content: data.texts.closingNotes },
  ];

  for (const section of textSections) {
    if (section.content) {
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }

      const interpolated = interpolateVars(section.content, vars);

      doc
        .fillColor(design.accentColor)
        .fontSize(fs.body + 1)
        .font("Helvetica-Bold")
        .text(section.title, margin + 4, y, { width: contentWidth - 8 });
      y += fs.body + 6;

      doc
        .fillColor(design.bodyTextColor)
        .fontSize(fs.body)
        .font("Helvetica")
        .text(interpolated, margin + 4, y, { width: contentWidth - 8 });
      y = doc.y + 10;
    }
  }

  // ─── FOOTER ───────────────────────────────────────────────────────────
  // Add footer to all pages
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer line
    if (design.showBorderLines) {
      doc
        .strokeColor(design.accentColor)
        .lineWidth(1)
        .moveTo(margin, pageHeight - 35)
        .lineTo(pageWidth - margin, pageHeight - 35)
        .stroke();
    }

    // Footer text
    const footerText = data.texts.footerText
      ? interpolateVars(data.texts.footerText, vars)
      : `${company.companyName}${company.phone ? ` | ${company.phone}` : ""}${company.email ? ` | ${company.email}` : ""}`;

    doc
      .fillColor(design.bodyTextColor)
      .fontSize(fs.small - 1)
      .font("Helvetica")
      .text(footerText, margin, pageHeight - 30, {
        width: contentWidth - 60,
        align: "left",
        lineBreak: false,
      });

    // Page number
    doc
      .text(`Página ${i + 1} de ${pages.count}`, margin, pageHeight - 30, {
        width: contentWidth,
        align: "right",
        lineBreak: false,
      });
  }

  // ─── Finalize ─────────────────────────────────────────────────────────
  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
