import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, FileText, Plus, ChevronLeft, ChevronRight, X, Eye, Send, ShoppingCart, Edit2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const INQUIRY_STATUS: Record<string, { label: string; color: string }> = {
  new: { label: "新询盘", color: "text-blue-400 bg-blue-400/10" },
  processing: { label: "跟进中", color: "text-amber-400 bg-amber-400/10" },
  quoted: { label: "已报价", color: "text-purple-400 bg-purple-400/10" },
  negotiating: { label: "谈判中", color: "text-cyan-400 bg-cyan-400/10" },
  won: { label: "已成交", color: "text-emerald-400 bg-emerald-400/10" },
  lost: { label: "已丢失", color: "text-red-400 bg-red-400/10" },
  converted: { label: "已转单", color: "text-slate-400 bg-slate-400/10" },
};

const QUOTE_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "text-slate-400 bg-slate-400/10" },
  pending_approval: { label: "待审批", color: "text-amber-400 bg-amber-400/10" },
  approved: { label: "已批准", color: "text-emerald-400 bg-emerald-400/10" },
  sent: { label: "已发送", color: "text-blue-400 bg-blue-400/10" },
  accepted: { label: "已接受", color: "text-emerald-400 bg-emerald-400/10" },
  rejected: { label: "已拒绝", color: "text-red-400 bg-red-400/10" },
  expired: { label: "已过期", color: "text-slate-400 bg-slate-400/10" },
};

export default function Inquiries() {
  const [tab, setTab] = useState<"inquiries" | "quotes">("inquiries");
  const [inqStatus, setInqStatus] = useState("all");
  const [quoteStatus, setQuoteStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreateQuote, setShowCreateQuote] = useState(false);

  const { data: inquiries, isLoading: inqLoading, refetch: refetchInq } = trpc.inquiries.list.useQuery({
    status: inqStatus !== "all" ? inqStatus : undefined,
    page, pageSize: 15,
  }, { enabled: tab === "inquiries" });

  const { data: quotes, isLoading: quoteLoading, refetch: refetchQuotes } = trpc.inquiries.quotes.useQuery({
    status: quoteStatus !== "all" ? quoteStatus : undefined,
    page, pageSize: 15,
  }, { enabled: tab === "quotes" });

  const [detailInq, setDetailInq] = useState<any>(null);
  const [editQuote, setEditQuote] = useState<any>(null);
  const [editQuoteForm, setEditQuoteForm] = useState({ totalAmount: "", currency: "USD", notes: "", validDays: "30" });
  const [convertTarget, setConvertTarget] = useState<any>(null);
  const [convertForm, setConvertForm] = useState({ platform: "direct", currency: "USD" });

  const createQuoteMutation = trpc.inquiries.createQuote.useMutation({
    onSuccess: () => { toast.success("报价单创建成功"); setShowCreateQuote(false); refetchQuotes(); },
    onError: (e) => toast.error(e.message),
  });

  const updateStatusMutation = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => { toast.success("询盘状态已更新"); refetchInq(); setDetailInq(null); },
    onError: (e) => toast.error(e.message),
  });

  const updateQuoteMutation = trpc.inquiries.updateQuote.useMutation({
    onSuccess: () => { toast.success("报价单已更新"); setEditQuote(null); refetchQuotes(); },
    onError: (e) => toast.error(e.message),
  });

  const convertToOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("询盘已成功转为订单");
      setConvertTarget(null);
      if (convertTarget) updateStatusMutation.mutate({ id: convertTarget.id, status: "converted" });
    },
    onError: (e) => toast.error(e.message),
  });

  const submitForApprovalMutation = trpc.inquiries.updateQuote.useMutation({
    onSuccess: () => { toast.success("报价单已提交审批"); setEditQuote(null); refetchQuotes(); },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.ceil(((tab === "inquiries" ? inquiries?.total : quotes?.total) ?? 0) / 15);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading gradient-text">询盘报价管理</h1>
          <p className="text-sm text-muted-foreground mt-1">询盘跟进、报价创建与审批流程</p>
        </div>
        {tab === "quotes" && (
          <Button size="sm" className="glow-primary" onClick={() => setShowCreateQuote(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> 新建报价单
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Tabs value={tab} onValueChange={v => { setTab(v as any); setPage(1); }}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="inquiries" className="text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              询盘列表
              {inquiries?.total != null && <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{inquiries.total}</span>}
            </TabsTrigger>
            <TabsTrigger value="quotes" className="text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              报价单
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "inquiries" ? (
          <Select value={inqStatus} onValueChange={v => { setInqStatus(v); setPage(1); }}>
            <SelectTrigger className="w-28 h-8 text-sm bg-card border-border">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(INQUIRY_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={quoteStatus} onValueChange={v => { setQuoteStatus(v); setPage(1); }}>
            <SelectTrigger className="w-28 h-8 text-sm bg-card border-border">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(QUOTE_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Inquiries Table */}
      {tab === "inquiries" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">询盘编号 / 客户</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">主题</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">来源</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">预估金额</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">更新时间</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {inqLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 mx-auto" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : (inquiries?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground text-sm">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    暂无询盘数据
                  </td>
                </tr>
              ) : (
                inquiries!.items.map(inq => (
                  <tr key={inq.id} className="border-b border-border/50 table-row-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-medium text-foreground">{inq.inquiryNo}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{inq.customerName ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-foreground line-clamp-1">{inq.subject ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">{inq.platform ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-foreground">
                        {inq.estimatedValue ? `$${parseFloat(inq.estimatedValue).toLocaleString()}` : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", INQUIRY_STATUS[inq.status]?.color)}>
                        {INQUIRY_STATUS[inq.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(inq.updatedAt).toLocaleDateString("zh-CN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDetailInq(inq)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        {inq.status !== "converted" && inq.status !== "lost" && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-400" title="转订单" onClick={() => { setConvertTarget(inq); setConvertForm({ platform: "direct", currency: "USD" }); }}>
                            <ShoppingCart className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Quotes Table */}
      {tab === "quotes" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">报价单号</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">金额</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">货币</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">创建时间</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {quoteLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 mx-auto" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : (quotes?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    暂无报价单
                  </td>
                </tr>
              ) : (
                quotes!.items.map(q => (
                  <tr key={q.id} className="border-b border-border/50 table-row-hover transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-foreground">{q.quoteNo}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-foreground">
                        {q.totalAmount ? `$${parseFloat(q.totalAmount).toLocaleString()}` : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{q.currency ?? "USD"}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", QUOTE_STATUS[q.status]?.color)}>
                        {QUOTE_STATUS[q.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(q.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(q.status === "draft" || q.status === "approved") && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="编辑" onClick={() => { setEditQuote(q); setEditQuoteForm({ totalAmount: q.totalAmount ?? "", currency: q.currency ?? "USD", notes: q.notes ?? "", validDays: "30" }); }}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        {q.status === "draft" && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-amber-400" title="提交审批" onClick={() => submitForApprovalMutation.mutate({ id: q.id, status: "pending_approval" })}>
                            <Send className="w-3 h-3" />
                          </Button>
                        )}
                        {q.status === "approved" && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-400" title="标记已发送" onClick={() => submitForApprovalMutation.mutate({ id: q.id, status: "sent" })}>
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Create Quote Dialog */}
      <Dialog open={showCreateQuote} onOpenChange={setShowCreateQuote}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">新建报价单</DialogTitle>
          </DialogHeader>
          <CreateQuoteForm onSave={(d) => createQuoteMutation.mutate(d)} loading={createQuoteMutation.isPending} onClose={() => setShowCreateQuote(false)} />
        </DialogContent>
      </Dialog>

      {/* Inquiry Detail Sheet */}
      <Sheet open={!!detailInq} onOpenChange={(o) => !o && setDetailInq(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto bg-card border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-heading">
              <MessageSquare className="h-4 w-4 text-primary" /> 询盘详情
            </SheetTitle>
          </SheetHeader>
          {detailInq && (
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-sm font-bold">{detailInq.inquiryNo}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{detailInq.customerName ?? "-"}</div>
                </div>
                <Badge variant="outline" className={cn("text-xs", INQUIRY_STATUS[detailInq.status]?.color)}>
                  {INQUIRY_STATUS[detailInq.status]?.label}
                </Badge>
              </div>

              {detailInq.subject && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">主题</div>
                  <div className="text-sm">{detailInq.subject}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">预估金额</div>
                  <div className="text-lg font-bold text-primary mt-0.5">
                    {detailInq.estimatedValue ? `$${parseFloat(detailInq.estimatedValue).toLocaleString()}` : "-"}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">来源平台</div>
                  <div className="text-sm font-medium mt-0.5 capitalize">{detailInq.platform ?? "-"}</div>
                </div>
              </div>

              {detailInq.content && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">询盘内容</div>
                  <div className="text-xs bg-muted/30 rounded-lg p-3 leading-relaxed">{detailInq.content}</div>
                </div>
              )}

              <Separator />
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">更新状态</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(INQUIRY_STATUS).filter(([k]) => k !== detailInq.status).map(([k, v]) => (
                    <Button key={k} variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateStatusMutation.mutate({ id: detailInq.id, status: k as any })}>
                      转为 {v.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                创建时间：{new Date(detailInq.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Quote Dialog */}
      <Dialog open={!!editQuote} onOpenChange={(o) => !o && setEditQuote(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">编辑报价单 - {editQuote?.quoteNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">总金额</Label>
                <Input type="number" step="0.01" value={editQuoteForm.totalAmount} onChange={e => setEditQuoteForm(f => ({ ...f, totalAmount: e.target.value }))} className="h-8 text-sm bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">货币</Label>
                <Select value={editQuoteForm.currency} onValueChange={v => setEditQuoteForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">有效天数</Label>
              <Input type="number" min="1" value={editQuoteForm.validDays} onChange={e => setEditQuoteForm(f => ({ ...f, validDays: e.target.value }))} className="h-8 text-sm bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">备注</Label>
              <Textarea value={editQuoteForm.notes} onChange={e => setEditQuoteForm(f => ({ ...f, notes: e.target.value }))} className="text-sm bg-background min-h-[80px]" placeholder="报价备注、优惠条件等" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditQuote(null)}>取消</Button>
            <Button variant="outline" size="sm" disabled={submitForApprovalMutation.isPending} onClick={() => {
              if (editQuote) {
                updateQuoteMutation.mutate({ id: editQuote.id, totalAmount: editQuoteForm.totalAmount || undefined, notes: editQuoteForm.notes || undefined });
              }
            }}>保存草稿</Button>
            <Button size="sm" disabled={submitForApprovalMutation.isPending} onClick={() => {
              if (editQuote) {
                updateQuoteMutation.mutate({ id: editQuote.id, totalAmount: editQuoteForm.totalAmount || undefined, notes: editQuoteForm.notes || undefined, status: "pending_approval" });
              }
            }}>
              <Send className="w-3.5 h-3.5 mr-1.5" /> 提交审批
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Order Dialog */}
      <Dialog open={!!convertTarget} onOpenChange={(o) => !o && setConvertTarget(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">询盘转订单</DialogTitle>
          </DialogHeader>
          {convertTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs font-medium">{convertTarget.inquiryNo}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{convertTarget.customerName ?? "-"}</div>
                {convertTarget.estimatedValue && (
                  <div className="text-sm font-bold text-primary mt-1">预估金额: ${parseFloat(convertTarget.estimatedValue).toLocaleString()}</div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">订单平台</Label>
                <Select value={convertForm.platform} onValueChange={v => setConvertForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">直接客户</SelectItem>
                    <SelectItem value="alibaba">Alibaba</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">订单货币</Label>
                <Select value={convertForm.currency} onValueChange={v => setConvertForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConvertTarget(null)}>取消</Button>
            <Button size="sm" disabled={convertToOrderMutation.isPending} onClick={() => {
              if (convertTarget) convertToOrderMutation.mutate({
                orderNo: `ORD-${Date.now()}`,
                platform: convertForm.platform as any,
                currency: convertForm.currency,
                totalAmount: convertTarget.estimatedValue ?? "0",
                status: "pending",
              });
            }}>
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> 确认转单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateQuoteForm({ onSave, loading, onClose }: { onSave: (d: any) => void; loading: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ quoteNo: `QT-${Date.now()}`, totalAmount: "", currency: "USD", notes: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">报价单号 *</Label>
          <Input value={form.quoteNo} onChange={e => set("quoteNo", e.target.value)} className="h-8 text-sm bg-background" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">总金额</Label>
          <Input value={form.totalAmount} onChange={e => set("totalAmount", e.target.value)} className="h-8 text-sm bg-background" type="number" step="0.01" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">货币</Label>
          <Select value={form.currency} onValueChange={v => set("currency", v)}>
            <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CNY">CNY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={loading || !form.quoteNo}>
          {loading ? "创建中..." : "创建报价单"}
        </Button>
      </DialogFooter>
    </div>
  );
}
