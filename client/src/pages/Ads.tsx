import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Megaphone, TrendingUp, DollarSign, MousePointer, ShoppingBag, ChevronDown, ChevronUp, Plus, Pause, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "投放中", color: "text-emerald-400 bg-emerald-400/10" },
  paused: { label: "已暂停", color: "text-amber-400 bg-amber-400/10" },
  ended: { label: "已结束", color: "text-slate-400 bg-slate-400/10" },
  draft: { label: "草稿", color: "text-blue-400 bg-blue-400/10" },
};

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  amazon: { label: "Amazon", color: "text-orange-400" },
  google: { label: "Google", color: "text-blue-400" },
  meta: { label: "Meta", color: "text-indigo-400" },
  tiktok: { label: "TikTok", color: "text-pink-400" },
  other: { label: "其他", color: "text-slate-400" },
};

export default function Ads() {
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", platform: "amazon", budget: "", startDate: "", endDate: "" });
  const setForm = (k: string, v: string) => setCreateForm(f => ({ ...f, [k]: v }));

  const { data, isLoading, refetch } = trpc.ads.campaigns.useQuery({
    status: status !== "all" ? status : undefined,
    pageSize: 20,
  });

  const createMutation = trpc.ads.create.useMutation({
    onSuccess: () => { toast.success("广告活动已创建"); setShowCreate(false); setCreateForm({ name: "", platform: "amazon", budget: "", startDate: "", endDate: "" }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.ads.update.useMutation({
    onSuccess: () => { toast.success("已更新"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const { data: groups } = trpc.ads.groups.useQuery(
    { campaignId: expanded! },
    { enabled: expanded !== null }
  );

  // Summary stats
  const items = data?.items ?? [];
  const totalSpend = items.reduce((s, c) => s + parseFloat(c.spend ?? "0"), 0);
  const totalRevenue = items.reduce((s, c) => s + parseFloat(c.revenue ?? "0"), 0);
  const totalImpressions = items.reduce((s, c) => s + (c.impressions ?? 0), 0);
  const totalConversions = items.reduce((s, c) => s + (c.conversions ?? 0), 0);
  const avgRoi = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">广告管理</h1>
          <p className="text-sm text-muted-foreground mt-1">多平台广告活动监控与 ROI 分析</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-28 h-8 text-sm bg-card border-border">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">投放中</SelectItem>
              <SelectItem value="paused">已暂停</SelectItem>
              <SelectItem value="ended">已结束</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="glow-primary h-8" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> 新建活动
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="总花费" value={`$${totalSpend.toFixed(0)}`} icon={DollarSign} color="text-red-400" bg="bg-red-400/10" loading={isLoading} />
        <SummaryCard title="总收入" value={`$${totalRevenue.toFixed(0)}`} icon={TrendingUp} color="text-emerald-400" bg="bg-emerald-400/10" loading={isLoading} />
        <SummaryCard title="平均 ROI" value={`${avgRoi.toFixed(2)}x`} icon={ShoppingBag} color="text-purple-400" bg="bg-purple-400/10" loading={isLoading} />
        <SummaryCard title="总曝光量" value={totalImpressions > 1000 ? `${(totalImpressions / 1000).toFixed(1)}K` : String(totalImpressions)} icon={MousePointer} color="text-blue-400" bg="bg-blue-400/10" loading={isLoading} />
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (items.length === 0) ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
            暂无广告活动数据
          </div>
        ) : (
          items.map(c => (
            <div key={c.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-medium", PLATFORM_CONFIG[c.platform ?? "other"]?.color)}>
                          {PLATFORM_CONFIG[c.platform ?? "other"]?.label}
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", STATUS_CONFIG[c.status]?.color)}>
                          {STATUS_CONFIG[c.status]?.label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-foreground mt-0.5 truncate">{c.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <MetricCol label="花费" value={`$${parseFloat(c.spend ?? "0").toFixed(0)}`} />
                    <MetricCol label="ROI" value={`${parseFloat(c.roi ?? "0").toFixed(2)}x`} highlight={parseFloat(c.roi ?? "0") > 5} />
                    <MetricCol label="CTR" value={`${(parseFloat(c.ctr ?? "0") * 100).toFixed(2)}%`} />
                    <MetricCol label="转化" value={String(c.conversions ?? 0)} />
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground"
                      onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: c.id, status: c.status === "active" ? "paused" : "active" }); }}
                    >
                      {c.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setExpanded(expanded === c.id ? null : c.id); }}>
                      {expanded === c.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>预算使用率</span>
                    <span>${parseFloat(c.spend ?? "0").toFixed(0)} / ${parseFloat(c.budget ?? "0").toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-primary to-blue-400"
                      style={{ width: `${Math.min(100, (parseFloat(c.spend ?? "0") / parseFloat(c.budget ?? "1")) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ad Groups */}
              {expanded === c.id && (
                <div className="border-t border-border bg-muted/10 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">广告组</h4>
                  {!groups || groups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">暂无广告组数据</p>
                  ) : (
                    <div className="space-y-2">
                      {groups.map(g => (
                        <div key={g.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div>
                            <span className="text-xs font-medium text-foreground">{g.name}</span>
                            <span className={cn("ml-2 text-[10px] px-1.5 py-0.5 rounded-full", STATUS_CONFIG[g.status]?.color)}>
                              {STATUS_CONFIG[g.status]?.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <MetricCol label="花费" value={`$${parseFloat(g.spend ?? "0").toFixed(0)}`} />
                            <MetricCol label="曝光" value={`${((g.impressions ?? 0) / 1000).toFixed(1)}K`} />
                            <MetricCol label="点击" value={String(g.clicks ?? 0)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">新建广告活动</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">活动名称 *</Label>
              <Input value={createForm.name} onChange={e => setForm("name", e.target.value)} className="h-8 text-sm bg-background" placeholder="广告活动名称" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">投放平台</Label>
                <Select value={createForm.platform} onValueChange={v => setForm("platform", v)}>
                  <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">预算 ($)</Label>
                <Input type="number" value={createForm.budget} onChange={e => setForm("budget", e.target.value)} className="h-8 text-sm bg-background" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">开始日期</Label>
                <Input type="date" value={createForm.startDate} onChange={e => setForm("startDate", e.target.value)} className="h-8 text-sm bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">结束日期</Label>
                <Input type="date" value={createForm.endDate} onChange={e => setForm("endDate", e.target.value)} className="h-8 text-sm bg-background" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>取消</Button>
            <Button size="sm" disabled={createMutation.isPending || !createForm.name} onClick={() => createMutation.mutate({ name: createForm.name, platform: createForm.platform as any, budget: createForm.budget || undefined, startDate: createForm.startDate || undefined, endDate: createForm.endDate || undefined })}>
              {createMutation.isPending ? "创建中..." : "创建活动"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color, bg, loading }: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; loading: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bg)}>
          <Icon className={cn("w-3.5 h-3.5", color)} />
        </div>
      </div>
      {loading ? <Skeleton className="h-7 w-24" /> : (
        <div className="text-2xl font-bold font-heading text-foreground">{value}</div>
      )}
    </div>
  );
}

function MetricCol({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-right">
      <div className={cn("text-xs font-semibold", highlight ? "text-emerald-400" : "text-foreground")}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
