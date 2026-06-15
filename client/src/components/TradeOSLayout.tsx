import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { hasPermission, ROLE_LABELS, ROLE_COLORS, type UserRole, type ModuleKey } from "../../../shared/permissions";
import {
  LayoutDashboard, Package, Users, ShoppingCart, Megaphone, Warehouse,
  MessageSquare, Bot, CheckSquare, FileText, Bell, Settings, ChevronLeft,
  ChevronRight, LogOut, Menu, X, Sparkles, TrendingUp, AlertTriangle,
  ChevronDown, Search, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "经营驾驶舱", icon: LayoutDashboard, path: "/" },
  { key: "products", label: "SKU 商品", icon: Package, path: "/products" },
  { key: "customers", label: "客户管理", icon: Users, path: "/customers" },
  { key: "orders", label: "订单管理", icon: ShoppingCart, path: "/orders" },
  { key: "ads", label: "广告管理", icon: Megaphone, path: "/ads" },
  { key: "inventory", label: "库存仓库", icon: Warehouse, path: "/inventory" },
  { key: "inquiries", label: "询盘报价", icon: MessageSquare, path: "/inquiries" },
  { key: "agent", label: "AI Agent", icon: Bot, path: "/agent" },
  { key: "approvals", label: "审批中心", icon: CheckSquare, path: "/approvals" },
  { key: "audit", label: "审计日志", icon: FileText, path: "/audit" },
  { key: "notifications", label: "通知中心", icon: Bell, path: "/notifications" },
];

interface TradeOSLayoutProps {
  children: React.ReactNode;
}

export default function TradeOSLayout({ children }: TradeOSLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const { data: approvalCount } = trpc.approvals.pendingCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const userRole = (user?.role ?? "readonly") as UserRole;

  const visibleNavItems = NAV_ITEMS.filter(item =>
    hasPermission(userRole, item.key)
  ).map(item => ({
    ...item,
    badge: item.key === "notifications" ? notifCount?.count
         : item.key === "approvals" ? approvalCount?.count
         : undefined,
  }));

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">正在加载 TradeOS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-6">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold font-heading gradient-text">TradeOS</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">跨境电商智能管理平台</h1>
          <p className="text-muted-foreground">AI 驱动的全业务闭环管理，从驾驶舱到审批审计，一站式掌控。</p>
          <Button
            className="w-full glow-primary"
            size="lg"
            onClick={() => window.location.href = getLoginUrl()}
          >
            登录开始使用
          </Button>
        </div>
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn(
      "flex flex-col h-full transition-all duration-300",
      mobile ? "w-64" : collapsed ? "w-16" : "w-60",
      "bg-sidebar border-r border-sidebar-border"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-sidebar-border shrink-0",
        collapsed && !mobile ? "justify-center" : "justify-between"
      )}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold font-heading text-foreground leading-none">TradeOS</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">跨境电商管理平台</div>
            </div>
          </div>
        )}
        {collapsed && !mobile && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleNavItems.map(item => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          const Icon = item.icon;
          const navItem = (
            <Link
              key={item.key}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "sidebar-item-active text-primary bg-primary/10"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {(!collapsed || mobile) && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && !mobile && item.badge != null && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary pulse-dot" />
              )}
            </Link>
          );
          if (collapsed && !mobile) {
            return (
              <Tooltip key={item.key} delayDuration={0}>
                <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return navItem;
        })}
      </nav>

      {/* User */}
      <div className={cn(
        "border-t border-sidebar-border p-3 shrink-0",
        collapsed && !mobile ? "flex justify-center" : ""
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-2.5 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors text-left",
              collapsed && !mobile ? "justify-center" : ""
            )}>
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              {(!collapsed || mobile) && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{user?.name ?? "用户"}</div>
                  <div className={cn("text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-0.5", ROLE_COLORS[userRole])}>
                    {ROLE_LABELS[userRole]}
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
              {user?.email ?? ""}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
              <LogOut className="w-3.5 h-3.5 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / Title */}
          <div className="flex-1">
            <PageTitle location={location} navItems={visibleNavItems} />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link href="/notifications">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
                <Bell className="w-4 h-4" />
                {notifCount?.count != null && notifCount.count > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary pulse-dot" />
                )}
              </button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function PageTitle({ location, navItems }: { location: string; navItems: NavItem[] }) {
  const current = navItems.find(item =>
    item.path === location || (item.path !== "/" && location.startsWith(item.path))
  );
  const Icon = current?.icon;
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      <span className="text-sm font-semibold text-foreground">{current?.label ?? "TradeOS"}</span>
    </div>
  );
}
