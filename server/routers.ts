import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  upsertUser, getUserByOpenId,
  getDashboardStats, getDashboardTrend,
  getProducts, getProductById, createProduct, updateProduct,
  getCustomers, getCustomerById, createCustomer, updateCustomer, getCustomerOrders,
  getOrders, getOrderById, createOrder, updateOrder, getOrderItems,
  getAdCampaigns, getAdGroups, createAdCampaign, updateAdCampaign,
  getInventory, getWarehouses, getInventoryAdjustments, adjustInventory,
  getInquiries, getInquiryById, getQuotes, getQuoteById, createQuote, updateInquiry, updateQuote,
  getAgentSuggestions, reviewAgentSuggestion,
  getApprovalTasks, getApprovalTaskById, getApprovalHistory, processApproval, getPendingApprovalCount,
  getAuditLogs, writeAuditLog,
  getNotifications, getUnreadNotificationCount, markNotificationsRead,
  seedDemoData,
} from "./db";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
  logout: protectedProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
    return { success: true };
  }),
});

// ─── Notifications ────────────────────────────────────────────────────────────
const notificationsRouter = router({
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getUnreadNotificationCount(ctx.user.id);
    return { count };
  }),
  list: protectedProcedure.input(z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    return getNotifications(ctx.user.id, input);
  }),
  markRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});

// ─── Approvals ────────────────────────────────────────────────────────────────
const approvalsRouter = router({
  pendingCount: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const count = await getPendingApprovalCount(tenantId);
    return { count };
  }),
  list: protectedProcedure.input(z.object({
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getApprovalTasks(tenantId, input);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    const task = await getApprovalTaskById(input.id);
    const history = task ? await getApprovalHistory(task.id) : [];
    return { task, history };
  }),
  process: protectedProcedure.input(z.object({
    id: z.number().int(),
    action: z.enum(["approved", "rejected", "transferred"]),
    comment: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await processApproval(input.id, input.action, ctx.user.id, ctx.user.name ?? "用户", input.comment);
    await writeAuditLog({
      tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户",
      module: "approvals", action: input.action,
      targetId: String(input.id), targetName: `审批任务 #${input.id}`,
      detail: { comment: input.comment },
    });
    return { success: true };
  }),
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getDashboardStats(tenantId);
  }),
  trend: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getDashboardTrend(tenantId);
  }),
});

// ─── Products ─────────────────────────────────────────────────────────────────
const productsRouter = router({
  list: protectedProcedure.input(z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getProducts(tenantId, input);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    return getProductById(input.id);
  }),
  create: protectedProcedure.input(z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    category: z.string().optional(),
    status: z.enum(["active", "inactive", "draft"]).default("active"),
    costPrice: z.string().optional(),
    amazonPrice: z.string().optional(),
    shopifyPrice: z.string().optional(),
    alibabaPrice: z.string().optional(),
    amazonStock: z.number().int().optional(),
    shopifyStock: z.number().int().optional(),
    warehouseStock: z.number().int().optional(),
    lowStockThreshold: z.number().int().optional(),
    tags: z.string().optional(),
    description: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await createProduct({ ...input, tenantId });
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "products", action: "create", targetName: input.name });
    return { success: true };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number().int(),
    name: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(["active", "inactive", "draft"]).optional(),
    costPrice: z.string().optional(),
    amazonPrice: z.string().optional(),
    shopifyPrice: z.string().optional(),
    alibabaPrice: z.string().optional(),
    amazonStock: z.number().int().optional(),
    shopifyStock: z.number().int().optional(),
    warehouseStock: z.number().int().optional(),
    lowStockThreshold: z.number().int().optional(),
    tags: z.string().optional(),
    description: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const { id, ...data } = input;
    await updateProduct(id, data);
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "products", action: "update", targetId: String(id) });
    return { success: true };
  }),
});

// ─── Customers ────────────────────────────────────────────────────────────────
const customersRouter = router({
  list: protectedProcedure.input(z.object({
    search: z.string().optional(),
    tier: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getCustomers(tenantId, input);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    return getCustomerById(input.id);
  }),
  getOrders: protectedProcedure.input(z.object({ customerId: z.number().int() })).query(async ({ input }) => {
    return getCustomerOrders(input.customerId);
  }),
  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    country: z.string().optional(),
    platform: z.enum(["amazon", "shopify", "alibaba", "direct", "other"]).optional(),
    tier: z.enum(["vip", "regular", "new"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await createCustomer({ ...input, tenantId });
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "customers", action: "create", targetName: input.name });
    return { success: true };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number().int(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    country: z.string().optional(),
    platform: z.enum(["amazon", "shopify", "alibaba", "direct", "other"]).optional(),
    tier: z.enum(["vip", "regular", "new"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const { id, ...data } = input;
    await updateCustomer(id, data);
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "customers", action: "update", targetId: String(id) });
    return { success: true };
  }),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
const ordersRouter = router({
  list: protectedProcedure.input(z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    platform: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getOrders(tenantId, input);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    const order = await getOrderById(input.id);
    const items = order ? await getOrderItems(order.id) : [];
    return { order, items };
  }),
  create: protectedProcedure.input(z.object({
    orderNo: z.string().min(1),
    platform: z.enum(["amazon", "shopify", "alibaba", "direct", "other"]).optional(),
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
    totalAmount: z.string(),
    currency: z.string().optional(),
    itemCount: z.number().int().optional(),
    shippingAddress: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await createOrder({ ...input, tenantId });
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "orders", action: "create", targetName: input.orderNo });
    return { success: true };
  }),
  updateStatus: protectedProcedure.input(z.object({
    id: z.number().int(),
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
    trackingNo: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const { id, ...data } = input;
    await updateOrder(id, data);
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "orders", action: `status_${input.status}`, targetId: String(id) });
    return { success: true };
  }),
});

// ─── Ads ──────────────────────────────────────────────────────────────────────
const adsRouter = router({
  campaigns: protectedProcedure.input(z.object({
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getAdCampaigns(tenantId, input);
  }),
  groups: protectedProcedure.input(z.object({ campaignId: z.number().int() })).query(async ({ input }) => {
    return getAdGroups(input.campaignId);
  }),
  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    platform: z.enum(["amazon", "google", "meta", "tiktok", "other"]).optional(),
    status: z.enum(["active", "paused", "ended", "draft"]).optional(),
    budget: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const { startDate, endDate, ...rest } = input;
    await createAdCampaign({
      ...rest,
      tenantId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "ads", action: "create", targetName: input.name });
    return { success: true };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number().int(),
    name: z.string().optional(),
    status: z.enum(["active", "paused", "ended", "draft"]).optional(),
    budget: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const { id, ...data } = input;
    await updateAdCampaign(id, data);
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "ads", action: "update", targetId: String(id) });
    return { success: true };
  }),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
const inventoryRouter = router({
  list: protectedProcedure.input(z.object({
    alert: z.boolean().optional(),
    warehouseId: z.number().int().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getInventory(tenantId, input);
  }),
  warehouses: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getWarehouses(tenantId);
  }),
  adjustments: protectedProcedure.input(z.object({ inventoryId: z.number().int() })).query(async ({ input }) => {
    return getInventoryAdjustments(input.inventoryId);
  }),
  adjust: protectedProcedure.input(z.object({
    inventoryId: z.number().int(),
    type: z.enum(["inbound", "outbound", "adjustment", "transfer", "damage"]),
    quantity: z.number().int().min(1),
    reason: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await adjustInventory(input.inventoryId, input.type, input.quantity, input.reason, ctx.user.id);
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "inventory", action: `adjust_${input.type}`, targetId: String(input.inventoryId), detail: { quantity: input.quantity, reason: input.reason } });
    return { success: true };
  }),
});

// ─── Inquiries ────────────────────────────────────────────────────────────────
const inquiriesRouter = router({
  list: protectedProcedure.input(z.object({
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getInquiries(tenantId, input);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    return getInquiryById(input.id);
  }),
  updateStatus: protectedProcedure.input(z.object({
    id: z.number().int(),
    status: z.enum(["new", "processing", "quoted", "negotiating", "won", "lost", "converted"]),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await updateInquiry(input.id, { status: input.status });
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "inquiries", action: `status_${input.status}`, targetId: String(input.id) });
    return { success: true };
  }),
  quotes: protectedProcedure.input(z.object({
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getQuotes(tenantId, input);
  }),
  getQuoteById: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    return getQuoteById(input.id);
  }),
  createQuote: protectedProcedure.input(z.object({
    quoteNo: z.string().min(1),
    inquiryId: z.number().int().optional(),
    customerId: z.number().int().optional(),
    totalAmount: z.string().optional(),
    currency: z.string().optional(),
    notes: z.string().optional(),
    items: z.any().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await createQuote({ ...input, tenantId, createdBy: ctx.user.id });
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "inquiries", action: "create_quote", targetName: input.quoteNo });
    return { success: true };
  }),
  updateQuote: protectedProcedure.input(z.object({
    id: z.number().int(),
    status: z.enum(["draft", "pending_approval", "approved", "sent", "accepted", "rejected", "expired"]).optional(),
    totalAmount: z.string().optional(),
    notes: z.string().optional(),
    items: z.any().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const { id, ...data } = input;
    await updateQuote(id, data);
    await writeAuditLog({ tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户", module: "inquiries", action: "update_quote", targetId: String(id) });
    return { success: true };
  }),
});

// ─── Agent ────────────────────────────────────────────────────────────────────
const agentRouter = router({
  suggestions: protectedProcedure.input(z.object({
    status: z.string().optional(),
    type: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getAgentSuggestions(tenantId, input);
  }),
  review: protectedProcedure.input(z.object({
    id: z.number().int(),
    status: z.enum(["accepted", "rejected", "suspended"]),
    reviewNote: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    await reviewAgentSuggestion(input.id, input.status, ctx.user.id, input.reviewNote);
    await writeAuditLog({
      tenantId, userId: ctx.user.id, userName: ctx.user.name ?? "用户",
      module: "agent", action: `suggestion_${input.status}`,
      targetId: String(input.id), detail: { reviewNote: input.reviewNote },
    });
    return { success: true };
  }),
});

// ─── Audit ────────────────────────────────────────────────────────────────────
const auditRouter = router({
  list: protectedProcedure.input(z.object({
    module: z.string().optional(),
    userId: z.number().int().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(50),
  })).query(async ({ ctx, input }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    return getAuditLogs(tenantId, input);
  }),
});

// ─── Seed ─────────────────────────────────────────────────────────────────────
const seedRouter = router({
  init: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId ?? 1;
    const result = await seedDemoData(tenantId, ctx.user.id);
    return result;
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  notifications: notificationsRouter,
  approvals: approvalsRouter,
  dashboard: dashboardRouter,
  products: productsRouter,
  customers: customersRouter,
  orders: ordersRouter,
  ads: adsRouter,
  inventory: inventoryRouter,
  inquiries: inquiriesRouter,
  agent: agentRouter,
  audit: auditRouter,
  seed: seedRouter,
});

export type AppRouter = typeof appRouter;
