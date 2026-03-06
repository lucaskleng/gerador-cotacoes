/*
 * Step 4 — Finalizar / Preview
 * Professional proposal layout inspired by WEG technical proposals.
 * Applies user's design settings (colors, fonts, logo, layout) to the document.
 */

import { useQuotationStore } from "@/store/quotationStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Save,
  RotateCcw,
  LayoutList,
  LogIn,
  Download,
  LayoutTemplate,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  interpolateTemplate,
  formatCurrency,
  formatDate,
  formatDateShort,
  generateQuotationNumber,
} from "@/lib/format";
import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  DEFAULT_COMPANY,
  DEFAULT_PROPOSAL_DESIGN,
} from "@shared/designDefaults";
import type { CompanyBranding, ProposalDesign } from "@shared/designDefaults";

export default function Step4Preview() {
  const {
    info,
    items,
    conditions,
    texts,
    subtotal,
    totalDiscount,
    grandTotal,
    setStep,
    markStepComplete,
    resetQuotation,
    quotationType,
  } = useQuotationStore();

  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [approved, setApproved] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const saveTemplateMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      toast.success("Template salvo com sucesso!", {
        description: `O template "${templateName}" está disponível para uso em novas cotações.`,
      });
      setShowTemplateDialog(false);
      setTemplateName("");
    },
    onError: (err) => {
      toast.error("Erro ao salvar template", { description: err.message });
    },
  });

  const handleSaveAsTemplate = useCallback(() => {
    if (!templateName.trim()) {
      toast.error("Informe um nome para o template");
      return;
    }
    saveTemplateMutation.mutate({
      name: templateName.trim(),
      quotationType,
      validityDays: info.validityDays,
      conditions,
      texts,
      defaultItems: items
        .filter((i) => i.description.trim())
        .map((i) => ({
          description: i.description,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
        })),
    });
  }, [
    templateName,
    quotationType,
    info.validityDays,
    conditions,
    texts,
    items,
    saveTemplateMutation,
  ]);

  const quotationNumber = useMemo(() => generateQuotationNumber(), []);

  // Load design settings
  const { data: designData } = trpc.design.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
  });

  const company: CompanyBranding = designData?.company ?? DEFAULT_COMPANY;
  const d: ProposalDesign = designData?.proposalDesign ?? DEFAULT_PROPOSAL_DESIGN;

  const fontSizeMap: Record<string, { base: string; sm: string; xs: string; title: string; h2: string }> = {
    small: { base: "text-xs", sm: "text-[11px]", xs: "text-[10px]", title: "text-sm", h2: "text-xs" },
    medium: { base: "text-sm", sm: "text-xs", xs: "text-[10px]", title: "text-base", h2: "text-sm" },
    large: { base: "text-base", sm: "text-sm", xs: "text-xs", title: "text-lg", h2: "text-base" },
  };
  const fs = fontSizeMap[d.fontSize] || fontSizeMap.medium;

  const saveMutation = trpc.quotation.create.useMutation({
    onSuccess: (data) => {
      setSavedId(data.id);
      setSavedNumber(data.quotationNumber);
      toast.success("Cotação salva com sucesso!", {
        description: `Número: ${data.quotationNumber}`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao salvar cotação", { description: err.message });
    },
  });

  const variables: Record<string, string | number> = {
    customerName: info.customerName || "[Nome do Cliente]",
    customerEmail: info.customerEmail || "[E-mail]",
    customerPhone: info.customerPhone || "[Telefone]",
    customerCompany: info.customerCompany || "[Empresa]",
    customerCNPJ: info.customerCNPJ || "[CNPJ]",
    customerAddress: info.customerAddress || "[Endereço]",
    reference: info.reference || "[Referência]",
    validityDays: info.validityDays,
    createdAt: formatDate(info.createdAt),
    paymentTerms: conditions.paymentTerms,
    deliveryTime: conditions.deliveryTime,
    freight: conditions.freight,
    warranty: conditions.warranty,
    grandTotal: formatCurrency(grandTotal),
  };

  const validItems = items.filter(
    (i) => i.description.trim() && i.quantity > 0 && i.unitPrice > 0
  );

  const handlePrint = () => window.print();

  const handleSave = (status: "draft" | "approved" = "draft") => {
    saveMutation.mutate({
      quotationType,
      customerName: info.customerName,
      customerEmail: info.customerEmail || undefined,
      customerPhone: info.customerPhone || undefined,
      customerCompany: info.customerCompany || undefined,
      customerCNPJ: info.customerCNPJ || undefined,
      customerAddress: info.customerAddress || undefined,
      reference: info.reference || undefined,
      validityDays: info.validityDays,
      quotationDate: info.createdAt,
      notes: info.notes || undefined,
      items: validItems.map((item) => ({
        id: item.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
      })),
      conditions: {
        paymentTerms: conditions.paymentTerms,
        deliveryTime: conditions.deliveryTime,
        freight: conditions.freight,
        freightValue: conditions.freightValue,
        warranty: conditions.warranty,
      },
      texts: {
        headerText: texts.headerText,
        introNotes: texts.introNotes,
        commercialNotes: texts.commercialNotes,
        technicalNotes: texts.technicalNotes,
        closingNotes: texts.closingNotes,
        footerText: texts.footerText,
      },
      subtotal,
      totalDiscount,
      grandTotal,
      status,
    });
  };

  const handleApprove = () => {
    markStepComplete(4);
    setApproved(true);
    if (isAuthenticated && !savedId) {
      handleSave("approved");
    } else {
      toast.success("Cotação aprovada com sucesso!", {
        description: `Número: ${savedNumber || quotationNumber}`,
      });
    }
  };

  const handleNewQuotation = () => {
    resetQuotation();
    setSavedId(null);
    setSavedNumber(null);
    setApproved(false);
    toast.info("Nova cotação iniciada.");
  };

  const proposalTitle =
    quotationType === "services"
      ? "Proposta Técnica de Serviços"
      : "Proposta Técnica Comercial";

  const sectionLabels = {
    delivery: quotationType === "services" ? "Prazo de Execução" : "Prazo de Entrega",
    freight: quotationType === "services" ? "Deslocamento" : "Frete",
    items: quotationType === "services" ? "Serviços" : "Materiais / Equipamentos",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* ═══════ ACTION BAR ═══════ */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pré-visualização da Proposta</h2>
          <p className="text-sm text-muted-foreground">
            Revise o documento antes de salvar, aprovar ou imprimir.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          {savedId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement("a");
                link.href = `/api/quotation/${savedId}/pdf`;
                link.download = `Cotacao-${savedNumber || ""}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Download do PDF iniciado!");
              }}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          )}
          {isAuthenticated ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateDialog(true)}
                className="gap-1.5"
              >
                <LayoutTemplate className="w-4 h-4" />
                Salvar Template
              </Button>
              {!savedId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave("draft")}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saveMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
                </Button>
              )}
              {!approved ? (
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aprovar e Salvar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNewQuotation}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nova Cotação
                </Button>
              )}
            </>
          ) : (
            <>
              {!approved ? (
                <Button size="sm" onClick={handleApprove} className="gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Aprovar Cotação
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNewQuotation}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nova Cotação
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════ STATUS BADGES ═══════ */}
      {savedId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="no-print bg-[oklch(0.95_0.05_145)] border border-[oklch(0.80_0.10_145)] rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[oklch(0.50_0.15_145)]" />
            <div>
              <p className="text-sm font-medium text-[oklch(0.30_0.05_145)]">
                Cotação Salva{approved ? " e Aprovada" : ""}
              </p>
              <p className="text-xs text-[oklch(0.40_0.08_145)]">
                Número: {savedNumber} — Salva no banco de dados
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/cotacoes")}
            className="gap-1.5 text-xs"
          >
            <LayoutList className="w-3.5 h-3.5" />
            Ver Cotações
          </Button>
        </motion.div>
      )}

      {!isAuthenticated && !approved && (
        <div className="no-print bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogIn className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Faça login para salvar</p>
              <p className="text-xs text-blue-700">
                Suas cotações serão salvas no banco de dados para consulta futura.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <a href={getLoginUrl()}>
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </a>
          </Button>
        </div>
      )}

      {approved && !savedId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="no-print bg-[oklch(0.95_0.05_145)] border border-[oklch(0.80_0.10_145)] rounded-lg p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-[oklch(0.50_0.15_145)]" />
          <div>
            <p className="text-sm font-medium text-[oklch(0.30_0.05_145)]">Cotação Aprovada</p>
            <p className="text-xs text-[oklch(0.40_0.08_145)]">
              Número: {quotationNumber} — {formatDateShort(info.createdAt)}
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DOCUMENT PREVIEW — Professional WEG-inspired layout
          ═══════════════════════════════════════════════════════════════════ */}
      <Card className="shadow-lg border-border/60 overflow-hidden print:shadow-none print:border-0">
        <div
          className="print:p-0"
          id="quotation-document"
          style={{
            backgroundColor: d.bodyBgColor,
            color: d.bodyTextColor,
            fontFamily: d.bodyFont,
          }}
        >
          {/* ─── HEADER BAR ─────────────────────────────────────────── */}
          <div
            className="px-8 py-5 md:px-10"
            style={{ backgroundColor: d.headerBgColor, color: d.headerTextColor }}
          >
            <div className="flex items-center justify-between">
              {/* Left: Logo + Company */}
              <div className="flex items-center gap-4">
                {d.showLogo && company.logoUrl && (
                  <img
                    src={company.logoUrl}
                    alt="Logo"
                    className="w-16 h-16 object-contain rounded-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "4px" }}
                  />
                )}
                {d.showLogo && !company.logoUrl && (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <span className="text-2xl font-bold" style={{ color: d.headerTextColor }}>
                      {(company.companyName || "E").charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1
                    className="text-xl font-bold leading-tight"
                    style={{ fontFamily: d.titleFont }}
                  >
                    {company.companyName || "Empresa"}
                  </h1>
                  {company.companySubtitle && (
                    <p className="text-sm opacity-80 mt-0.5">{company.companySubtitle}</p>
                  )}
                  {company.cnpj && (
                    <p className="text-xs opacity-60 mt-0.5">CNPJ: {company.cnpj}</p>
                  )}
                </div>
              </div>
              {/* Right: Proposal Number */}
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
                  Proposta N.
                </div>
                <div
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: d.monoFont }}
                >
                  {savedNumber || quotationNumber}
                </div>
                {approved && (
                  <div
                    className="mt-1.5 inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: d.headerTextColor,
                    }}
                  >
                    Aprovada
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── INFO RIBBON ────────────────────────────────────────── */}
          <div
            className="px-8 py-2.5 md:px-10 flex items-center justify-between"
            style={{
              backgroundColor: d.accentColor,
              color: "#ffffff",
            }}
          >
            <div className="flex items-center gap-6 text-xs font-medium">
              <span>
                <span className="opacity-70">Tipo:</span>{" "}
                {quotationType === "services" ? "Serviços" : "Produtos"}
              </span>
              <span>
                <span className="opacity-70">Data:</span> {formatDateShort(info.createdAt)}
              </span>
              <span>
                <span className="opacity-70">Validade:</span> {info.validityDays} dias
              </span>
            </div>
            <div className="text-xs font-medium opacity-80">
              Rev. 00
            </div>
          </div>

          {/* ─── DOCUMENT BODY ──────────────────────────────────────── */}
          <div className="px-8 py-8 md:px-10 space-y-7">
            {/* Title */}
            <div className="text-center pb-4" style={{ borderBottom: `2px solid ${d.accentColor}` }}>
              <h2
                className="text-xl font-bold uppercase tracking-wide"
                style={{ fontFamily: d.titleFont, color: d.accentColor }}
              >
                {proposalTitle}
              </h2>
              {info.reference && (
                <p className={`${fs.sm} mt-1.5 opacity-70`}>
                  Ref.: {info.reference}
                </p>
              )}
            </div>

            {/* ─── Section 1: Destinatário ──────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: d.accentColor }}
                >
                  1
                </div>
                <h3
                  className={`${fs.title} font-bold uppercase tracking-wider`}
                  style={{ fontFamily: d.titleFont, color: d.accentColor }}
                >
                  Destinatário
                </h3>
              </div>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: `1px solid ${d.tableBorderColor}` }}
              >
                <table className={`w-full ${fs.base}`} style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                      <td
                        className="py-2.5 px-4 font-semibold w-36"
                        style={{ backgroundColor: d.tableStripedBg }}
                      >
                        Cliente
                      </td>
                      <td className="py-2.5 px-4 font-medium">
                        {info.customerName || "—"}
                      </td>
                    </tr>
                    {info.customerCompany && (
                      <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                        <td
                          className="py-2.5 px-4 font-semibold"
                          style={{ backgroundColor: d.tableStripedBg }}
                        >
                          Empresa
                        </td>
                        <td className="py-2.5 px-4">{info.customerCompany}</td>
                      </tr>
                    )}
                    {info.customerCNPJ && (
                      <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                        <td
                          className="py-2.5 px-4 font-semibold"
                          style={{ backgroundColor: d.tableStripedBg }}
                        >
                          CNPJ
                        </td>
                        <td className="py-2.5 px-4" style={{ fontFamily: d.monoFont }}>
                          {info.customerCNPJ}
                        </td>
                      </tr>
                    )}
                    {info.customerAddress && (
                      <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                        <td
                          className="py-2.5 px-4 font-semibold"
                          style={{ backgroundColor: d.tableStripedBg }}
                        >
                          Endereço
                        </td>
                        <td className="py-2.5 px-4">{info.customerAddress}</td>
                      </tr>
                    )}
                    {(info.customerPhone || info.customerEmail) && (
                      <tr>
                        <td
                          className="py-2.5 px-4 font-semibold"
                          style={{ backgroundColor: d.tableStripedBg }}
                        >
                          Contato
                        </td>
                        <td className="py-2.5 px-4">
                          {[info.customerPhone, info.customerEmail]
                            .filter(Boolean)
                            .join(" — ")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Section 2: Introdução ────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: d.accentColor }}
                >
                  2
                </div>
                <h3
                  className={`${fs.title} font-bold uppercase tracking-wider`}
                  style={{ fontFamily: d.titleFont, color: d.accentColor }}
                >
                  Introdução
                </h3>
              </div>
              <div className={`${fs.base} whitespace-pre-wrap leading-relaxed pl-9`}>
                {interpolateTemplate(texts.introNotes, variables)}
              </div>
            </div>

            {/* ─── Section 3: Items Table ───────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: d.accentColor }}
                >
                  3
                </div>
                <h3
                  className={`${fs.title} font-bold uppercase tracking-wider`}
                  style={{ fontFamily: d.titleFont, color: d.accentColor }}
                >
                  {sectionLabels.items}
                </h3>
              </div>
              <div className="pl-0">
                <table className={`w-full ${fs.base}`} style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: d.tableHeaderBgColor,
                        color: d.tableHeaderTextColor,
                      }}
                    >
                      <th
                        className={`text-center py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}
                        style={{ width: "40px" }}
                      >
                        Item
                      </th>
                      <th
                        className={`text-left py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}
                      >
                        Descrição
                      </th>
                      <th
                        className={`text-center py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}
                        style={{ width: "50px" }}
                      >
                        Unid.
                      </th>
                      <th
                        className={`text-center py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}
                        style={{ width: "55px" }}
                      >
                        Qtd.
                      </th>
                      <th
                        className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}
                        style={{ width: "110px" }}
                      >
                        Preço Unit.
                      </th>
                      {validItems.some((i) => i.discount > 0) && (
                        <th
                          className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}
                          style={{ width: "65px" }}
                        >
                          Desc.
                        </th>
                      )}
                      <th
                        className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}
                        style={{ width: "120px" }}
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {validItems.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          backgroundColor:
                            index % 2 === 1 ? d.tableStripedBg : "transparent",
                          borderBottom: `1px solid ${d.tableBorderColor}`,
                        }}
                      >
                        <td
                          className="py-2.5 px-3 text-center opacity-60"
                          style={{ fontFamily: d.monoFont }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2.5 px-3 font-medium">{item.description}</td>
                        <td className="py-2.5 px-3 text-center opacity-70">{item.unit}</td>
                        <td
                          className="py-2.5 px-3 text-center tabular-nums"
                          style={{ fontFamily: d.monoFont }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          className="py-2.5 px-3 text-right tabular-nums"
                          style={{ fontFamily: d.monoFont }}
                        >
                          {formatCurrency(item.unitPrice)}
                        </td>
                        {validItems.some((i) => i.discount > 0) && (
                          <td
                            className="py-2.5 px-3 text-right tabular-nums opacity-70"
                            style={{ fontFamily: d.monoFont }}
                          >
                            {item.discount > 0 ? `${item.discount}%` : "—"}
                          </td>
                        )}
                        <td
                          className="py-2.5 px-3 text-right tabular-nums font-semibold"
                          style={{ fontFamily: d.monoFont }}
                        >
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div
                  className="mt-0 rounded-b-lg px-4 py-4"
                  style={{ backgroundColor: d.tableStripedBg }}
                >
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`flex items-center gap-8 ${fs.base}`}>
                      <span className="opacity-60 w-24 text-right">Subtotal</span>
                      <span
                        className="w-32 text-right tabular-nums"
                        style={{ fontFamily: d.monoFont }}
                      >
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className={`flex items-center gap-8 ${fs.base}`}>
                        <span className="opacity-60 w-24 text-right">Descontos</span>
                        <span
                          className="w-32 text-right tabular-nums"
                          style={{ fontFamily: d.monoFont, color: "#dc2626" }}
                        >
                          -{formatCurrency(totalDiscount)}
                        </span>
                      </div>
                    )}
                    {conditions.freightValue > 0 && (
                      <div className={`flex items-center gap-8 ${fs.base}`}>
                        <span className="opacity-60 w-24 text-right">
                          {sectionLabels.freight}
                        </span>
                        <span
                          className="w-32 text-right tabular-nums"
                          style={{ fontFamily: d.monoFont }}
                        >
                          {formatCurrency(conditions.freightValue)}
                        </span>
                      </div>
                    )}
                    <div
                      className="flex items-center gap-8 font-bold pt-2 mt-1"
                      style={{
                        borderTop: `2px solid ${d.accentColor}`,
                        fontSize:
                          d.fontSize === "large"
                            ? "1.125rem"
                            : d.fontSize === "small"
                              ? "0.875rem"
                              : "1rem",
                      }}
                    >
                      <span className="w-24 text-right">TOTAL</span>
                      <span
                        className="w-32 text-right tabular-nums"
                        style={{ fontFamily: d.monoFont, color: d.accentColor }}
                      >
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Section 4: Condições Comerciais ──────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: d.accentColor }}
                >
                  4
                </div>
                <h3
                  className={`${fs.title} font-bold uppercase tracking-wider`}
                  style={{ fontFamily: d.titleFont, color: d.accentColor }}
                >
                  Condições Comerciais
                </h3>
              </div>
              <div
                className="rounded-lg overflow-hidden ml-0"
                style={{ border: `1px solid ${d.tableBorderColor}` }}
              >
                <table className={`w-full ${fs.base}`} style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                      <td
                        className="py-2.5 px-4 font-semibold w-44"
                        style={{ backgroundColor: d.tableStripedBg }}
                      >
                        Pagamento
                      </td>
                      <td className="py-2.5 px-4">{conditions.paymentTerms}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                      <td
                        className="py-2.5 px-4 font-semibold"
                        style={{ backgroundColor: d.tableStripedBg }}
                      >
                        {sectionLabels.delivery}
                      </td>
                      <td className="py-2.5 px-4">{conditions.deliveryTime}</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                      <td
                        className="py-2.5 px-4 font-semibold"
                        style={{ backgroundColor: d.tableStripedBg }}
                      >
                        {sectionLabels.freight}
                      </td>
                      <td className="py-2.5 px-4">
                        {conditions.freight}
                        {conditions.freightValue > 0 &&
                          ` — ${formatCurrency(conditions.freightValue)}`}
                      </td>
                    </tr>
                    <tr>
                      <td
                        className="py-2.5 px-4 font-semibold"
                        style={{ backgroundColor: d.tableStripedBg }}
                      >
                        Garantia
                      </td>
                      <td className="py-2.5 px-4">{conditions.warranty}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Additional commercial notes */}
              {texts.commercialNotes && (
                <div className={`${fs.base} whitespace-pre-wrap leading-relaxed mt-3 pl-9`}>
                  {interpolateTemplate(texts.commercialNotes, variables)}
                </div>
              )}
            </div>

            {/* ─── Section 5: Informações Técnicas ──────────────────── */}
            {texts.technicalNotes && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: d.accentColor }}
                  >
                    5
                  </div>
                  <h3
                    className={`${fs.title} font-bold uppercase tracking-wider`}
                    style={{ fontFamily: d.titleFont, color: d.accentColor }}
                  >
                    Informações Técnicas
                  </h3>
                </div>
                <div className={`${fs.base} whitespace-pre-wrap leading-relaxed pl-9`}>
                  {interpolateTemplate(texts.technicalNotes, variables)}
                </div>
              </div>
            )}

            {/* ─── Section 6: Encerramento ──────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: d.accentColor }}
                >
                  {texts.technicalNotes ? "6" : "5"}
                </div>
                <h3
                  className={`${fs.title} font-bold uppercase tracking-wider`}
                  style={{ fontFamily: d.titleFont, color: d.accentColor }}
                >
                  Considerações Finais
                </h3>
              </div>
              <div className={`${fs.base} whitespace-pre-wrap leading-relaxed pl-9`}>
                {interpolateTemplate(texts.closingNotes, variables)}
              </div>
            </div>

            {/* ─── Revision Table ───────────────────────────────────── */}
            <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${d.tableBorderColor}` }}>
              <table className={`w-full ${fs.xs}`} style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: d.tableHeaderBgColor, color: d.tableHeaderTextColor }}>
                    <th className="py-1.5 px-3 text-left font-semibold uppercase tracking-wider" style={{ width: "60px" }}>
                      Rev.
                    </th>
                    <th className="py-1.5 px-3 text-left font-semibold uppercase tracking-wider" style={{ width: "100px" }}>
                      Data
                    </th>
                    <th className="py-1.5 px-3 text-left font-semibold uppercase tracking-wider">
                      Descrição
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                    <td className="py-1.5 px-3" style={{ fontFamily: d.monoFont }}>
                      00
                    </td>
                    <td className="py-1.5 px-3" style={{ fontFamily: d.monoFont }}>
                      {formatDateShort(info.createdAt)}
                    </td>
                    <td className="py-1.5 px-3">Emissão inicial</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── FOOTER ─────────────────────────────────────────────── */}
          <div
            className="px-8 py-4 md:px-10"
            style={{
              backgroundColor: d.headerBgColor,
              color: d.headerTextColor,
            }}
          >
            <div className="flex items-center justify-between">
              <div className={fs.xs} style={{ opacity: 0.8 }}>
                <span className="font-semibold">
                  {company.companyName || "Empresa"}
                </span>
                {company.cnpj && <span className="ml-2 opacity-70">CNPJ: {company.cnpj}</span>}
              </div>
              <div className={fs.xs} style={{ opacity: 0.6 }}>
                Pág. 1 | 1
              </div>
            </div>
            {company.address && (
              <div className="text-[10px] mt-1" style={{ opacity: 0.6 }}>
                {company.address}
              </div>
            )}
            {(company.phone || company.email || company.website) && (
              <div className="text-[10px] mt-0.5" style={{ opacity: 0.5 }}>
                {[company.phone, company.email, company.website].filter(Boolean).join(" | ")}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ═══════ BOTTOM NAVIGATION ═══════ */}
      <div className="no-print flex justify-between pt-2 pb-8">
        <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </Button>
          {isAuthenticated && !savedId && (
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={saveMutation.isPending}
              className="gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
            </Button>
          )}
          {!approved ? (
            <Button
              onClick={handleApprove}
              disabled={saveMutation.isPending}
              className="gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isAuthenticated ? "Aprovar e Salvar" : "Aprovar Cotação"}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleNewQuotation} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Nova Cotação
            </Button>
          )}
        </div>
      </div>

      {/* ═══════ SAVE AS TEMPLATE DIALOG ═══════ */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              Salvar como Template
            </DialogTitle>
            <DialogDescription>
              Salve a configuração atual (textos, condições e itens) como um template
              reutilizável para futuras cotações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: Proposta Industrial, Manutenção Preventiva..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAsTemplate()}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>O template incluirá:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>
                  Tipo: {quotationType === "services" ? "Serviços" : "Produtos"}
                </li>
                <li>Condições comerciais (pagamento, prazo, frete, garantia)</li>
                <li>Todos os 6 blocos de texto formatado</li>
                <li>
                  {items.filter((i) => i.description.trim()).length} iten(s) pré-definido(s)
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={saveTemplateMutation.isPending || !templateName.trim()}
              className="gap-1.5"
            >
              <LayoutTemplate className="w-4 h-4" />
              {saveTemplateMutation.isPending ? "Salvando..." : "Salvar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
