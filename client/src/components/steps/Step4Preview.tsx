/*
 * Step 4 — Finalizar / Preview
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
} from "lucide-react";
import { motion } from "framer-motion";
import {
  interpolateTemplate,
  formatCurrency,
  formatDate,
  formatDateShort,
  generateQuotationNumber,
} from "@/lib/format";
import { useState, useMemo } from "react";
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
  } = useQuotationStore();

  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [approved, setApproved] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const quotationNumber = useMemo(() => generateQuotationNumber(), []);

  // Load design settings
  const { data: designData } = trpc.design.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
  });

  const company: CompanyBranding = designData?.company ?? DEFAULT_COMPANY;
  const d: ProposalDesign = designData?.proposalDesign ?? DEFAULT_PROPOSAL_DESIGN;

  const fontSizeMap: Record<string, { base: string; sm: string; xs: string; title: string }> = {
    small: { base: "text-xs", sm: "text-[11px]", xs: "text-[10px]", title: "text-sm" },
    medium: { base: "text-sm", sm: "text-xs", xs: "text-[10px]", title: "text-base" },
    large: { base: "text-base", sm: "text-sm", xs: "text-xs", title: "text-lg" },
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

  const headerAlign =
    d.headerLayout === "center"
      ? "text-center justify-center"
      : d.headerLayout === "right"
        ? "text-right justify-end"
        : "text-left justify-start";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Action Bar */}
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
                <Button size="sm" variant="outline" onClick={handleNewQuotation} className="gap-1.5">
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
                <Button size="sm" variant="outline" onClick={handleNewQuotation} className="gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  Nova Cotação
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Saved Badge */}
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

      {/* Login Hint */}
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

      {/* Approved Badge (when not saved) */}
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
          DOCUMENT PREVIEW — styled with user's design settings
          ═══════════════════════════════════════════════════════════════════ */}
      <Card className="shadow-lg border-border/60 overflow-hidden print:shadow-none print:border-0">
        <div
          className="p-8 md:p-12 space-y-8 print:p-6"
          id="quotation-document"
          style={{
            backgroundColor: d.bodyBgColor,
            color: d.bodyTextColor,
            fontFamily: d.bodyFont,
          }}
        >
          {/* ─── Header ─────────────────────────────────────────────── */}
          <div
            className="rounded-lg px-6 py-5 -mx-8 -mt-8 md:-mx-12 md:-mt-12 print:-mx-6 print:-mt-6"
            style={{
              backgroundColor: d.headerBgColor,
              color: d.headerTextColor,
            }}
          >
            <div className={`flex items-center gap-4 ${headerAlign}`}>
              {d.showLogo && company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt="Logo"
                  className="w-14 h-14 object-contain rounded-md"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                />
              )}
              {d.showLogo && !company.logoUrl && (
                <div
                  className="w-14 h-14 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <span className="text-xl font-bold" style={{ color: d.headerTextColor }}>
                    {(company.companyName || "E").charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2
                  className="text-lg font-bold leading-tight"
                  style={{ fontFamily: d.titleFont }}
                >
                  {company.companyName || interpolateTemplate(texts.headerText, variables)}
                </h2>
                {company.companySubtitle && (
                  <p className="text-sm opacity-80">{company.companySubtitle}</p>
                )}
                {(company.phone || company.email) && (
                  <p className="text-xs opacity-60 mt-0.5">
                    {[company.phone, company.email].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {d.showBorderLines && (
            <div className="h-1 rounded-full -mx-8 md:-mx-12 print:-mx-6" style={{ backgroundColor: d.accentColor }} />
          )}

          {/* ─── Proposal Number & Date ─────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div>
              <h3
                className={`${fs.title} font-bold uppercase tracking-wider`}
                style={{ fontFamily: d.titleFont, color: d.accentColor }}
              >
                Proposta Comercial
              </h3>
              <p className={`${fs.xs} mt-0.5 opacity-60`}>
                {formatDate(info.createdAt)} — Validade: {info.validityDays} dias
              </p>
            </div>
            <div className="text-right">
              <div className={`${fs.xs} opacity-50 uppercase tracking-wider mb-0.5`}>
                Proposta Nº
              </div>
              <div
                className={`${fs.title} font-bold`}
                style={{ fontFamily: d.monoFont, color: d.accentColor }}
              >
                {savedNumber || quotationNumber}
              </div>
              {approved && (
                <div
                  className="mt-1.5 inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded"
                  style={{
                    backgroundColor: d.accentColor + "20",
                    color: d.accentColor,
                  }}
                >
                  Aprovada
                </div>
              )}
            </div>
          </div>

          {/* ─── Customer Info ───────────────────────────────────────── */}
          <div
            className="grid grid-cols-2 gap-6 rounded-lg p-4"
            style={{ backgroundColor: d.tableStripedBg }}
          >
            <div>
              <div
                className={`${fs.xs} uppercase tracking-wider mb-2 font-semibold`}
                style={{ color: d.accentColor }}
              >
                Cliente
              </div>
              <div className={`${fs.base} font-semibold`}>{info.customerName || "—"}</div>
              {info.customerCompany && (
                <div className={`${fs.sm} opacity-70`}>{info.customerCompany}</div>
              )}
              {info.customerCNPJ && (
                <div className={`${fs.sm} opacity-70`}>CNPJ: {info.customerCNPJ}</div>
              )}
            </div>
            <div>
              <div
                className={`${fs.xs} uppercase tracking-wider mb-2 font-semibold`}
                style={{ color: d.accentColor }}
              >
                Contato
              </div>
              {info.customerEmail && <div className={fs.base}>{info.customerEmail}</div>}
              {info.customerPhone && <div className={fs.base}>{info.customerPhone}</div>}
              {info.customerAddress && (
                <div className={`${fs.xs} opacity-60 mt-1`}>{info.customerAddress}</div>
              )}
            </div>
          </div>

          {/* ─── Reference ──────────────────────────────────────────── */}
          {info.reference && (
            <div className="rounded-lg p-4" style={{ backgroundColor: d.tableStripedBg }}>
              <div
                className={`${fs.xs} uppercase tracking-wider mb-1 font-semibold`}
                style={{ color: d.accentColor }}
              >
                Referência
              </div>
              <div className={`${fs.base} font-medium`}>{info.reference}</div>
            </div>
          )}

          {/* ─── Intro Notes ────────────────────────────────────────── */}
          <div className={`${fs.base} whitespace-pre-wrap leading-relaxed`}>
            {interpolateTemplate(texts.introNotes, variables)}
          </div>

          {/* ─── Items Table ────────────────────────────────────────── */}
          <div>
            <table className={`w-full ${fs.base}`} style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: d.tableHeaderBgColor,
                    color: d.tableHeaderTextColor,
                  }}
                >
                  <th className={`text-left py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider rounded-tl-md`}>
                    #
                  </th>
                  <th className={`text-left py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}>
                    Descrição
                  </th>
                  <th className={`text-center py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}>
                    Unid.
                  </th>
                  <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}>
                    Qtd.
                  </th>
                  <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}>
                    Preço Unit.
                  </th>
                  {validItems.some((i) => i.discount > 0) && (
                    <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}>
                      Desc.
                    </th>
                  )}
                  <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider rounded-tr-md`}>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {validItems.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: index % 2 === 1 ? d.tableStripedBg : "transparent",
                      borderBottom: `1px solid ${d.tableBorderColor}`,
                    }}
                  >
                    <td className="py-2.5 px-3 opacity-50" style={{ fontFamily: d.monoFont }}>
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-2.5 px-3 font-medium">{item.description}</td>
                    <td className="py-2.5 px-3 text-center opacity-70">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                      {formatCurrency(item.unitPrice)}
                    </td>
                    {validItems.some((i) => i.discount > 0) && (
                      <td className="py-2.5 px-3 text-right tabular-nums opacity-70" style={{ fontFamily: d.monoFont }}>
                        {item.discount > 0 ? `${item.discount}%` : "—"}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right tabular-nums font-medium" style={{ fontFamily: d.monoFont }}>
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex flex-col items-end gap-1">
              <div className={`flex items-center gap-6 ${fs.base}`}>
                <span className="opacity-60">Subtotal</span>
                <span className="w-28 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className={`flex items-center gap-6 ${fs.base}`}>
                  <span className="opacity-60">Descontos</span>
                  <span className="w-28 text-right tabular-nums text-red-600" style={{ fontFamily: d.monoFont }}>
                    -{formatCurrency(totalDiscount)}
                  </span>
                </div>
              )}
              {conditions.freightValue > 0 && (
                <div className={`flex items-center gap-6 ${fs.base}`}>
                  <span className="opacity-60">Frete ({conditions.freight})</span>
                  <span className="w-28 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                    {formatCurrency(conditions.freightValue)}
                  </span>
                </div>
              )}
              <div
                className="flex items-center gap-6 font-bold pt-2 mt-2"
                style={{
                  borderTop: `2px solid ${d.accentColor}`,
                  fontSize: d.fontSize === "large" ? "1.125rem" : d.fontSize === "small" ? "0.875rem" : "1rem",
                }}
              >
                <span>Total</span>
                <span
                  className="w-28 text-right tabular-nums"
                  style={{ fontFamily: d.monoFont, color: d.accentColor }}
                >
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Commercial Notes ───────────────────────────────────── */}
          <div className="space-y-1">
            <div
              className={`${fs.xs} uppercase tracking-wider font-semibold mb-2`}
              style={{ color: d.accentColor }}
            >
              Condições Comerciais
            </div>
            <div
              className={`${fs.base} whitespace-pre-wrap leading-relaxed rounded-lg p-4`}
              style={{ backgroundColor: d.tableStripedBg }}
            >
              {interpolateTemplate(texts.commercialNotes, variables)}
            </div>
          </div>

          {/* ─── Technical Notes ─────────────────────────────────────── */}
          <div className="space-y-1">
            <div
              className={`${fs.xs} uppercase tracking-wider font-semibold mb-2`}
              style={{ color: d.accentColor }}
            >
              Informações Técnicas
            </div>
            <div className={`${fs.base} whitespace-pre-wrap leading-relaxed`}>
              {interpolateTemplate(texts.technicalNotes, variables)}
            </div>
          </div>

          {/* ─── Closing ─────────────────────────────────────────────── */}
          <div
            className={`${fs.base} whitespace-pre-wrap leading-relaxed pt-4`}
            style={{ borderTop: `1px solid ${d.tableBorderColor}` }}
          >
            {interpolateTemplate(texts.closingNotes, variables)}
          </div>

          {/* ─── Footer ──────────────────────────────────────────────── */}
          {d.showBorderLines && (
            <div className="h-1 rounded-full -mx-8 md:-mx-12 print:-mx-6" style={{ backgroundColor: d.accentColor }} />
          )}
          <div
            className="rounded-b-lg px-6 py-4 -mx-8 -mb-8 md:-mx-12 md:-mb-12 print:-mx-6 print:-mb-6 text-center"
            style={{
              backgroundColor: d.headerBgColor,
              color: d.headerTextColor,
            }}
          >
            <div className={fs.xs} style={{ opacity: 0.8 }}>
              {company.companyName || interpolateTemplate(texts.footerText, variables)}
              {company.address && ` — ${company.address}`}
            </div>
            {(company.phone || company.email || company.website) && (
              <div className="text-[10px] mt-0.5" style={{ opacity: 0.6 }}>
                {[company.phone, company.email, company.website].filter(Boolean).join(" • ")}
              </div>
            )}
            <div className="text-[10px] mt-1" style={{ opacity: 0.5 }}>
              Validade: {info.validityDays} dias a partir de {formatDateShort(info.createdAt)}
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
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
    </motion.div>
  );
}
