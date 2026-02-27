/*
 * QuotationList — Histórico de Cotações
 * Design: Clean Commerce / Swiss Design
 * Lists all saved quotations with search, filter, and actions
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Eye,
  Edit3,
  Copy,
  RotateCcw,
  LogIn,
  ChevronRight,
  Clock,
  Building2,
  DollarSign,
  Filter,
  LayoutList,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Rascunho", color: "text-muted-foreground", bg: "bg-muted" },
  sent: { label: "Enviada", color: "text-blue-700", bg: "bg-blue-50" },
  approved: { label: "Aprovada", color: "text-[oklch(0.35_0.08_145)]", bg: "bg-[oklch(0.96_0.03_145)]" },
  rejected: { label: "Rejeitada", color: "text-destructive", bg: "bg-red-50" },
  expired: { label: "Expirada", color: "text-orange-700", bg: "bg-orange-50" },
};

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function QuotationList() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: quotations, isLoading, refetch } = trpc.quotation.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.quotation.delete.useMutation({
    onSuccess: () => {
      toast.success("Cotação excluída com sucesso.");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao excluir cotação.");
    },
  });

  const statusMutation = trpc.quotation.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado.");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar status.");
    },
  });

  const filtered = useMemo(() => {
    if (!quotations) return [];
    return quotations.filter((q) => {
      const matchesSearch =
        !searchTerm ||
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.customerCompany ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.reference ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  // ─── Auth Gate ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onNavigate={navigate} />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <LogIn className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Faça login para continuar</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse sua conta para ver e gerenciar suas cotações salvas.
                </p>
              </div>
              <Button asChild size="lg" className="gap-2">
                <a href={getLoginUrl()}>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Ou{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-primary hover:underline"
                >
                  crie uma cotação sem login
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Main Content ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={navigate} />

      <main className="flex-1 container py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={quotations?.length ?? 0}
            icon={<LayoutList className="w-4 h-4" />}
          />
          <StatCard
            label="Rascunhos"
            value={quotations?.filter((q) => q.status === "draft").length ?? 0}
            icon={<Edit3 className="w-4 h-4" />}
          />
          <StatCard
            label="Aprovadas"
            value={quotations?.filter((q) => q.status === "approved").length ?? 0}
            icon={<FileText className="w-4 h-4" />}
            accent
          />
          <StatCard
            label="Valor Total"
            value={formatCurrency(
              quotations?.reduce((sum, q) => sum + parseFloat(String(q.grandTotal)), 0) ?? 0
            )}
            icon={<DollarSign className="w-4 h-4" />}
            isCurrency
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, número, empresa ou referência..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="approved">Aprovada</SelectItem>
              <SelectItem value="rejected">Rejeitada</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/")} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nova Cotação
          </Button>
        </div>

        {/* Quotation List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card rounded-lg animate-pulse border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhuma cotação encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Crie sua primeira cotação para começar."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => navigate("/")} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Cotação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((q, idx) => {
                const status = STATUS_MAP[q.status] ?? STATUS_MAP.draft;
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="hover:shadow-sm transition-shadow group">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Left: Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {q.quotationNumber}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm truncate">
                              {q.customerName}
                              {q.customerCompany && (
                                <span className="font-normal text-muted-foreground ml-1">
                                  — {q.customerCompany}
                                </span>
                              )}
                            </h3>
                            {q.reference && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {q.reference}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(q.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {Array.isArray(q.items) ? q.items.length : 0} {(Array.isArray(q.items) ? q.items.length : 0) === 1 ? "item" : "itens"}
                              </span>
                            </div>
                          </div>

                          {/* Right: Total + Actions */}
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-right">
                              <p className="font-mono text-base font-semibold text-foreground">
                                {formatCurrency(q.grandTotal)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Valor total
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/cotacao/${q.id}`)}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/editar/${q.id}`)}
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = `/api/quotation/${q.id}/pdf`;
                                  link.download = `Cotacao-${q.quotationNumber}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  toast.success("Download do PDF iniciado!");
                                }}
                                title="Baixar PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Select
                                value={q.status}
                                onValueChange={(newStatus) =>
                                  statusMutation.mutate({
                                    id: q.id,
                                    status: newStatus as any,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 w-8 p-0 border-0 shadow-none [&>svg:last-child]:hidden">
                                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Rascunho</SelectItem>
                                  <SelectItem value="sent">Enviada</SelectItem>
                                  <SelectItem value="approved">Aprovada</SelectItem>
                                  <SelectItem value="rejected">Rejeitada</SelectItem>
                                  <SelectItem value="expired">Expirada</SelectItem>
                                </SelectContent>
                              </Select>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir cotação?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      A cotação <strong>{q.quotationNumber}</strong> será
                                      excluída permanentemente. Esta ação não pode ser
                                      desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate({ id: q.id })}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t border-border py-4">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            Quotation Generator &mdash; Sistema de Cotações
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Header({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate("/")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663029168631/DmKchUsoAAxHzwJg.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="text-sm font-semibold leading-tight">
                Quotation Generator
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Gerador de Cotações
              </p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("/")}
            className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Cotação
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("/cotacoes")}
            className="gap-1.5 text-xs"
          >
            <LayoutList className="w-3.5 h-3.5" />
            Minhas Cotações
          </Button>
        </div>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  isCurrency,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: boolean;
  isCurrency?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={accent ? "text-primary" : "text-muted-foreground"}>
            {icon}
          </span>
        </div>
        <p
          className={`text-lg font-semibold ${
            isCurrency ? "font-mono text-base" : ""
          } ${accent ? "text-primary" : ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
