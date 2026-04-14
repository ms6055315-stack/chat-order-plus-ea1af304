import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import OrdersPage from "./pages/Orders";
import SelfServicePage from "./pages/SelfService";
import ReportsPage from "./pages/Reports";
import WhatsAppSettingsPage from "./pages/WhatsAppSettings";
import POSSettingsPage from "./pages/POSSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/self-service" element={<SelfServicePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/whatsapp-settings" element={<WhatsAppSettingsPage />} />
          <Route path="/pos-settings" element={<POSSettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
