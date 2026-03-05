import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { CategoryProvider } from './context/CategoryContext';
import { InvoiceProvider } from './context/InvoiceContext';
import { ReturnProvider } from './context/ReturnContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Categories from './pages/Categories';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Returns from './pages/Returns';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <CategoryProvider>
              <InvoiceProvider>
                <ReturnProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Main Layout Routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }>
                      {/* Common Routes */}
                      <Route index element={<Billing />} />
                      <Route path="invoices" element={<Invoices />} />
                      <Route path="returns" element={<Returns />} />

                      {/* Manager Only Routes */}
                      <Route path="sales" element={
                        <ProtectedRoute allowedRoles={['manager']}>
                          <Sales />
                        </ProtectedRoute>
                      } />
                      <Route path="inventory" element={
                        <ProtectedRoute allowedRoles={['manager']}>
                          <Inventory />
                        </ProtectedRoute>
                      } />
                      <Route path="categories" element={
                        <ProtectedRoute allowedRoles={['manager']}>
                          <Categories />
                        </ProtectedRoute>
                      } />
                      <Route path="customers" element={
                        <ProtectedRoute allowedRoles={['manager']}>
                          <Customers />
                        </ProtectedRoute>
                      } />
                    </Route>

                  </Routes>
                </ReturnProvider>
              </InvoiceProvider>
            </CategoryProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
