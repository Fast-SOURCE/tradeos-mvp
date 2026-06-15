// Mock data for demo mode (no backend required)

export const mockUser = {
  id: 1,
  name: "Demo 管理员",
  email: "demo@tradeos.com",
  role: "admin" as const,
  tenantId: 1,
  createdAt: new Date("2024-01-01"),
};

export const mockDashboardStats = {
  gmv: "1284650.00",
  gmvGrowth: "12.5",
  orderCount: 3842,
  orderGrowth: "8.3",
  adSpend: "98420.00",
  adRoi: "3.21",
  adRoiGrowth: "5.2",
  pendingApprovals: 7,
  lowStockCount: 12,
  newInquiries: 23,
};

export const mockTrend = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2024, 4, i + 1);
  return {
    date: date.toISOString().slice(0, 10),
    gmv: (80000 + Math.random() * 60000).toFixed(2),
    adRoi: (2.5 + Math.random() * 2).toFixed(2),
    orderCount: Math.floor(100 + Math.random() * 80),
  };
});

export const mockProducts = {
  items: [
    { id: 1, sku: "SKU-001", name: "蓝牙耳机 Pro X", category: "电子产品", price: "299.00", stock: 450, status: "active", salesCount: 1230, createdAt: new Date("2024-01-15") },
    { id: 2, sku: "SKU-002", name: "智能手表 S3", category: "可穿戴设备", price: "899.00", stock: 8, status: "active", salesCount: 876, createdAt: new Date("2024-02-01") },
    { id: 3, sku: "SKU-003", name: "无线充电器 15W", category: "配件", price: "129.00", stock: 320, status: "active", salesCount: 2100, createdAt: new Date("2024-01-20") },
    { id: 4, sku: "SKU-004", name: "机械键盘 RGB", category: "外设", price: "459.00", stock: 0, status: "inactive", salesCount: 543, createdAt: new Date("2024-03-10") },
    { id: 5, sku: "SKU-005", name: "4K 便携显示器", category: "显示设备", price: "1299.00", stock: 65, status: "active", salesCount: 321, createdAt: new Date("2024-03-15") },
    { id: 6, sku: "SKU-006", name: "USB-C Hub 7合1", category: "配件", price: "199.00", stock: 5, status: "active", salesCount: 1890, createdAt: new Date("2024-02-20") },
    { id: 7, sku: "SKU-007", name: "降噪耳机 ANC", category: "电子产品", price: "699.00", stock: 120, status: "active", salesCount: 654, createdAt: new Date("2024-04-01") },
    { id: 8, sku: "SKU-008", name: "游戏鼠标 DPI8000", category: "外设", price: "259.00", stock: 230, status: "active", salesCount: 987, createdAt: new Date("2024-04-10") },
  ],
  total: 8,
  page: 1,
  pageSize: 20,
};

export const mockCustomers = {
  items: [
    { id: 1, name: "TechWorld Inc.", email: "buyer@techworld.com", country: "美国", totalOrders: 45, totalAmount: "128500.00", status: "active", createdAt: new Date("2023-06-01") },
    { id: 2, name: "Global Electronics GmbH", email: "procurement@globalelec.de", country: "德国", totalOrders: 32, totalAmount: "98200.00", status: "active", createdAt: new Date("2023-08-15") },
    { id: 3, name: "Sunrise Trading Co.", email: "orders@sunrise.jp", country: "日本", totalOrders: 28, totalAmount: "76400.00", status: "active", createdAt: new Date("2023-09-20") },
    { id: 4, name: "Nordic Tech AB", email: "info@nordictech.se", country: "瑞典", totalOrders: 19, totalAmount: "54300.00", status: "active", createdAt: new Date("2023-11-05") },
    { id: 5, name: "Pacific Imports Ltd.", email: "buy@pacificimports.au", country: "澳大利亚", totalOrders: 15, totalAmount: "43200.00", status: "active", createdAt: new Date("2024-01-10") },
  ],
  total: 5,
  page: 1,
  pageSize: 20,
};

export const mockOrders = {
  items: [
    { id: 1, orderNo: "ORD-2024-001", customerId: 1, customerName: "TechWorld Inc.", totalAmount: "12800.00", currency: "USD", status: "shipped", itemCount: 3, createdAt: new Date("2024-05-01") },
    { id: 2, orderNo: "ORD-2024-002", customerId: 2, customerName: "Global Electronics GmbH", totalAmount: "8900.00", currency: "EUR", status: "pending", itemCount: 2, createdAt: new Date("2024-05-03") },
    { id: 3, orderNo: "ORD-2024-003", customerId: 3, customerName: "Sunrise Trading Co.", totalAmount: "15600.00", currency: "USD", status: "delivered", itemCount: 5, createdAt: new Date("2024-05-05") },
    { id: 4, orderNo: "ORD-2024-004", customerId: 1, customerName: "TechWorld Inc.", totalAmount: "6200.00", currency: "USD", status: "processing", itemCount: 1, createdAt: new Date("2024-05-08") },
    { id: 5, orderNo: "ORD-2024-005", customerId: 4, customerName: "Nordic Tech AB", totalAmount: "9800.00", currency: "EUR", status: "pending", itemCount: 4, createdAt: new Date("2024-05-10") },
  ],
  total: 5,
  page: 1,
  pageSize: 20,
};

export const mockAds = {
  items: [
    { id: 1, name: "蓝牙耳机-夏季促销", platform: "Amazon", budget: "5000.00", spend: "3240.00", impressions: 128000, clicks: 4200, orders: 320, roi: "3.85", status: "active", createdAt: new Date("2024-04-01") },
    { id: 2, name: "智能手表-品牌推广", platform: "Google", budget: "8000.00", spend: "6100.00", impressions: 256000, clicks: 8900, orders: 210, roi: "2.91", status: "active", createdAt: new Date("2024-04-10") },
    { id: 3, name: "充电器-关键词广告", platform: "Amazon", budget: "3000.00", spend: "2800.00", impressions: 89000, clicks: 3100, orders: 480, roi: "4.20", status: "active", createdAt: new Date("2024-04-15") },
    { id: 4, name: "键盘-再营销活动", platform: "Facebook", budget: "2000.00", spend: "1200.00", impressions: 45000, clicks: 1800, orders: 95, roi: "2.10", status: "paused", createdAt: new Date("2024-05-01") },
  ],
  total: 4,
  page: 1,
  pageSize: 20,
};

export const mockInventory = {
  items: [
    { id: 1, productId: 1, sku: "SKU-001", productName: "蓝牙耳机 Pro X", warehouse: "深圳仓", quantity: 450, safetyStock: 100, status: "normal", updatedAt: new Date("2024-05-10") },
    { id: 2, productId: 2, sku: "SKU-002", productName: "智能手表 S3", warehouse: "深圳仓", quantity: 8, safetyStock: 50, status: "low", updatedAt: new Date("2024-05-10") },
    { id: 3, productId: 3, sku: "SKU-003", productName: "无线充电器 15W", warehouse: "广州仓", quantity: 320, safetyStock: 80, status: "normal", updatedAt: new Date("2024-05-10") },
    { id: 4, productId: 4, sku: "SKU-004", productName: "机械键盘 RGB", warehouse: "广州仓", quantity: 0, safetyStock: 30, status: "out", updatedAt: new Date("2024-05-10") },
    { id: 5, productId: 6, sku: "SKU-006", productName: "USB-C Hub 7合1", warehouse: "深圳仓", quantity: 5, safetyStock: 60, status: "low", updatedAt: new Date("2024-05-10") },
  ],
  total: 5,
  page: 1,
  pageSize: 20,
};

export const mockInquiries = {
  items: [
    { id: 1, inquiryNo: "INQ-2024-001", customerId: 1, customerName: "TechWorld Inc.", subject: "蓝牙耳机批量采购询价", status: "pending", createdAt: new Date("2024-05-08") },
    { id: 2, inquiryNo: "INQ-2024-002", customerId: 2, customerName: "Global Electronics GmbH", subject: "智能手表 Q3 备货计划", status: "quoted", createdAt: new Date("2024-05-07") },
    { id: 3, inquiryNo: "INQ-2024-003", customerId: 5, customerName: "Pacific Imports Ltd.", subject: "USB-C Hub 新款询价", status: "pending", createdAt: new Date("2024-05-09") },
  ],
  total: 3,
  page: 1,
  pageSize: 20,
};

export const mockQuotes = {
  items: [
    { id: 1, quoteNo: "QUO-2024-001", inquiryId: 2, customerId: 2, customerName: "Global Electronics GmbH", totalAmount: "45000.00", currency: "USD", status: "sent", createdAt: new Date("2024-05-08") },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

export const mockAgentSuggestions = {
  items: [
    { id: 1, type: "restock", title: "SKU-002 智能手表库存告急，建议立即补货", summary: "当前库存仅剩 8 件，按近 7 日日均销量 3.2 件计算，预计 2.5 天内售罄。建议补货 200 件。", impact: "high", confidence: "0.92", status: "pending", createdAt: new Date("2024-05-10") },
    { id: 2, type: "ad_optimize", title: "蓝牙耳机广告 ROI 低于均值，建议调整出价策略", summary: "过去 7 天该广告组 ROI 为 2.1，低于账户均值 3.2。建议降低非核心关键词出价 20%，提升核心词预算。", impact: "medium", confidence: "0.85", status: "pending", createdAt: new Date("2024-05-10") },
    { id: 3, type: "pricing", title: "USB-C Hub 竞品降价，建议跟进调整售价", summary: "监测到主要竞品将价格从 $29.99 降至 $24.99，建议将售价调整至 $25.99 以保持竞争力。", impact: "medium", confidence: "0.78", status: "pending", createdAt: new Date("2024-05-09") },
    { id: 4, type: "opportunity", title: "德国市场机械键盘需求上升，建议加大投放", summary: "近 30 天德国站机械键盘搜索量环比增长 45%，建议新建德语广告组，预算 €2000/月。", impact: "high", confidence: "0.88", status: "pending", createdAt: new Date("2024-05-09") },
  ],
  total: 4,
  page: 1,
  pageSize: 20,
};

export const mockApprovals = {
  items: [
    { id: 1, type: "quote", title: "报价单 QUO-2024-002 审批", description: "Global Electronics GmbH 智能手表 200 件报价，总金额 $89,000", status: "pending", requestedBy: "销售张三", createdAt: new Date("2024-05-10") },
    { id: 2, type: "discount", title: "大客户折扣申请", description: "TechWorld Inc. 申请年度采购折扣 8%，预计年采购额 $500,000", status: "pending", requestedBy: "销售李四", createdAt: new Date("2024-05-09") },
    { id: 3, type: "restock", title: "紧急补货申请 - SKU-002", description: "智能手表 S3 库存告急，申请紧急采购 200 件，预算 ¥180,000", status: "pending", requestedBy: "仓储王五", createdAt: new Date("2024-05-10") },
  ],
  total: 3,
  page: 1,
  pageSize: 20,
};

export const mockNotifications = {
  items: [
    { id: 1, title: "库存预警", content: "SKU-002 智能手表库存低于安全库存线", type: "warning", isRead: false, createdAt: new Date("2024-05-10") },
    { id: 2, title: "新询盘", content: "收到来自 Pacific Imports Ltd. 的新询盘", type: "info", isRead: false, createdAt: new Date("2024-05-09") },
    { id: 3, title: "审批提醒", content: "有 3 条待审批事项需要处理", type: "info", isRead: false, createdAt: new Date("2024-05-09") },
    { id: 4, title: "广告预算告警", content: "蓝牙耳机广告组预算使用率已达 90%", type: "warning", isRead: true, createdAt: new Date("2024-05-08") },
  ],
  total: 4,
  page: 1,
  pageSize: 20,
};

export const mockAuditLogs = {
  items: [
    { id: 1, userId: 1, userName: "Demo 管理员", module: "orders", action: "create", targetId: "5", detail: {}, createdAt: new Date("2024-05-10") },
    { id: 2, userId: 1, userName: "Demo 管理员", module: "products", action: "update", targetId: "2", detail: {}, createdAt: new Date("2024-05-10") },
    { id: 3, userId: 1, userName: "Demo 管理员", module: "inquiries", action: "create_quote", targetName: "QUO-2024-001", detail: {}, createdAt: new Date("2024-05-09") },
  ],
  total: 3,
  page: 1,
  pageSize: 50,
};
