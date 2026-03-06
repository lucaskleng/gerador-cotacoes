/*
 * QuotationView — Visualizar Cotação Salva
 * Professional WEG-inspired layout matching Step4Preview.
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
  Download,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  DEFAULT_COMPANY,
  DEFAULT_PROPOSAL_DESIGN,
} from "@shared/designDefaults";
import type { CompanyBranding, ProposalDesign } from "@shared/designDefaults";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR").format(date);
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

  const fontSizeMap: Record<string, { base: string; sm: string; xs: string; title: string; h2: string }> = {
    small: { base: "text-xs", sm: "text-[11px]", xs: "text-[10px]", title: "text-sm", h2: "text-xs" },
    medium: { base: "text-sm", sm: "text-xs", xs: "text-[10px]", title: "text-base", h2: "text-sm" },
    large: { base: "text-base", sm: "text-sm", xs: "text-xs", title: "text-lg", h2: "text-base" },
  };
  const fs = fontSizeMap[d.fontSize] || fontSizeMap.medium;

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

  const quotationType = (quotation as any).quotationType ?? "products";
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Header */}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement("a");
                link.href = `/api/quotation/${quotation.id}/pdf`;
                link.download = `Cotacao-${quotation.quotationNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Download do PDF iniciado!");
              }}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Document Preview */}
      <main className="flex-1 container py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden shadow-lg print:shadow-none print:border-0">
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
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
                      Proposta N.
                    </div>
                    <div
                      className="text-2xl font-bold tracking-tight"
                      style={{ fontFamily: d.monoFont }}
                    >
                      {quotation.quotationNumber}
                    </div>
                    {quotation.status === "approved" && (
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
                    <span className="opacity-70">Data:</span> {formatDateShort(quotation.quotationDate)}
                  </span>
                  <span>
                    <span className="opacity-70">Validade:</span> {quotation.validityDays} dias
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
                  {quotation.reference && (
                    <p className={`${fs.sm} mt-1.5 opacity-70`}>
                      Ref.: {quotation.reference}
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
                          <td className="py-2.5 px-4 font-semibold w-36" style={{ backgroundColor: d.tableStripedBg }}>
                            Cliente
                          </td>
                          <td className="py-2.5 px-4 font-medium">{quotation.customerName || "—"}</td>
                        </tr>
                        {quotation.customerCompany && (
                          <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                            <td className="py-2.5 px-4 font-semibold" style={{ backgroundColor: d.tableStripedBg }}>
                              Empresa
                            </td>
                            <td className="py-2.5 px-4">{quotation.customerCompany}</td>
                          </tr>
                        )}
                        {quotation.customerCNPJ && (
                          <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                            <td className="py-2.5 px-4 font-semibold" style={{ backgroundColor: d.tableStripedBg }}>
                              CNPJ
                            </td>
                            <td className="py-2.5 px-4" style={{ fontFamily: d.monoFont }}>
                              {quotation.customerCNPJ}
                            </td>
                          </tr>
                        )}
                        {quotation.customerAddress && (
                          <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                            <td className="py-2.5 px-4 font-semibold" style={{ backgroundColor: d.tableStripedBg }}>
                              Endereço
                            </td>
                            <td className="py-2.5 px-4">{quotation.customerAddress}</td>
                          </tr>
                        )}
                        {(quotation.customerPhone || quotation.customerEmail) && (
                          <tr>
                            <td className="py-2.5 px-4 font-semibold" style={{ backgroundColor: d.tableStripedBg }}>
                              Contato
                            </td>
                            <td className="py-2.5 px-4">
                              {[quotation.customerPhone, quotation.customerEmail].filter(Boolean).join(" — ")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ─── Section 2: Introdução ────────────────────────────── */}
                {texts?.introNotes && (
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
                      {interpolateText(texts.introNotes, vars)}
                    </div>
                  </div>
                )}

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
                        <tr style={{ backgroundColor: d.tableHeaderBgColor, color: d.tableHeaderTextColor }}>
                          <th className={`text-center py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`} style={{ width: "40px" }}>
                            Item
                          </th>
                          <th className={`text-left py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`}>
                            Descrição
                          </th>
                          <th className={`text-center py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`} style={{ width: "50px" }}>
                            Unid.
                          </th>
                          <th className={`text-center py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`} style={{ width: "55px" }}>
                            Qtd.
                          </th>
                          <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`} style={{ width: "110px" }}>
                            Preço Unit.
                          </th>
                          {items.some((i: any) => (i.discount ?? 0) > 0) && (
                            <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`} style={{ width: "65px" }}>
                              Desc.
                            </th>
                          )}
                          <th className={`text-right py-2.5 px-3 ${fs.xs} font-semibold uppercase tracking-wider`} style={{ width: "120px" }}>
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
                            <td className="py-2.5 px-3 text-center opacity-60" style={{ fontFamily: d.monoFont }}>
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="py-2.5 px-3 font-medium">{item.description || "—"}</td>
                            <td className="py-2.5 px-3 text-center opacity-70">{item.unit}</td>
                            <td className="py-2.5 px-3 text-center tabular-nums" style={{ fontFamily: d.monoFont }}>
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                              {formatCurrency(item.unitPrice)}
                            </td>
                            {items.some((i: any) => (i.discount ?? 0) > 0) && (
                              <td className="py-2.5 px-3 text-right tabular-nums opacity-70" style={{ fontFamily: d.monoFont }}>
                                {(item.discount ?? 0) > 0 ? `${item.discount}%` : "—"}
                              </td>
                            )}
                            <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ fontFamily: d.monoFont }}>
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="mt-0 rounded-b-lg px-4 py-4" style={{ backgroundColor: d.tableStripedBg }}>
                      <div className="flex flex-col items-end gap-1.5">
                        {subtotalVal > 0 && (
                          <div className={`flex items-center gap-8 ${fs.base}`}>
                            <span className="opacity-60 w-24 text-right">Subtotal</span>
                            <span className="w-32 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                              {formatCurrency(subtotalVal)}
                            </span>
                          </div>
                        )}
                        {discountVal > 0 && (
                          <div className={`flex items-center gap-8 ${fs.base}`}>
                            <span className="opacity-60 w-24 text-right">Descontos</span>
                            <span className="w-32 text-right tabular-nums" style={{ fontFamily: d.monoFont, color: "#dc2626" }}>
                              -{formatCurrency(discountVal)}
                            </span>
                          </div>
                        )}
                        {freightVal > 0 && (
                          <div className={`flex items-center gap-8 ${fs.base}`}>
                            <span className="opacity-60 w-24 text-right">{sectionLabels.freight}</span>
                            <span className="w-32 text-right tabular-nums" style={{ fontFamily: d.monoFont }}>
                              {formatCurrency(freightVal)}
                            </span>
                          </div>
                        )}
                        <div
                          className="flex items-center gap-8 font-bold pt-2 mt-1"
                          style={{
                            borderTop: `2px solid ${d.accentColor}`,
                            fontSize: d.fontSize === "large" ? "1.125rem" : d.fontSize === "small" ? "0.875rem" : "1rem",
                          }}
                        >
                          <span className="w-24 text-right">TOTAL</span>
                          <span className="w-32 text-right tabular-nums" style={{ fontFamily: d.monoFont, color: d.accentColor }}>
                            {formatCurrency(grandTotalVal)}
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
                  <div className="rounded-lg overflow-hidden ml-0" style={{ border: `1px solid ${d.tableBorderColor}` }}>
                    <table className={`w-full ${fs.base}`} style={{ borderCollapse: "collapse" }}>
                      <tbody>
                        <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                          <td className="py-2.5 px-4 font-semibold w-44" style={{ backgroundColor: d.tableStripedBg }}>
                            Pagamento
                          </td>
                          <td className="py-2.5 px-4">{conditions?.paymentTerms}</td>
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                          <td className="py-2.5 px-4 font-semibold" style={{ backgroundColor: d.tableStripedBg }}>
                            {sectionLabels.delivery}
                          </td>
                          <td className="py-2.5 px-4">{conditions?.deliveryTime}</td>
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${d.tableBorderColor}` }}>
                          <td className="py-2.5 px-4 font-semibold" style={{ backgroundColor: d.tableStripedBg }}>
                            {sectionLabels.freight}
                          </td>
                          <td className="py-2.5 px-4">
                            {conditions?.freight}
                            {freightVal > 0 && ` — ${formatCurrency(freightVal)}`}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold" style={{ backgroundColor: d.tableStripedBg }}>
                            Garantia
                          </td>
                          <td className="py-2.5 px-4">{conditions?.warranty}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {texts?.commercialNotes && (
                    <div className={`${fs.base} whitespace-pre-wrap leading-relaxed mt-3 pl-9`}>
                      {interpolateText(texts.commercialNotes, vars)}
                    </div>
                  )}
                </div>

                {/* ─── Section 5: Informações Técnicas ──────────────────── */}
                {texts?.technicalNotes && (
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
                      {interpolateText(texts.technicalNotes, vars)}
                    </div>
                  </div>
                )}

                {/* ─── Section 6: Encerramento ──────────────────────────── */}
                {texts?.closingNotes && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: d.accentColor }}
                      >
                        {texts?.technicalNotes ? "6" : "5"}
                      </div>
                      <h3
                        className={`${fs.title} font-bold uppercase tracking-wider`}
                        style={{ fontFamily: d.titleFont, color: d.accentColor }}
                      >
                        Considerações Finais
                      </h3>
                    </div>
                    <div className={`${fs.base} whitespace-pre-wrap leading-relaxed pl-9`}>
                      {interpolateText(texts.closingNotes, vars)}
                    </div>
                  </div>
                )}

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
                        <td className="py-1.5 px-3" style={{ fontFamily: d.monoFont }}>00</td>
                        <td className="py-1.5 px-3" style={{ fontFamily: d.monoFont }}>
                          {formatDateShort(quotation.quotationDate)}
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
                style={{ backgroundColor: d.headerBgColor, color: d.headerTextColor }}
              >
                <div className="flex items-center justify-between">
                  <div className={fs.xs} style={{ opacity: 0.8 }}>
                    <span className="font-semibold">{company.companyName || "Empresa"}</span>
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
        </div>
      </main>
    </div>
  );
}
