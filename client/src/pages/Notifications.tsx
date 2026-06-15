import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, XCircle, Bot, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  approval: { icon: CheckSquare, color: "text-purple-400", bg: "bg-purple-400/10" },
  ai_suggestion: { icon: Bot, color: "text-primary", bg: "bg-primary/10" },
};

export default function Notifications() {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notifications.list.useQuery({ pageSize: 50 });

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      toast.success("已全部标记为已读");
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const unreadCount = data?.items?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">通知中心</h1>
          <p className="text-sm text-muted-foreground mt-1">系统通知、预警提醒与 AI 建议推送</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border"
            onClick={() => markReadMutation.mutate()}
            disabled={markReadMutation.isPending}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            全部已读 ({unreadCount})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (data?.items?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground text-sm">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data!.items.map(n => {
            const conf = TYPE_CONFIG[n.type ?? "info"] ?? TYPE_CONFIG.info;
            const Icon = conf.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "bg-card rounded-xl border p-4 flex items-start gap-3 transition-all",
                  n.isRead ? "border-border opacity-60" : "border-border/80"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", conf.bg)}>
                  <Icon className={cn("w-4 h-4", conf.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={cn("text-sm font-semibold", n.isRead ? "text-muted-foreground" : "text-foreground")}>
                      {n.title}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary pulse-dot shrink-0" />
                      )}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                    </div>
                  </div>
                  {n.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                  )}
                  {n.relatedModule && (
                    <span className="text-[10px] text-muted-foreground mt-1.5 inline-block px-1.5 py-0.5 bg-muted rounded-md">
                      {n.relatedModule}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
