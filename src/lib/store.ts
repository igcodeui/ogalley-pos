import { create } from 'zustand';
import type { CartItem, ViewType, OrderType, Employee, PaymentMethod, DiscountType, Order } from './types';

// ============ UI Store ============
interface UIStore {
  currentView: ViewType;
  sidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  isCheckoutOpen: boolean;
  isReceiptOpen: boolean;
  isHoldingOrder: boolean;
  currentReceiptOrder: Order | null;
  searchQuery: string;
  setCurrentView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
  setReceiptOpen: (open: boolean) => void;
  setCurrentReceiptOrder: (order: Order | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentView: 'pos',
  sidebarCollapsed: false,
  isMobileMenuOpen: false,
  isCheckoutOpen: false,
  isReceiptOpen: false,
  isHoldingOrder: false,
  currentReceiptOrder: null,
  searchQuery: '',
  setCurrentView: (view) => set({ currentView: view, isMobileMenuOpen: false, searchQuery: '' }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),
  setReceiptOpen: (open) => set({ isReceiptOpen: open }),
  setCurrentReceiptOrder: (order) => set({ currentReceiptOrder: order }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// ============ POS / Cart Store ============
interface POSStore {
  cart: CartItem[];
  orderType: OrderType;
  selectedCategoryId: string | null;
  appliedDiscount: { type: DiscountType; value: number; code?: string; amount: number } | null;
  selectedCustomer: { id: string; name: string; loyaltyPoints: number } | null;
  heldOrders: { id: string; cart: CartItem[]; orderType: OrderType; customer: string | null; createdAt: string }[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (tempId: string) => void;
  updateCartQuantity: (tempId: string, quantity: number) => void;
  updateCartItem: (tempId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setAppliedDiscount: (discount: { type: DiscountType; value: number; code?: string; amount: number } | null) => void;
  setSelectedCustomer: (customer: { id: string; name: string; loyaltyPoints: number } | null) => void;
  holdOrder: () => void;
  resumeOrder: (id: string) => void;
  removeHeldOrder: (id: string) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  cart: [],
  orderType: 'DINE_IN',
  selectedCategoryId: null,
  appliedDiscount: null,
  selectedCustomer: null,
  heldOrders: [],

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (c) =>
          c.product.id === item.product.id &&
          c.size === item.size &&
          c.sugarLevel === item.sugarLevel &&
          c.iceLevel === item.iceLevel &&
          c.temperature === item.temperature &&
          JSON.stringify(c.selectedAddons) === JSON.stringify(item.selectedAddons)
      );
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.tempId === existing.tempId
              ? { ...c, quantity: c.quantity + item.quantity, subtotal: (c.quantity + item.quantity) * c.unitPrice }
              : c
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),

  removeFromCart: (tempId) => set((s) => ({ cart: s.cart.filter((c) => c.tempId !== tempId) })),
  updateCartQuantity: (tempId, quantity) =>
    set((s) => ({
      cart: quantity <= 0
        ? s.cart.filter((c) => c.tempId !== tempId)
        : s.cart.map((c) => (c.tempId === tempId ? { ...c, quantity, subtotal: quantity * c.unitPrice } : c)),
    })),
  updateCartItem: (tempId, updates) =>
    set((s) => ({
      cart: s.cart.map((c) => {
        if (c.tempId !== tempId) return c;
        const updated = { ...c, ...updates };
        updated.subtotal = updated.quantity * updated.unitPrice;
        return updated;
      }),
    })),
  clearCart: () => set({ cart: [], appliedDiscount: null, selectedCustomer: null }),
  setOrderType: (type) => set({ orderType: type }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  setAppliedDiscount: (discount) => set({ appliedDiscount: discount }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

  holdOrder: () =>
    set((s) => {
      if (s.cart.length === 0) return s;
      const held = {
        id: crypto.randomUUID(),
        cart: [...s.cart],
        orderType: s.orderType,
        customer: s.selectedCustomer?.name ?? null,
        createdAt: new Date().toISOString(),
      };
      return { cart: [], appliedDiscount: null, selectedCustomer: null, heldOrders: [...s.heldOrders, held] };
    }),

  resumeOrder: (id) =>
    set((s) => {
      const held = s.heldOrders.find((h) => h.id === id);
      if (!held) return s;
      return {
        cart: held.cart,
        orderType: held.orderType,
        heldOrders: s.heldOrders.filter((h) => h.id !== id),
      };
    }),

  removeHeldOrder: (id) => set((s) => ({ heldOrders: s.heldOrders.filter((h) => h.id !== id) })),

  getSubtotal: () => get().cart.reduce((sum, item) => sum + item.subtotal, 0),
  getTax: () => {
    const sub = get().getSubtotal();
    const disc = get().getDiscountAmount();
    return Math.round((sub - disc) * 0.12 * 100) / 100;
  },
  getDiscountAmount: () => get().appliedDiscount?.amount ?? 0,
  getTotal: () => {
    const sub = get().getSubtotal();
    const disc = get().getDiscountAmount();
    const tax = Math.round((sub - disc) * 0.12 * 100) / 100;
    return Math.round((sub - disc + tax) * 100) / 100;
  },
  getItemCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
}));

// ============ Auth Store ============
interface AuthStore {
  currentEmployee: Employee | null;
  isAuthenticated: boolean;
  login: (employee: Employee) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentEmployee: null,
  isAuthenticated: false,
  login: (employee) => set({ currentEmployee: employee, isAuthenticated: true }),
  logout: () => set({ currentEmployee: null, isAuthenticated: false }),
}));