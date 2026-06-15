import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Plus, Users, ChevronLeft, ChevronRight, X, Globe, Mail, Building2, Eye, Edit, Phone, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  vip: { label: "VIP", color: "text-amber-400 bg-amber-400/10" },
  regular: { label: "普通", color: "text-blue-400 bg-blue-400/10" },
  new: { label: "新客", color: "text-emerald-400 bg-emerald-400/10" },
};

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  amazon: { label: "Amazon", color: "text-orange-400" },
  shopify: { label: "Shopify", color: "text-emerald-400" },
  alibaba: { label: "Alibaba", color: "text-amber-400" },
  direct: { label: "直接", color: "text-blue-400" },
  other: { label: "其他", color: "text-slate-400" },
};

export default function Customers() {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [editCustomer, setEditCustomer] = useState<any>(null);

  const { data, isLoading, refetch } = trpc.customers.list.useQuery({
    search: search || undefined,
    tier: tier !== "all" ? tier : undefined,
    page, pageSize: 15,
  });

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => { toast.success("客户创建成功"); setShowCreate(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => { toast.success("客户更新成功"); setEditCustomer(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const { data: customerOrders } = trpc.customers.getOrders.useQuery(
    { customerId: detailCustomer?.id ?? 0 },
    { enabled: !!detailCustomer?.id }
  );

  const totalPages = Math.ceil((data?.total ?? 0) / 15);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">客户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理客户信息、分层与交易记录</p>
        </div>
        <Button size="sm" className="glow-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> 新增客户
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索客户名称、邮箱或公司..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-sm bg-card border-border"
          />
        </div>
        <Select value={tier} onValueChange={v => { setTier(v); setPage(1); }}>
          <SelectTrigger className="w-28 h-8 text-sm bg-card border-border">
            <SelectValue placeholder="等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="regular">普通</SelectItem>
            <SelectItem value="new">新客</SelectItem>
          </SelectContent>
        </Select>
        {(search || tier !== "all") && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => { setSearch(""); setTier("all"); setPage(1); }}>
            <X className="w-3 h-3 mr-1" /> 清除
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">共 {data?.total ?? 0} 位客户</span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">客户信息</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">公司 / 国家</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">来源平台</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">订单数</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">累计消费</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">等级</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-12 mx-auto" /></td>
                </tr>
              ))
            ) : (data?.items?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无客户数据
                </td>
              </tr>
            ) : (
              data!.items.map(c => (
                <tr key={c.id} className="border-b border-border/50 table-row-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-xs">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5" />
                      {c.email ?? "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-xs text-foreground">{c.company ?? "-"}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Globe className="w-2.5 h-2.5" />
                      {c.country ?? "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={cn("text-xs font-medium", PLATFORM_CONFIG[c.platform ?? "other"]?.color)}>
                      {PLATFORM_CONFIG[c.platform ?? "other"]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-foreground">{c.totalOrders ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold text-foreground">${parseFloat(c.totalSpend ?? "0").toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", TIER_CONFIG[c.tier ?? "new"]?.color)}>
                      {TIER_CONFIG[c.tier ?? "new"]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDetailCustomer(c)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditCustomer(c)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
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

      {/* Customer Detail Sheet */}
      <Sheet open={!!detailCustomer} onOpenChange={(o) => !o && setDetailCustomer(null)}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto bg-card border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-heading">
              <Users className="h-4 w-4 text-primary" /> 客户详情
            </SheetTitle>
          </SheetHeader>
          {detailCustomer && (
            <div className="mt-5 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold">{detailCustomer.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className={cn("text-xs", TIER_CONFIG[detailCustomer.tier ?? "new"]?.color)}>
                      {TIER_CONFIG[detailCustomer.tier ?? "new"]?.label}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", PLATFORM_CONFIG[detailCustomer.platform ?? "other"]?.color)}>
                      {PLATFORM_CONFIG[detailCustomer.platform ?? "other"]?.label}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setDetailCustomer(null); setEditCustomer(detailCustomer); }}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" /> 编辑
                </Button>
              </div>

              <div className="space-y-2">
                {detailCustomer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{detailCustomer.email}</span>
                  </div>
                )}
                {detailCustomer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{detailCustomer.phone}</span>
                  </div>
                )}
                {detailCustomer.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{detailCustomer.company}</span>
                  </div>
                )}
                {detailCustomer.country && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{detailCustomer.country}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">订单数</div>
                  <div className="text-xl font-bold mt-0.5">{detailCustomer.totalOrders ?? 0}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">累计消费</div>
                  <div className="text-xl font-bold mt-0.5 text-primary">${parseFloat(detailCustomer.totalSpend ?? "0").toLocaleString()}</div>
                </div>
              </div>

              {customerOrders && customerOrders.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5" /> 最近订单
                    </h4>
                    <div className="space-y-2">
                      {customerOrders.slice(0, 5).map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40">
                          <div>
                            <div className="font-mono font-medium">{o.orderNo}</div>
                            <div className="text-muted-foreground">{o.platform}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${parseFloat(o.totalAmount ?? "0").toLocaleString()}</div>
                            <div className="text-muted-foreground">{o.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {detailCustomer.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">备注</h4>
                    <p className="text-sm text-muted-foreground">{detailCustomer.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Customer Dialog */}
      {editCustomer && (
        <Dialog open={!!editCustomer} onOpenChange={(o) => !o && setEditCustomer(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">编辑客户</DialogTitle>
            </DialogHeader>
            <CustomerForm
              initialData={editCustomer}
              onSave={(d) => updateMutation.mutate({ id: editCustomer.id, ...d })}
              loading={updateMutation.isPending}
              onClose={() => setEditCustomer(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">新增客户</DialogTitle>
          </DialogHeader>
          <CustomerForm onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerForm({ onSave, loading, onClose, initialData }: { onSave: (d: any) => void; loading: boolean; onClose: () => void; initialData?: any }) {
  const [form, setForm] = useState({ name: initialData?.name ?? "", email: initialData?.email ?? "", phone: initialData?.phone ?? "", company: initialData?.company ?? "", country: initialData?.country ?? "", platform: initialData?.platform ?? "direct", tier: initialData?.tier ?? "new", notes: initialData?.notes ?? "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">姓名 *</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm bg-background" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">邮箱</Label>
          <Input value={form.email} onChange={e => set("email", e.target.value)} className="h-8 text-sm bg-background" type="email" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">公司</Label>
          <Input value={form.company} onChange={e => set("company", e.target.value)} className="h-8 text-sm bg-background" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">国家</Label>
          <Input value={form.country} onChange={e => set("country", e.target.value)} className="h-8 text-sm bg-background" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">来源平台</Label>
          <Select value={form.platform} onValueChange={v => set("platform", v)}>
            <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="amazon">Amazon</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="alibaba">Alibaba</SelectItem>
              <SelectItem value="direct">直接</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">客户等级</Label>
          <Select value={form.tier} onValueChange={v => set("tier", v)}>
            <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="regular">普通</SelectItem>
              <SelectItem value="new">新客</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={loading || !form.name}>
          {loading ? "保存中..." : "保存"}
        </Button>
      </DialogFooter>
    </div>
  );
}
