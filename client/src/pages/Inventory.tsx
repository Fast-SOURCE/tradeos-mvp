import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Warehouse, AlertTriangle, Package, ArrowUpDown, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function Inventory() {
  const [tab, setTab] = useState<"all" | "alert" | "warehouses" | "history">("all");
  const [warehouseId, setWarehouseId] = useState<number | undefined>();

  const { data: warehouses } = trpc.inventory.warehouses.useQuery();
  const { data: inventory, isLoading, refetch: refetchInventory } = trpc.inventory.list.useQuery({
    alert: tab === "alert" ? true : undefined,
    warehouseId,
    pageSize: 50,
  });

  const [adjustTarget, setAdjustTarget] = useState<any>(null);
  const [adjustType, setAdjustType] = useState("inbound");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // For history tab, we show adjustments across all inventory items
  // We use a placeholder inventoryId of 0 when not targeting a specific item
  const [historyInventoryId, setHistoryInventoryId] = useState<number | null>(null);
  const { data: adjustments, isLoading: adjLoading } = trpc.inventory.adjustments.useQuery(
    { inventoryId: historyInventoryId ?? 0 },
    { enabled: tab === "history" && historyInventoryId !== null }
  );

  const adjustMutation = trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      toast.success("库存调整成功");
      setAdjustTarget(null);
      setAdjustQty("");
      setAdjustReason("");
      refetchInventory();
    },
    onError: (e) => toast.error(e.message),
  });

  const alertCount = inventory?.items?.filter(i => i.inv.isAlert).length ?? 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">库存仓库管理</h1>
          <p className="text-sm text-muted-foreground mt-1">多仓库库存监控、预警与调整记录</p>
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {alertCount} 项库存预警
          </div>
        )}
      </div>

      {/* Warehouse Summary */}
      {warehouses && warehouses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <button
              key={w.id}
              onClick={() => setWarehouseId(warehouseId === w.id ? undefined : w.id)}
              className={cn(
                "bg-card rounded-xl border p-4 text-left transition-all",
                warehouseId === w.id ? "border-primary/50 bg-primary/5" : "border-border hover:border-border/80"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Warehouse className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{w.name}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full ml-auto",
                  w.status === "active" ? "text-emerald-400 bg-emerald-400/10" : "text-slate-400 bg-slate-400/10"
                )}>
                  {w.status === "active" ? "运营中" : "停用"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{w.location ?? "-"} · {w.country ?? "-"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                类型: {w.type === "owned" ? "自有仓" : w.type === "fba" ? "FBA 仓" : w.type === "3pl" ? "三方仓" : "保税仓"}
                {w.capacity && ` · 容量 ${w.capacity.toLocaleString()}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="all" className="text-xs">全部库存</TabsTrigger>
          <TabsTrigger value="alert" className="text-xs">
            预警库存
            {alertCount > 0 && (
              <span className="ml-1.5 bg-amber-400/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full">{alertCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs" onClick={() => { if (tab !== "history") setHistoryInventoryId(null); }}>调整历史</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Adjustment History Tab */}
      {tab === "history" && (
        <div className="space-y-3">
          {historyInventoryId === null ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground mb-3">请先在库存列表中点击某一商品的「调整」按鈕，将在此展示该商品的调整历史</p>
              <Button variant="outline" size="sm" onClick={() => setTab("all")}>返回库存列表</Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
                <span className="text-xs text-muted-foreground">库存 ID: {historyInventoryId} 的调整记录</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setHistoryInventoryId(null)}>清除选择</Button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">类型</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">数量</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">原因</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {adjLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : !adjustments || adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground text-sm">暂无调整记录</td>
                    </tr>
                  ) : (
                    adjustments.map((adj) => {
                      const TYPE_MAP: Record<string, { label: string; color: string; sign: string }> = {
                        inbound: { label: "入库", color: "text-emerald-400", sign: "+" },
                        outbound: { label: "出库", color: "text-red-400", sign: "-" },
                        adjustment: { label: "盘点", color: "text-blue-400", sign: "±" },
                        damage: { label: "损耗", color: "text-amber-400", sign: "-" },
                        transfer: { label: "调拨", color: "text-purple-400", sign: "⇄" },
                      };
                      const tc = TYPE_MAP[adj.type] ?? { label: adj.type, color: "text-muted-foreground", sign: "" };
                      return (
                        <tr key={adj.id} className="border-b border-border/50 table-row-hover">
                          <td className="px-4 py-3">
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", tc.color)}>{tc.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn("text-xs font-bold", tc.color)}>{tc.sign}{adj.quantity}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">{adj.reason ?? "-"}</span>
                          </td>
                          <td className="px-4 py-3 text-right hidden xl:table-cell">
                            <span className="text-[10px] text-muted-foreground">{new Date(adj.createdAt).toLocaleString("zh-CN")}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">商品</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">仓库</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">在库数量</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">预留数量</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">可用数量</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">在途数量</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 mx-auto" /></td>
                </tr>
              ))
            ) : (inventory?.items?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无库存数据
                </td>
              </tr>
            ) : (
              inventory!.items.map(({ inv, product, warehouse }) => (
                <tr key={inv.id} className={cn("border-b border-border/50 table-row-hover transition-colors", inv.isAlert && "bg-amber-400/5")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {inv.isAlert && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <div>
                        <div className="text-xs font-medium text-foreground">{product?.name ?? "未知商品"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{product?.sku ?? "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{warehouse?.name ?? "-"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-xs font-semibold", inv.isAlert ? "text-amber-400" : "text-foreground")}>
                      {inv.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{inv.reservedQty ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-foreground">{inv.availableQty ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden xl:table-cell">
                    <span className="text-xs text-muted-foreground">{inv.inboundQty ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {inv.isAlert ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10 font-medium">库存预警</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-400/10 font-medium">正常</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => { setAdjustTarget({ inv, product, warehouse }); setAdjustType("inbound"); setAdjustQty(""); setAdjustReason(""); setHistoryInventoryId(inv.id); }}>
                      <ArrowUpDown className="w-3 h-3 mr-1" /> 调整
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Inventory Adjust Dialog */}
      <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">库存调整</DialogTitle>
          </DialogHeader>
          {adjustTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs font-medium">{adjustTarget.product?.name ?? "未知商品"}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{adjustTarget.product?.sku} · {adjustTarget.warehouse?.name}</div>
                <div className="text-sm font-bold mt-1">当前库存: {adjustTarget.inv.quantity} 件</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">调整类型</Label>
                <Select value={adjustType} onValueChange={setAdjustType}>
                  <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">入库</SelectItem>
                    <SelectItem value="outbound">出库</SelectItem>
                    <SelectItem value="adjustment">盘点调整</SelectItem>
                    <SelectItem value="damage">损耗报废</SelectItem>
                    <SelectItem value="transfer">调拨转移</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">调整数量</Label>
                <Input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} className="h-8 text-sm bg-background" placeholder="输入数量" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">调整原因（可选）</Label>
                <Input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="h-8 text-sm bg-background" placeholder="如：定期盘点、入库单号" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAdjustTarget(null)}>取消</Button>
            <Button size="sm" disabled={adjustMutation.isPending || !adjustQty || parseInt(adjustQty) < 1} onClick={() => {
              if (adjustTarget) adjustMutation.mutate({
                inventoryId: adjustTarget.inv.id,
                type: adjustType as any,
                quantity: parseInt(adjustQty),
                reason: adjustReason || undefined,
              });
            }}>
              {adjustMutation.isPending ? "调整中..." : "确认调整"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
