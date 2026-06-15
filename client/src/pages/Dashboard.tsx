import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, ShoppingCart, Megaphone, AlertTriangle,
  MessageSquare, Sparkles, RefreshCw, ChevronRight, Bot, ArrowUpRight,
  DollarSign, Package, BarChart3, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const SUGGESTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  restock: { label: "补货建议", color: "text-amber-400 bg-amber-400/10" },
  ad_optimize: { label: "广告优化", color: "text-blue-400 bg-blue-400/10" },
  pricing: { label: "定价建议", color: "text-purple-400 bg-purple-400/10" },
  quote: { label: "报价建议", color: "text-emerald-400 bg-emerald-400/10" },
  risk: { label: "风险预警", color: "text-red-400 bg-red-400/10" },
  opportunity: { label: "商机发现", color: "text-cyan-400 bg-cyan-400/10" },
};

const IMPACT_COLORS: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-emerald-400",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.dashboard.stats.useQuery();
  const { data: trend, isLoading: trendLoading } = trpc.dashboard.trend.useQuery();
  const { data: suggestions, isLoading: suggestionsLoading } = trpc.agent.suggestions.useQuery({ status: "pending", pageSize: 4 });
  const { data: approvals } = trpc.approvals.list.useQuery({ status: "pending", pageSize: 3 });

  const seedMutation = trpc.seed.init.useMutation({
    onSuccess: () => {
      toast.success("演示数据初始化成功！页面即将刷新...");
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (e) => toast.error(`初始化失败: ${e.message}`),
  });

  const reviewMutation = trpc.agent.review.useMutation({
    onSuccess: () => {
      toast.success("操作成功");
    },
  });

  const trendData = trend?.map(d => ({
    date: d.date?.slice(5) ?? "",
    GMV: parseFloat(d.gmv ?? "0"),
    广告ROI: parseFloat(d.adRoi ?? "0"),
    订单数: d.orderCount ?? 0,
  })) ?? [];

  const hasData = (stats?.orderCount ?? 0) > 0 || (trend?.length ?? 0) > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">经营驾驶舱</h1>
          <p className="text-sm text-muted-foreground mt-1">实时监控核心业务指标，AI 智能辅助决策</p>
        </div>
        <div className="flex items-center gap-2">
          {!hasData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              {seedMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 mr-1.5" />
              )}
              初始化演示数据
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => refetchStats()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="总 GMV"
          value={stats ? `$${(stats.gmv / 1000).toFixed(1)}K` : "--"}
          icon={DollarSign}
          color="text-emerald-400"
          bgColor="bg-emerald-400/10"
          loading={statsLoading}
          trend="+12.5%"
          trendUp
        />
        <KpiCard
          title="订单量"
          value={stats?.orderCount?.toString() ?? "--"}
          icon={ShoppingCart}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
          loading={statsLoading}
          trend="+8.3%"
          trendUp
        />
        <KpiCard
          title="广告 ROI"
          value={stats ? `${stats.adRoi.toFixed(2)}x` : "--"}
          icon={Megaphone}
          color="text-purple-400"
          bgColor="bg-purple-400/10"
          loading={statsLoading}
          trend="+2.1x"
          trendUp
        />
        <KpiCard
          title="库存预警"
          value={stats?.stockAlertCount?.toString() ?? "--"}
          icon={AlertTriangle}
          color="text-amber-400"
          bgColor="bg-amber-400/10"
          loading={statsLoading}
          trend="需关注"
          trendUp={false}
        />
        <KpiCard
          title="待处理询盘"
          value={stats?.pendingInquiries?.toString() ?? "--"}
          icon={MessageSquare}
          color="text-cyan-400"
          bgColor="bg-cyan-400/10"
          loading={statsLoading}
          trend="新增 3"
          trendUp
        />
      </div>

      {/* Charts + AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">GMV 趋势（近 30 天）</h3>
              <p className="text-xs text-muted-foreground mt-0.5">每日 GMV 与广告 ROI 变化</p>
            </div>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          {trendLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.62 0.22 270)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.62 0.22 270)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.016 250)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.012 250)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.012 250)" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.14 0.014 250)", border: "1px solid oklch(0.22 0.016 250)", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "oklch(0.95 0.008 250)" }}
                  formatter={(value: number, name: string) => [name === "GMV" ? `$${value.toFixed(0)}` : value.toFixed(2), name]}
                />
                <Area type="monotone" dataKey="GMV" stroke="oklch(0.62 0.22 270)" strokeWidth={2} fill="url(#gmvGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              暂无数据，请先初始化演示数据
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">快速概览</h3>
          <div className="space-y-3">
            <QuickStatRow label="广告总花费" value={stats ? `$${stats.adSpend.toFixed(0)}` : "--"} loading={statsLoading} />
            <QuickStatRow label="待审批任务" value={approvals?.total?.toString() ?? "--"} loading={false} />
            <QuickStatRow label="AI 待处理建议" value={suggestions?.total?.toString() ?? "--"} loading={suggestionsLoading} />
          </div>
          <div className="pt-2 border-t border-border">
            <Link href="/agent">
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  查看所有 AI 建议
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/approvals">
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  处理待审批任务
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">AI 老板参谋建议</h3>
            {suggestions && suggestions.total > 0 && (
              <Badge className="text-[10px] bg-primary/20 text-primary border-0">{suggestions.total} 条待处理</Badge>
            )}
          </div>
          <Link href="/agent">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              查看全部 <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        {suggestionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (suggestions?.items?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions!.items.slice(0, 4).map(s => (
              <div key={s.id} className="ai-card rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", SUGGESTION_TYPE_LABELS[s.type]?.color)}>
                      {SUGGESTION_TYPE_LABELS[s.type]?.label ?? s.type}
                    </span>
                    <span className={cn("text-[10px] font-medium", IMPACT_COLORS[s.impact ?? "medium"])}>
                      {s.impact === "high" ? "高影响" : s.impact === "medium" ? "中影响" : "低影响"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    置信度 {((parseFloat(s.confidence ?? "0.8")) * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground line-clamp-1">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.summary}</p>
                </div>
                {/* Confidence bar */}
                <div className="w-full bg-border rounded-full h-1">
                  <div
                    className="confidence-bar"
                    style={{ width: `${parseFloat(s.confidence ?? "0.8") * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2 bg-primary/20 text-primary hover:bg-primary/30 border-0"
                    onClick={() => reviewMutation.mutate({ id: s.id, status: "accepted" })}
                    disabled={reviewMutation.isPending}
                  >
                    采纳
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => reviewMutation.mutate({ id: s.id, status: "suspended" })}
                    disabled={reviewMutation.isPending}
                  >
                    挂起
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                    onClick={() => reviewMutation.mutate({ id: s.id, status: "rejected" })}
                    disabled={reviewMutation.isPending}
                  >
                    驳回
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无 AI 建议，请先初始化演示数据
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bgColor, loading, trend, trendUp }: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>;
  color: string; bgColor: string; loading: boolean; trend: string; trendUp: boolean;
}) {
  return (
    <div className="kpi-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-3.5 h-3.5", color)} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="text-2xl font-bold font-heading text-foreground">{value}</div>
      )}
      <div className={cn("flex items-center gap-1 text-[10px]", trendUp ? "text-emerald-400" : "text-amber-400")}>
        {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {trend}
      </div>
    </div>
  );
}

function QuickStatRow({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {loading ? <Skeleton className="h-4 w-12" /> : <span className="text-sm font-semibold text-foreground">{value}</span>}
    </div>
  );
}
