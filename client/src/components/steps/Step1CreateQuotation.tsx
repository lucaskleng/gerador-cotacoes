/*
 * Step 1 — Criar Cotação
 * Design: Clean Commerce / Swiss Design
 * Form with customer identification, validity, reference
 * CNPJ auto-lookup via BrasilAPI (Receita Federal / SEFAZ)
 */

import { useQuotationStore } from "@/store/quotationStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  User,
  Building2,
  FileText,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCallback, useRef, useEffect } from "react";
import {
  useCnpjLookup,
  stripCnpj,
  isValidCnpjFormat,
  formatCnpjDisplay,
  formatPhone,
  buildAddress,
} from "@/hooks/useCnpjLookup";

function formatCnpjInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default function Step1CreateQuotation() {
  const { info, updateInfo, setStep, markStepComplete } = useQuotationStore();
  const { loading, error, data, lookup } = useCnpjLookup();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLookedUpRef = useRef<string>("");

  const handleCnpjChange = useCallback(
    (rawValue: string) => {
      const formatted = formatCnpjInput(rawValue);
      updateInfo({ customerCNPJ: formatted });

      const digits = stripCnpj(formatted);

      // Clear debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Only trigger lookup when we have 14 digits and it's different from last lookup
      if (digits.length === 14 && digits !== lastLookedUpRef.current) {
        debounceRef.current = setTimeout(async () => {
          lastLookedUpRef.current = digits;
          const result = await lookup(digits);
          if (result) {
            // Auto-fill fields from CNPJ data
            const updates: Record<string, string> = {};

            if (result.razao_social) {
              updates.customerCompany = result.razao_social;
            }

            // Use nome_fantasia as customer name if available, otherwise razao_social
            if (result.nome_fantasia && result.nome_fantasia.trim()) {
              updates.customerName = result.nome_fantasia;
            } else if (result.razao_social && !info.customerName.trim()) {
              updates.customerName = result.razao_social;
            }

            const address = buildAddress(result);
            if (address) {
              updates.customerAddress = address;
            }

            if (result.email) {
              updates.customerEmail = result.email;
            }

            const phone = formatPhone(result.ddd_telefone_1);
            if (phone) {
              updates.customerPhone = phone;
            }

            updateInfo(updates);

            toast.success("Dados da empresa carregados!", {
              description: `${result.razao_social} — ${result.descricao_situacao_cadastral}`,
            });
          }
        }, 600);
      }
    },
    [lookup, updateInfo, info.customerName]
  );

  const handleManualLookup = useCallback(async () => {
    const digits = stripCnpj(info.customerCNPJ);
    if (!isValidCnpjFormat(info.customerCNPJ)) {
      toast.error("Digite um CNPJ válido com 14 dígitos.");
      return;
    }
    lastLookedUpRef.current = digits;
    const result = await lookup(digits);
    if (result) {
      const updates: Record<string, string> = {};
      if (result.razao_social) updates.customerCompany = result.razao_social;
      if (result.nome_fantasia && result.nome_fantasia.trim()) {
        updates.customerName = result.nome_fantasia;
      } else if (result.razao_social && !info.customerName.trim()) {
        updates.customerName = result.razao_social;
      }
      const address = buildAddress(result);
      if (address) updates.customerAddress = address;
      if (result.email) updates.customerEmail = result.email;
      const phone = formatPhone(result.ddd_telefone_1);
      if (phone) updates.customerPhone = phone;
      updateInfo(updates);
      toast.success("Dados da empresa carregados!", {
        description: `${result.razao_social} — ${result.descricao_situacao_cadastral}`,
      });
    }
  }, [info.customerCNPJ, info.customerName, lookup, updateInfo]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleNext = () => {
    if (!info.customerName.trim()) {
      toast.error("Informe o nome do cliente para continuar.");
      return;
    }
    markStepComplete(1);
    setStep(2);
  };

  const cnpjDigits = stripCnpj(info.customerCNPJ);
  const showLookupButton = cnpjDigits.length === 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Dados do Cliente</CardTitle>
              <CardDescription>
                Informe o CNPJ para buscar os dados automaticamente na Receita Federal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CNPJ Field — Prominent position with lookup */}
          <div className="space-y-2">
            <Label htmlFor="customerCNPJ" className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-primary" />
              CNPJ
              <span className="text-xs text-muted-foreground font-normal ml-1">
                (preencha para buscar automaticamente)
              </span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="customerCNPJ"
                  placeholder="00.000.000/0001-00"
                  value={info.customerCNPJ}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  className="font-mono text-base pr-10"
                  maxLength={18}
                />
                {/* Status indicator inside input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {loading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </motion.div>
                    )}
                    {!loading && data && !error && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-[oklch(0.55_0.18_145)]" />
                      </motion.div>
                    )}
                    {!loading && error && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <XCircle className="w-4 h-4 text-destructive" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {showLookupButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleManualLookup}
                  disabled={loading}
                  className="gap-1.5 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Consultar
                </Button>
              )}
            </div>

            {/* Status messages */}
            <AnimatePresence>
              {loading && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-primary flex items-center gap-1.5"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Consultando CNPJ na Receita Federal...
                </motion.p>
              )}
              {!loading && error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </motion.p>
              )}
              {!loading && data && !error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[oklch(0.96_0.03_145)] border border-[oklch(0.85_0.08_145)] rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[oklch(0.35_0.08_145)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Empresa encontrada — dados preenchidos automaticamente
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[oklch(0.40_0.05_145)]">
                    <span>
                      <strong className="font-medium">Razão Social:</strong>{" "}
                      {data.razao_social}
                    </span>
                    <span>
                      <strong className="font-medium">Situação:</strong>{" "}
                      <span
                        className={
                          data.descricao_situacao_cadastral === "ATIVA"
                            ? "text-[oklch(0.45_0.15_145)] font-semibold"
                            : "text-destructive font-semibold"
                        }
                      >
                        {data.descricao_situacao_cadastral}
                      </span>
                    </span>
                    {data.nome_fantasia && (
                      <span>
                        <strong className="font-medium">Nome Fantasia:</strong>{" "}
                        {data.nome_fantasia}
                      </span>
                    )}
                    <span>
                      <strong className="font-medium">Natureza:</strong>{" "}
                      {data.natureza_juridica}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Separator */}
          <div className="border-t border-border/50 pt-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Nome do Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="Ex: João da Silva"
                value={info.customerName}
                onChange={(e) => updateInfo({ customerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">E-mail</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="cliente@empresa.com"
                value={info.customerEmail}
                onChange={(e) => updateInfo({ customerEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone</Label>
              <Input
                id="customerPhone"
                placeholder="(00) 00000-0000"
                value={info.customerPhone}
                onChange={(e) => updateInfo({ customerPhone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Empresa</CardTitle>
              <CardDescription>
                Dados complementares da empresa
                {data && (
                  <span className="text-[oklch(0.45_0.15_145)] ml-1">
                    — preenchidos via CNPJ
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerCompany">Razão Social / Empresa</Label>
            <Input
              id="customerCompany"
              placeholder="Empresa do Cliente Ltda."
              value={info.customerCompany}
              onChange={(e) => updateInfo({ customerCompany: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerAddress">Endereço</Label>
            <Input
              id="customerAddress"
              placeholder="Rua, Número, Bairro — Cidade/UF"
              value={info.customerAddress}
              onChange={(e) => updateInfo({ customerAddress: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quotation Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Detalhes da Cotação</CardTitle>
              <CardDescription>Referência, validade e observações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Referência / Assunto</Label>
              <Input
                id="reference"
                placeholder="Ex: Manutenção Elétrica — Galpão 3"
                value={info.reference}
                onChange={(e) => updateInfo({ reference: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createdAt">Data de Emissão</Label>
              <Input
                id="createdAt"
                type="date"
                value={info.createdAt}
                onChange={(e) => updateInfo({ createdAt: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validityDays">Validade da Proposta</Label>
              <Select
                value={String(info.validityDays)}
                onValueChange={(v) => updateInfo({ validityDays: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações Internas</Label>
            <Textarea
              id="notes"
              placeholder="Notas internas (não aparecerão no documento final)"
              rows={3}
              value={info.notes}
              onChange={(e) => updateInfo({ notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end pt-2 pb-8">
        <Button onClick={handleNext} size="lg" className="gap-2">
          Continuar para Itens
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
