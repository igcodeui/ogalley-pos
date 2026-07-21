'use client';

import { useUIStore, useAuthStore } from '@/lib/store';
import type { ViewType, EmployeeRole } from '@/lib/types';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Warehouse,
  Users,
  UserCog,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems: { view: ViewType; label: string; icon: React.ReactNode; minRole?: EmployeeRole }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, minRole: 'MANAGER' },
  { view: 'pos', label: 'POS Terminal', icon: <ShoppingBag size={20} /> },
  { view: 'products', label: 'Products', icon: <Package size={20} />, minRole: 'ADMIN' },
  { view: 'inventory', label: 'Inventory', icon: <Warehouse size={20} />, minRole: 'MANAGER' },
  { view: 'customers', label: 'Customers', icon: <Users size={20} /> },
  { view: 'employees', label: 'Employees', icon: <UserCog size={20} />, minRole: 'ADMIN' },
  { view: 'reports', label: 'Reports', icon: <BarChart3 size={20} />, minRole: 'MANAGER' },
  { view: 'settings', label: 'Settings', icon: <Settings size={20} />, minRole: 'ADMIN' },
];

const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  INVENTORY: 2,
  CASHIER: 1,
};

export default function AppSidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { currentEmployee } = useAuthStore();
  const userLevel = currentEmployee ? ROLE_HIERARCHY[currentEmployee.role] ?? 1 : 0;

  const visibleNavItems = navItems.filter((item) => {
    if (!item.minRole) return true;
    return userLevel >= (ROLE_HIERARCHY[item.minRole] ?? 0);
  });

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        style={{
          background: 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-[#C48A3A]/20">
            <Image src="/logo.jpg" alt="O'Galley" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-sm font-semibold text-white tracking-tight">O'Galley</h1>
                <p className="text-[10px] text-[#888] -mt-0.5">POS System</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'text-[#C48A3A] bg-[#C48A3A]/10'
                    : 'text-[#888] hover:text-white hover:bg-white/[0.04]'
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-[#C48A3A]"
                    style={{ boxShadow: '0 0 10px rgba(196,138,58,0.5)' }}
                  />
                )}
                <span className={`transition-colors duration-200 ${isActive ? 'text-[#C48A3A]' : 'text-[#888] group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle - Desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center h-12 border-t border-white/[0.06] text-[#888] hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </motion.aside>
    </>
  );
}