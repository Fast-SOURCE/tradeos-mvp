import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckSquare, CheckCircle2, XCircle, ArrowRightLeft, ChevronDown, ChevronUp, Bot, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "待审批", color: "text-amber-400 bg-amber-400/10" },
  approved: { label: "已通过", color: "text-emerald-400 bg-emerald-400/10" },
  rejected: { label: "已拒绝", color: "text-red-400 bg-red-400/10" },
  transferred: { label: "已转交", color: "text-blue-400 bg-blue-400/10" },
  expired: { label: "已过期", color: "text-slate-400 bg-slate-400/10" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "紧急", color: "text-red-400 bg-red-400/10" },
  high: { label: "高优先", color: "text-orange-400 bg-orange-400/10" },
  normal: { label: "普通", color: "text-blue-400 bg-blue-400/10" },
  low: { label: "低优先", color: "text-slate-400 bg-slate-400/10" },
};

const TYPE_LABELS: Record<string, string> = {
  quote_approval: "报价审批",
  price_change: "价格变更",
  large_order: "大额订单",
  restock: "补货申请",
  ad_budget: "广告预算",
  other: "其他",
};

export default function Approvals() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [action, setAction] = useState<"approved" | "rejected" | "transferred" | null>(null);
  const [comment, setComment] = useState("");

  const { data, isLoading, refetch } = trpc.approvals.list.useQuery({
    status: status !== "all" ? status : undefined,
    page, pageSize: 15,
  });

  const { data: taskDetail } = trpc.approvals.getById.useQuery(
    { id: selectedTask?.id ?? 0 },
    { enabled: !!selectedTask }
  );

  const processMutation = trpc.approvals.process.useMutation({
    onSuccess: () => {
      toast.success("审批操作成功");
      setAction(null);
      setComment("");
      setSelectedTask(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 15);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">审批任务中心</h1>
          <p className="text-sm text-muted-foreground mt-1">处理待审批任务，支持 AI 预评估辅助决策</p>
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-28 h-8 text-sm bg-card border-border">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (data?.items?.length ?? 0) === 0 ? (
          <div className="text-center py-20">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">暂无审批任务</p>
          </div>
        ) : (
          data!.items.map(task => (
            <div
              key={task.id}
              className={cn(
                "bg-card rounded-xl border p-4 cursor-pointer transition-all hover:border-border/80",
                selectedTask?.id === task.id ? "border-primary/50 bg-primary/5" : "border-border",
                task.status === "pending" && "border-l-2 border-l-amber-400"
              )}
              onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] text-muted-foreground font-mono">{task.taskNo}</span>
                    <span className="text-[10px] text-muted-foreground">{TYPE_LABELS[task.type] ?? task.type}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", PRIORITY_CONFIG[task.priority ?? "normal"]?.color)}>
                      {PRIORITY_CONFIG[task.priority ?? "normal"]?.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_CONFIG[task.status]?.color)}>
                    {STATUS_CONFIG[task.status]?.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(task.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>

              {/* AI Pre-evaluation */}
              {task.aiPreEvaluation != null && selectedTask?.id === task.id && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/15">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-semibold text-primary">AI 预评估</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      置信度 {((task.aiPreEvaluation as any).confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{(task.aiPreEvaluation as any).reason}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">AI 建议：</span>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      (task.aiPreEvaluation as any).recommendation === "approve"
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-red-400 bg-red-400/10"
                    )}>
                      {(task.aiPreEvaluation as any).recommendation === "approve" ? "建议通过" : "建议拒绝"}
                    </span>
                  </div>
                </div>
              )}

              {/* History */}
              {selectedTask?.id === task.id && taskDetail?.history && taskDetail.history.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-2">审批历史</p>
                  <div className="space-y-1.5">
                    {taskDetail.history.map(h => (
                      <div key={h.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{new Date(h.createdAt).toLocaleString("zh-CN")}</span>
                        <span className="font-medium text-foreground">{h.operatorName}</span>
                        <span>{h.action === "approved" ? "通过" : h.action === "rejected" ? "拒绝" : h.action === "transferred" ? "转交" : h.action}</span>
                        {h.comment && <span className="text-muted-foreground">· {h.comment}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {task.status === "pending" && selectedTask?.id === task.id && (
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <Button
                    size="sm"
                    className="h-7 text-[10px] bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 border-0"
                    onClick={(e) => { e.stopPropagation(); setAction("approved"); }}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> 通过
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] text-red-400 hover:text-red-300"
                    onClick={(e) => { e.stopPropagation(); setAction("rejected"); }}
                  >
                    <XCircle className="w-3 h-3 mr-1" /> 拒绝
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] text-blue-400 hover:text-blue-300"
                    onClick={(e) => { e.stopPropagation(); setAction("transferred"); }}
                  >
                    <ArrowRightLeft className="w-3 h-3 mr-1" /> 转交
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!action} onOpenChange={() => setAction(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-sm">
              {action === "approved" ? "确认通过" : action === "rejected" ? "确认拒绝" : "确认转交"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">任务：{selectedTask?.title}</p>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">备注（可选）</label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="请输入审批备注..."
                className="text-xs bg-background resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAction(null)}>取消</Button>
            <Button
              size="sm"
              className={cn(
                action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" :
                action === "rejected" ? "bg-destructive hover:bg-destructive/90" : ""
              )}
              onClick={() => {
                if (selectedTask && action) {
                  processMutation.mutate({ id: selectedTask.id, action, comment: comment || undefined });
                }
              }}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
