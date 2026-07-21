'use client';

import { useUIStore, useAuthStore } from '@/lib/store';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import DashboardView from '@/components/dashboard/DashboardView';
import POSView from '@/components/pos/POSView';
import ProductsView from '@/components/products/ProductsView';
import InventoryView from '@/components/inventory/InventoryView';
import CustomersView from '@/components/customers/CustomersView';
import EmployeesView from '@/components/employees/EmployeesView';
import ReportsView from '@/components/reports/ReportsView';
import SettingsView from '@/components/settings/SettingsView';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import type { ViewType, Employee } from '@/lib/types';

function LoginScreen() {
  const { login } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Invalid PIN');
        setLoading(false);
        return;
      }

      const emp: Employee = await res.json();
      login(emp);
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1a1510 0%, #111111 50%, #0a0a0a 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-2xl shadow-[#C48A3A]/30"
          >
            <Image src="/logo.jpg" alt="O'Galley" width={80} height={80} className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">O'Galley</h1>
          <p className="text-sm text-[#888] mt-1">POS System</p>
        </div>

        {/* PIN Input */}
        <div className="premium-card p-6 bronze-glow">
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-white">Enter your PIN</p>
            {error ? (
              <p className="text-xs text-red-400 mt-0.5">{error}</p>
            ) : (
              <p className="text-xs text-[#888] mt-0.5">Enter your 4+ digit employee PIN</p>
            )}
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all duration-200
                  ${i < pin.length ? 'border-[#C48A3A] bg-[#C48A3A]/10 text-[#C48A3A]' : 'border-white/[0.1] text-transparent'}
                  ${error ? 'border-red-500 bg-red-500/10' : ''}`}
              >
                {i < pin.length ? '●' : '·'}
              </div>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(k => (
              <button
                key={k}
                disabled={k === '' || loading}
                onClick={() => {
                  if (k === '⌫') setPin(p => p.slice(0, -1));
                  else if (pin.length < 6) setPin(p => p + k);
                  setError('');
                }}
                className={`h-12 rounded-xl text-lg font-medium transition-all duration-150
                  ${k === '' ? 'invisible' : 'bg-white/[0.05] hover:bg-white/[0.1] text-white active:scale-95 border border-white/[0.06] disabled:opacity-50'}
                `}
              >{k}</button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={pin.length < 4 || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white font-medium text-sm disabled:opacity-30 hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all active:scale-[0.98]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && error.includes('Connection') && (
            <p className="text-center text-[10px] text-[#666] mt-3">
              Make sure the server is running. Add an employee in Settings first if this is a fresh install.
            </p>
          )}
        </div>

        <p className="text-center text-[10px] text-[#666] mt-6">
          O&apos;Galley — Enterprise POS System v1.0
        </p>
      </motion.div>
    </div>
  );
}

const viewComponents: Record<ViewType, React.ComponentType> = {
  dashboard: DashboardView,
  pos: POSView,
  products: ProductsView,
  inventory: InventoryView,
  customers: CustomersView,
  employees: EmployeesView,
  reports: ReportsView,
  settings: SettingsView,
};

const ROLE_VIEW_MAP: Record<string, number> = {
  dashboard: 3, // MANAGER
  pos: 0, // ALL
  customers: 0, // ALL
  products: 4, // ADMIN
  inventory: 3, // MANAGER
  employees: 4, // ADMIN
  reports: 3, // MANAGER
  settings: 4, // ADMIN
};
const ROLE_LEVEL: Record<string, number> = { OWNER: 5, ADMIN: 4, MANAGER: 3, INVENTORY: 2, CASHIER: 1 };

export default function HomePage() {
  const { currentView, sidebarCollapsed, setCurrentView } = useUIStore();
  const { isAuthenticated, currentEmployee } = useAuthStore();
  const [mounted] = useState(true);

  // View-level role guard
  const userLevel = currentEmployee ? (ROLE_LEVEL[currentEmployee.role] ?? 1) : 0;
  const requiredLevel = ROLE_VIEW_MAP[currentView] ?? 0;
  const canAccess = userLevel >= requiredLevel;

  if (!mounted) return null;
  if (!isAuthenticated) return <LoginScreen />;

  // If user can't access the view, redirect to POS
  const activeView = canAccess ? currentView : 'pos';
  const ViewComponent = viewComponents[activeView];

  return (
    <div className="min-h-screen bg-[#111111]">
      <AppSidebar />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}
      >
        <AppHeader />

        <main className={`${activeView === 'pos' ? 'h-[calc(100vh-4rem)]' : 'min-h-[calc(100vh-4rem)]'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={activeView === 'pos' ? 'h-full' : ''}
            >
              <ViewComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
