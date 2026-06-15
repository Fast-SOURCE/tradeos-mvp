import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, ShoppingCart, ChevronLeft, ChevronRight, X, Eye, Truck, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "待确认", color: "text-slate-400 bg-slate-400/10" },
  confirmed: { label: "已确认", color: "text-blue-400 bg-blue-400/10" },
  processing: { label: "处理中", color: "text-amber-400 bg-amber-400/10" },
  shipped: { label: "已发货", color: "text-cyan-400 bg-cyan-400/10" },
  delivered: { label: "已送达", color: "text-emerald-400 bg-emerald-400/10" },
  cancelled: { label: "已取消", color: "text-red-400 bg-red-400/10" },
  refunded: { label: "已退款", color: "text-purple-400 bg-purple-400/10" },
};

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  amazon: { label: "Amazon", color: "text-orange-400" },
  shopify: { label: "Shopify", color: "text-emerald-400" },
  alibaba: { label: "Alibaba", color: "text-amber-400" },
  direct: { label: "直接", color: "text-blue-400" },
  other: { label: "其他", color: "text-slate-400" },
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.orders.list.useQuery({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    platform: platform !== "all" ? platform : undefined,
    page, pageSize: 15,
  });

  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNo, setTrackingNo] = useState("");

  const { data: orderDetail } = trpc.orders.getById.useQuery(
    { id: detailOrder?.id ?? 0 },
    { enabled: !!detailOrder?.id }
  );

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("订单状态已更新"); setShowStatusUpdate(false); setDetailOrder(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 15);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">订单管理</h1>
          <p className="text-sm text-muted-foreground mt-1">多平台订单状态跟踪与管理</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setStatus(status === key ? "all" : key); setPage(1); }}
            className={cn(
              "bg-card rounded-lg border p-3 text-left transition-all",
              status === key ? "border-primary/50 bg-primary/5" : "border-border hover:border-border/80"
            )}
          >
            <div className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block", cfg.color)}>{cfg.label}</div>
            <div className="text-lg font-bold font-heading text-foreground mt-1">
              {isLoading ? "-" : (data?.items?.filter(o => o.status === key)?.length ?? 0)}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索订单号..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-sm bg-card border-border"
          />
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
        <Select value={platform} onValueChange={v => { setPlatform(v); setPage(1); }}>
          <SelectTrigger className="w-28 h-8 text-sm bg-card border-border">
            <SelectValue placeholder="平台" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台</SelectItem>
            {Object.entries(PLATFORM_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || status !== "all" || platform !== "all") && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => { setSearch(""); setStatus("all"); setPlatform("all"); setPage(1); }}>
            <X className="w-3 h-3 mr-1" /> 清除
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">共 {data?.total ?? 0} 笔订单</span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">订单号</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">平台</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">商品数</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">金额</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">创建时间</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-8 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 mx-auto" /></td>
                  <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></td>
                </tr>
              ))
            ) : (data?.items?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无订单数据
                </td>
              </tr>
            ) : (
              data!.items.map(o => (
                <tr key={o.id} className="border-b border-border/50 table-row-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-medium text-foreground">{o.orderNo}</div>
                    {o.trackingNo && <div className="text-[10px] text-muted-foreground mt-0.5">物流: {o.trackingNo}</div>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn("text-xs font-medium", PLATFORM_CONFIG[o.platform ?? "other"]?.color)}>
                      {PLATFORM_CONFIG[o.platform ?? "other"]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{o.itemCount ?? 1} 件</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold text-foreground">
                      {o.currency ?? "USD"} {parseFloat(o.totalAmount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_CONFIG[o.status]?.color)}>
                      {STATUS_CONFIG[o.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden xl:table-cell">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDetailOrder(o)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">第 {page} / {totalPages} 页</span>
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

      {/* Order Detail Sheet */}
      <Sheet open={!!detailOrder} onOpenChange={(o) => !o && setDetailOrder(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto bg-card border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-heading">
              <ShoppingCart className="h-4 w-4 text-primary" /> 订单详情
            </SheetTitle>
          </SheetHeader>
          {detailOrder && (
            <div className="mt-5 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-sm font-bold">{detailOrder.orderNo}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className={cn("text-xs", STATUS_CONFIG[detailOrder.status]?.color)}>
                      {STATUS_CONFIG[detailOrder.status]?.label}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", PLATFORM_CONFIG[detailOrder.platform ?? "other"]?.color)}>
                      {PLATFORM_CONFIG[detailOrder.platform ?? "other"]?.label}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setNewStatus(detailOrder.status); setTrackingNo(detailOrder.trackingNo ?? ""); setShowStatusUpdate(true); }}>
                  <Truck className="h-3.5 w-3.5 mr-1.5" /> 更新状态
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">订单金额</div>
                  <div className="text-xl font-bold text-primary mt-0.5">{detailOrder.currency ?? "USD"} {parseFloat(detailOrder.totalAmount ?? "0").toLocaleString()}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">商品数量</div>
                  <div className="text-xl font-bold mt-0.5">{detailOrder.itemCount ?? 1} 件</div>
                </div>
              </div>

              {detailOrder.trackingNo && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">物流单号：</span>
                  <span className="font-mono font-medium">{detailOrder.trackingNo}</span>
                </div>
              )}

              {detailOrder.shippingAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">收货地址</div>
                    <div>{detailOrder.shippingAddress}</div>
                  </div>
                </div>
              )}

              {orderDetail?.items && orderDetail.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" /> 订单商品
                    </h4>
                    <div className="space-y-2">
                      {orderDetail.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40">
                          <div>
                            <div className="font-medium">{item.productName ?? item.sku}</div>
                            <div className="text-muted-foreground font-mono">{item.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{item.quantity} 件</div>
                            <div className="text-muted-foreground">${parseFloat(item.unitPrice ?? "0").toFixed(2)} 各</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {detailOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">备注</h4>
                    <p className="text-sm text-muted-foreground">{detailOrder.notes}</p>
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground pt-2">
                创建时间：{new Date(detailOrder.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">更新订单状态</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">订单状态</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">物流单号（可选）</Label>
              <Input value={trackingNo} onChange={e => setTrackingNo(e.target.value)} className="h-8 text-sm bg-background" placeholder="输入物流单号" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowStatusUpdate(false)}>取消</Button>
            <Button size="sm" disabled={updateStatusMutation.isPending || !newStatus} onClick={() => {
              if (detailOrder) updateStatusMutation.mutate({ id: detailOrder.id, status: newStatus as any, trackingNo: trackingNo || undefined });
            }}>
              {updateStatusMutation.isPending ? "更新中..." : "确认更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
