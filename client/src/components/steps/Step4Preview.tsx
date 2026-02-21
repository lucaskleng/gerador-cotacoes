/*
 * Step 4 — Finalizar / Preview
 * Design: Clean Commerce / Swiss Design
 * Print-ready preview of the quotation document
 * Approve simulation button
 */

import { useQuotationStore } from "@/store/quotationStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Download,
  RotateCcw,
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

export default function Step4Preview() {
  const { info, items, conditions, texts, subtotal, totalDiscount, grandTotal, setStep, markStepComplete, resetQuotation } =
    useQuotationStore();

  const [approved, setApproved] = useState(false);
  const quotationNumber = useMemo(() => generateQuotationNumber(), []);

  // Build variables map
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

  const handlePrint = () => {
    window.print();
  };

  const handleApprove = () => {
    markStepComplete(4);
    setApproved(true);
    toast.success("Cotação aprovada com sucesso!", {
      description: `Número: ${quotationNumber}`,
    });
  };

  const handleNewQuotation = () => {
    resetQuotation();
    toast.info("Nova cotação iniciada.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Action Bar */}
      <div className="no-print flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pré-visualização da Proposta</h2>
          <p className="text-sm text-muted-foreground">
            Revise o documento antes de aprovar ou imprimir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
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
        </div>
      </div>

      {/* Approved Badge */}
      {approved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="no-print bg-[oklch(0.95_0.05_145)] border border-[oklch(0.80_0.10_145)] rounded-lg p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-[oklch(0.50_0.15_145)]" />
          <div>
            <p className="text-sm font-medium text-[oklch(0.30_0.05_145)]">
              Cotação Aprovada
            </p>
            <p className="text-xs text-[oklch(0.40_0.08_145)]">
              Número: {quotationNumber} — {formatDateShort(info.createdAt)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Document Preview */}
      <Card className="shadow-lg border-border/60 overflow-hidden print:shadow-none print:border-0">
        <div className="bg-white p-8 md:p-12 space-y-8 print:p-6" id="quotation-document">
          {/* Header */}
          <div className="border-b-2 border-primary pb-6">
            <div className="flex items-start justify-between">
              <div>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                  {interpolateTemplate(texts.headerText, variables)}
                </pre>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Proposta Nº
                </div>
                <div className="font-mono text-sm font-semibold text-primary">
                  {quotationNumber}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDate(info.createdAt)}
                </div>
                {approved && (
                  <div className="mt-2 inline-block px-2 py-0.5 bg-[oklch(0.95_0.05_145)] text-[oklch(0.40_0.12_145)] text-[10px] font-semibold uppercase tracking-wider rounded">
                    Aprovada
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Cliente
              </div>
              <div className="font-semibold">{info.customerName || "—"}</div>
              {info.customerCompany && (
                <div className="text-muted-foreground">{info.customerCompany}</div>
              )}
              {info.customerCNPJ && (
                <div className="text-muted-foreground">CNPJ: {info.customerCNPJ}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Contato
              </div>
              {info.customerEmail && <div>{info.customerEmail}</div>}
              {info.customerPhone && <div>{info.customerPhone}</div>}
              {info.customerAddress && (
                <div className="text-muted-foreground text-xs mt-1">
                  {info.customerAddress}
                </div>
              )}
            </div>
          </div>

          {/* Reference */}
          {info.reference && (
            <div className="bg-muted/40 rounded-lg p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Referência
              </div>
              <div className="text-sm font-medium">{info.reference}</div>
            </div>
          )}

          {/* Intro Notes */}
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {interpolateTemplate(texts.introNotes, variables)}
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary">
                  <th className="text-left py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="text-center py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    Unid.
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    Qtd.
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    Preço Unit.
                  </th>
                  {validItems.some((i) => i.discount > 0) && (
                    <th className="text-right py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                      Desc.
                    </th>
                  )}
                  <th className="text-right py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {validItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/40 hover:bg-muted/20"
                  >
                    <td className="py-2.5 text-muted-foreground font-mono text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-2.5 font-medium">{item.description}</td>
                    <td className="py-2.5 text-center text-muted-foreground">
                      {item.unit}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    {validItems.some((i) => i.discount > 0) && (
                      <td className="py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {item.discount > 0 ? `${item.discount}%` : "—"}
                      </td>
                    )}
                    <td className="py-2.5 text-right font-mono tabular-nums font-medium">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex flex-col items-end gap-1">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums w-28 text-right">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-muted-foreground">Descontos</span>
                  <span className="font-mono tabular-nums w-28 text-right text-destructive">
                    -{formatCurrency(totalDiscount)}
                  </span>
                </div>
              )}
              {conditions.freightValue > 0 && (
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-muted-foreground">
                    Frete ({conditions.freight})
                  </span>
                  <span className="font-mono tabular-nums w-28 text-right">
                    {formatCurrency(conditions.freightValue)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-6 text-base font-bold pt-2 border-t-2 border-primary mt-2">
                <span>Total</span>
                <span className="font-mono tabular-nums w-28 text-right text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Commercial Notes */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Condições Comerciais
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-4">
              {interpolateTemplate(texts.commercialNotes, variables)}
            </div>
          </div>

          {/* Technical Notes */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Informações Técnicas
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {interpolateTemplate(texts.technicalNotes, variables)}
            </div>
          </div>

          {/* Closing */}
          <div className="text-sm whitespace-pre-wrap leading-relaxed pt-4 border-t border-border">
            {interpolateTemplate(texts.closingNotes, variables)}
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-border text-center">
            <div className="text-xs text-muted-foreground">
              {interpolateTemplate(texts.footerText, variables)}
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-1">
              Validade: {info.validityDays} dias a partir de{" "}
              {formatDateShort(info.createdAt)}
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
          {!approved ? (
            <Button onClick={handleApprove} className="gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Aprovar Cotação
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
