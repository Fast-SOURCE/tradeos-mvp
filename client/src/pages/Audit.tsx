import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  system: "系统",
  products: "商品",
  customers: "客户",
  orders: "订单",
  ads: "广告",
  inventory: "库存",
  inquiries: "询盘",
  agent: "AI Agent",
  approvals: "审批",
  audit: "审计",
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-400/10",
  update: "text-blue-400 bg-blue-400/10",
  delete: "text-red-400 bg-red-400/10",
  approved: "text-emerald-400 bg-emerald-400/10",
  rejected: "text-red-400 bg-red-400/10",
  transferred: "text-blue-400 bg-blue-400/10",
  suggestion_accepted: "text-emerald-400 bg-emerald-400/10",
  suggestion_rejected: "text-red-400 bg-red-400/10",
  suggestion_suspended: "text-slate-400 bg-slate-400/10",
  seed_data: "text-purple-400 bg-purple-400/10",
  create_quote: "text-cyan-400 bg-cyan-400/10",
};

export default function Audit() {
  const [module, setModule] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.audit.list.useQuery({
    module: module !== "all" ? module : undefined,
    page, pageSize: 50,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">审计日志</h1>
          <p className="text-sm text-muted-foreground mt-1">记录所有用户操作，支持按模块与用户筛选</p>
        </div>
        <Select value={module} onValueChange={v => { setModule(v); setPage(1); }}>
          <SelectTrigger className="w-32 h-8 text-sm bg-card border-border">
            <SelectValue placeholder="模块" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模块</SelectItem>
            {Object.entries(MODULE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">时间</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">操作人</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">模块</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">目标</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-2.5"><Skeleton className="h-3.5 w-32" /></td>
                  <td className="px-4 py-2.5"><Skeleton className="h-3.5 w-20" /></td>
                  <td className="px-4 py-2.5 hidden md:table-cell"><Skeleton className="h-3.5 w-16" /></td>
                  <td className="px-4 py-2.5"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-2.5 hidden lg:table-cell"><Skeleton className="h-3.5 w-32" /></td>
                </tr>
              ))
            ) : (data?.items?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无审计日志
                </td>
              </tr>
            ) : (
              data!.items.map(log => (
                <tr key={log.id} className="border-b border-border/50 table-row-hover transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleString("zh-CN", { hour12: false })}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-foreground">{log.userName ?? "系统"}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{MODULE_LABELS[log.module] ?? log.module}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", ACTION_COLORS[log.action] ?? "text-slate-400 bg-slate-400/10")}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{log.targetName ?? log.targetId ?? "-"}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">第 {page} / {totalPages} 页 · 共 {data?.total ?? 0} 条记录</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
