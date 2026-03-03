/*
 * Dashboard — Quotation Metrics
 * Brand: Navy (#1A1A2E) + Coral (#FF4B4B)
 * Charts: Recharts with brand palette
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  Loader2,
  LogIn,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029168631/DmKchUsoAAxHzwJg.png";

// Chart colors matching brand palette
const CHART_COLORS = {
  navy: "#1A1A2E",
  coral: "#FF4B4B",
  green: "#22C55E",
  amber: "#F59E0B",
  slate: "#64748B",
  purple: "#8B5CF6",
};

const STATUS_COLORS: Record<string, string> = {
  approved: CHART_COLORS.green,
  sent: CHART_COLORS.amber,
  draft: CHART_COLORS.slate,
  rejected: CHART_COLORS.coral,
  expired: CHART_COLORS.purple,
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Aprovadas",
  sent: "Enviadas",
  draft: "Rascunhos",
  rejected: "Rejeitadas",
  expired: "Expiradas",
};

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${months[parseInt(month!) - 1]} ${year!.slice(2)}`;
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {typeof entry.value === "number" && entry.name?.includes("Valor")
            ? formatCurrency(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Auth guard
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
        <p className="text-muted-foreground">Faça login para acessar o dashboard.</p>
        <Button asChild>
          <a href={getLoginUrl()}>
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </a>
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const statusDistribution = metrics
    ? [
        { name: "Aprovadas", value: metrics.totalApproved, color: STATUS_COLORS.approved },
        { name: "Enviadas", value: metrics.totalSent, color: STATUS_COLORS.sent },
        { name: "Rascunhos", value: metrics.totalDrafts, color: STATUS_COLORS.draft },
        { name: "Rejeitadas", value: metrics.totalRejected, color: STATUS_COLORS.rejected },
        { name: "Expiradas", value: metrics.totalExpired, color: STATUS_COLORS.expired },
      ].filter((d) => d.value > 0)
    : [];

  const monthlyChartData = metrics?.monthlyData.map((m) => ({
    ...m,
    label: formatMonthLabel(m.month),
  })) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground">Dashboard</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Métricas de Cotações
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !metrics ? (
          <div className="text-center py-20 text-muted-foreground">
            Erro ao carregar métricas.
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                icon={<FileText className="w-5 h-5" />}
                label="Total de Cotações"
                value={String(metrics.totalQuotations)}
                color="navy"
              />
              <KPICard
                icon={<DollarSign className="w-5 h-5" />}
                label="Valor Médio"
                value={formatCurrency(metrics.averageValue)}
                color="coral"
              />
              <KPICard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Taxa de Aprovação"
                value={`${metrics.approvalRate.toFixed(1)}%`}
                color="green"
                subtitle={`${metrics.totalApproved} aprovadas`}
              />
              <KPICard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Valor Total"
                value={formatCompactCurrency(metrics.totalValue)}
                color="navy"
              />
            </div>

            {/* Status mini-cards */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              <StatusMiniCard label="Rascunhos" count={metrics.totalDrafts} color={STATUS_COLORS.draft} />
              <StatusMiniCard label="Enviadas" count={metrics.totalSent} color={STATUS_COLORS.sent} />
              <StatusMiniCard label="Aprovadas" count={metrics.totalApproved} color={STATUS_COLORS.approved} />
              <StatusMiniCard label="Rejeitadas" count={metrics.totalRejected} color={STATUS_COLORS.rejected} />
              <StatusMiniCard label="Expiradas" count={metrics.totalExpired} color={STATUS_COLORS.expired} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart — Cotações por Mês */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Cotações por Mês</h3>
                </div>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyChartData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Bar
                        dataKey="approved"
                        name="Aprovadas"
                        fill={STATUS_COLORS.approved}
                        radius={[3, 3, 0, 0]}
                        stackId="a"
                      />
                      <Bar
                        dataKey="pending"
                        name="Pendentes"
                        fill={STATUS_COLORS.sent}
                        radius={[3, 3, 0, 0]}
                        stackId="a"
                      />
                      <Bar
                        dataKey="rejected"
                        name="Rejeitadas"
                        fill={STATUS_COLORS.rejected}
                        radius={[3, 3, 0, 0]}
                        stackId="a"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    Nenhum dado disponível
                  </div>
                )}
              </div>

              {/* Pie Chart — Distribuição por Status */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Status</h3>
                </div>
                {statusDistribution.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name]}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {statusDistribution.map((entry, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    Nenhum dado
                  </div>
                )}
              </div>
            </div>

            {/* Line Chart — Evolução de Valor */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Evolução do Valor Total por Mês
                </h3>
              </div>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompactCurrency(v)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                    <Line
                      type="monotone"
                      dataKey="totalValue"
                      name="Valor Total"
                      stroke={CHART_COLORS.coral}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: CHART_COLORS.coral }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Qtd. Cotações"
                      stroke={CHART_COLORS.navy}
                      strokeWidth={2}
                      dot={{ r: 3, fill: CHART_COLORS.navy }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </div>

            {/* Bottom Row: Recent + Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Quotations */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Cotações Recentes</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/cotacoes")}
                    className="text-xs text-muted-foreground"
                  >
                    Ver todas
                  </Button>
                </div>
                {metrics.recentQuotations.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.recentQuotations.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/cotacao/${q.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {q.customerName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {q.quotationNumber}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm font-mono font-semibold text-foreground">
                            {formatCurrency(Number(q.grandTotal))}
                          </p>
                          <span
                            className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${STATUS_COLORS[q.status] || CHART_COLORS.slate}20`,
                              color: STATUS_COLORS[q.status] || CHART_COLORS.slate,
                            }}
                          >
                            {STATUS_LABELS[q.status] || q.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma cotação ainda
                  </p>
                )}
              </div>

              {/* Top Customers */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Principais Clientes</h3>
                </div>
                {metrics.topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topCustomers.map((c, i) => {
                      const maxVal = metrics.topCustomers[0]?.totalValue || 1;
                      const pct = (c.totalValue / maxVal) * 100;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-foreground truncate flex-1">
                              {c.name}
                            </p>
                            <div className="text-right ml-3">
                              <span className="text-xs font-mono text-foreground">
                                {formatCurrency(c.totalValue)}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-2">
                                ({c.count} cot.)
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  i === 0
                                    ? CHART_COLORS.coral
                                    : i === 1
                                    ? CHART_COLORS.navy
                                    : CHART_COLORS.slate,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum cliente ainda
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-4">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            Quotation Generator &mdash; Dashboard de Métricas
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "navy" | "coral" | "green";
  subtitle?: string;
}) {
  const colorMap = {
    navy: { bg: "bg-navy-50", text: "text-navy-800", icon: "text-navy-600" },
    coral: { bg: "bg-coral-50", text: "text-coral-700", icon: "text-coral-500" },
    green: { bg: "bg-emerald-50", text: "text-emerald-800", icon: "text-emerald-600" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
      </div>
      <p className={`text-xl md:text-2xl font-bold font-mono ${c.text}`}>{value}</p>
      {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function StatusMiniCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-lg font-bold font-mono text-foreground leading-tight">{count}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  );
}
