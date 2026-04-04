/**
 * Technical Proposal Generator Page
 * Allows user to input panels/items and generate a professional Word document.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Upload,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  FileSpreadsheet,
  Package,
  Settings2,
  BookOpen,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PanelItem {
  pos: number;
  description: string;
  qty: number;
  code?: string;
  observation?: string;
}

interface Panel {
  id: string;
  name: string;
  items: PanelItem[];
  isExpanded: boolean;
}

interface ProposalInfo {
  proposalNumber: string;
  proposalDate: string;
  validityDays: number;
  revision: string;
  customerName: string;
  customerCNPJ: string;
  customerContact: string;
  customerAddress: string;
  projectName: string;
  projectAddress: string;
  signatoryName: string;
  signatoryRole: string;
}

interface ProposalTexts {
  introText: string;
  presentationText: string;
  normsText: string;
  technicalComments: string;
  supplyLimits: string;
  environmentConditions: string;
  referenceDocuments: string;
  documentation: string;
  fieldServices: string;
  factoryInspection: string;
  pricesText: string;
  deliveryText: string;
  warrantyText: string;
  effectiveText: string;
}

// ─── Default texts ──────────────────────────────────────────────────────────

const DEFAULT_NORMS = `ABNT NBR IEC 61439-1 - Conjuntos de manobra e controle de baixa tensão - Parte 1: Regras gerais
ABNT NBR IEC 61439-3 - Conjuntos de manobra e controle de baixa tensão - Parte 3: Quadros de distribuição
ABNT NBR IEC 60947-2 - Dispositivos de manobra e comando de baixa tensão - Parte 2: Disjuntores
ABNT NBR IEC 62208 - Invólucros vazios para conjuntos de manobra e controle de baixa tensão
ABNT NBR IEC 60898-1 - Disjuntores para proteção de sobrecorrentes para instalações domésticas
ABNT NBR 5410 - Instalações elétricas de baixa tensão
ABNT NBR 5419 - Proteção contra descargas atmosféricas
NR-10 - Segurança em Instalações e Serviços em Eletricidade`;

const DEFAULT_SUPPLY_LIMITS = `Incluso no fornecimento:
- Fabricação, montagem e testes em fábrica dos painéis elétricos
- Documentação técnica (diagramas unifilares, trifilares e de interligação)
- Certificados de ensaio de tipo e rotina conforme NBR IEC 61439

Não incluso no fornecimento:
- Transporte e frete até o local da obra
- Instalação e montagem em campo
- Cabos de interligação entre painéis
- Obras civis e infraestrutura elétrica`;

const DEFAULT_WARRANTY = `A KL Engenharia Elétrica garante os equipamentos fornecidos pelo prazo de 12 (doze) meses, contados a partir da data de entrega, contra defeitos de fabricação e materiais empregados.

A garantia não cobre:
- Danos causados por mau uso, negligência ou instalação inadequada
- Desgaste natural dos componentes
- Modificações realizadas sem autorização prévia da KL Engenharia
- Danos causados por eventos de força maior (raios, enchentes, etc.)`;

// ─── Helper ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TechnicalProposal() {
  const { user, loading, isAuthenticated } = useAuth();

  // Proposal info
  const [info, setInfo] = useState<ProposalInfo>({
    proposalNumber: "",
    proposalDate: new Date().toLocaleDateString("pt-BR"),
    validityDays: 30,
    revision: "00",
    customerName: "",
    customerCNPJ: "",
    customerContact: "",
    customerAddress: "",
    projectName: "",
    projectAddress: "",
    signatoryName: "Lucas Lessa",
    signatoryRole: "Diretor Executivo",
  });

  // Texts
  const [texts, setTexts] = useState<ProposalTexts>({
    introText:
      "Apresentamos a seguir nossa proposta técnica para fornecimento de painéis elétricos conforme especificações do projeto.",
    presentationText: "",
    normsText: DEFAULT_NORMS,
    technicalComments: "",
    supplyLimits: DEFAULT_SUPPLY_LIMITS,
    environmentConditions:
      "Temperatura ambiente: 0°C a 40°C\nUmidade relativa: até 50% a 40°C\nAltitude: até 2000m\nGrau de poluição: 3",
    referenceDocuments: "",
    documentation:
      "Serão fornecidos os seguintes documentos:\n- Diagrama unifilar\n- Diagrama trifilar\n- Diagrama de interligação\n- Lista de materiais\n- Memorial descritivo\n- Certificados de ensaio",
    fieldServices: "Não incluso nesta proposta. Sob consulta.",
    factoryInspection:
      "Os equipamentos poderão ser inspecionados em fábrica mediante agendamento prévio de 5 dias úteis.",
    pricesText: "Conforme proposta comercial em separado.",
    deliveryText:
      "O prazo de entrega será de 45 a 60 dias úteis após confirmação do pedido e aprovação dos desenhos.",
    warrantyText: DEFAULT_WARRANTY,
    effectiveText:
      "Esta proposta entra em vigor na data de sua emissão e tem validade conforme indicado na capa.",
  });

  // Panels
  const [panels, setPanels] = useState<Panel[]>([]);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // ─── Panel Management ─────────────────────────────────────────────

  const addPanel = useCallback(() => {
    setPanels((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        items: [{ pos: 1, description: "", qty: 1 }],
        isExpanded: true,
      },
    ]);
  }, []);

  const removePanel = useCallback((panelId: string) => {
    setPanels((prev) => prev.filter((p) => p.id !== panelId));
  }, []);

  const duplicatePanel = useCallback((panelId: string) => {
    setPanels((prev) => {
      const panel = prev.find((p) => p.id === panelId);
      if (!panel) return prev;
      const newPanel: Panel = {
        ...panel,
        id: generateId(),
        name: `${panel.name} (cópia)`,
        items: panel.items.map((item) => ({ ...item })),
        isExpanded: true,
      };
      const idx = prev.findIndex((p) => p.id === panelId);
      const result = [...prev];
      result.splice(idx + 1, 0, newPanel);
      return result;
    });
  }, []);

  const updatePanelName = useCallback((panelId: string, name: string) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, name } : p))
    );
  }, []);

  const togglePanel = useCallback((panelId: string) => {
    setPanels((prev) =>
      prev.map((p) =>
        p.id === panelId ? { ...p, isExpanded: !p.isExpanded } : p
      )
    );
  }, []);

  // ─── Item Management ──────────────────────────────────────────────

  const addItem = useCallback((panelId: string) => {
    setPanels((prev) =>
      prev.map((p) => {
        if (p.id !== panelId) return p;
        const nextPos = p.items.length > 0 ? Math.max(...p.items.map((i) => i.pos)) + 1 : 1;
        return {
          ...p,
          items: [...p.items, { pos: nextPos, description: "", qty: 1 }],
        };
      })
    );
  }, []);

  const removeItem = useCallback((panelId: string, itemIdx: number) => {
    setPanels((prev) =>
      prev.map((p) => {
        if (p.id !== panelId) return p;
        const items = p.items.filter((_, i) => i !== itemIdx).map((item, i) => ({
          ...item,
          pos: i + 1,
        }));
        return { ...p, items };
      })
    );
  }, []);

  const updateItem = useCallback(
    (panelId: string, itemIdx: number, field: keyof PanelItem, value: string | number) => {
      setPanels((prev) =>
        prev.map((p) => {
          if (p.id !== panelId) return p;
          const items = [...p.items];
          items[itemIdx] = { ...items[itemIdx], [field]: value };
          return { ...p, items };
        })
      );
    },
    []
  );

  // ─── Excel Import ─────────────────────────────────────────────────

  const handleExcelImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch("/api/technical-proposal/import-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ base64, filename: file.name }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Falha ao importar");
        }

        const data = await response.json();

        if (data.panels && data.panels.length > 0) {
          const importedPanels: Panel[] = data.panels.map((p: any) => ({
            id: generateId(),
            name: p.name,
            items: p.items,
            isExpanded: false,
          }));

          setPanels((prev) => [...prev, ...importedPanels]);
          toast.success(
            `Importados ${data.totalPanels} painéis com ${data.totalItems} itens da planilha "${data.sheetName}"`
          );
        } else {
          toast.warning("Nenhum painel encontrado na planilha. Verifique o formato.");
        }

        setShowImportDialog(false);
      } catch (error: any) {
        toast.error(`Erro ao importar: ${error.message}`);
      } finally {
        setIsImporting(false);
        // Reset input
        e.target.value = "";
      }
    },
    []
  );

  // ─── Generate Word ────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!info.proposalNumber.trim()) {
      toast.error("Preencha o número da proposta");
      return;
    }
    if (!info.customerName.trim()) {
      toast.error("Preencha o nome do cliente");
      return;
    }
    if (!info.projectName.trim()) {
      toast.error("Preencha o nome do empreendimento");
      return;
    }
    if (panels.length === 0) {
      toast.error("Adicione pelo menos um painel com itens");
      return;
    }

    // Validate panels have names and items
    for (const panel of panels) {
      if (!panel.name.trim()) {
        toast.error("Todos os painéis precisam ter um nome");
        return;
      }
      if (panel.items.length === 0 || panel.items.every((i) => !i.description.trim())) {
        toast.error(`O painel "${panel.name}" não possui itens válidos`);
        return;
      }
    }

    setIsGenerating(true);
    try {
      const payload = {
        ...info,
        ...texts,
        panels: panels.map((p) => ({
          name: p.name,
          items: p.items
            .filter((i) => i.description.trim())
            .map((i) => ({
              pos: i.pos,
              description: i.description,
              qty: i.qty,
              code: i.code || undefined,
              observation: i.observation || undefined,
            })),
        })),
      };

      const response = await fetch("/api/technical-proposal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Falha ao gerar proposta");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposta_Tecnica_${info.proposalNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Proposta técnica gerada com sucesso!");
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [info, texts, panels]);

  // ─── Stats ────────────────────────────────────────────────────────

  const totalPanels = panels.length;
  const totalItems = panels.reduce((sum, p) => sum + p.items.filter((i) => i.description.trim()).length, 0);

  // ─── Auth guard ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold leading-tight">Proposta Técnica</h1>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Gerador de Documento Word
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-muted-foreground hidden sm:block">
              <span className="font-medium text-foreground">{totalPanels}</span> painéis ·{" "}
              <span className="font-medium text-foreground">{totalItems}</span> itens
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGenerating ? "Gerando..." : "Gerar Word"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Info Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Informações da Proposta
            </CardTitle>
            <CardDescription>Dados gerais, cliente e empreendimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nº da Proposta *</Label>
                <Input
                  placeholder="KL-036/2026"
                  value={info.proposalNumber}
                  onChange={(e) => setInfo({ ...info, proposalNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Input
                  placeholder="04/04/2026"
                  value={info.proposalDate}
                  onChange={(e) => setInfo({ ...info, proposalDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Validade (dias)</Label>
                <Input
                  type="number"
                  value={info.validityDays}
                  onChange={(e) => setInfo({ ...info, validityDays: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Revisão</Label>
                <Input
                  placeholder="00"
                  value={info.revision}
                  onChange={(e) => setInfo({ ...info, revision: e.target.value })}
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Destinatário</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Razão Social *</Label>
                    <Input
                      placeholder="Nome do cliente"
                      value={info.customerName}
                      onChange={(e) => setInfo({ ...info, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CNPJ</Label>
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={info.customerCNPJ}
                      onChange={(e) => setInfo({ ...info, customerCNPJ: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">A/C (Contato)</Label>
                    <Input
                      placeholder="Eng. Nome"
                      value={info.customerContact}
                      onChange={(e) => setInfo({ ...info, customerContact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Endereço</Label>
                    <Input
                      placeholder="Endereço do cliente"
                      value={info.customerAddress}
                      onChange={(e) => setInfo({ ...info, customerAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Dados da Obra</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Empreendimento *</Label>
                    <Input
                      placeholder="Nome do empreendimento"
                      value={info.projectName}
                      onChange={(e) => setInfo({ ...info, projectName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Local da Obra</Label>
                    <Input
                      placeholder="Endereço da obra"
                      value={info.projectAddress}
                      onChange={(e) => setInfo({ ...info, projectAddress: e.target.value })}
                    />
                  </div>
                </div>

                <Separator className="my-2" />

                <h3 className="text-sm font-medium text-muted-foreground">Assinatura</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={info.signatoryName}
                      onChange={(e) => setInfo({ ...info, signatoryName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cargo</Label>
                    <Input
                      value={info.signatoryRole}
                      onChange={(e) => setInfo({ ...info, signatoryRole: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panels Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Painéis e Lista de Materiais
                </CardTitle>
                <CardDescription>
                  Adicione painéis manualmente ou importe de uma planilha Excel
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" />
                      Importar Excel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Importar Lista de Materiais</DialogTitle>
                      <DialogDescription>
                        Selecione um arquivo Excel (.xlsx) com a lista de materiais organizada por
                        painéis. O sistema detectará automaticamente os painéis e itens.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">
                          Arraste o arquivo ou clique para selecionar
                        </p>
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={handleExcelImport}
                            disabled={isImporting}
                          />
                          <Button variant="outline" size="sm" disabled={isImporting} asChild>
                            <span>
                              {isImporting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Importando...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Selecionar Arquivo
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Formato esperado: nome do painel em uma linha, seguido dos itens com
                        descrição e quantidade. Aceita formatos variados.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button size="sm" onClick={addPanel} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Novo Painel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {panels.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Nenhum painel adicionado
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Adicione painéis manualmente ou importe de uma planilha Excel
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Importar Excel
                  </Button>
                  <Button size="sm" onClick={addPanel}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Novo Painel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {panels.map((panel, panelIdx) => (
                  <div
                    key={panel.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* Panel Header */}
                    <div className="bg-muted/30 px-4 py-2.5 flex items-center gap-3">
                      <button
                        onClick={() => togglePanel(panel.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {panel.isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-xs font-mono text-muted-foreground w-6">
                        {panelIdx + 1}.
                      </span>
                      <Input
                        placeholder="Nome do painel (ex: QGBT-01)"
                        value={panel.name}
                        onChange={(e) => updatePanelName(panel.id, e.target.value)}
                        className="h-8 text-sm font-medium flex-1"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {panel.items.filter((i) => i.description.trim()).length} itens
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicatePanel(panel.id)}
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title="Duplicar painel"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePanel(panel.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Remover painel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Panel Items */}
                    {panel.isExpanded && (
                      <div className="p-4">
                        {/* Column headers */}
                        <div className="grid grid-cols-[50px_1fr_80px_180px_180px_36px] gap-2 mb-2 px-1">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Item
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Descrição
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Qtd
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Código
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Observação
                          </span>
                          <span></span>
                        </div>

                        {panel.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="grid grid-cols-[50px_1fr_80px_180px_180px_36px] gap-2 mb-1.5"
                          >
                            <Input
                              value={item.pos}
                              onChange={(e) =>
                                updateItem(panel.id, itemIdx, "pos", Number(e.target.value))
                              }
                              className="h-8 text-xs text-center"
                              type="number"
                            />
                            <Input
                              placeholder="Descrição do item"
                              value={item.description}
                              onChange={(e) =>
                                updateItem(panel.id, itemIdx, "description", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                            <Input
                              value={item.qty}
                              onChange={(e) =>
                                updateItem(panel.id, itemIdx, "qty", Number(e.target.value))
                              }
                              className="h-8 text-xs text-center"
                              type="number"
                            />
                            <Input
                              placeholder="Código"
                              value={item.code || ""}
                              onChange={(e) =>
                                updateItem(panel.id, itemIdx, "code", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                            <Input
                              placeholder="Obs."
                              value={item.observation || ""}
                              onChange={(e) =>
                                updateItem(panel.id, itemIdx, "observation", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(panel.id, itemIdx)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addItem(panel.id)}
                          className="mt-2 text-xs text-muted-foreground gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar item
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Texts Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Seções Textuais
            </CardTitle>
            <CardDescription>
              Textos padrão para cada seção da proposta. Edite conforme necessário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["intro"]} className="w-full">
              <AccordionItem value="intro">
                <AccordionTrigger className="text-sm">Carta de Apresentação</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={4}
                    value={texts.introText}
                    onChange={(e) => setTexts({ ...texts, introText: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="norms">
                <AccordionTrigger className="text-sm">1. Normas Aplicáveis</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={8}
                    value={texts.normsText}
                    onChange={(e) => setTexts({ ...texts, normsText: e.target.value })}
                    className="text-sm font-mono"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="comments">
                <AccordionTrigger className="text-sm">2.1 Comentários Técnicos</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={4}
                    value={texts.technicalComments}
                    onChange={(e) => setTexts({ ...texts, technicalComments: e.target.value })}
                    className="text-sm"
                    placeholder="Comentários sobre o sistema, tecnologia utilizada, etc."
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="supply">
                <AccordionTrigger className="text-sm">2.2 Limites de Fornecimento</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={8}
                    value={texts.supplyLimits}
                    onChange={(e) => setTexts({ ...texts, supplyLimits: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="environment">
                <AccordionTrigger className="text-sm">2.3 Condições Ambientais</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={4}
                    value={texts.environmentConditions}
                    onChange={(e) => setTexts({ ...texts, environmentConditions: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="refdocs">
                <AccordionTrigger className="text-sm">2.4 Documentos de Referência</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={4}
                    value={texts.referenceDocuments}
                    onChange={(e) => setTexts({ ...texts, referenceDocuments: e.target.value })}
                    className="text-sm"
                    placeholder="Projetos elétricos, memoriais descritivos, etc."
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="docs">
                <AccordionTrigger className="text-sm">2.5 Documentação</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={6}
                    value={texts.documentation}
                    onChange={(e) => setTexts({ ...texts, documentation: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="field">
                <AccordionTrigger className="text-sm">3. Serviços de Campo</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={3}
                    value={texts.fieldServices}
                    onChange={(e) => setTexts({ ...texts, fieldServices: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="inspection">
                <AccordionTrigger className="text-sm">
                  4. Inspeção em Fábrica
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={3}
                    value={texts.factoryInspection}
                    onChange={(e) => setTexts({ ...texts, factoryInspection: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prices">
                <AccordionTrigger className="text-sm">5. Preços</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={3}
                    value={texts.pricesText}
                    onChange={(e) => setTexts({ ...texts, pricesText: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delivery">
                <AccordionTrigger className="text-sm">6. Prazo de Entrega</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={3}
                    value={texts.deliveryText}
                    onChange={(e) => setTexts({ ...texts, deliveryText: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="warranty">
                <AccordionTrigger className="text-sm">7. Garantia</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={8}
                    value={texts.warrantyText}
                    onChange={(e) => setTexts({ ...texts, warrantyText: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="effective">
                <AccordionTrigger className="text-sm">8. Entrada em Vigor</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={3}
                    value={texts.effectiveText}
                    onChange={(e) => setTexts({ ...texts, effectiveText: e.target.value })}
                    className="text-sm"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Generate Button (bottom) */}
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalPanels}</span> painéis ·{" "}
            <span className="font-medium text-foreground">{totalItems}</span> itens
          </div>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isGenerating ? "Gerando Proposta..." : "Gerar Proposta Técnica (.docx)"}
          </Button>
        </div>
      </main>
    </div>
  );
}
