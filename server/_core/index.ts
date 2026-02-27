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
