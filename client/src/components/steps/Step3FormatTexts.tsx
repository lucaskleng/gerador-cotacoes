/*
 * Step 3 — Formatar Textos
 * Design: Clean Commerce / Swiss Design
 * Accordions for each text section with live variable preview
 */

import { useQuotationStore } from "@/store/quotationStore";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  MessageSquare,
  Briefcase,
  Wrench,
  HandshakeIcon,
  LayoutTemplate,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { interpolateTemplate, formatCurrency, formatDate } from "@/lib/format";
import { useState } from "react";

interface TextSectionProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  variables: Record<string, string | number>;
  description: string;
}

function TextSection({ label, icon, value, onChange, variables, description }: TextSectionProps) {
  const [showPreview, setShowPreview] = useState(false);
  const interpolated = interpolateTemplate(value, variables);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              Editar
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              Visualizar
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">{description}</p>

      {showPreview ? (
        <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed border border-border/50">
          {interpolated}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="text-sm font-mono leading-relaxed"
          placeholder={`Digite o texto para ${label.toLowerCase()}...`}
        />
      )}
    </div>
  );
}

export default function Step3FormatTexts() {
  const { info, conditions, texts, grandTotal, updateTexts, setStep, markStepComplete } =
    useQuotationStore();

  // Build variables map for interpolation
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

  const handleNext = () => {
    markStepComplete(3);
    setStep(4);
  };

  const sections = [
    {
      id: "header",
      label: "Cabeçalho",
      icon: <LayoutTemplate className="w-4 h-4 text-primary" />,
      key: "headerText" as const,
      description: "Identificação da empresa emissora (aparece no topo do documento)",
    },
    {
      id: "intro",
      label: "Notas de Introdução",
      icon: <MessageSquare className="w-4 h-4 text-primary" />,
      key: "introNotes" as const,
      description:
        "Texto de abertura com saudação ao cliente. Use ${customerName}, ${reference}, etc.",
    },
    {
      id: "commercial",
      label: "Condições Comerciais",
      icon: <Briefcase className="w-4 h-4 text-primary" />,
      key: "commercialNotes" as const,
      description:
        "Resumo das condições. Use ${paymentTerms}, ${deliveryTime}, ${freight}, ${warranty}, ${validityDays}.",
    },
    {
      id: "technical",
      label: "Notas Técnicas",
      icon: <Wrench className="w-4 h-4 text-primary" />,
      key: "technicalNotes" as const,
      description: "Informações técnicas, normas e especificações aplicáveis.",
    },
    {
      id: "closing",
      label: "Encerramento",
      icon: <HandshakeIcon className="w-4 h-4 text-primary" />,
      key: "closingNotes" as const,
      description: "Texto de encerramento e assinatura.",
    },
    {
      id: "footer",
      label: "Rodapé",
      icon: <FileText className="w-4 h-4 text-primary" />,
      key: "footerText" as const,
      description: "Informações de contato e dados legais (aparece no rodapé do documento).",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Textos da Proposta</CardTitle>
              <CardDescription>
                Edite os textos que comporão o documento final. Use variáveis como{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                  {"${customerName}"}
                </code>{" "}
                para inserir dados automaticamente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Available variables hint */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Variáveis disponíveis:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(variables).map((key) => (
                <code
                  key={key}
                  className="text-[10px] bg-background px-1.5 py-0.5 rounded border border-border font-mono text-primary"
                >
                  {"${" + key + "}"}
                </code>
              ))}
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["intro"]} className="space-y-2">
            {sections.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border border-border/50 rounded-lg px-4 data-[state=open]:bg-muted/20"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2.5">
                    {section.icon}
                    <span className="text-sm font-medium">{section.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <TextSection
                    label={section.label}
                    icon={section.icon}
                    value={texts[section.key]}
                    onChange={(val) => updateTexts({ [section.key]: val })}
                    variables={variables}
                    description={section.description}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-2 pb-8">
        <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} size="lg" className="gap-2">
          Visualizar Proposta
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
