import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import OrderConfirmation from "./pages/OrderConfirmation";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import Wishlist from "./pages/Wishlist";
import Sale from "./pages/Sale";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

const queryClient = new QueryClient();

// Layout wrapper for public pages
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <WhatsAppButton />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicLayout><Index /></PublicLayout>} />
              <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
              <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
              <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
              <Route path="/products/:slug" element={<PublicLayout><ProductDetail /></PublicLayout>} />
              <Route path="/products" element={<PublicLayout><Products /></PublicLayout>} />
              <Route path="/collections" element={<PublicLayout><Collections /></PublicLayout>} />
              <Route path="/collections/:slug" element={<PublicLayout><CollectionDetail /></PublicLayout>} />
              <Route path="/sale" element={<PublicLayout><Sale /></PublicLayout>} />
              <Route path="/sale/:slug" element={<PublicLayout><Sale /></PublicLayout>} />
              <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
              
              {/* Protected user routes */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <PublicLayout><Account /></PublicLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <PublicLayout><Orders /></PublicLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <PublicLayout><Checkout /></PublicLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <PublicLayout><Wishlist /></PublicLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-confirmation/:orderId"
                element={
                  <ProtectedRoute>
                    <PublicLayout><OrderConfirmation /></PublicLayout>
                  </ProtectedRoute>
                }
              />

              {/* The admin portal is a separate site: see src/admin/ */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
