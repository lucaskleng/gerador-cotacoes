/*
 * Step 1 — Criar Cotação
 * Design: Clean Commerce / Swiss Design
 * Form with customer identification, validity, reference
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
import { ArrowRight, User, Building2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Step1CreateQuotation() {
  const { info, updateInfo, setStep, markStepComplete } = useQuotationStore();

  const handleNext = () => {
    if (!info.customerName.trim()) {
      toast.error("Informe o nome do cliente para continuar.");
      return;
    }
    markStepComplete(1);
    setStep(2);
  };

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
              <CardDescription>Informações de identificação do cliente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="customerCNPJ">CNPJ / CPF</Label>
              <Input
                id="customerCNPJ"
                placeholder="00.000.000/0001-00"
                value={info.customerCNPJ}
                onChange={(e) => updateInfo({ customerCNPJ: e.target.value })}
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
              <CardDescription>Dados complementares da empresa</CardDescription>
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
