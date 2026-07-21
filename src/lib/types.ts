export type ViewType =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'employees'
  | 'reports'
  | 'settings';

export type OrderType = 'DINE_IN' | 'TAKE_OUT' | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'GIFT_CERTIFICATE' | 'STORE_CREDIT';
export type OrderStatus = 'COMPLETED' | 'VOID' | 'REFUND' | 'HOLD';
export type EmployeeRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY';
export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'SENIOR_CITIZEN' | 'PWD' | 'EMPLOYEE' | 'PROMO';
export type MembershipLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  imageUrl?: string;
  costPrice: number;
  sellingPrice: number;
  isAvailable: boolean;
  isFavorite: boolean;
  categoryIds: string;
  variants?: string;
  addons?: string;
  recipe?: string;
  sizeOptions?: string;
  hasSugarLevel: boolean;
  hasIceLevel: boolean;
  hasHotCold: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  product?: Product;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
  address?: string;
  loyaltyPoints: number;
  cashbackBalance: number;
  membershipLevel: MembershipLevel;
  totalSpent: number;
  totalVisits: number;
  referralCode?: string;
  referredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  pin: string;
  isActive: boolean;
  hireDate?: string;
  hourlyRate: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer?: Customer;
  employeeId?: string;
  employee?: Employee;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  discountType?: DiscountType;
  discountCode?: string;
  taxAmount: number;
  taxExempt: boolean;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  paymentNote?: string;
  referenceNumber?: string;
  notes?: string;
  isSplit: boolean;
  splitFromOrderId?: string;
  loyaltyPointsEarned: number;
  receiptPrinted: boolean;
  items?: OrderItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variant?: string;
  size?: string;
  sugarLevel?: string;
  iceLevel?: string;
  temperature?: string;
  addons?: string;
  notes?: string;
  costPrice: number;
  profit: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  tempId: string;
  product: Product;
  quantity: number;
  size?: string;
  sizePriceAdj?: number;
  sugarLevel?: string;
  iceLevel?: string;
  temperature?: string;
  selectedAddons?: { name: string; price: number }[];
  notes?: string;
  variant?: string;
  unitPrice: number;
  subtotal: number;
}

export interface DashboardStats {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  annualSales: number;
 todayTransactions: number;
  todayCustomers: number;
  avgOrderValue: number;
  grossProfit: number;
  netProfit: number;
 refundTotal: number;
 cancelledTotal: number;
 hourlySales: { hour: string; sales: number; orders: number }[];
  dailySales: { date: string; sales: number; orders: number }[];
  bestSellers: { productName: string; quantity: number; revenue: number }[];
  slowMovers: { productName: string; quantity: number; revenue: number }[];
  categoryPerformance: { category: string; sales: number; percentage: number }[];
  lowStockItems: { productName: string; currentStock: number; minStock: number }[];
  employeeRanking: { name: string; sales: number; transactions: number }[];
}

export interface StoreConfig {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  taxRate: number;
  currency: string;
  footerMessage?: string;
}
