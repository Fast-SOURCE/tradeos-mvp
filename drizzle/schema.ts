import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["super_admin", "tenant_admin", "operator", "advertiser", "warehouse", "finance", "readonly", "admin", "user"]).default("readonly").notNull(),
  tenantId: int("tenantId"),
  avatar: text("avatar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Tenants ──────────────────────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  plan: mysqlEnum("plan", ["starter", "growth", "enterprise"]).default("starter").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "trial"]).default("trial").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SKU / Products ───────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  sku: varchar("sku", { length: 64 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 64 }),
  description: text("description"),
  imageUrl: text("imageUrl"),
  status: mysqlEnum("status", ["active", "inactive", "draft"]).default("active").notNull(),
  costPrice: decimal("costPrice", { precision: 12, scale: 2 }),
  amazonPrice: decimal("amazonPrice", { precision: 12, scale: 2 }),
  shopifyPrice: decimal("shopifyPrice", { precision: 12, scale: 2 }),
  alibabaPrice: decimal("alibabaPrice", { precision: 12, scale: 2 }),
  amazonStock: int("amazonStock").default(0),
  shopifyStock: int("shopifyStock").default(0),
  warehouseStock: int("warehouseStock").default(0),
  lowStockThreshold: int("lowStockThreshold").default(50),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: varchar("dimensions", { length: 64 }),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 128 }),
  country: varchar("country", { length: 64 }),
  platform: mysqlEnum("platform", ["amazon", "shopify", "alibaba", "direct", "other"]).default("direct"),
  tier: mysqlEnum("tier", ["vip", "regular", "new"]).default("new"),
  totalOrders: int("totalOrders").default(0),
  totalSpend: decimal("totalSpend", { precision: 14, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(),
  customerId: int("customerId"),
  platform: mysqlEnum("platform", ["amazon", "shopify", "alibaba", "direct", "other"]).default("direct"),
  status: mysqlEnum("status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  itemCount: int("itemCount").default(1),
  shippingAddress: text("shippingAddress"),
  trackingNo: varchar("trackingNo", { length: 128 }),
  notes: text("notes"),
  inquiryId: int("inquiryId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId"),
  sku: varchar("sku", { length: 64 }),
  name: varchar("name", { length: 256 }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
});

// ─── Ad Campaigns ─────────────────────────────────────────────────────────────
export const adCampaigns = mysqlTable("ad_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  platform: mysqlEnum("platform", ["amazon", "google", "meta", "tiktok", "other"]).default("amazon"),
  status: mysqlEnum("status", ["active", "paused", "ended", "draft"]).default("draft").notNull(),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0"),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  conversions: int("conversions").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  roi: decimal("roi", { precision: 8, scale: 4 }).default("0"),
  ctr: decimal("ctr", { precision: 8, scale: 4 }).default("0"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Ad Groups ────────────────────────────────────────────────────────────────
export const adGroups = mysqlTable("ad_groups", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  status: mysqlEnum("status", ["active", "paused", "ended"]).default("active").notNull(),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0"),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  ctr: decimal("ctr", { precision: 8, scale: 4 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const warehouses = mysqlTable("warehouses", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  code: varchar("code", { length: 32 }),
  location: varchar("location", { length: 256 }),
  country: varchar("country", { length: 64 }),
  type: mysqlEnum("type", ["owned", "3pl", "fba", "bonded"]).default("owned"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  capacity: int("capacity"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  productId: int("productId").notNull(),
  warehouseId: int("warehouseId").notNull(),
  quantity: int("quantity").default(0).notNull(),
  reservedQty: int("reservedQty").default(0),
  availableQty: int("availableQty").default(0),
  inboundQty: int("inboundQty").default(0),
  lowStockThreshold: int("lowStockThreshold").default(50),
  isAlert: boolean("isAlert").default(false),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

// ─── Inventory Adjustments ────────────────────────────────────────────────────
export const inventoryAdjustments = mysqlTable("inventory_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  inventoryId: int("inventoryId").notNull(),
  type: mysqlEnum("type", ["inbound", "outbound", "adjustment", "transfer", "damage"]).notNull(),
  quantity: int("quantity").notNull(),
  reason: varchar("reason", { length: 256 }),
  operatorId: int("operatorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Inquiries ────────────────────────────────────────────────────────────────
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  inquiryNo: varchar("inquiryNo", { length: 64 }).notNull().unique(),
  customerId: int("customerId"),
  customerName: varchar("customerName", { length: 128 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  platform: mysqlEnum("platform", ["amazon", "alibaba", "email", "website", "other"]).default("email"),
  status: mysqlEnum("status", ["new", "processing", "quoted", "negotiating", "won", "lost", "converted"]).default("new").notNull(),
  subject: varchar("subject", { length: 256 }),
  content: text("content"),
  productIds: text("productIds"),
  estimatedValue: decimal("estimatedValue", { precision: 14, scale: 2 }),
  assignedTo: int("assignedTo"),
  convertedOrderId: int("convertedOrderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Quotes ───────────────────────────────────────────────────────────────────
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  quoteNo: varchar("quoteNo", { length: 64 }).notNull().unique(),
  inquiryId: int("inquiryId"),
  customerId: int("customerId"),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
  totalAmount: decimal("totalAmount", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("USD"),
  validUntil: timestamp("validUntil"),
  items: json("items"),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── AI Agent Suggestions ─────────────────────────────────────────────────────
export const agentSuggestions = mysqlTable("agent_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  type: mysqlEnum("type", ["pricing", "restock", "ad_optimize", "quote", "risk", "opportunity"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  summary: text("summary").notNull(),
  reasoning: text("reasoning"),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).default("0.8"),
  impact: mysqlEnum("impact", ["high", "medium", "low"]).default("medium"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "suspended", "expired"]).default("pending").notNull(),
  relatedModule: varchar("relatedModule", { length: 64 }),
  relatedId: int("relatedId"),
  actionData: json("actionData"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

// ─── Approval Tasks ───────────────────────────────────────────────────────────
export const approvalTasks = mysqlTable("approval_tasks", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  taskNo: varchar("taskNo", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["quote_approval", "price_change", "large_order", "restock", "ad_budget", "other"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "transferred", "expired"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal"),
  requesterId: int("requesterId"),
  assigneeId: int("assigneeId"),
  relatedModule: varchar("relatedModule", { length: 64 }),
  relatedId: int("relatedId"),
  aiPreEvaluation: json("aiPreEvaluation"),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Approval History ─────────────────────────────────────────────────────────
export const approvalHistory = mysqlTable("approval_history", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  action: mysqlEnum("action", ["approved", "rejected", "transferred", "commented", "created"]).notNull(),
  operatorId: int("operatorId"),
  operatorName: varchar("operatorName", { length: 128 }),
  comment: text("comment"),
  fromStatus: varchar("fromStatus", { length: 32 }),
  toStatus: varchar("toStatus", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  userId: int("userId"),
  userName: varchar("userName", { length: 128 }),
  module: varchar("module", { length: 64 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  targetId: varchar("targetId", { length: 64 }),
  targetName: varchar("targetName", { length: 256 }),
  detail: json("detail"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  userId: int("userId"),
  type: mysqlEnum("type", ["info", "warning", "error", "success", "approval", "ai_suggestion"]).default("info"),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content"),
  isRead: boolean("isRead").default(false),
  relatedModule: varchar("relatedModule", { length: 64 }),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Dashboard Metrics (cached) ───────────────────────────────────────────────
export const dashboardMetrics = mysqlTable("dashboard_metrics", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  gmv: decimal("gmv", { precision: 16, scale: 2 }).default("0"),
  orderCount: int("orderCount").default(0),
  adRoi: decimal("adRoi", { precision: 8, scale: 4 }).default("0"),
  adSpend: decimal("adSpend", { precision: 12, scale: 2 }).default("0"),
  stockAlertCount: int("stockAlertCount").default(0),
  pendingInquiries: int("pendingInquiries").default(0),
  newCustomers: int("newCustomers").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
