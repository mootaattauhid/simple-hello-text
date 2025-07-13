
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import MidtransScript from "@/components/MidtransScript";

// Components
import AdminNavbar from "@/components/AdminNavbar";
import CashierNavbar from "@/components/CashierNavbar";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Children from "./pages/Children";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import FoodManagement from "./pages/admin/FoodManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import OrderManagementV2 from "./pages/admin/OrderManagementV2";
import ScheduleManagement from "./pages/admin/ScheduleManagement";
import UserManagement from "./pages/admin/UserManagement";
import PopulateDailyMenus from "./pages/admin/PopulateDailyMenus";
import OrderRecap from "./pages/admin/OrderRecap";
import OrderRecapV2 from "./pages/admin/OrderRecapV2";
import Reports from "./pages/admin/Reports";

// Cashier Pages
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierReports from "./pages/cashier/CashierReports";
import CashierPaymentV2 from "./pages/cashier/CashierPaymentV2";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }: { 
  children: React.ReactNode; 
  requiredRoles?: string[] 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  console.log('ProtectedRoute: Checking access - authLoading:', authLoading, 'roleLoading:', roleLoading, 'user:', !!user);

  if (authLoading || roleLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Access granted');
  return <>{children}</>;
};

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  console.log('App: Auth state - user:', user?.email, 'authLoading:', authLoading);
  console.log('App: Role state - role:', role, 'roleLoading:', roleLoading);

  if (authLoading || roleLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  console.log('App: Rendering with role:', role, 'user:', !!user);

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Admin routes
  if (role === 'admin') {
    console.log('App: Showing admin dashboard');
    return (
      <>
        <AdminNavbar />
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/food-management" element={<FoodManagement />} />
          <Route path="/admin/order-management" element={<OrderManagement />} />
          <Route path="/admin/order-management-v2" element={<OrderManagementV2 />} />
          <Route path="/admin/schedule-management" element={<ScheduleManagement />} />
          <Route path="/admin/user-management" element={<UserManagement />} />
          <Route path="/admin/populate-daily-menus" element={<PopulateDailyMenus />} />
          <Route path="/admin/order-recap" element={<OrderRecap />} />
          <Route path="/admin/order-recap-v2" element={<OrderRecapV2 />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
  }

  // Cashier routes
  if (role === 'cashier') {
    console.log('App: Showing cashier dashboard');
    return (
      <>
        <CashierNavbar />
        <Routes>
          <Route path="/" element={<CashierDashboard />} />
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/cashier/reports" element={<CashierReports />} />
          <Route path="/cashier/payment-v2" element={<CashierPaymentV2 />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
  }

  // Parent routes (default)
  console.log('App: Showing parent dashboard');
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/orders" element={
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      } />
      <Route path="/orders/:orderId" element={
        <ProtectedRoute>
          <OrderDetail />
        </ProtectedRoute>
      } />
      <Route path="/children" element={
        <ProtectedRoute>
          <Children />
        </ProtectedRoute>
      } />
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MidtransScript />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
