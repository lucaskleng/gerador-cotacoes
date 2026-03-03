/*
 * Templates Page — Manage proposal templates
 * Brand: Navy (#1A1A2E) + Coral (#FF4B4B)
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  FileText,
  Package,
  Wrench,
  Pencil,
  Trash2,
  Copy,
  LayoutTemplate,
  Loader2,
  LogIn,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029168631/DmKchUsoAAxHzwJg.png";

// ─── Default conditions & texts for new templates ──────────────────────────

const defaultConditionsProducts = {
  paymentTerms: "30 dias",
  deliveryTime: "15 dias úteis",
  freight: "CIF",
  freightValue: 0,
  warranty: "12 meses",
};

const defaultConditionsServices = {
  paymentTerms: "30/60 dias",
  deliveryTime: "A combinar",
  freight: "Não aplicável",
  freightValue: 0,
  warranty: "90 dias sobre o serviço",
};

const defaultTextsProducts = {
  headerText: "PROPOSTA COMERCIAL — PRODUTOS\nKL Engenharia Elétrica Ltda.",
  introNotes:
    'Prezado(a) ${customerName},\n\nConforme solicitação, apresentamos nossa proposta comercial referente ao fornecimento de materiais/equipamentos para o projeto "${reference}".',
  commercialNotes:
    "• Condição de Pagamento: ${paymentTerms}\n• Prazo de Entrega: ${deliveryTime}\n• Frete: ${freight}\n• Garantia: ${warranty}\n• Validade: ${validityDays} dias",
  technicalNotes:
    "Todos os equipamentos atendem às normas técnicas vigentes (ABNT, NR-10, NR-12) e possuem certificação de qualidade.",
  closingNotes:
    "Ficamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nEquipe Comercial\nKL Engenharia",
  footerText:
    "KL Engenharia Elétrica Ltda. | Tel: (61) 3000-0000 | contato@klengenharia.com.br",
};

const defaultTextsServices = {
  headerText: "PROPOSTA COMERCIAL — SERVIÇOS\nKL Engenharia Elétrica Ltda.",
  introNotes:
    'Prezado(a) ${customerName},\n\nConforme solicitação, apresentamos nossa proposta de prestação de serviços referente ao projeto "${reference}".',
  commercialNotes:
    "• Condição de Pagamento: ${paymentTerms}\n• Prazo de Execução: ${deliveryTime}\n• Deslocamento: ${freight}\n• Garantia do Serviço: ${warranty}\n• Validade: ${validityDays} dias",
  technicalNotes:
    "Todos os serviços serão executados por profissionais habilitados, em conformidade com as normas técnicas vigentes (ABNT, NR-10, NR-12, NR-35).",
  closingNotes:
    "Ficamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nEquipe Técnica\nKL Engenharia",
  footerText:
    "KL Engenharia Elétrica Ltda. | Tel: (61) 3000-0000 | contato@klengenharia.com.br",
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface TemplateFormData {
  name: string;
  description: string;
  quotationType: "products" | "services";
  validityDays: number;
  conditions: {
    paymentTerms: string;
    deliveryTime: string;
    freight: string;
    freightValue: number;
    warranty: string;
  };
  texts: {
    headerText: string;
    introNotes: string;
    commercialNotes: string;
    technicalNotes: string;
    closingNotes: string;
    footerText: string;
  };
  defaultItems: {
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
}

function getEmptyForm(type: "products" | "services" = "products"): TemplateFormData {
  return {
    name: "",
    description: "",
    quotationType: type,
    validityDays: 30,
    conditions: type === "services" ? { ...defaultConditionsServices } : { ...defaultConditionsProducts },
    texts: type === "services" ? { ...defaultTextsServices } : { ...defaultTextsProducts },
    defaultItems: [],
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Templates() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: templates, isLoading } = trpc.template.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      toast.success("Template criado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      toast.success("Template atualizado!");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      toast.success("Template excluído.");
    },
    onError: (err) => toast.error(err.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateFormData>(getEmptyForm());
  const [activeTab, setActiveTab] = useState<"info" | "conditions" | "texts" | "items">("info");

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setEditingId(null);
      setForm(getEmptyForm());
      setActiveTab("info");
    }
  }, [dialogOpen]);

  const handleCreate = () => {
    setEditingId(null);
    setForm(getEmptyForm());
    setDialogOpen(true);
  };

  const handleEdit = (template: NonNullable<typeof templates>[number]) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      description: template.description || "",
      quotationType: template.quotationType as "products" | "services",
      validityDays: template.validityDays,
      conditions: template.conditions as TemplateFormData["conditions"],
      texts: template.texts as TemplateFormData["texts"],
      defaultItems: (template.defaultItems as TemplateFormData["defaultItems"]) || [],
    });
    setDialogOpen(true);
  };

  const handleDuplicate = (template: NonNullable<typeof templates>[number]) => {
    setEditingId(null);
    setForm({
      name: `${template.name} (Cópia)`,
      description: template.description || "",
      quotationType: template.quotationType as "products" | "services",
      validityDays: template.validityDays,
      conditions: template.conditions as TemplateFormData["conditions"],
      texts: template.texts as TemplateFormData["texts"],
      defaultItems: (template.defaultItems as TemplateFormData["defaultItems"]) || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`Excluir o template "${name}"?`)) return;
    deleteMutation.mutate({ id });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do template.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: form.name,
        description: form.description,
        quotationType: form.quotationType,
        validityDays: form.validityDays,
        conditions: form.conditions,
        texts: form.texts,
        defaultItems: form.defaultItems.length > 0 ? form.defaultItems : undefined,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        description: form.description,
        quotationType: form.quotationType,
        validityDays: form.validityDays,
        conditions: form.conditions,
        texts: form.texts,
        defaultItems: form.defaultItems.length > 0 ? form.defaultItems : undefined,
      });
    }
  };

  const handleTypeChange = (type: "products" | "services") => {
    setForm((prev) => ({
      ...prev,
      quotationType: type,
      conditions: type === "services" ? { ...defaultConditionsServices } : { ...defaultConditionsProducts },
      texts: type === "services" ? { ...defaultTextsServices } : { ...defaultTextsProducts },
    }));
  };

  const addDefaultItem = () => {
    setForm((prev) => ({
      ...prev,
      defaultItems: [
        ...prev.defaultItems,
        { description: "", unit: form.quotationType === "services" ? "sv" : "un", quantity: 1, unitPrice: 0, discount: 0 },
      ],
    }));
  };

  const updateDefaultItem = (index: number, updates: Partial<TemplateFormData["defaultItems"][number]>) => {
    setForm((prev) => ({
      ...prev,
      defaultItems: prev.defaultItems.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    }));
  };

  const removeDefaultItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      defaultItems: prev.defaultItems.filter((_, i) => i !== index),
    }));
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <LayoutTemplate className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Faça login para gerenciar seus templates.</p>
        <Button asChild>
          <a href={getLoginUrl()}>
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </a>
        </Button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mr-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground">
                Templates de Proposta
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Modelos reutilizáveis para cotações
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Novo Template
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !templates || templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LayoutTemplate className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Nenhum template criado</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Crie templates com textos, condições e itens pré-definidos para agilizar a criação de novas cotações.
            </p>
            <Button onClick={handleCreate} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Criar Primeiro Template
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {template.quotationType === "services" ? (
                            <Wrench className="w-4 h-4 text-primary" />
                          ) : (
                            <Package className="w-4 h-4 text-primary" />
                          )}
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            template.quotationType === "services"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {template.quotationType === "services" ? "Serviços" : "Produtos"}
                        </span>
                      </div>
                      {template.description && (
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground space-y-1 mb-4">
                        <p>Validade: {template.validityDays} dias</p>
                        <p>
                          Pagamento:{" "}
                          {(template.conditions as TemplateFormData["conditions"])?.paymentTerms || "—"}
                        </p>
                        {(template.defaultItems as TemplateFormData["defaultItems"])?.length ? (
                          <p>
                            {(template.defaultItems as TemplateFormData["defaultItems"]).length} item(ns) pré-definido(s)
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs gap-1"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => handleDuplicate(template)}
                          title="Duplicar"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id, template.name)}
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ─── Template Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize as informações do template de proposta."
                : "Crie um modelo reutilizável com textos e condições pré-definidas."}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border pb-0 mb-4">
            {(
              [
                { key: "info", label: "Informações" },
                { key: "conditions", label: "Condições" },
                { key: "texts", label: "Textos" },
                { key: "items", label: "Itens Padrão" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Template *</Label>
                <Input
                  placeholder="Ex: Proposta Padrão Industrial"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Breve descrição do uso deste template..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Proposta</Label>
                  <Select
                    value={form.quotationType}
                    onValueChange={(v) => handleTypeChange(v as "products" | "services")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">
                        <span className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5" />
                          Produtos
                        </span>
                      </SelectItem>
                      <SelectItem value="services">
                        <span className="flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5" />
                          Serviços
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Validade (dias)</Label>
                  <Input
                    type="number"
                    value={form.validityDays}
                    onChange={(e) => setForm((p) => ({ ...p, validityDays: Number(e.target.value) || 30 }))}
                    min={1}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Conditions */}
          {activeTab === "conditions" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Condição de Pagamento</Label>
                <Input
                  value={form.conditions.paymentTerms}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      conditions: { ...p.conditions, paymentTerms: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {form.quotationType === "services" ? "Prazo de Execução" : "Prazo de Entrega"}
                </Label>
                <Input
                  value={form.conditions.deliveryTime}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      conditions: { ...p.conditions, deliveryTime: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{form.quotationType === "services" ? "Deslocamento" : "Frete"}</Label>
                  <Input
                    value={form.conditions.freight}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        conditions: { ...p.conditions, freight: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Garantia</Label>
                  <Input
                    value={form.conditions.warranty}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        conditions: { ...p.conditions, warranty: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Texts */}
          {activeTab === "texts" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Use variáveis como <code className="bg-muted px-1 rounded">${"${customerName}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">${"${reference}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">${"${paymentTerms}"}</code> nos textos.
              </p>
              {(
                [
                  { key: "headerText", label: "Cabeçalho" },
                  { key: "introNotes", label: "Introdução" },
                  { key: "commercialNotes", label: "Notas Comerciais" },
                  { key: "technicalNotes", label: "Notas Técnicas" },
                  { key: "closingNotes", label: "Encerramento" },
                  { key: "footerText", label: "Rodapé" },
                ] as const
              ).map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Textarea
                    value={form.texts[field.key]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        texts: { ...p.texts, [field.key]: e.target.value },
                      }))
                    }
                    rows={3}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tab: Default Items */}
          {activeTab === "items" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Adicione itens que serão pré-preenchidos ao usar este template. Opcional.
              </p>
              {form.defaultItems.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => removeDefaultItem(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Descrição do item"
                        value={item.description}
                        onChange={(e) => updateDefaultItem(index, { description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px]">Unidade</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateDefaultItem(index, { unit: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Qtd</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateDefaultItem(index, { quantity: Number(e.target.value) || 1 })
                          }
                          min={1}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Preço Unit.</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateDefaultItem(index, { unitPrice: Number(e.target.value) || 0 })
                          }
                          min={0}
                          step={0.01}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Desc. %</Label>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            updateDefaultItem(index, { discount: Number(e.target.value) || 0 })
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addDefaultItem} className="w-full gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Adicionar Item Padrão
              </Button>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="gap-1.5"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {editingId ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
