import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ResetPassword from "@/pages/ResetPassword";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCollections from "@/pages/admin/AdminCollections";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import HomeBanners from "@/pages/admin/HomeBanners";
import InventoryDashboard from "@/pages/inventory/InventoryDashboard";
import InventoryStock from "@/pages/inventory/InventoryStock";
import RecordSale from "@/pages/inventory/RecordSale";
import StockHistory from "@/pages/inventory/StockHistory";
import { AdminGuard } from "./AdminGuard";
import AdminLogin from "./AdminLogin";

const queryClient = new QueryClient();

// The admin portal is its own site (e.g. admin.yourdomain.com), separate from the store.
const AdminApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword successPath="/" loginPath="/login" />} />
            <Route
              path="/"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<Dashboard />} />
              {/* Store Admin: the website and its customers */}
              <Route path="banners" element={<HomeBanners />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              {/* Inventory Management: products and stock */}
              <Route path="inventory" element={<InventoryDashboard />} />
              <Route path="inventory/products" element={<AdminProducts />} />
              <Route path="inventory/stock" element={<InventoryStock />} />
              <Route path="inventory/sale" element={<RecordSale />} />
              <Route path="inventory/history" element={<StockHistory />} />
              {/* Products moved into Inventory Management */}
              <Route path="products" element={<Navigate to="/inventory/products" replace />} />
            </Route>
            {/* Old /admin/... bookmarks keep working */}
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AdminApp;
