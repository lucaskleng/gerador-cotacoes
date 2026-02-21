/**
 * Settings Page — Design & Branding Configuration
 * Three tabs: Company Identity, Platform Theme, Proposal Design
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import ColorPicker from "@/components/settings/ColorPicker";
import ProposalMiniPreview from "@/components/settings/ProposalMiniPreview";
import {
  ArrowLeft,
  Building2,
  Palette,
  FileText,
  Save,
  Upload,
  Loader2,
  LogIn,
  RotateCcw,
  ImageIcon,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import type {
  CompanyBranding,
  PlatformTheme,
  ProposalDesign,
  DesignSettingsData,
} from "../../../shared/designDefaults";
import {
  DEFAULT_COMPANY,
  DEFAULT_PLATFORM_THEME,
  DEFAULT_PROPOSAL_DESIGN,
  FONT_OPTIONS,
  MONO_FONT_OPTIONS,
  COLOR_PRESETS,
} from "../../../shared/designDefaults";

export default function Settings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { settings, isLoading, save, isSaving, uploadLogo, isUploadingLogo } = useDesignSettings();

  // Local state for editing
  const [company, setCompany] = useState<CompanyBranding>(DEFAULT_COMPANY);
  const [platformTheme, setPlatformTheme] = useState<PlatformTheme>(DEFAULT_PLATFORM_THEME);
  const [proposalDesign, setProposalDesign] = useState<ProposalDesign>(DEFAULT_PROPOSAL_DESIGN);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync from server
  useEffect(() => {
    if (settings) {
      setCompany(settings.company);
      setPlatformTheme(settings.platformTheme);
      setProposalDesign(settings.proposalDesign);
    }
  }, [settings]);

  // Track changes
  const markChanged = useCallback(() => setHasChanges(true), []);

  const updateCompany = useCallback(
    (field: keyof CompanyBranding, value: string) => {
      setCompany((prev) => ({ ...prev, [field]: value }));
      markChanged();
    },
    [markChanged]
  );

  const updatePlatformTheme = useCallback(
    (field: keyof PlatformTheme, value: string) => {
      setPlatformTheme((prev) => ({ ...prev, [field]: value }));
      markChanged();
    },
    [markChanged]
  );

  const updateProposalDesign = useCallback(
    (field: keyof ProposalDesign, value: string | boolean) => {
      setProposalDesign((prev) => ({ ...prev, [field]: value }));
      markChanged();
    },
    [markChanged]
  );

  // Handle logo upload
  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas.");
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const result = await uploadLogo({ base64, mimeType: file.type });
          updateCompany("logoUrl", result.url);
          toast.success("Logo enviado com sucesso!");
        };
        reader.readAsDataURL(file);
      } catch {
        toast.error("Erro ao enviar logo. Tente novamente.");
      }
    },
    [uploadLogo, updateCompany]
  );

  // Save all settings
  const handleSave = useCallback(async () => {
    try {
      await save({ company, platformTheme, proposalDesign });
      setHasChanges(false);
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    }
  }, [save, company, platformTheme, proposalDesign]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    if (!window.confirm("Deseja restaurar todas as configurações para os valores padrão?")) return;
    setCompany(DEFAULT_COMPANY);
    setPlatformTheme(DEFAULT_PLATFORM_THEME);
    setProposalDesign(DEFAULT_PROPOSAL_DESIGN);
    setHasChanges(true);
    toast.info("Configurações restauradas para o padrão.");
  }, []);

  // Apply preset
  const applyPreset = useCallback(
    (preset: (typeof COLOR_PRESETS)[number]) => {
      setPlatformTheme((prev) => ({
        ...prev,
        primaryColor: preset.primary,
      }));
      setProposalDesign((prev) => ({
        ...prev,
        headerBgColor: preset.headerBg,
        accentColor: preset.accent,
        tableHeaderBgColor: preset.accent,
      }));
      setHasChanges(true);
      toast.info(`Preset "${preset.name}" aplicado.`);
    },
    []
  );

  // Auth gate
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Faça login para acessar as configurações.</p>
        <Button asChild>
          <a href={getLoginUrl()}>
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h1 className="text-sm font-semibold">Configurações de Design</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrão
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="gap-1.5 text-xs"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="company" className="gap-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="platform" className="gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5" />
              Plataforma
            </TabsTrigger>
            <TabsTrigger value="proposal" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
              Proposta
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab 1: Company Identity ────────────────────────────────── */}
          <TabsContent value="company" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Logo da Empresa
                  </CardTitle>
                  <CardDescription>
                    Envie o logotipo que aparecerá no cabeçalho das propostas. Recomendado: PNG ou SVG com fundo transparente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30"
                    >
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                          <p className="text-[10px] text-muted-foreground mt-1">Sem logo</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors">
                          {isUploadingLogo ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          Enviar Logo
                        </div>
                      </label>
                      {company.logoUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCompany("logoUrl", "")}
                          className="text-xs text-destructive"
                        >
                          Remover
                        </Button>
                      )}
                      <p className="text-[11px] text-muted-foreground">Máx. 2MB — PNG, JPG ou SVG</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Dados da Empresa
                  </CardTitle>
                  <CardDescription>
                    Informações que aparecerão no cabeçalho e rodapé das propostas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Nome da Empresa</Label>
                      <Input
                        value={company.companyName}
                        onChange={(e) => updateCompany("companyName", e.target.value)}
                        placeholder="Ex: KL Engenharia Elétrica"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Subtítulo / Slogan</Label>
                      <Input
                        value={company.companySubtitle}
                        onChange={(e) => updateCompany("companySubtitle", e.target.value)}
                        placeholder="Ex: Soluções em Engenharia Elétrica"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CNPJ</Label>
                      <Input
                        value={company.cnpj}
                        onChange={(e) => updateCompany("cnpj", e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Telefone</Label>
                      <Input
                        value={company.phone}
                        onChange={(e) => updateCompany("phone", e.target.value)}
                        placeholder="(00) 0000-0000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">E-mail</Label>
                      <Input
                        value={company.email}
                        onChange={(e) => updateCompany("email", e.target.value)}
                        placeholder="contato@empresa.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Website</Label>
                      <Input
                        value={company.website}
                        onChange={(e) => updateCompany("website", e.target.value)}
                        placeholder="www.empresa.com.br"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Endereço</Label>
                      <Input
                        value={company.address}
                        onChange={(e) => updateCompany("address", e.target.value)}
                        placeholder="Rua Exemplo, 123 - Cidade/UF"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Tab 2: Platform Theme ──────────────────────────────────── */}
          <TabsContent value="platform" className="space-y-6">
            {/* Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Temas Pré-definidos</CardTitle>
                <CardDescription>
                  Selecione um tema rápido para aplicar cores à plataforma e à proposta simultaneamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex gap-0.5 shrink-0">
                        <div className="w-4 h-8 rounded-l-md" style={{ backgroundColor: preset.primary }} />
                        <div className="w-4 h-8" style={{ backgroundColor: preset.accent }} />
                        <div className="w-4 h-8 rounded-r-md" style={{ backgroundColor: preset.headerBg }} />
                      </div>
                      <span className="text-[11px] font-medium leading-tight">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Cores da Plataforma
                </CardTitle>
                <CardDescription>
                  Personalize as cores da interface do aplicativo. As alterações serão aplicadas após salvar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorPicker
                    label="Cor Primária"
                    value={platformTheme.primaryColor}
                    onChange={(v) => updatePlatformTheme("primaryColor", v)}
                    description="Botões, links e acentos"
                  />
                  <ColorPicker
                    label="Texto na Primária"
                    value={platformTheme.primaryForeground}
                    onChange={(v) => updatePlatformTheme("primaryForeground", v)}
                    description="Texto sobre a cor primária"
                  />
                  <ColorPicker
                    label="Fundo da Página"
                    value={platformTheme.backgroundColor}
                    onChange={(v) => updatePlatformTheme("backgroundColor", v)}
                    description="Background geral"
                  />
                  <ColorPicker
                    label="Fundo dos Cards"
                    value={platformTheme.cardColor}
                    onChange={(v) => updatePlatformTheme("cardColor", v)}
                    description="Cards e superfícies"
                  />
                  <ColorPicker
                    label="Texto Principal"
                    value={platformTheme.foregroundColor}
                    onChange={(v) => updatePlatformTheme("foregroundColor", v)}
                    description="Texto e títulos"
                  />
                  <ColorPicker
                    label="Texto Secundário"
                    value={platformTheme.mutedColor}
                    onChange={(v) => updatePlatformTheme("mutedColor", v)}
                    description="Descrições e labels"
                  />
                  <ColorPicker
                    label="Bordas"
                    value={platformTheme.borderColor}
                    onChange={(v) => updatePlatformTheme("borderColor", v)}
                    description="Linhas e separadores"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platform Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg p-4 space-y-3 border"
                  style={{
                    backgroundColor: platformTheme.backgroundColor,
                    borderColor: platformTheme.borderColor,
                  }}
                >
                  {/* Mini header */}
                  <div
                    className="rounded-md px-3 py-2 flex items-center justify-between"
                    style={{
                      backgroundColor: platformTheme.cardColor,
                      borderBottom: `1px solid ${platformTheme.borderColor}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: platformTheme.primaryColor }}
                      >
                        <FileText className="w-3 h-3" style={{ color: platformTheme.primaryForeground }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: platformTheme.foregroundColor }}>
                        Quotation Generator
                      </span>
                    </div>
                    <div
                      className="px-2 py-1 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: platformTheme.primaryColor,
                        color: platformTheme.primaryForeground,
                      }}
                    >
                      Botão
                    </div>
                  </div>
                  {/* Mini card */}
                  <div
                    className="rounded-md p-3 space-y-1.5"
                    style={{
                      backgroundColor: platformTheme.cardColor,
                      border: `1px solid ${platformTheme.borderColor}`,
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: platformTheme.foregroundColor }}>
                      Exemplo de Card
                    </p>
                    <p className="text-[11px]" style={{ color: platformTheme.mutedColor }}>
                      Este é um preview de como a plataforma ficará com as cores selecionadas.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <div
                        className="px-2 py-0.5 rounded text-[10px]"
                        style={{
                          backgroundColor: platformTheme.primaryColor,
                          color: platformTheme.primaryForeground,
                        }}
                      >
                        Primário
                      </div>
                      <div
                        className="px-2 py-0.5 rounded text-[10px]"
                        style={{
                          border: `1px solid ${platformTheme.borderColor}`,
                          color: platformTheme.foregroundColor,
                        }}
                      >
                        Secundário
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab 3: Proposal Design ─────────────────────────────────── */}
          <TabsContent value="proposal" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left: Settings */}
              <div className="xl:col-span-2 space-y-6">
                {/* Header & Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cores do Documento</CardTitle>
                    <CardDescription>
                      Defina as cores do cabeçalho, corpo e tabelas da proposta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <ColorPicker
                        label="Fundo do Cabeçalho"
                        value={proposalDesign.headerBgColor}
                        onChange={(v) => updateProposalDesign("headerBgColor", v)}
                      />
                      <ColorPicker
                        label="Texto do Cabeçalho"
                        value={proposalDesign.headerTextColor}
                        onChange={(v) => updateProposalDesign("headerTextColor", v)}
                      />
                      <ColorPicker
                        label="Cor de Acento"
                        value={proposalDesign.accentColor}
                        onChange={(v) => updateProposalDesign("accentColor", v)}
                        description="Títulos, linhas decorativas"
                      />
                      <ColorPicker
                        label="Fundo do Corpo"
                        value={proposalDesign.bodyBgColor}
                        onChange={(v) => updateProposalDesign("bodyBgColor", v)}
                      />
                      <ColorPicker
                        label="Texto do Corpo"
                        value={proposalDesign.bodyTextColor}
                        onChange={(v) => updateProposalDesign("bodyTextColor", v)}
                      />
                      <ColorPicker
                        label="Linhas Zebradas"
                        value={proposalDesign.tableStripedBg}
                        onChange={(v) => updateProposalDesign("tableStripedBg", v)}
                        description="Fundo alternado nas linhas"
                      />
                    </div>
                    <Separator className="my-4" />
                    <p className="text-xs font-medium mb-3">Tabela de Itens</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <ColorPicker
                        label="Borda da Tabela"
                        value={proposalDesign.tableBorderColor}
                        onChange={(v) => updateProposalDesign("tableBorderColor", v)}
                      />
                      <ColorPicker
                        label="Fundo Cabeçalho"
                        value={proposalDesign.tableHeaderBgColor}
                        onChange={(v) => updateProposalDesign("tableHeaderBgColor", v)}
                      />
                      <ColorPicker
                        label="Texto Cabeçalho"
                        value={proposalDesign.tableHeaderTextColor}
                        onChange={(v) => updateProposalDesign("tableHeaderTextColor", v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Typography */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tipografia</CardTitle>
                    <CardDescription>
                      Escolha as fontes e o tamanho base do texto na proposta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Fonte dos Títulos</Label>
                        <Select
                          value={proposalDesign.titleFont}
                          onValueChange={(v) => updateProposalDesign("titleFont", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                <span style={{ fontFamily: f.value }}>{f.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Fonte do Corpo</Label>
                        <Select
                          value={proposalDesign.bodyFont}
                          onValueChange={(v) => updateProposalDesign("bodyFont", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                <span style={{ fontFamily: f.value }}>{f.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Fonte Monetária</Label>
                        <Select
                          value={proposalDesign.monoFont}
                          onValueChange={(v) => updateProposalDesign("monoFont", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONO_FONT_OPTIONS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                <span style={{ fontFamily: f.value }}>{f.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tamanho Base</Label>
                        <Select
                          value={proposalDesign.fontSize}
                          onValueChange={(v) => updateProposalDesign("fontSize", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Pequeno</SelectItem>
                            <SelectItem value="medium">Médio</SelectItem>
                            <SelectItem value="large">Grande</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Layout Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Layout da Proposta</CardTitle>
                    <CardDescription>
                      Controle a disposição dos elementos no documento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Alinhamento do Cabeçalho</Label>
                        <Select
                          value={proposalDesign.headerLayout}
                          onValueChange={(v) => updateProposalDesign("headerLayout", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Esquerda</SelectItem>
                            <SelectItem value="center">Centro</SelectItem>
                            <SelectItem value="right">Direita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tamanho do Papel</Label>
                        <Select
                          value={proposalDesign.paperSize}
                          onValueChange={(v) => updateProposalDesign("paperSize", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                            <SelectItem value="Letter">Carta (8.5×11in)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">Exibir Logo no Cabeçalho</p>
                        <p className="text-[11px] text-muted-foreground">Mostra o logotipo da empresa no topo da proposta</p>
                      </div>
                      <Switch
                        checked={proposalDesign.showLogo}
                        onCheckedChange={(v) => updateProposalDesign("showLogo", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">Linhas Decorativas</p>
                        <p className="text-[11px] text-muted-foreground">Exibe linhas coloridas entre seções do documento</p>
                      </div>
                      <Switch
                        checked={proposalDesign.showBorderLines}
                        onCheckedChange={(v) => updateProposalDesign("showBorderLines", v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Live Preview (sticky) */}
              <div className="xl:col-span-1">
                <div className="sticky top-20">
                  <ProposalMiniPreview company={company} design={proposalDesign} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating save bar when changes exist */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-3 z-50">
          <div className="container flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Você tem alterações não salvas.
            </p>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 text-xs">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Configurações
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
