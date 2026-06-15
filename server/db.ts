import { eq, desc, and, like, or, sql, lt, gt, gte, lte, isNull, count, sum, avg } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, tenants, products, customers, orders, orderItems,
  adCampaigns, adGroups, warehouses, inventory, inventoryAdjustments,
  inquiries, quotes, agentSuggestions, approvalTasks, approvalHistory,
  auditLogs, notifications, dashboardMetrics,
  type User, type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getDashboardStats(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  const [orderStats] = await db.select({
    totalGmv: sql<string>`COALESCE(SUM(totalAmount), 0)`,
    orderCount: count(),
  }).from(orders).where(and(eq(orders.tenantId, tenantId)));
  const [adStats] = await db.select({
    totalSpend: sql<string>`COALESCE(SUM(spend), 0)`,
    totalRevenue: sql<string>`COALESCE(SUM(revenue), 0)`,
  }).from(adCampaigns).where(and(eq(adCampaigns.tenantId, tenantId), eq(adCampaigns.status, "active")));
  const [alertCount] = await db.select({ count: count() }).from(inventory)
    .where(and(eq(inventory.tenantId, tenantId), eq(inventory.isAlert, true)));
  const [pendingInq] = await db.select({ count: count() }).from(inquiries)
    .where(and(eq(inquiries.tenantId, tenantId), eq(inquiries.status, "new")));
  const spend = parseFloat(adStats?.totalSpend ?? "0");
  const revenue = parseFloat(adStats?.totalRevenue ?? "0");
  const roi = spend > 0 ? revenue / spend : 0;
  return {
    gmv: parseFloat(orderStats?.totalGmv ?? "0"),
    orderCount: orderStats?.orderCount ?? 0,
    adRoi: roi,
    adSpend: spend,
    stockAlertCount: alertCount?.count ?? 0,
    pendingInquiries: pendingInq?.count ?? 0,
  };
}

export async function getDashboardTrend(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dashboardMetrics)
    .where(eq(dashboardMetrics.tenantId, tenantId))
    .orderBy(dashboardMetrics.date).limit(30);
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(tenantId: number, opts?: { search?: string; status?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(products.tenantId, tenantId)];
  if (opts?.status) conditions.push(eq(products.status, opts.status as any));
  if (opts?.search) conditions.push(or(like(products.name, `%${opts.search}%`), like(products.sku, `%${opts.search}%`))!);
  const [{ total }] = await db.select({ total: count() }).from(products).where(and(...conditions));
  const items = await db.select().from(products).where(and(...conditions))
    .orderBy(desc(products.updatedAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function getCustomers(tenantId: number, opts?: { search?: string; tier?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(customers.tenantId, tenantId)];
  if (opts?.tier) conditions.push(eq(customers.tier, opts.tier as any));
  if (opts?.search) conditions.push(or(like(customers.name, `%${opts.search}%`), like(customers.email, `%${opts.search}%`), like(customers.company, `%${opts.search}%`))!);
  const [{ total }] = await db.select({ total: count() }).from(customers).where(and(...conditions));
  const items = await db.select().from(customers).where(and(...conditions))
    .orderBy(desc(customers.updatedAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function createCustomer(data: typeof customers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(customers).values(data);
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getOrders(tenantId: number, opts?: { search?: string; status?: string; platform?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(orders.tenantId, tenantId)];
  if (opts?.status) conditions.push(eq(orders.status, opts.status as any));
  if (opts?.platform) conditions.push(eq(orders.platform, opts.platform as any));
  if (opts?.search) conditions.push(or(like(orders.orderNo, `%${opts.search}%`))!);
  const [{ total }] = await db.select({ total: count() }).from(orders).where(and(...conditions));
  const items = await db.select().from(orders).where(and(...conditions))
    .orderBy(desc(orders.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function createOrder(data: typeof orders.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(orders).values(data);
}

// ─── Ad Campaigns ─────────────────────────────────────────────────────────────
export async function getAdCampaigns(tenantId: number, opts?: { status?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(adCampaigns.tenantId, tenantId)];
  if (opts?.status) conditions.push(eq(adCampaigns.status, opts.status as any));
  const [{ total }] = await db.select({ total: count() }).from(adCampaigns).where(and(...conditions));
  const items = await db.select().from(adCampaigns).where(and(...conditions))
    .orderBy(desc(adCampaigns.updatedAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getAdGroups(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adGroups).where(eq(adGroups.campaignId, campaignId));
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export async function getInventory(tenantId: number, opts?: { alert?: boolean; warehouseId?: number; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(inventory.tenantId, tenantId)];
  if (opts?.alert) conditions.push(eq(inventory.isAlert, true));
  if (opts?.warehouseId) conditions.push(eq(inventory.warehouseId, opts.warehouseId));
  const [{ total }] = await db.select({ total: count() }).from(inventory).where(and(...conditions));
  const items = await db.select({
    inv: inventory,
    product: { id: products.id, name: products.name, sku: products.sku, imageUrl: products.imageUrl },
    warehouse: { id: warehouses.id, name: warehouses.name },
  }).from(inventory)
    .leftJoin(products, eq(inventory.productId, products.id))
    .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(inventory.isAlert).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getWarehouses(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(warehouses).where(eq(warehouses.tenantId, tenantId));
}

export async function getInventoryAdjustments(inventoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryAdjustments)
    .where(eq(inventoryAdjustments.inventoryId, inventoryId))
    .orderBy(desc(inventoryAdjustments.createdAt)).limit(20);
}

// ─── Inquiries ────────────────────────────────────────────────────────────────
export async function getInquiries(tenantId: number, opts?: { status?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(inquiries.tenantId, tenantId)];
  if (opts?.status) conditions.push(eq(inquiries.status, opts.status as any));
  const [{ total }] = await db.select({ total: count() }).from(inquiries).where(and(...conditions));
  const items = await db.select().from(inquiries).where(and(...conditions))
    .orderBy(desc(inquiries.updatedAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getInquiryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return result[0];
}

export async function getQuotes(tenantId: number, opts?: { status?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(quotes.tenantId, tenantId)];
  if (opts?.status) conditions.push(eq(quotes.status, opts.status as any));
  const [{ total }] = await db.select({ total: count() }).from(quotes).where(and(...conditions));
  const items = await db.select().from(quotes).where(and(...conditions))
    .orderBy(desc(quotes.updatedAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function createQuote(data: typeof quotes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(quotes).values(data);
}

// ─── Agent Suggestions ────────────────────────────────────────────────────────
export async function getAgentSuggestions(tenantId: number, opts?: { status?: string; type?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(agentSuggestions.tenantId, tenantId)];
  if (opts?.status) conditions.push(eq(agentSuggestions.status, opts.status as any));
  if (opts?.type) conditions.push(eq(agentSuggestions.type, opts.type as any));
  const [{ total }] = await db.select({ total: count() }).from(agentSuggestions).where(and(...conditions));
  const items = await db.select().from(agentSuggestions).where(and(...conditions))
    .orderBy(desc(agentSuggestions.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function reviewAgentSuggestion(id: number, status: "accepted" | "rejected" | "suspended", reviewedBy: number, reviewNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(agentSuggestions).set({
    status, reviewedBy, reviewedAt: new Date(), reviewNote: reviewNote ?? null,
  }).where(eq(agentSuggestions.id, id));
}

// ─── Approvals ────────────────────────────────────────────────────────────────
export async function getApprovalTasks(tenantId: number, opts?: { status?: string; assigneeId?: number; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const conditions = [eq(approvalTasks.tenantId, tenantId)];
  if (opts?.status) conditions.push(eq(approvalTasks.status, opts.status as any));
  if (opts?.assigneeId) conditions.push(eq(approvalTasks.assigneeId, opts.assigneeId));
  const [{ total }] = await db.select({ total: count() }).from(approvalTasks).where(and(...conditions));
  const items = await db.select().from(approvalTasks).where(and(...conditions))
    .orderBy(desc(approvalTasks.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getApprovalTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(approvalTasks).where(eq(approvalTasks.id, id)).limit(1);
  return result[0];
}

export async function getApprovalHistory(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(approvalHistory).where(eq(approvalHistory.taskId, taskId))
    .orderBy(desc(approvalHistory.createdAt));
}

export async function processApproval(taskId: number, action: "approved" | "rejected" | "transferred", operatorId: number, operatorName: string, comment?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const task = await getApprovalTaskById(taskId);
  if (!task) throw new Error("Task not found");
  await db.update(approvalTasks).set({ status: action, updatedAt: new Date() }).where(eq(approvalTasks.id, taskId));
  await db.insert(approvalHistory).values({
    taskId, action, operatorId, operatorName, comment: comment ?? null,
    fromStatus: task.status, toStatus: action,
  });
}

export async function getPendingApprovalCount(tenantId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [{ total }] = await db.select({ total: count() }).from(approvalTasks)
    .where(and(eq(approvalTasks.tenantId, tenantId), eq(approvalTasks.status, "pending")));
  return total;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export async function getAuditLogs(tenantId: number, opts?: { module?: string; userId?: number; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;
  const conditions = [eq(auditLogs.tenantId, tenantId)];
  if (opts?.module) conditions.push(eq(auditLogs.module, opts.module));
  if (opts?.userId) conditions.push(eq(auditLogs.userId, opts.userId));
  const [{ total }] = await db.select({ total: count() }).from(auditLogs).where(and(...conditions));
  const items = await db.select().from(auditLogs).where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function writeAuditLog(data: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(userId: number, opts?: { page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const [{ total }] = await db.select({ total: count() }).from(notifications)
    .where(eq(notifications.userId, userId));
  const items = await db.select().from(notifications).where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total };
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [{ total }] = await db.select({ total: count() }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return total;
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── Inventory Adjustments ───────────────────────────────────────────────────
export async function adjustInventory(inventoryId: number, type: "inbound" | "outbound" | "adjustment" | "transfer" | "damage", quantity: number, reason?: string, operatorId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [inv] = await db.select().from(inventory).where(eq(inventory.id, inventoryId)).limit(1);
  if (!inv) throw new Error("Inventory record not found");
  const delta = (type === "outbound" || type === "damage") ? -Math.abs(quantity) : Math.abs(quantity);
  const newQty = Math.max(0, inv.quantity + delta);
  const newAvailable = Math.max(0, (inv.availableQty ?? 0) + delta);
  const isAlert = newQty <= (inv.lowStockThreshold ?? 50);
  await db.update(inventory).set({ quantity: newQty, availableQty: newAvailable, isAlert }).where(eq(inventory.id, inventoryId));
  await db.insert(inventoryAdjustments).values({ inventoryId, type, quantity, reason: reason ?? null, operatorId: operatorId ?? null });
}

// ─── Ad Campaigns CRUD ────────────────────────────────────────────────────────
export async function createAdCampaign(data: typeof adCampaigns.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(adCampaigns).values(data);
}

export async function updateAdCampaign(id: number, data: Partial<typeof adCampaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(adCampaigns).set(data).where(eq(adCampaigns.id, id));
}

// ─── Customers Update ─────────────────────────────────────────────────────────
export async function updateCustomer(id: number, data: Partial<typeof customers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

// ─── Orders Update ────────────────────────────────────────────────────────────
export async function updateOrder(id: number, data: Partial<typeof orders.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

// ─── Inquiries Update ─────────────────────────────────────────────────────────
export async function updateInquiry(id: number, data: Partial<typeof inquiries.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(inquiries).set(data).where(eq(inquiries.id, id));
}

export async function updateQuote(id: number, data: Partial<typeof quotes.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(quotes).set(data).where(eq(quotes.id, id));
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getCustomerOrders(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt)).limit(10);
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
export async function seedDemoData(tenantId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Products
  const productData = [
    { tenantId, sku: "SKU-001", name: "无线蓝牙耳机 Pro", category: "电子产品", status: "active" as const, costPrice: "45.00", amazonPrice: "89.99", shopifyPrice: "79.99", alibabaPrice: "52.00", amazonStock: 320, shopifyStock: 150, warehouseStock: 500, lowStockThreshold: 100, tags: "热销,蓝牙,耳机" },
    { tenantId, sku: "SKU-002", name: "便携式充电宝 20000mAh", category: "电子产品", status: "active" as const, costPrice: "28.00", amazonPrice: "49.99", shopifyPrice: "45.99", alibabaPrice: "32.00", amazonStock: 45, shopifyStock: 80, warehouseStock: 200, lowStockThreshold: 80, tags: "充电,便携" },
    { tenantId, sku: "SKU-003", name: "智能手表运动版", category: "穿戴设备", status: "active" as const, costPrice: "62.00", amazonPrice: "129.99", shopifyPrice: "119.99", alibabaPrice: "75.00", amazonStock: 180, shopifyStock: 95, warehouseStock: 350, lowStockThreshold: 60, tags: "智能,手表,运动" },
    { tenantId, sku: "SKU-004", name: "USB-C 多功能扩展坞", category: "电脑配件", status: "active" as const, costPrice: "22.00", amazonPrice: "39.99", shopifyPrice: "35.99", alibabaPrice: "26.00", amazonStock: 30, shopifyStock: 60, warehouseStock: 150, lowStockThreshold: 50, tags: "USB,扩展坞" },
    { tenantId, sku: "SKU-005", name: "机械键盘 RGB 版", category: "电脑配件", status: "active" as const, costPrice: "55.00", amazonPrice: "99.99", shopifyPrice: "95.99", alibabaPrice: "65.00", amazonStock: 0, shopifyStock: 20, warehouseStock: 80, lowStockThreshold: 40, tags: "键盘,机械,RGB" },
    { tenantId, sku: "SKU-006", name: "家用空气净化器", category: "家居", status: "active" as const, costPrice: "85.00", amazonPrice: "159.99", shopifyPrice: "149.99", alibabaPrice: "98.00", amazonStock: 120, shopifyStock: 55, warehouseStock: 200, lowStockThreshold: 30, tags: "净化器,家居" },
  ];
  for (const p of productData) {
    await db.insert(products).values(p).onDuplicateKeyUpdate({ set: { name: p.name } });
  }

  // Customers
  const customerData = [
    { tenantId, name: "Sarah Johnson", email: "sarah@techstore.com", company: "TechStore USA", country: "美国", platform: "amazon" as const, tier: "vip" as const, totalOrders: 28, totalSpend: "15680.00" },
    { tenantId, name: "Michael Chen", email: "m.chen@globaltech.hk", company: "GlobalTech HK", country: "香港", platform: "alibaba" as const, tier: "vip" as const, totalOrders: 45, totalSpend: "32450.00" },
    { tenantId, name: "Emma Williams", email: "emma@shopify-store.co.uk", company: "Williams Electronics", country: "英国", platform: "shopify" as const, tier: "regular" as const, totalOrders: 12, totalSpend: "4280.00" },
    { tenantId, name: "Carlos Rodriguez", email: "carlos@techimport.mx", company: "TechImport MX", country: "墨西哥", platform: "direct" as const, tier: "regular" as const, totalOrders: 8, totalSpend: "2890.00" },
    { tenantId, name: "Yuki Tanaka", email: "yuki@electronics.jp", company: "Tanaka Electronics", country: "日本", platform: "amazon" as const, tier: "new" as const, totalOrders: 3, totalSpend: "890.00" },
  ];
  for (const c of customerData) {
    await db.insert(customers).values(c).onDuplicateKeyUpdate({ set: { name: c.name } });
  }

  // Orders
  const orderData = [
    { tenantId, orderNo: `ORD-${tenantId}-001`, platform: "amazon" as const, status: "delivered" as const, totalAmount: "1299.90", currency: "USD", itemCount: 3 },
    { tenantId, orderNo: `ORD-${tenantId}-002`, platform: "shopify" as const, status: "shipped" as const, totalAmount: "459.95", currency: "USD", itemCount: 2 },
    { tenantId, orderNo: `ORD-${tenantId}-003`, platform: "alibaba" as const, status: "processing" as const, totalAmount: "3200.00", currency: "USD", itemCount: 8 },
    { tenantId, orderNo: `ORD-${tenantId}-004`, platform: "direct" as const, status: "pending" as const, totalAmount: "789.99", currency: "USD", itemCount: 1 },
    { tenantId, orderNo: `ORD-${tenantId}-005`, platform: "amazon" as const, status: "confirmed" as const, totalAmount: "2150.00", currency: "USD", itemCount: 5 },
    { tenantId, orderNo: `ORD-${tenantId}-006`, platform: "shopify" as const, status: "cancelled" as const, totalAmount: "320.00", currency: "USD", itemCount: 1 },
  ];
  for (const o of orderData) {
    await db.insert(orders).values(o).onDuplicateKeyUpdate({ set: { status: o.status } });
  }

  // Ad Campaigns
  const adData = [
    { tenantId, name: "Q2 蓝牙耳机主推活动", platform: "amazon" as const, status: "active" as const, budget: "5000.00", spend: "3240.50", impressions: 128500, clicks: 4820, conversions: 312, revenue: "27890.00", roi: "8.6062", ctr: "0.0375" },
    { tenantId, name: "Google 品牌词竞价", platform: "google" as const, status: "active" as const, budget: "3000.00", spend: "1890.20", impressions: 85200, clicks: 3150, conversions: 198, revenue: "12450.00", roi: "6.5868", ctr: "0.0370" },
    { tenantId, name: "Meta 再营销活动", platform: "meta" as const, status: "paused" as const, budget: "2000.00", spend: "980.00", impressions: 45000, clicks: 1200, conversions: 65, revenue: "3800.00", roi: "3.8776", ctr: "0.0267" },
    { tenantId, name: "TikTok 智能手表推广", platform: "tiktok" as const, status: "active" as const, budget: "1500.00", spend: "650.00", impressions: 320000, clicks: 8500, conversions: 145, revenue: "8900.00", roi: "13.6923", ctr: "0.0266" },
  ];
  for (const a of adData) {
    await db.insert(adCampaigns).values(a).onDuplicateKeyUpdate({ set: { status: a.status } });
  }

  // Warehouses
  const warehouseData = [
    { tenantId, name: "深圳总仓", code: "SZ-001", location: "深圳市龙华区", country: "中国", type: "owned" as const, status: "active" as const, capacity: 50000 },
    { tenantId, name: "美国 FBA 仓", code: "US-FBA-001", location: "洛杉矶", country: "美国", type: "fba" as const, status: "active" as const, capacity: 10000 },
    { tenantId, name: "英国保税仓", code: "UK-BND-001", location: "伦敦希思罗", country: "英国", type: "bonded" as const, status: "active" as const, capacity: 8000 },
  ];
  for (const w of warehouseData) {
    await db.insert(warehouses).values(w).onDuplicateKeyUpdate({ set: { name: w.name } });
  }

  // Inquiries
  const inquiryData = [
    { tenantId, inquiryNo: `INQ-${tenantId}-001`, customerName: "David Kim", customerEmail: "david@koreatech.kr", platform: "alibaba" as const, status: "new" as const, subject: "批量采购蓝牙耳机询价", estimatedValue: "15000.00" },
    { tenantId, inquiryNo: `INQ-${tenantId}-002`, customerName: "Anna Mueller", customerEmail: "anna@techgmbh.de", platform: "email" as const, status: "processing" as const, subject: "智能手表 500 件报价", estimatedValue: "45000.00" },
    { tenantId, inquiryNo: `INQ-${tenantId}-003`, customerName: "James Wilson", customerEmail: "james@retailusa.com", platform: "website" as const, status: "quoted" as const, subject: "USB 扩展坞年度采购合同", estimatedValue: "28000.00" },
    { tenantId, inquiryNo: `INQ-${tenantId}-004`, customerName: "Li Wei", customerEmail: "liwei@import.cn", platform: "alibaba" as const, status: "won" as const, subject: "充电宝 1000 件", estimatedValue: "32000.00" },
  ];
  for (const i of inquiryData) {
    await db.insert(inquiries).values(i).onDuplicateKeyUpdate({ set: { status: i.status } });
  }

  // Agent Suggestions
  const suggestionData = [
    { tenantId, type: "restock" as const, title: "SKU-002 充电宝库存预警：建议紧急补货", summary: "美国 FBA 仓充电宝库存仅剩 45 件，按当前销售速度预计 8 天内售罄。建议立即补货 500 件以避免断货损失。", reasoning: "过去 30 天平均日销 5.6 件，当前库存 45 件，预计 8 天售罄。历史断货期间损失约 $2,800/周。", confidence: "0.9200", impact: "high" as const, status: "pending" as const, relatedModule: "inventory" },
    { tenantId, type: "ad_optimize" as const, title: "TikTok 智能手表广告 ROI 异常优秀，建议加大预算", summary: "TikTok 智能手表推广活动 ROI 达 13.69，远超账户平均水平（6.2）。建议将预算从 $1,500 提升至 $4,000 以放大收益。", reasoning: "该活动 CTR 2.66%，转化率 1.71%，均高于行业基准。受众匹配度高，建议趁竞争窗口期加速投放。", confidence: "0.8500", impact: "high" as const, status: "pending" as const, relatedModule: "ads" },
    { tenantId, type: "pricing" as const, title: "SKU-003 智能手表 Amazon 定价偏低，建议上调 8%", summary: "竞品分析显示同类产品均价 $142，当前定价 $129.99 低于市场 8.5%。建议调整至 $139.99 以提升利润率。", reasoning: "近 30 天价格弹性系数 -0.42，表明需求对价格不敏感。上调 $10 预计月增利润 $3,200。", confidence: "0.7800", impact: "medium" as const, status: "pending" as const, relatedModule: "products" },
    { tenantId, type: "quote" as const, title: "INQ-002 Anna Mueller 询盘：建议报价 $88/件", summary: "基于成本结构、竞品报价和客户历史采购记录，建议对 500 件智能手表报价 $88/件，总额 $44,000。", reasoning: "成本 $62，目标毛利率 29.5%。客户来自德国，汇率风险低。同类客户历史成交价 $85-92 区间。", confidence: "0.8800", impact: "high" as const, status: "pending" as const, relatedModule: "inquiries" },
    { tenantId, type: "risk" as const, title: "SKU-005 机械键盘 Amazon 库存清零，存在断货风险", summary: "SKU-005 Amazon 库存已归零，仓库库存仅 80 件，且近期无补货计划。建议优先安排入仓或暂停广告投放。", reasoning: "Amazon 断货将导致 listing 权重下降，恢复期通常需要 2-4 周。建议立即安排 200 件入仓。", confidence: "0.9500", impact: "high" as const, status: "pending" as const, relatedModule: "inventory" },
    { tenantId, type: "opportunity" as const, title: "英国市场空气净化器需求上升，建议开拓新渠道", summary: "近期英国 Amazon 空气净化器搜索量环比上升 34%，当前竞争度较低。建议在英国站开设 listing 并配合 PPC 推广。", reasoning: "英国站同类产品 BSR 前 10 平均月销 850 件，利润空间约 35%。建议首批入仓 200 件测试市场。", confidence: "0.7200", impact: "medium" as const, status: "pending" as const, relatedModule: "products" },
  ];
  for (const s of suggestionData) {
    await db.insert(agentSuggestions).values(s).onDuplicateKeyUpdate({ set: { status: s.status } });
  }

  // Approval Tasks
  const approvalData = [
    { tenantId, taskNo: `APV-${tenantId}-001`, type: "quote_approval" as const, title: "INQ-002 Anna Mueller 500 件智能手表报价审批", status: "pending" as const, priority: "urgent" as const, requesterId: userId, assigneeId: userId, relatedModule: "quotes", aiPreEvaluation: { recommendation: "approve", confidence: 0.88, reason: "报价合理，客户信用良好，利润率达标" } },
    { tenantId, taskNo: `APV-${tenantId}-002`, type: "ad_budget" as const, title: "TikTok 广告预算从 $1,500 调整至 $4,000", status: "pending" as const, priority: "high" as const, requesterId: userId, assigneeId: userId, relatedModule: "ads", aiPreEvaluation: { recommendation: "approve", confidence: 0.85, reason: "ROI 表现优异，加大预算可放大收益" } },
    { tenantId, taskNo: `APV-${tenantId}-003`, type: "price_change" as const, title: "SKU-003 智能手表 Amazon 定价上调至 $139.99", status: "pending" as const, priority: "normal" as const, requesterId: userId, assigneeId: userId, relatedModule: "products", aiPreEvaluation: { recommendation: "approve", confidence: 0.78, reason: "价格弹性低，上调对销量影响有限" } },
    { tenantId, taskNo: `APV-${tenantId}-004`, type: "restock" as const, title: "SKU-002 充电宝紧急补货 500 件", status: "approved" as const, priority: "urgent" as const, requesterId: userId, assigneeId: userId, relatedModule: "inventory", aiPreEvaluation: { recommendation: "approve", confidence: 0.92, reason: "库存紧急，断货风险高" } },
  ];
  for (const a of approvalData) {
    await db.insert(approvalTasks).values(a).onDuplicateKeyUpdate({ set: { status: a.status } });
  }

  // Dashboard Metrics (30 days)
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const base = 8000 + Math.random() * 4000;
    await db.insert(dashboardMetrics).values({
      tenantId, date: dateStr,
      gmv: (base + Math.random() * 2000).toFixed(2),
      orderCount: Math.floor(15 + Math.random() * 25),
      adRoi: (4 + Math.random() * 8).toFixed(4),
      adSpend: (500 + Math.random() * 300).toFixed(2),
      stockAlertCount: Math.floor(Math.random() * 5),
      pendingInquiries: Math.floor(Math.random() * 8),
      newCustomers: Math.floor(Math.random() * 5),
    }).onDuplicateKeyUpdate({ set: { gmv: (base + Math.random() * 2000).toFixed(2) } });
  }

  // Notifications
  const notifData = [
    { tenantId, userId, type: "warning" as const, title: "库存预警：SKU-002 充电宝库存不足", content: "美国 FBA 仓充电宝库存仅剩 45 件，预计 8 天内售罄。", relatedModule: "inventory" },
    { tenantId, userId, type: "ai_suggestion" as const, title: "AI 建议：TikTok 广告 ROI 异常优秀", content: "TikTok 智能手表广告 ROI 达 13.69，建议加大预算至 $4,000。", relatedModule: "ads" },
    { tenantId, userId, type: "approval" as const, title: "待审批：Anna Mueller 报价单需要您的审批", content: "500 件智能手表报价 $44,000，请及时处理。", relatedModule: "approvals" },
    { tenantId, userId, type: "info" as const, title: "新询盘：David Kim 批量采购蓝牙耳机", content: "来自韩国的新询盘，预估金额 $15,000，请及时跟进。", relatedModule: "inquiries" },
    { tenantId, userId, type: "success" as const, title: "订单已发货：ORD-001", content: "订单 ORD-001 已成功发货，物流单号 TRK-2024-001。", relatedModule: "orders" },
  ];
  for (const n of notifData) {
    await db.insert(notifications).values(n);
  }

  // Audit Logs
  await db.insert(auditLogs).values([
    { tenantId, userId, userName: "系统管理员", module: "system", action: "seed_data", targetName: "演示数据初始化", detail: { message: "MVP 演示数据种子初始化完成" } },
  ]);

  return { success: true, message: "演示数据初始化完成" };
}
