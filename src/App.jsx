import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import MovementsPage from './pages/MovementsPage'
import ScanPage from './pages/ScanPage'
import UsersPage from './pages/UsersPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      {/* Admin y Operator */}
                      <Route path="/scan" element={<ScanPage />} />
                      <Route path="/" element={
                        <ProtectedRoute requiredRole="Admin"><DashboardPage /></ProtectedRoute>
                      } />
                      <Route path="/products" element={
                        <ProtectedRoute requiredRole="Admin"><ProductsPage /></ProtectedRoute>
                      } />
                      <Route path="/movements" element={
                        <ProtectedRoute requiredRole="Admin"><MovementsPage /></ProtectedRoute>
                      } />
                      <Route path="/users" element={
                        <ProtectedRoute requiredRole="Admin"><UsersPage /></ProtectedRoute>
                      } />
                      <Route path="*" element={<Navigate to="/scan" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
