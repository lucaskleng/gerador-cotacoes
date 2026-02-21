/*
 * QuotationView — Visualizar Cotação Salva
 * Applies user's design settings (colors, fonts, logo, layout) to the document.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  Edit3,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useMemo } from "react";
import {
  DEFAULT_COMPANY,
  DEFAULT_PROPOSAL_DESIGN,
} from "../../../shared/designDefaults";
import type { CompanyBranding, ProposalDesign } from "../../../shared/designDefaults";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function interpolateText(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? `\${${key}}`);
}

export default function QuotationView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: quotation, isLoading, error } = trpc.quotation.get.useQuery(
    { id: Number(id) },
    { enabled: isAuthenticated && !!id }
  );

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

  const headerAlign =
    d.headerLayout === "center"
      ? "text-center justify-center"
      : d.headerLayout === "right"
        ? "text-right justify-end"
        : "text-left justify-start";

  const vars: Record<string, string> = useMemo(() => {
    if (!quotation) return {} as Record<string, string>;
    return {
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail ?? "",
      customerPhone: quotation.customerPhone ?? "",
      customerCompany: quotation.customerCompany ?? "",
      customerCNPJ: quotation.customerCNPJ ?? "",
      customerAddress: quotation.customerAddress ?? "",
      reference: quotation.reference ?? "",
      validityDays: String(quotation.validityDays),
      createdAt: formatDate(quotation.quotationDate),
      paymentTerms: quotation.conditions?.paymentTerms ?? "",
      deliveryTime: quotation.conditions?.deliveryTime ?? "",
      freight: quotation.conditions?.freight ?? "",
      warranty: quotation.conditions?.warranty ?? "",
      grandTotal: formatCurrency(parseFloat(String(quotation.grandTotal))),
    };
  }, [quotation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando cotação...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-8 text-center space-y-4">
            <h2 className="text-lg font-semibold">Cotação não encontrada</h2>
            <p className="text-sm text-muted-foreground">
              A cotação solicitada não existe ou você não tem permissão para acessá-la.
            </p>
            <Button onClick={() => navigate("/cotacoes")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Cotações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = Array.isArray(quotation.items) ? quotation.items : [];
  const texts = quotation.texts;
  const conditions = quotation.conditions;
  const subtotalVal = parseFloat(String(quotation.subtotal ?? 0));
  const discountVal = parseFloat(String(quotation.totalDiscount ?? 0));
  const grandTotalVal = parseFloat(String(quotation.grandTotal));
  const freightVal = conditions?.freightValue ? parseFloat(String(conditions.freightValue)) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 no-print">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/cotacoes")}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold leading-tight">
                {quotation.quotationNumber}
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {quotation.customerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/editar/${quotation.id}`)}
              className="gap-1.5 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </Button>
          </div>
        </div>
      </header>

      {/* Preview Content */}
      <main className="flex-1 container py-6">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden shadow-lg print:shadow-none print:border-0">
            <div
              className="p-8 space-y-8 print:p-6"
              style={{
                backgroundColor: d.bodyBgColor,
                color: d.bodyTextColor,
                fontFamily: d.bodyFont,
              }}
            >
              {/* ─── Header ─────────────────────────────────────────── */}
              <div
                className="rounded-lg px-6 py-5 -mx-8 -mt-8 print:-mx-6 print:-mt-6"
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
                      {company.companyName || (texts?.headerText ? texts.headerText.split("\n")[0] : "")}
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
                <div className="h-1 rounded-full -mx-8 print:-mx-6" style={{ backgroundColor: d.accentColor }} />
              )}

              {/* ─── Proposal Number & Date ─────────────────────────── */}
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className={`${fs.title} font-bold uppercase tracking-wider`}
                    style={{ fontFamily: d.titleFont, color: d.accentColor }}
                  >
                    Proposta Comercial
                  </h3>
                  <p className={`${fs.xs} mt-0.5 opacity-60`}>
                    {formatDate(quotation.quotationDate)} — Validade: {quotation.validityDays} dias
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
                    {quotation.quotationNumber}
                  </div>
                  {quotation.status === "approved" && (
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

              {/* ─── Customer Info ───────────────────────────────────── */}
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
                  <div className={`${fs.base} font-semibold`}>{quotation.customerName}</div>
                  {quotation.customerCompany && (
                    <div className={`${fs.sm} opacity-70`}>{quotation.customerCompany}</div>
                  )}
                  {quotation.customerCNPJ && (
                    <div className={`${fs.sm} opacity-70`}>CNPJ: {quotation.customerCNPJ}</div>
                  )}
                </div>
                <div>
                  <div
                    className={`${fs.xs} uppercase tracking-wider mb-2 font-semibold`}
                    style={{ color: d.accentColor }}
                  >
                    Contato
                  </div>
                  {quotation.customerEmail && <div className={fs.base}>{quotation.customerEmail}</div>}
                  {quotation.customerPhone && <div className={fs.base}>{quotation.customerPhone}</div>}
                  {quotation.customerAddress && (
                    <div className={`${fs.xs} opacity-60 mt-1`}>{quotation.customerAddress}</div>
                  )}
                </div>
              </div>

              {/* ─── Reference ──────────────────────────────────────── */}
              {quotation.reference && (
                <div className="rounded-lg p-4" style={{ backgroundColor: d.tableStripedBg }}>
                  <div
                    className={`${fs.xs} uppercase tracking-wider mb-1 font-semibold`}
                    style={{ color: d.accentColor }}
                  >
                    Referência
                  </div>
                  <div className={`${fs.base} font-medium`}>{quotation.reference}</div>
                </div>
              )}

              {/* ─── Intro Notes ────────────────────────────────────── */}
              {texts?.introNotes && (
                <div className={`${fs.base} whitespace-pre-wrap leading-relaxed`}>
                  {interpolateText(texts.introNotes, vars)}
                </div>
              )}

              {/* ─── Items Table ────────────────────────────────────── */}
              <div className="overflow-x-auto">
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
                        Qtd
                      </th>
                      <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}>
                        Unitário
                      </th>
                      <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider rounded-tr-md`}>
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, idx: number) => (
                      <tr
                        key={item.id || idx}
                        style={{
                          backgroundColor: idx % 2 === 1 ? d.tableStripedBg : "transparent",
                          borderBottom: `1px solid ${d.tableBorderColor}`,
                        }}
                      >
                        <td className="py-2.5 px-3 opacity-50" style={{ fontFamily: d.monoFont }}>
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2.5 px-3 font-medium">{item.description || "—"}</td>
                        <td className="py-2.5 px-3 text-center tabular-nums" style={{ fontFamily: d.monoFont }}>
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium" style={{ fontFamily: d.monoFont }}>
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-4 flex flex-col items-end gap-1">
                  {subtotalVal > 0 && (
                    <div className={`flex items-center gap-6 ${fs.base}`}>
                      <span className="opacity-60">Subtotal</span>
                      <span className="w-28 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                        {formatCurrency(subtotalVal)}
                      </span>
                    </div>
                  )}
                  {discountVal > 0 && (
                    <div className={`flex items-center gap-6 ${fs.base}`}>
                      <span className="opacity-60">Descontos</span>
                      <span className="w-28 text-right tabular-nums text-red-600" style={{ fontFamily: d.monoFont }}>
                        -{formatCurrency(discountVal)}
                      </span>
                    </div>
                  )}
                  {freightVal > 0 && (
                    <div className={`flex items-center gap-6 ${fs.base}`}>
                      <span className="opacity-60">Frete ({conditions?.freight})</span>
                      <span className="w-28 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                        {formatCurrency(freightVal)}
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
                      {formatCurrency(grandTotalVal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── Commercial Notes ───────────────────────────────── */}
              {texts?.commercialNotes && (
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
                    {interpolateText(texts.commercialNotes, vars)}
                  </div>
                </div>
              )}

              {/* ─── Technical Notes ─────────────────────────────────── */}
              {texts?.technicalNotes && (
                <div className="space-y-1">
                  <div
                    className={`${fs.xs} uppercase tracking-wider font-semibold mb-2`}
                    style={{ color: d.accentColor }}
                  >
                    Informações Técnicas
                  </div>
                  <div className={`${fs.base} whitespace-pre-wrap leading-relaxed`}>
                    {interpolateText(texts.technicalNotes, vars)}
                  </div>
                </div>
              )}

              {/* ─── Closing ─────────────────────────────────────────── */}
              {texts?.closingNotes && (
                <div
                  className={`${fs.base} whitespace-pre-wrap leading-relaxed pt-4`}
                  style={{ borderTop: `1px solid ${d.tableBorderColor}` }}
                >
                  {interpolateText(texts.closingNotes, vars)}
                </div>
              )}

              {/* ─── Footer ──────────────────────────────────────────── */}
              {d.showBorderLines && (
                <div className="h-1 rounded-full -mx-8 print:-mx-6" style={{ backgroundColor: d.accentColor }} />
              )}
              <div
                className="rounded-b-lg px-6 py-4 -mx-8 -mb-8 print:-mx-6 print:-mb-6 text-center"
                style={{
                  backgroundColor: d.headerBgColor,
                  color: d.headerTextColor,
                }}
              >
                <div className={fs.xs} style={{ opacity: 0.8 }}>
                  {company.companyName || (texts?.footerText ?? "")}
                  {company.address && ` — ${company.address}`}
                </div>
                {(company.phone || company.email || company.website) && (
                  <div className="text-[10px] mt-0.5" style={{ opacity: 0.6 }}>
                    {[company.phone, company.email, company.website].filter(Boolean).join(" • ")}
                  </div>
                )}
                <div className="text-[10px] mt-1" style={{ opacity: 0.5 }}>
                  Validade: {quotation.validityDays} dias a partir de {formatDate(quotation.quotationDate)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
