import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // PDF download endpoint
  app.get("/api/quotation/:id/pdf", async (req, res) => {
    try {
      const { generateQuotationPDF } = await import("../pdfGenerator");
      const { getQuotation, getDesignSettings } = await import("../db");
      const { DEFAULT_COMPANY, DEFAULT_PROPOSAL_DESIGN } = await import("../../shared/designDefaults");
      const { sdk } = await import("./sdk");

      // Authenticate
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const quotationId = parseInt(req.params.id);
      if (isNaN(quotationId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const quotation = await getQuotation(quotationId, user.id);
      if (!quotation) {
        return res.status(404).json({ error: "Cotação não encontrada" });
      }

      // Get design settings
      const settings = await getDesignSettings(user.id);
      const company = settings?.company ?? DEFAULT_COMPANY;
      const design = settings?.proposalDesign ?? DEFAULT_PROPOSAL_DESIGN;

      const pdfBuffer = await generateQuotationPDF(
        {
          quotationNumber: quotation.quotationNumber,
          quotationDate: quotation.quotationDate,
          validityDays: quotation.validityDays,
          quotationType: (quotation as any).quotationType ?? "products",
          customerName: quotation.customerName,
          customerEmail: quotation.customerEmail,
          customerPhone: quotation.customerPhone,
          customerCompany: quotation.customerCompany,
          customerCNPJ: quotation.customerCNPJ,
          customerAddress: quotation.customerAddress,
          reference: quotation.reference,
          notes: quotation.notes,
          items: quotation.items as any,
          conditions: quotation.conditions as any,
          texts: quotation.texts as any,
          subtotal: String(quotation.subtotal),
          totalDiscount: String(quotation.totalDiscount),
          grandTotal: String(quotation.grandTotal),
        },
        { company: company as any, design: design as any }
      );

      const filename = `Cotacao-${quotation.quotationNumber}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[PDF] Generation failed:", error);
      res.status(500).json({ error: "Falha ao gerar PDF" });
    }
  });
  // Technical Proposal Word generation endpoint
  app.post("/api/technical-proposal/generate", async (req, res) => {
    try {
      const { generateTechnicalProposal } = await import("../technicalProposalGenerator");
      const { getDesignSettings } = await import("../db");
      const { DEFAULT_COMPANY, DEFAULT_PROPOSAL_DESIGN } = await import("../../shared/designDefaults");
      const { sdk } = await import("./sdk");

      // Authenticate
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const data = req.body;
      if (!data || !data.panels || !Array.isArray(data.panels)) {
        return res.status(400).json({ error: "Dados inválidos. Envie os painéis e informações da proposta." });
      }

      // Get design settings
      const settings = await getDesignSettings(user.id);
      const company = settings?.company ?? DEFAULT_COMPANY;
      const design = settings?.proposalDesign ?? DEFAULT_PROPOSAL_DESIGN;

      const docxBuffer = await generateTechnicalProposal(data, {
        company: company as any,
        design: design as any,
      });

      const filename = `Proposta_Tecnica_${data.proposalNumber || "nova"}.docx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", docxBuffer.length);
      res.send(docxBuffer);
    } catch (error) {
      console.error("[DOCX] Generation failed:", error);
      res.status(500).json({ error: "Falha ao gerar proposta técnica" });
    }
  });

  // Excel import endpoint for technical proposal panels
  app.post("/api/technical-proposal/import-excel", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");

      // Authenticate
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { base64, filename } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "Envie o arquivo Excel em base64" });
      }

      const XLSX = await import("xlsx");
      const buffer = Buffer.from(base64, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });

      // Try to find a sheet with panel data
      let sheetName = workbook.SheetNames[0];
      // Prefer "Cleaned Data" or similar
      for (const name of workbook.SheetNames) {
        if (name.toLowerCase().includes("clean") || name.toLowerCase().includes("material")) {
          sheetName = name;
          break;
        }
      }

      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Parse panels from rows
      const panels: { name: string; items: { pos: number; description: string; qty: number; code?: string; observation?: string }[] }[] = [];
      let currentPanel: typeof panels[0] | null = null;
      let itemCounter = 0;

      for (const row of rows) {
        if (!row || row.length === 0) continue;

        const firstCell = String(row[0] || "").trim();

        // Detect panel header: starts with known prefixes or is all uppercase
        if (
          firstCell.match(/^(Q|QGBT|QGEM|QB-|QG-|QDAC|QELEV|QGFL|QFL|QFB|QFNB|QCB|QGAC|QF-)/i) &&
          (row.length <= 2 || !row[1] || String(row[1]).trim() === "")
        ) {
          // This is a panel header
          if (currentPanel && currentPanel.items.length > 0) {
            panels.push(currentPanel);
          }
          currentPanel = { name: firstCell.toUpperCase(), items: [] };
          itemCounter = 0;
          continue;
        }

        // Skip header rows
        if (firstCell.toLowerCase() === "item" || firstCell.toLowerCase() === "pos" || firstCell.toLowerCase() === "descrição") {
          continue;
        }

        // Try to parse as item row
        if (currentPanel) {
          const desc = String(row[1] || row[0] || "").trim();
          if (!desc) continue;

          itemCounter++;
          const qty = Number(row[2]) || Number(row[3]) || 1;
          const code = row[3] ? String(row[3]).trim() : (row[4] ? String(row[4]).trim() : undefined);
          const obs = row[4] ? String(row[4]).trim() : (row[5] ? String(row[5]).trim() : undefined);

          currentPanel.items.push({
            pos: itemCounter,
            description: desc,
            qty,
            code: code || undefined,
            observation: obs || undefined,
          });
        }
      }

      // Push last panel
      if (currentPanel && currentPanel.items.length > 0) {
        panels.push(currentPanel);
      }

      res.json({
        success: true,
        sheetName,
        totalSheets: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames,
        panels,
        totalPanels: panels.length,
        totalItems: panels.reduce((sum, p) => sum + p.items.length, 0),
      });
    } catch (error) {
      console.error("[Excel Import] Failed:", error);
      res.status(500).json({ error: "Falha ao importar Excel" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
