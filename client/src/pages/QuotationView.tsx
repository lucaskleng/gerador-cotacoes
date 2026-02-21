/*
 * QuotationView — Visualizar Cotação Salva
 * Loads a saved quotation from the database and renders the preview
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  ArrowLeft,
  Printer,
  Edit3,
  LayoutList,
  Download,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useMemo } from "react";

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
          <Card className="overflow-hidden">
            <CardContent className="p-8 space-y-6">
              {/* Header Text */}
              {texts?.headerText && (
                <div className="text-center border-b border-border pb-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {texts.headerText}
                  </pre>
                </div>
              )}

              {/* Quotation Number & Date */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Proposta Nº
                  </p>
                  <p className="font-mono text-lg font-bold text-primary">
                    {quotation.quotationNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Data
                  </p>
                  <p className="font-mono text-sm">
                    {formatDate(quotation.quotationDate)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Cliente
                </p>
                <p className="font-semibold">{quotation.customerName}</p>
                {quotation.customerCompany && (
                  <p className="text-sm text-muted-foreground">
                    {quotation.customerCompany}
                  </p>
                )}
                {quotation.customerCNPJ && (
                  <p className="text-sm text-muted-foreground font-mono">
                    CNPJ: {quotation.customerCNPJ}
                  </p>
                )}
                {quotation.customerAddress && (
                  <p className="text-sm text-muted-foreground">
                    {quotation.customerAddress}
                  </p>
                )}
                <div className="flex gap-4 mt-1">
                  {quotation.customerEmail && (
                    <p className="text-sm text-muted-foreground">
                      {quotation.customerEmail}
                    </p>
                  )}
                  {quotation.customerPhone && (
                    <p className="text-sm text-muted-foreground">
                      {quotation.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Reference */}
              {quotation.reference && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Referência
                  </p>
                  <p className="text-sm font-medium">{quotation.reference}</p>
                </div>
              )}

              {/* Intro Notes */}
              {texts?.introNotes && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {interpolateText(texts.introNotes, vars)}
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-primary/20">
                      <th className="text-left py-2 text-xs uppercase tracking-wider text-muted-foreground">
                        #
                      </th>
                      <th className="text-left py-2 text-xs uppercase tracking-wider text-muted-foreground">
                        Descrição
                      </th>
                      <th className="text-center py-2 text-xs uppercase tracking-wider text-muted-foreground">
                        Qtd
                      </th>
                      <th className="text-right py-2 text-xs uppercase tracking-wider text-muted-foreground">
                        Unitário
                      </th>
                      <th className="text-right py-2 text-xs uppercase tracking-wider text-muted-foreground">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="border-b border-border/50">
                        <td className="py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2">{item.description || "—"}</td>
                        <td className="py-2 text-center font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2 text-right font-mono font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-primary/20">
                      <td colSpan={4} className="py-2 text-right font-semibold">
                        Total Geral
                      </td>
                      <td className="py-2 text-right font-mono text-lg font-bold text-primary">
                        {formatCurrency(parseFloat(String(quotation.grandTotal)))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Commercial Notes */}
              {texts?.commercialNotes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Condições Comerciais
                  </p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap bg-secondary/30 rounded-lg p-4">
                    {interpolateText(texts.commercialNotes, vars)}
                  </div>
                </div>
              )}

              {/* Technical Notes */}
              {texts?.technicalNotes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Notas Técnicas
                  </p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {interpolateText(texts.technicalNotes, vars)}
                  </div>
                </div>
              )}

              {/* Closing Notes */}
              {texts?.closingNotes && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap border-t border-border pt-4">
                  {interpolateText(texts.closingNotes, vars)}
                </div>
              )}

              {/* Footer */}
              {texts?.footerText && (
                <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
                  <pre className="whitespace-pre-wrap font-sans">
                    {texts.footerText}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
