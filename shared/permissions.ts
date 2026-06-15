export type UserRole =
  | "super_admin"
  | "tenant_admin"
  | "operator"
  | "advertiser"
  | "warehouse"
  | "finance"
  | "readonly"
  | "admin"
  | "user";

export type ModuleKey =
  | "dashboard"
  | "products"
  | "customers"
  | "orders"
  | "ads"
  | "inventory"
  | "inquiries"
  | "agent"
  | "approvals"
  | "audit"
  | "notifications"
  | "settings";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "超级管理员",
  tenant_admin: "租户管理员",
  operator: "运营",
  advertiser: "广告",
  warehouse: "仓储",
  finance: "财务",
  readonly: "只读",
  admin: "管理员",
  user: "普通用户",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "text-purple-400 bg-purple-400/10",
  tenant_admin: "text-indigo-400 bg-indigo-400/10",
  operator: "text-blue-400 bg-blue-400/10",
  advertiser: "text-cyan-400 bg-cyan-400/10",
  warehouse: "text-amber-400 bg-amber-400/10",
  finance: "text-emerald-400 bg-emerald-400/10",
  readonly: "text-slate-400 bg-slate-400/10",
  admin: "text-purple-400 bg-purple-400/10",
  user: "text-slate-400 bg-slate-400/10",
};

// Modules each role can access
export const ROLE_PERMISSIONS: Record<UserRole, ModuleKey[]> = {
  super_admin: ["dashboard", "products", "customers", "orders", "ads", "inventory", "inquiries", "agent", "approvals", "audit", "notifications", "settings"],
  admin: ["dashboard", "products", "customers", "orders", "ads", "inventory", "inquiries", "agent", "approvals", "audit", "notifications", "settings"],
  tenant_admin: ["dashboard", "products", "customers", "orders", "ads", "inventory", "inquiries", "agent", "approvals", "audit", "notifications", "settings"],
  operator: ["dashboard", "products", "customers", "orders", "inquiries", "agent", "approvals", "notifications"],
  advertiser: ["dashboard", "ads", "products", "agent", "notifications"],
  warehouse: ["dashboard", "inventory", "products", "agent", "notifications"],
  finance: ["dashboard", "orders", "customers", "audit", "notifications"],
  readonly: ["dashboard", "products", "customers", "orders", "ads", "inventory", "inquiries"],
  user: ["dashboard", "products", "customers", "orders", "inquiries", "notifications"],
};

export function hasPermission(role: UserRole, module: ModuleKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}

export function canWrite(role: UserRole): boolean {
  return !["readonly"].includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return ["super_admin", "admin", "tenant_admin"].includes(role);
}
