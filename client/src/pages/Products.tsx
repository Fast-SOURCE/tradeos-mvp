import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Plus, Package, Edit, ChevronLeft, ChevronRight, X, Eye, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "在售", color: "text-emerald-400 bg-emerald-400/10" },
  inactive: { label: "停售", color: "text-slate-400 bg-slate-400/10" },
  draft: { label: "草稿", color: "text-amber-400 bg-amber-400/10" },
};

export default function Products() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);

  const { data, isLoading, refetch } = trpc.products.list.useQuery({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    page, pageSize: 15,
  });

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("商品创建成功"); setShowCreate(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("商品更新成功"); setEditProduct(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 15);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">SKU 商品管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理多平台商品信息、价格与库存</p>
        </div>
        <Button size="sm" className="glow-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> 新增商品
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索商品名称或 SKU..."
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
            <SelectItem value="active">在售</SelectItem>
            <SelectItem value="inactive">停售</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
          </SelectContent>
        </Select>
        {(search || status !== "all") && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => { setSearch(""); setStatus("all"); setPage(1); }}>
            <X className="w-3 h-3 mr-1" /> 清除筛选
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">共 {data?.total ?? 0} 件商品</span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">SKU / 商品名称</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">分类</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">成本价</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Amazon</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Shopify</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">仓库库存</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-12 mx-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-12 ml-auto" /></td>
                </tr>
              ))
            ) : (data?.items?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无商品数据
                </td>
              </tr>
            ) : (
              data!.items.map(p => {
                const isLowStock = (p.warehouseStock ?? 0) <= (p.lowStockThreshold ?? 50) && (p.warehouseStock ?? 0) > 0;
                const isOutOfStock = (p.amazonStock ?? 0) === 0;
                return (
                  <tr key={p.id} className="border-b border-border/50 table-row-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground text-xs">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{p.category ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-foreground">${p.costPrice ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <div className="text-xs font-medium text-foreground">${p.amazonPrice ?? "-"}</div>
                      {isOutOfStock && <div className="text-[10px] text-red-400">缺货</div>}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-xs font-medium text-foreground">${p.shopifyPrice ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className={cn("text-xs font-medium", isLowStock ? "text-amber-400" : "text-foreground")}>
                        {p.warehouseStock ?? 0}
                        {isLowStock && <span className="ml-1 text-[10px]">⚠</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_CONFIG[p.status]?.color)}>
                        {STATUS_CONFIG[p.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDetailProduct(p)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditProduct(p)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Detail Sheet */}
      <Sheet open={!!detailProduct} onOpenChange={(o) => !o && setDetailProduct(null)}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto bg-card border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-heading">
              <Package className="h-4 w-4 text-primary" /> 商品详情
            </SheetTitle>
            <SheetDescription className="font-mono text-xs">{detailProduct?.sku}</SheetDescription>
          </SheetHeader>
          {detailProduct && (
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="text-base font-semibold">{detailProduct.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  {detailProduct.category && <Badge variant="outline" className="text-xs">{detailProduct.category}</Badge>}
                  <Badge variant="outline" className={cn("text-xs", STATUS_CONFIG[detailProduct.status]?.color)}>
                    {STATUS_CONFIG[detailProduct.status]?.label}
                  </Badge>
                </div>
                {detailProduct.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {detailProduct.tags.split(",").map((t: string) => (
                      <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                  <TrendingUp className="h-3.5 w-3.5" /> 平台价格对比
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "成本价", value: detailProduct.costPrice, cls: "text-muted-foreground" },
                    { label: "Amazon", value: detailProduct.amazonPrice, cls: "text-orange-400" },
                    { label: "Shopify", value: detailProduct.shopifyPrice, cls: "text-green-400" },
                    { label: "阿里巴巴", value: detailProduct.alibabaPrice, cls: "text-amber-400" },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-muted/30 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className={cn("text-base font-mono font-semibold mt-0.5", cls)}>
                        {value ? `$${value}` : "—"}
                      </div>
                      {value && detailProduct.costPrice && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          利润率 {(((parseFloat(value) - parseFloat(detailProduct.costPrice)) / parseFloat(value)) * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                  <Package className="h-3.5 w-3.5" /> 库存状态
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Amazon", value: detailProduct.amazonStock },
                    { label: "Shopify", value: detailProduct.shopifyStock },
                    { label: "仓库", value: detailProduct.warehouseStock },
                  ].map(({ label, value }) => {
                    const threshold = detailProduct.lowStockThreshold;
                    const isLow = value !== null && threshold !== null && value <= threshold && value > 0;
                    const isOut = value === 0;
                    return (
                      <div key={label} className={cn("rounded-lg p-3", isOut ? "bg-red-500/10 border border-red-500/20" : isLow ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/30")}>
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className={cn("text-lg font-mono font-bold mt-0.5", isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-foreground")}>{value ?? 0}</div>
                        {isOut && <div className="text-[10px] text-red-400">缺货</div>}
                        {isLow && <div className="text-[10px] text-amber-400">低库存</div>}
                      </div>
                    );
                  })}
                </div>
                {detailProduct.lowStockThreshold && (
                  <p className="text-xs text-muted-foreground mt-1.5">预警阈值：{detailProduct.lowStockThreshold} 件</p>
                )}
              </div>
              <div className="pt-2">
                <Button className="w-full" size="sm" onClick={() => { setDetailProduct(null); setEditProduct(detailProduct); }}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" /> 编辑商品
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <ProductDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
        title="新增商品"
      />

      {/* Edit Dialog */}
      {editProduct && (
        <ProductDialog
          open={!!editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(data) => updateMutation.mutate({ id: editProduct.id, ...data })}
          loading={updateMutation.isPending}
          title="编辑商品"
          initialData={editProduct}
        />
      )}
    </div>
  );
}

function ProductDialog({ open, onClose, onSave, loading, title, initialData }: {
  open: boolean; onClose: () => void; onSave: (data: any) => void;
  loading: boolean; title: string; initialData?: any;
}) {
  const [form, setForm] = useState({
    sku: initialData?.sku ?? "",
    name: initialData?.name ?? "",
    category: initialData?.category ?? "",
    status: initialData?.status ?? "active",
    costPrice: initialData?.costPrice ?? "",
    amazonPrice: initialData?.amazonPrice ?? "",
    shopifyPrice: initialData?.shopifyPrice ?? "",
    alibabaPrice: initialData?.alibabaPrice ?? "",
    amazonStock: initialData?.amazonStock?.toString() ?? "",
    shopifyStock: initialData?.shopifyStock?.toString() ?? "",
    warehouseStock: initialData?.warehouseStock?.toString() ?? "",
    lowStockThreshold: initialData?.lowStockThreshold?.toString() ?? "50",
    tags: initialData?.tags ?? "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">SKU *</Label>
            <Input value={form.sku} onChange={e => set("sku", e.target.value)} className="h-8 text-sm bg-background" disabled={!!initialData} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">状态</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">在售</SelectItem>
                <SelectItem value="inactive">停售</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">商品名称 *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm bg-background" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">分类</Label>
            <Input value={form.category} onChange={e => set("category", e.target.value)} className="h-8 text-sm bg-background" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">标签</Label>
            <Input value={form.tags} onChange={e => set("tags", e.target.value)} className="h-8 text-sm bg-background" placeholder="逗号分隔" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">成本价 ($)</Label>
            <Input value={form.costPrice} onChange={e => set("costPrice", e.target.value)} className="h-8 text-sm bg-background" type="number" step="0.01" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amazon 价格 ($)</Label>
            <Input value={form.amazonPrice} onChange={e => set("amazonPrice", e.target.value)} className="h-8 text-sm bg-background" type="number" step="0.01" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Shopify 价格 ($)</Label>
            <Input value={form.shopifyPrice} onChange={e => set("shopifyPrice", e.target.value)} className="h-8 text-sm bg-background" type="number" step="0.01" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alibaba 价格 ($)</Label>
            <Input value={form.alibabaPrice} onChange={e => set("alibabaPrice", e.target.value)} className="h-8 text-sm bg-background" type="number" step="0.01" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">仓库库存</Label>
            <Input value={form.warehouseStock} onChange={e => set("warehouseStock", e.target.value)} className="h-8 text-sm bg-background" type="number" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">预警阈值</Label>
            <Input value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", e.target.value)} className="h-8 text-sm bg-background" type="number" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={() => onSave({
            ...form,
            amazonStock: form.amazonStock ? parseInt(form.amazonStock) : undefined,
            shopifyStock: form.shopifyStock ? parseInt(form.shopifyStock) : undefined,
            warehouseStock: form.warehouseStock ? parseInt(form.warehouseStock) : undefined,
            lowStockThreshold: form.lowStockThreshold ? parseInt(form.lowStockThreshold) : undefined,
          })} disabled={loading || !form.sku || !form.name}>
            {loading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
