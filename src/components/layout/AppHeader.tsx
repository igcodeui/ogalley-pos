'use client';

import { useUIStore, useAuthStore, usePOSStore } from '@/lib/store';
import { Menu, Bell, Search, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export default function AppHeader() {
  const { currentView, setMobileMenuOpen, searchQuery, setSearchQuery } = useUIStore();
  const { currentEmployee, logout } = useAuthStore();
  const { clearCart } = usePOSStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'POS Terminal',
    products: 'Product Management',
    inventory: 'Inventory',
    customers: 'Customers',
    employees: 'Employees',
    reports: 'Reports',
    settings: 'Settings',
  };

  const handleSignOut = () => {
    setShowUserMenu(false);
    clearCart();
    logout();
  };

  if (!currentEmployee) return null;

  return (
    <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-6 shrink-0 glass-strong z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">{viewTitles[currentView] || 'Dashboard'}</h2>
          <p className="text-[11px] text-[#888] -mt-0.5 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Center - Search (POS only) */}
      {currentView === 'pos' && (
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#C48A3A]/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C48A3A] rounded-full" />
        </button>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C48A3A] to-[#A06E28] flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-white leading-tight">{currentEmployee.name}</p>
              <p className="text-[10px] text-[#C48A3A] leading-tight">{currentEmployee.role}</p>
            </div>
          </button>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1E1E1E] border border-white/[0.08] shadow-2xl shadow-black/40 p-1.5 z-50"
            >
              <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                <p className="text-xs font-medium text-white">{currentEmployee.name}</p>
                <p className="text-[10px] text-[#888]">{currentEmployee.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}