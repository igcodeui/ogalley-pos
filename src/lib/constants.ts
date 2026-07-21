export const CURRENCY = '₱';
export const TAX_RATE = 0.12;

export const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];
export const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular'];
export const TEMPERATURES = ['Hot', 'Cold'];
export const SIZES = ['Small', 'Medium', 'Large'];
export const SIZE_PRICE_ADJ: Record<string, number> = { Small: 0, Medium: 15, Large: 30 };

export const ORDER_TYPES = [
  { value: 'DINE_IN' as const, label: 'Dine In', icon: 'UtensilsCrossed' },
  { value: 'TAKE_OUT' as const, label: 'Take Out', icon: 'Package' },
  { value: 'DELIVERY' as const, label: 'Delivery', icon: 'Truck' },
];

export const PAYMENT_METHODS = [
  { value: 'CASH' as const, label: 'Cash', icon: 'Banknote' },
  { value: 'CREDIT_CARD' as const, label: 'Credit Card', icon: 'CreditCard' },
  { value: 'DEBIT_CARD' as const, label: 'Debit Card', icon: 'CreditCard' },
  { value: 'GCASH' as const, label: 'GCash', icon: 'Smartphone' },
  { value: 'MAYA' as const, label: 'Maya', icon: 'Wallet' },
  { value: 'BANK_TRANSFER' as const, label: 'Bank Transfer', icon: 'Landmark' },
  { value: 'GIFT_CERTIFICATE' as const, label: 'Gift Certificate', icon: 'Gift' },
  { value: 'STORE_CREDIT' as const, label: 'Store Credit', icon: 'BadgePercent' },
];

export const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE' as const, label: 'Percentage (%)' },
  { value: 'FIXED' as const, label: 'Fixed Amount' },
  { value: 'SENIOR_CITIZEN' as const, label: 'Senior Citizen (20%)' },
  { value: 'PWD' as const, label: 'PWD (20%)' },
  { value: 'EMPLOYEE' as const, label: 'Employee Discount' },
  { value: 'PROMO' as const, label: 'Promo Code' },
];

export const MEMBERSHIP_LEVELS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;

export const MEMBERSHIP_THRESHOLDS: Record<string, { minSpent: number; pointsMultiplier: number; color: string }> = {
  BRONZE: { minSpent: 0, pointsMultiplier: 1, color: '#CD7F32' },
  SILVER: { minSpent: 5000, pointsMultiplier: 1.5, color: '#C0C0C0' },
  GOLD: { minSpent: 15000, pointsMultiplier: 2, color: '#FFD700' },
  PLATINUM: { minSpent: 50000, pointsMultiplier: 3, color: '#E5E4E2' },
};

export function formatCurrency(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `ORD-${date}-${seq}`;
}

export function getMembershipLevel(totalSpent: number): string {
  if (totalSpent >= 50000) return 'PLATINUM';
  if (totalSpent >= 15000) return 'GOLD';
  if (totalSpent >= 5000) return 'SILVER';
  return 'BRONZE';
}