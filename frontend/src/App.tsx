import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ImportOrders from './pages/ImportOrders';
import ImportSales from './pages/ImportSales';
import ViewOrders from './pages/ViewOrders';
import ViewSales from './pages/ViewSales';
import AddOrder from './pages/AddOrder';
import AddSale from './pages/AddSale';
import AddSupplier from './pages/AddSupplier';
import CustomLogin from './pages/CustomLogin';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<CustomLogin />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/import-orders" element={<ImportOrders />} />
                    <Route path="/import-sales" element={<ImportSales />} />
                    <Route path="/view-orders" element={<ViewOrders />} />
                    <Route path="/view-sales" element={<ViewSales />} />
                    <Route path="/add-order" element={<AddOrder />} />
                    <Route path="/add-sale" element={<AddSale />} />
                    <Route path="/add-supplier" element={<AddSupplier />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;