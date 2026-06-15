CREATE TABLE `ad_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`platform` enum('amazon','google','meta','tiktok','other') DEFAULT 'amazon',
	`status` enum('active','paused','ended','draft') NOT NULL DEFAULT 'draft',
	`budget` decimal(12,2),
	`spend` decimal(12,2) DEFAULT '0',
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`revenue` decimal(12,2) DEFAULT '0',
	`roi` decimal(8,4) DEFAULT '0',
	`ctr` decimal(8,4) DEFAULT '0',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`status` enum('active','paused','ended') NOT NULL DEFAULT 'active',
	`spend` decimal(12,2) DEFAULT '0',
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`ctr` decimal(8,4) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`type` enum('pricing','restock','ad_optimize','quote','risk','opportunity') NOT NULL,
	`title` varchar(256) NOT NULL,
	`summary` text NOT NULL,
	`reasoning` text,
	`confidence` decimal(5,4) DEFAULT '0.8',
	`impact` enum('high','medium','low') DEFAULT 'medium',
	`status` enum('pending','accepted','rejected','suspended','expired') NOT NULL DEFAULT 'pending',
	`relatedModule` varchar(64),
	`relatedId` int,
	`actionData` json,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `agent_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`action` enum('approved','rejected','transferred','commented','created') NOT NULL,
	`operatorId` int,
	`operatorName` varchar(128),
	`comment` text,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`taskNo` varchar(64) NOT NULL,
	`type` enum('quote_approval','price_change','large_order','restock','ad_budget','other') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`status` enum('pending','approved','rejected','transferred','expired') NOT NULL DEFAULT 'pending',
	`priority` enum('urgent','high','normal','low') DEFAULT 'normal',
	`requesterId` int,
	`assigneeId` int,
	`relatedModule` varchar(64),
	`relatedId` int,
	`aiPreEvaluation` json,
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `approval_tasks_taskNo_unique` UNIQUE(`taskNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int,
	`userName` varchar(128),
	`module` varchar(64) NOT NULL,
	`action` varchar(64) NOT NULL,
	`targetId` varchar(64),
	`targetName` varchar(256),
	`detail` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`company` varchar(128),
	`country` varchar(64),
	`platform` enum('amazon','shopify','alibaba','direct','other') DEFAULT 'direct',
	`tier` enum('vip','regular','new') DEFAULT 'new',
	`totalOrders` int DEFAULT 0,
	`totalSpend` decimal(14,2) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`date` varchar(16) NOT NULL,
	`gmv` decimal(16,2) DEFAULT '0',
	`orderCount` int DEFAULT 0,
	`adRoi` decimal(8,4) DEFAULT '0',
	`adSpend` decimal(12,2) DEFAULT '0',
	`stockAlertCount` int DEFAULT 0,
	`pendingInquiries` int DEFAULT 0,
	`newCustomers` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboard_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`inquiryNo` varchar(64) NOT NULL,
	`customerId` int,
	`customerName` varchar(128),
	`customerEmail` varchar(320),
	`platform` enum('amazon','alibaba','email','website','other') DEFAULT 'email',
	`status` enum('new','processing','quoted','negotiating','won','lost','converted') NOT NULL DEFAULT 'new',
	`subject` varchar(256),
	`content` text,
	`productIds` text,
	`estimatedValue` decimal(14,2),
	`assignedTo` int,
	`convertedOrderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `inquiries_inquiryNo_unique` UNIQUE(`inquiryNo`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`productId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`reservedQty` int DEFAULT 0,
	`availableQty` int DEFAULT 0,
	`inboundQty` int DEFAULT 0,
	`lowStockThreshold` int DEFAULT 50,
	`isAlert` boolean DEFAULT false,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryId` int NOT NULL,
	`type` enum('inbound','outbound','adjustment','transfer','damage') NOT NULL,
	`quantity` int NOT NULL,
	`reason` varchar(256),
	`operatorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int,
	`type` enum('info','warning','error','success','approval','ai_suggestion') DEFAULT 'info',
	`title` varchar(256) NOT NULL,
	`content` text,
	`isRead` boolean DEFAULT false,
	`relatedModule` varchar(64),
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`sku` varchar(64),
	`name` varchar(256),
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`totalPrice` decimal(12,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`customerId` int,
	`platform` enum('amazon','shopify','alibaba','direct','other') DEFAULT 'direct',
	`status` enum('pending','confirmed','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(14,2) NOT NULL,
	`currency` varchar(8) DEFAULT 'USD',
	`itemCount` int DEFAULT 1,
	`shippingAddress` text,
	`trackingNo` varchar(128),
	`notes` text,
	`inquiryId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`sku` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`category` varchar(64),
	`description` text,
	`imageUrl` text,
	`status` enum('active','inactive','draft') NOT NULL DEFAULT 'active',
	`costPrice` decimal(12,2),
	`amazonPrice` decimal(12,2),
	`shopifyPrice` decimal(12,2),
	`alibabaPrice` decimal(12,2),
	`amazonStock` int DEFAULT 0,
	`shopifyStock` int DEFAULT 0,
	`warehouseStock` int DEFAULT 0,
	`lowStockThreshold` int DEFAULT 50,
	`weight` decimal(8,2),
	`dimensions` varchar(64),
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`quoteNo` varchar(64) NOT NULL,
	`inquiryId` int,
	`customerId` int,
	`status` enum('draft','pending_approval','approved','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`totalAmount` decimal(14,2),
	`currency` varchar(8) DEFAULT 'USD',
	`validUntil` timestamp,
	`items` json,
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_quoteNo_unique` UNIQUE(`quoteNo`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`code` varchar(32) NOT NULL,
	`plan` enum('starter','growth','enterprise') NOT NULL DEFAULT 'starter',
	`status` enum('active','suspended','trial') NOT NULL DEFAULT 'trial',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`code` varchar(32),
	`location` varchar(256),
	`country` varchar(64),
	`type` enum('owned','3pl','fba','bonded') DEFAULT 'owned',
	`status` enum('active','inactive') DEFAULT 'active',
	`capacity` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','tenant_admin','operator','advertiser','warehouse','finance','readonly','admin','user') NOT NULL DEFAULT 'readonly';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;