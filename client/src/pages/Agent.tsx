import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bot, Sparkles, CheckCircle2, XCircle, PauseCircle, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  restock: { label: "补货建议", color: "text-amber-400", bg: "bg-amber-400/10" },
  ad_optimize: { label: "广告优化", color: "text-blue-400", bg: "bg-blue-400/10" },
  pricing: { label: "定价建议", color: "text-purple-400", bg: "bg-purple-400/10" },
  quote: { label: "报价建议", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  risk: { label: "风险预警", color: "text-red-400", bg: "bg-red-400/10" },
  opportunity: { label: "商机发现", color: "text-cyan-400", bg: "bg-cyan-400/10" },
};

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "高影响", color: "text-red-400" },
  medium: { label: "中影响", color: "text-amber-400" },
  low: { label: "低影响", color: "text-emerald-400" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "text-blue-400 bg-blue-400/10" },
  accepted: { label: "已采纳", color: "text-emerald-400 bg-emerald-400/10" },
  rejected: { label: "已驳回", color: "text-red-400 bg-red-400/10" },
  suspended: { label: "已挂起", color: "text-slate-400 bg-slate-400/10" },
  expired: { label: "已过期", color: "text-slate-400 bg-slate-400/10" },
};

export default function Agent() {
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.agent.suggestions.useQuery({
    status: status !== "all" ? status : undefined,
    type: type !== "all" ? type : undefined,
    page, pageSize: 12,
  });

  const reviewMutation = trpc.agent.review.useMutation({
    onSuccess: (_, vars) => {
      const labels: Record<string, string> = { accepted: "已采纳", rejected: "已驳回", suspended: "已挂起" };
      toast.success(`建议${labels[vars.status]}`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const pendingCount = status === "pending" ? (data?.total ?? 0) : 0;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading gradient-text">AI Agent 建议</h1>
            <p className="text-sm text-muted-foreground mt-0.5">智能分析引擎生成的经营优化建议</p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-primary/20 text-primary border-0">{pendingCount} 条待处理</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-28 h-8 text-sm bg-card border-border">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="accepted">已采纳</SelectItem>
            <SelectItem value="rejected">已驳回</SelectItem>
            <SelectItem value="suspended">已挂起</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={v => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-32 h-8 text-sm bg-card border-border">
            <SelectValue placeholder="建议类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">共 {data?.total ?? 0} 条建议</span>
      </div>

      {/* Suggestion Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (data?.items?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground text-sm">暂无 AI 建议</p>
          <p className="text-muted-foreground text-xs mt-1">请先初始化演示数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data!.items.map(s => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onReview={(action) => reviewMutation.mutate({ id: s.id, status: action })}
              loading={reviewMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion: s, onReview, loading }: {
  suggestion: any;
  onReview: (action: "accepted" | "rejected" | "suspended") => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeConf = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.opportunity;
  const impactConf = IMPACT_CONFIG[s.impact ?? "medium"];
  const statusConf = STATUS_CONFIG[s.status ?? "pending"];
  const confidence = parseFloat(s.confidence ?? "0.8");
  const isPending = s.status === "pending";

  return (
    <div className={cn(
      "ai-card rounded-xl p-5 space-y-4 transition-all",
      isPending ? "border-primary/25" : "opacity-70"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", typeConf.color, typeConf.bg)}>
            {typeConf.label}
          </span>
          <span className={cn("text-[10px] font-medium", impactConf.color)}>
            {impactConf.label}
          </span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", statusConf.color)}>
            {statusConf.label}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold text-foreground">{(confidence * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-muted-foreground">置信度</div>
        </div>
      </div>

      {/* Title & Summary */}
      <div>
        <h3 className="text-sm font-semibold text-foreground leading-snug">{s.title}</h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{s.summary}</p>
      </div>

      {/* Confidence Bar */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>AI 置信度</span>
          <span>{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div className="confidence-bar h-1.5" style={{ width: `${confidence * 100}%` }} />
        </div>
      </div>

      {/* Reasoning (expandable) */}
      {s.reasoning && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            {expanded ? "收起推理依据" : "查看推理依据"}
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/15">
              <p className="text-[10px] text-muted-foreground leading-relaxed">{s.reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            size="sm"
            className="flex-1 h-7 text-[10px] bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 border-0"
            onClick={() => onReview("accepted")}
            disabled={loading}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" /> 采纳
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-[10px] text-slate-400 hover:text-foreground"
            onClick={() => onReview("suspended")}
            disabled={loading}
          >
            <PauseCircle className="w-3 h-3 mr-1" /> 挂起
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-[10px] text-red-400 hover:text-red-300"
            onClick={() => onReview("rejected")}
            disabled={loading}
          >
            <XCircle className="w-3 h-3 mr-1" /> 驳回
          </Button>
        </div>
      )}

      {/* Review info */}
      {!isPending && s.reviewedAt && (
        <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
          {new Date(s.reviewedAt).toLocaleDateString("zh-CN")} 处理
          {s.reviewNote && <span className="ml-2">· {s.reviewNote}</span>}
        </div>
      )}
    </div>
  );
}
