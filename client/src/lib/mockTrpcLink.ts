import { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../../../server/routers";
import {
  mockUser,
  mockDashboardStats,
  mockTrend,
  mockProducts,
  mockCustomers,
  mockOrders,
  mockAds,
  mockInventory,
  mockInquiries,
  mockQuotes,
  mockAgentSuggestions,
  mockApprovals,
  mockNotifications,
  mockAuditLogs,
} from "./mockData";

// Mock response registry
const mockResponses: Record<string, (input?: unknown) => unknown> = {
  "auth.me": () => mockUser,
  "auth.logout": () => ({ success: true }),
  "system.health": () => ({ status: "ok" }),
  "dashboard.stats": () => mockDashboardStats,
  "dashboard.trend": () => mockTrend,
  "products.list": () => mockProducts,
  "products.getById": (input: any) => mockProducts.items.find(p => p.id === input?.id) ?? null,
  "products.create": () => ({ success: true }),
  "products.update": () => ({ success: true }),
  "products.delete": () => ({ success: true }),
  "customers.list": () => mockCustomers,
  "customers.getById": (input: any) => mockCustomers.items.find(c => c.id === input?.id) ?? null,
  "customers.create": () => ({ success: true }),
  "customers.update": () => ({ success: true }),
  "orders.list": () => mockOrders,
  "orders.getById": (input: any) => mockOrders.items.find(o => o.id === input?.id) ?? null,
  "orders.create": () => ({ success: true }),
  "orders.update": () => ({ success: true }),
  "ads.list": () => mockAds,
  "ads.getById": (input: any) => mockAds.items.find(a => a.id === input?.id) ?? null,
  "ads.create": () => ({ success: true }),
  "ads.update": () => ({ success: true }),
  "ads.pause": () => ({ success: true }),
  "ads.resume": () => ({ success: true }),
  "inventory.list": () => mockInventory,
  "inventory.adjust": () => ({ success: true }),
  "inquiries.list": () => mockInquiries,
  "inquiries.getById": (input: any) => mockInquiries.items.find(i => i.id === input?.id) ?? null,
  "inquiries.create": () => ({ success: true }),
  "inquiries.updateStatus": () => ({ success: true }),
  "inquiries.quotes": () => mockQuotes,
  "inquiries.getQuoteById": (input: any) => mockQuotes.items.find(q => q.id === input?.id) ?? null,
  "inquiries.createQuote": () => ({ success: true }),
  "inquiries.updateQuote": () => ({ success: true }),
  "agent.suggestions": () => mockAgentSuggestions,
  "agent.review": () => ({ success: true }),
  "approvals.list": () => mockApprovals,
  "approvals.pendingCount": () => ({ count: 3 }),
  "approvals.approve": () => ({ success: true }),
  "approvals.reject": () => ({ success: true }),
  "notifications.list": () => mockNotifications,
  "notifications.unreadCount": () => ({ count: 3 }),
  "notifications.markRead": () => ({ success: true }),
  "notifications.markAllRead": () => ({ success: true }),
  "audit.list": () => mockAuditLogs,
  "seed.init": () => ({ success: true, message: "Demo 模式，无需初始化" }),
};

export const mockTrpcLink = (): TRPCLink<AppRouter> => {
  return () => {
    return ({ op }) => {
      return observable((observer) => {
        const path = op.path;
        const input = op.input;
        const timer = setTimeout(() => {
          const handler = mockResponses[path];
          if (handler) {
            try {
              const result = handler(input);
              observer.next({ result: { type: "data", data: result } });
              observer.complete();
            } catch (err) {
              observer.error(err);
            }
          } else {
            console.warn("[MockTRPC] No mock for:", path);
            observer.next({ result: { type: "data", data: null } });
            observer.complete();
          }
        }, 150);
        return () => clearTimeout(timer);
      });
    };
  };
};
