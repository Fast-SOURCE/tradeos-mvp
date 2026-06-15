import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import TradeOSLayout from "@/components/TradeOSLayout";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

// Lazy load pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Products = lazy(() => import("@/pages/Products"));
const Customers = lazy(() => import("@/pages/Customers"));
const Orders = lazy(() => import("@/pages/Orders"));
const Ads = lazy(() => import("@/pages/Ads"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Inquiries = lazy(() => import("@/pages/Inquiries"));
const Agent = lazy(() => import("@/pages/Agent"));
const Approvals = lazy(() => import("@/pages/Approvals"));
const Audit = lazy(() => import("@/pages/Audit"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-6 h-6 text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <TradeOSLayout>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/products" component={Products} />
            <Route path="/customers" component={Customers} />
            <Route path="/orders" component={Orders} />
            <Route path="/ads" component={Ads} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/inquiries" component={Inquiries} />
            <Route path="/agent" component={Agent} />
            <Route path="/approvals" component={Approvals} />
            <Route path="/audit" component={Audit} />
            <Route path="/notifications" component={Notifications} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </TradeOSLayout>
      <Toaster position="top-right" richColors />
    </>
  );
}
