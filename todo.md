# TradeOS MVP - Todo

## Phase 1: 全局主题 & 数据库 Schema
- [x] 设计全局 CSS 主题（深色优雅风格，色彩系统）
- [x] 设计并迁移数据库 Schema（租户、角色、SKU、订单、广告、库存、询盘、审批、审计）
- [x] 实现演示数据种子初始化 API

## Phase 2: 布局 & 权限框架
- [x] 扩展 DashboardLayout（侧边栏导航、角色权限菜单）→ TradeOSLayout
- [x] 实现角色权限矩阵（shared/permissions.ts）
- [x] 配置全部路由（11 个模块页面）
- [x] 登录页面（OAuth 登录入口）

## Phase 3: 经营驾驶舱
- [x] KPI 指标卡片（GMV、订单量、广告 ROI、库存预警、待处理询盘）
- [x] 趋势折线图（Chart.js）
- [x] AI Agent 建议摘要卡片
- [x] 异常高亮逻辑

## Phase 4: SKU 商品管理
- [x] 商品列表（分页、搜索、筛选）
- [x] 新增/编辑商品表单（多平台价格与库存字段）
- [x] 商品详情侧边抽屉（已实现）

## Phase 4b: 客户与订单管理
- [x] 客户列表与新建
- [x] 订单列表（状态筛选）
- [x] 订单新建
- [x] 客户详情侧边抽屉（已实现）
- [x] 订单详情侧边抽屉（已实现）
- [x] 询盘详情侧边抽屉（状态更新、询盘内容展示）
- [x] 询盘转订单入口（选择平台/货币确认转单）

## Phase 5: 广告管理
- [x] 广告活动列表
- [x] 广告组展示
- [x] ROI/CTR/花费指标展示
- [x] 广告活动创建/编辑（已实现）

## Phase 5b: 库存与仓库管理
- [x] 库存列表（预警高亮）
- [x] 仓库信息管理
- [x] 库存调整记录
- [x] 库存调整操作（已实现）

## Phase 6: 询盘与报价管理
- [x] 询盘列表（状态流转）
- [x] 报价单创建
- [x] 报价单编辑器（完整表单：金额/货币/备注/有效期）
- [x] 报价审批触发（一键提交审批、状态流转）

## Phase 6b: AI Agent 建议卡片系统
- [x] 统一建议卡片组件（置信度、推理依据、采纳/驳回/挂起）
- [x] 六类 Agent 建议类型支持
- [x] 人机协作审批闭环 API

## Phase 7: 审批任务中心
- [x] 待审批列表
- [x] 审批详情（含 AI 预评估结果）
- [x] 多步骤审批操作（通过/拒绝/转交）
- [x] 审批历史记录

## Phase 7b: 审计日志与通知
- [x] 操作审计日志列表（按模块/用户/时间筛选）
- [x] 系统通知中心
- [x] 演示数据种子初始化功能

## Phase 8: 测试 & 交付
- [x] Vitest 单元测试（auth.logout 路由）
- [x] 修复 logout 路由 cookie 名称（COOKIE_NAME 常量）
- [x] 修复 TypeScript 编译错误（useAuth.ts, Approvals.tsx）
- [x] 数据库迁移执行（所有 18 张表）
- [x] 构建验证（TypeScript 零错误）
- [x] 保存 Checkpoint 并交付

## Phase 9: 详情页与增强功能（已全部完成）
- [x] 商品详情侧边抽屉（价格对比、库存状态、标签、描述）
- [x] 客户详情侧边抽屉（订单历史、联系信息、备注）
- [x] 订单详情侧边抽屉（订单项、物流追踪、状态变更）
- [x] 广告活动创建/编辑对话框（新建活动、暂停/恢复）
- [x] 库存调整操作（入库/出库/调整历史）
- [x] db.ts 新增 adjustInventory、createAdCampaign、updateAdCampaign、updateCustomer、updateOrder、updateInquiry、getCustomerOrders、getOrderItems、getQuoteById、updateQuote 函数
- [x] routers.ts 新增对应 tRPC 路由（customers.update、orders.updateStatus、ads.create/update、inventory.adjust、inquiries.updateStatus/updateQuote）
- [x] TypeScript 零错误验证
- [x] 测试套件通过
