'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePOSStore, useUIStore, useAuthStore } from '@/lib/store';
import type { Product, Category, CartItem, PaymentMethod, OrderType, Order } from '@/lib/types';
import { formatCurrency, SUGAR_LEVELS, ICE_LEVELS, TEMPERATURES, SIZES, SIZE_PRICE_ADJ, ORDER_TYPES, PAYMENT_METHODS, DISCOUNT_TYPES, generateOrderNumber } from '@/lib/constants';
import { Search, Plus, Minus, Trash2, ShoppingBag, UtensilsCrossed, Package, Truck, CreditCard, Banknote, Smartphone, Wallet, Gift, BadgePercent, X, Pause, Play, Heart, Clock, ChevronDown, Tag, Percent, User, Check, Printer, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// ============ HELPERS ============

const CATEGORY_EMOJIS: Record<string, string> = {
  coffee: '☕',
  tea: '🍵',
  milkshake: '🥤',
  smoothie: '🫐',
  juice: '🧃',
  pastry: '🥐',
  cake: '🍰',
  bread: '🍞',
  sandwich: '🥪',
  rice: '🍚',
  noodle: '🍜',
  pasta: '🍝',
  salad: '🥗',
  dessert: '🍮',
  snack: '🍿',
  burger: '🍔',
  pizza: '🍕',
  chicken: '🍗',
  seafood: '🦐',
  default: '🍽️',
};

function getCategoryEmoji(categoryName: string): string {
  const lower = categoryName.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return CATEGORY_EMOJIS.default;
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="w-5 h-5" />,
  CREDIT_CARD: <CreditCard className="w-5 h-5" />,
  DEBIT_CARD: <CreditCard className="w-5 h-5" />,
  GCASH: <Smartphone className="w-5 h-5" />,
  MAYA: <Wallet className="w-5 h-5" />,
  BANK_TRANSFER: <CreditCard className="w-5 h-5" />,
  GIFT_CERTIFICATE: <Gift className="w-5 h-5" />,
  STORE_CREDIT: <BadgePercent className="w-5 h-5" />,
};

const ORDER_TYPE_ICONS: Record<string, React.ReactNode> = {
  DINE_IN: <UtensilsCrossed className="w-3.5 h-3.5" />,
  TAKE_OUT: <Package className="w-3.5 h-3.5" />,
  DELIVERY: <Truck className="w-3.5 h-3.5" />,
};

// ============ MAIN COMPONENT ============

export default function POSView() {
  const isMobile = useIsMobile();

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);

  // Quick Add Dialog
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [qaSize, setQaSize] = useState('Small');
  const [qaSugar, setQaSugar] = useState('100%');
  const [qaIce, setQaIce] = useState('Regular');
  const [qaTemp, setQaTemp] = useState('Cold');
  const [qaAddons, setQaAddons] = useState<{ name: string; price: number }[]>([]);
  const [qaQty, setQaQty] = useState(1);
  const [qaNotes, setQaNotes] = useState('');
  const [specialTab, setSpecialTab] = useState<string | null>(null); // 'favorites' | 'recent' | null

  // Checkout
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<{ id: string; name: string; loyaltyPoints: number }[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Cart
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Stores
  const {
    cart, orderType, selectedCategoryId, appliedDiscount, selectedCustomer,
    heldOrders, addToCart, removeFromCart, updateCartQuantity, clearCart,
    setOrderType, setSelectedCategoryId, setAppliedDiscount, setSelectedCustomer,
    holdOrder, resumeOrder, removeHeldOrder,
    getSubtotal, getTax, getDiscountAmount, getTotal, getItemCount,
  } = usePOSStore();
  const { currentEmployee } = useAuthStore();

  const { searchQuery, isCheckoutOpen, isReceiptOpen, setCheckoutOpen, setReceiptOpen, currentReceiptOrder, setCurrentReceiptOrder } = useUIStore();

  // ============ DATA FETCHING ============
  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(cats.filter((c: Category) => c.isActive));
        }
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods.filter((p: Product) => p.isAvailable));
        }
      } catch (e) {
        console.error('Failed to fetch POS data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ============ DERIVED STATE ============

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Special tabs
    if (specialTab === 'favorites') {
      filtered = filtered.filter((p) => p.isFavorite);
    } else if (specialTab === 'recent') {
      filtered = filtered.filter((p) => recentProductIds.includes(p.id));
    } else if (selectedCategoryId) {
      filtered = filtered.filter((p) => {
        try {
          const ids: string[] = JSON.parse(p.categoryIds);
          return ids.includes(selectedCategoryId);
        } catch {
          return false;
        }
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [products, selectedCategoryId, searchQuery, specialTab, recentProductIds]);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();

  const parsedAddons = useMemo(() => {
    if (!quickAddProduct?.addons) return [];
    try {
      return JSON.parse(quickAddProduct.addons) as { name: string; price: number; isDefault?: boolean }[];
    } catch {
      return [];
    }
  }, [quickAddProduct]);

  const qaUnitPrice = useMemo(() => {
    if (!quickAddProduct) return 0;
    const base = quickAddProduct.sellingPrice;
    const sizeAdj = SIZE_PRICE_ADJ[qaSize] ?? 0;
    const addonTotal = qaAddons.reduce((s, a) => s + a.price, 0);
    return base + sizeAdj + addonTotal;
  }, [quickAddProduct, qaSize, qaAddons]);

  // Checkout computed
  const checkoutSubtotal = subtotal;
  const checkoutDiscount = discountAmount;
  const checkoutTax = tax;
  const checkoutTotal = total;

  const cashTenderedNum = parseFloat(cashTendered) || 0;
  const changeAmount = Math.max(0, Math.round((cashTenderedNum - checkoutTotal) * 100) / 100);

  // ============ HANDLERS ============

  const openQuickAdd = useCallback((product: Product) => {
    setQuickAddProduct(product);
    setQaSize('Small');
    setQaSugar('100%');
    setQaIce('Regular');
    setQaTemp(product.hasHotCold ? 'Cold' : '');
    setQaAddons(parsedAddons.filter((a) => a.isDefault).map((a) => ({ name: a.name, price: a.price })));
    setQaQty(1);
    setQaNotes('');
  }, [parsedAddons]);

  const handleQuickAdd = useCallback(() => {
    if (!quickAddProduct) return;
    const item: CartItem = {
      tempId: crypto.randomUUID(),
      product: quickAddProduct,
      quantity: qaQty,
      size: quickAddProduct.sizeOptions ? qaSize : undefined,
      sizePriceAdj: quickAddProduct.sizeOptions ? (SIZE_PRICE_ADJ[qaSize] ?? 0) : undefined,
      sugarLevel: quickAddProduct.hasSugarLevel ? qaSugar : undefined,
      iceLevel: quickAddProduct.hasIceLevel ? qaIce : undefined,
      temperature: quickAddProduct.hasHotCold ? qaTemp : undefined,
      selectedAddons: qaAddons.length > 0 ? qaAddons : undefined,
      notes: qaNotes.trim() || undefined,
      unitPrice: qaUnitPrice,
      subtotal: qaUnitPrice * qaQty,
    };
    addToCart(item);

    // Track recent
    setRecentProductIds((prev) => {
      const filtered = prev.filter((id) => id !== quickAddProduct.id);
      return [quickAddProduct.id, ...filtered].slice(0, 20);
    });

    setQuickAddProduct(null);
    if (isMobile) setMobileCartOpen(true);
  }, [quickAddProduct, qaQty, qaSize, qaSugar, qaIce, qaTemp, qaAddons, qaNotes, qaUnitPrice, addToCart, isMobile]);

  const toggleAddon = useCallback((name: string, price: number) => {
    setQaAddons((prev) => {
      const exists = prev.find((a) => a.name === name);
      if (exists) return prev.filter((a) => a.name !== name);
      return [...prev, { name, price }];
    });
  }, []);

  const handleSelectCategory = useCallback((id: string | null) => {
    setSelectedCategoryId(id);
    setSpecialTab(null);
  }, [setSelectedCategoryId]);

  const handleSpecialTab = useCallback((tab: string) => {
    setSpecialTab(specialTab === tab ? null : tab);
    setSelectedCategoryId(null);
  }, [specialTab, setSelectedCategoryId]);

  // Auto-apply discount on change
  useEffect(() => {
    if (discountType) {
      const type = discountType as DiscountType;
      const val = parseFloat(discountValue) || 0;
      let amount = 0;
      if (type === 'PERCENTAGE' || type === 'SENIOR_CITIZEN' || type === 'PWD' || type === 'EMPLOYEE') {
        const pct = type === 'SENIOR_CITIZEN' || type === 'PWD' ? 20 : (type === 'EMPLOYEE' ? 15 : val);
        amount = Math.round(subtotal * (pct / 100) * 100) / 100;
      } else if (type === 'FIXED') {
        amount = Math.min(val, subtotal);
      } else if (type === 'PROMO' && promoCode.trim()) {
        amount = Math.round(subtotal * 0.1 * 100) / 100;
      }
      setAppliedDiscount({ type, value: val, code: type === 'PROMO' ? promoCode : undefined, amount });
    }
  }, [discountType, discountValue, promoCode, subtotal, setAppliedDiscount]);

  const handleCompleteSale = useCallback(async () => {
    if (isCompleting) return;
    setOrderError('');

    if (checkoutPayment === 'CASH' && cashTenderedNum < checkoutTotal) {
      setOrderError('Insufficient amount tendered');
      return;
    }

    setIsCompleting(true);
    try {
      const orderNumber = generateOrderNumber();
      // Determine tax exemption (Senior/PWD in PH are VAT-exempt)
      const isTaxExempt = appliedDiscount?.type === 'SENIOR_CITIZEN' || appliedDiscount?.type === 'PWD';
      const finalTax = isTaxExempt ? 0 : checkoutTax;
      const finalTotal = checkoutSubtotal - checkoutDiscount + finalTax;

      const body = {
        orderNumber,
        orderType,
        employeeId: currentEmployee?.id ?? null,
        subtotal: checkoutSubtotal,
        discountAmount: checkoutDiscount,
        discountType: appliedDiscount?.type ?? null,
        taxExempt: isTaxExempt,
        taxAmount: finalTax,
        totalAmount: Math.round(finalTotal * 100) / 100,
        amountPaid: checkoutPayment === 'CASH' ? cashTenderedNum : Math.round(finalTotal * 100) / 100,
        changeAmount: checkoutPayment === 'CASH' ? Math.max(0, Math.round((cashTenderedNum - finalTotal) * 100) / 100) : 0,
        paymentMethod: checkoutPayment,
        customerId: selectedCustomer?.id ?? null,
        discountCode: appliedDiscount?.code ?? null,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          variant: item.variant ?? null,
          size: item.size ?? null,
          sugarLevel: item.sugarLevel ?? null,
          iceLevel: item.iceLevel ?? null,
          temperature: item.temperature ?? null,
          addons: item.selectedAddons ? JSON.stringify(item.selectedAddons) : null,
          notes: item.notes ?? null,
          costPrice: item.product.costPrice,
          profit: (item.unitPrice - item.product.costPrice) * item.quantity,
        })),
        payments: [{
          method: checkoutPayment,
          amount: checkoutPayment === 'CASH' ? cashTenderedNum : checkoutTotal,
        }],
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to create order');

      const createdOrder = await res.json();

      setCurrentReceiptOrder({
        ...createdOrder,
        items: cart.map((item) => ({
          id: '',
          orderId: createdOrder.id,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          variant: item.variant,
          size: item.size,
          sugarLevel: item.sugarLevel,
          iceLevel: item.iceLevel,
          temperature: item.temperature,
          addons: item.selectedAddons ? JSON.stringify(item.selectedAddons) : undefined,
          notes: item.notes,
          costPrice: item.product.costPrice,
          profit: (item.unitPrice - item.product.costPrice) * item.quantity,
          createdAt: new Date().toISOString(),
        })),
      } as unknown as Order);

      clearCart();
      setCheckoutOpen(false);
      setReceiptOpen(true);

      // Auto-open cash drawer on successful payment (like Loyverse)
      openCashDrawerOnPayment().catch(() => {});

      // Reset checkout state
      setCashTendered('');
      setDiscountType('');
      setDiscountValue('');
      setPromoCode('');
      setCustomerSearch('');
    } catch (e) {
      console.error('Order failed:', e);
      setOrderError('Failed to complete the sale. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  }, [isCompleting, checkoutPayment, cashTenderedNum, checkoutTotal, orderType, checkoutSubtotal, checkoutDiscount, checkoutTax, selectedCustomer, appliedDiscount, cart, changeAmount, clearCart, setCheckoutOpen, setReceiptOpen, setCurrentReceiptOrder]);

  // Standalone cash drawer open on payment (no receipt print required)
  const openCashDrawerOnPayment = useCallback(async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) return;
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] },
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb'],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb')
        .catch(async () => await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb'));
      const char = await service.getCharacteristic('0000ff02-0000-1000-8000-00805f9b34fb')
        .catch(async () => await service.getCharacteristic('0000ff02-0000-1000-8000-00805f9b34fb'));
      // ESC/POS cash drawer kick: pulse pin 2 for ~200ms
      await char.writeValue(new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
      await server.disconnect();
    } catch (e: any) {
      // Silently fail — no printer connected or user cancelled
      if (e.name !== 'NotFoundError') console.warn('Cash drawer auto-open failed:', e.message);
    }
  }, []);

  const handleNewOrder = useCallback(() => {
    setReceiptOpen(false);
    setCurrentReceiptOrder(null);
  }, [setReceiptOpen, setCurrentReceiptOrder]);

  const handlePrintReceipt = useCallback(async () => {
    const order = currentReceiptOrder;
    if (!order) return;

    const payLabel = PAYMENT_METHODS.find(pm => pm.value === order.paymentMethod)?.label ?? order.paymentMethod;

    // Build plain-text receipt for Bluetooth thermal printer (58mm / 80mm)
    const lines: string[] = [];
    const W = 32; // chars per line for 58mm printer
    const center = (t: string) => t.padStart(Math.floor((W - t.length) / 2) + t.length).padEnd(W);
    const right = (label: string, val: string) => {
      const space = W - label.length - val.length;
      return label + ' '.repeat(Math.max(1, space)) + val;
    };
    const dashLine = '-'.repeat(W);
    const dotLine = '.'.repeat(W);

    lines.push(center("O'GALLEY"));
    lines.push(center('123 Bonifacio St, Makati City'));
    lines.push(center('Tel: +63 2 8888 1234'));
    lines.push(dashLine);
    lines.push(right('Order #', order.orderNumber));
    lines.push(right('', ORDER_TYPES.find(o => o.value === order.orderType)?.label ?? order.orderType));
    lines.push(right('Cashier', currentEmployee?.name ?? 'Staff'));
    lines.push(right('Date', new Date(order.createdAt).toLocaleString()));
    lines.push(dotLine);

    for (const item of (order.items ?? [])) {
      const name = item.quantity + 'x ' + item.productName;
      lines.push(name);
      if (item.size) lines.push('  Size: ' + item.size);
      if (item.sugarLevel) lines.push('  Sugar: ' + item.sugarLevel);
      if (item.iceLevel) lines.push('  Ice: ' + item.iceLevel);
      if (item.temperature) lines.push('  ' + item.temperature);
      lines.push(right('  ', formatCurrency(item.subtotal)));
    }

    lines.push(dotLine);
    lines.push(right('Net Sale', formatCurrency(Math.round((order.subtotal - order.discountAmount - order.taxAmount) * 100) / 100)));
    if (order.discountAmount > 0) {
      lines.push(right('Discount', '-' + formatCurrency(order.discountAmount)));
    }
    if (order.taxAmount > 0) {
      lines.push(right('VAT (12% incl.)', formatCurrency(order.taxAmount)));
    } else {
      lines.push(right('VAT', 'VAT Exempt'));
    }
    lines.push(dashLine);
    lines.push(right('TOTAL', formatCurrency(order.totalAmount)));
    lines.push(dashLine);
    lines.push(right('Payment', payLabel));
    lines.push(right('Amount Paid', formatCurrency(order.amountPaid)));
    if (order.changeAmount > 0) {
      lines.push(right('Change', formatCurrency(order.changeAmount)));
    }
    lines.push(dashLine);
    lines.push(center("Thank you for visiting O'Galley!"));
    lines.push('');

    const receiptText = lines.join('\n');

    // Cash drawer kick function
    const openCashDrawer = async (char: any) => {
      try {
        await char.writeValue(new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
      } catch (e) {
        console.warn('Cash drawer kick failed:', e);
      }
    };

    // Try Web Bluetooth API for thermal printers (mobile)
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] }],
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb', '00003802-0000-1000-8000-00805f9b34fb'],
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb')
          .catch(async () => await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb'));
        const char = await service.getCharacteristic('0000ff02-0000-1000-8000-00805f9b34fb')
          .catch(async () => await service.getCharacteristic('0000ff02-0000-1000-8000-00805f9b34fb'));

        const encoder = new TextEncoder();
        const chunkSize = 100;
        for (let i = 0; i < receiptText.length; i += chunkSize) {
          await char.writeValue(encoder.encode(receiptText.slice(i, i + chunkSize) + '\n'));
        }
        // Cut paper command (ESC/POS)
        await char.writeValue(new Uint8Array([0x1D, 0x56, 0x01]));
        // Open cash drawer
        await openCashDrawer(char);
        await server.disconnect();
        return;
      } catch (bluetoothError: any) {
        // User cancelled device selection or no printer found — fall through to browser print
        if (bluetoothError.name === 'NotFoundError') return;
        console.warn('Bluetooth print failed, falling back to browser print:', bluetoothError.message);
      }
    }

    // Fallback: standard browser print dialog
    window.print();
  }, [currentReceiptOrder]);

  const handlePauseOrder = useCallback(() => {
    if (cart.length === 0) return;
    holdOrder();
  }, [cart.length, holdOrder]);

  const handleSearchCustomer = useCallback(async (query: string) => {
    setCustomerSearch(query);
    if (query.trim().length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerResults(data.slice(0, 5).map((c: { id: string; name: string; loyaltyPoints: number }) => ({ id: c.id, name: c.name, loyaltyPoints: c.loyaltyPoints })));
        setShowCustomerDropdown(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectCustomer = useCallback((customer: { id: string; name: string; loyaltyPoints: number }) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  }, [setSelectedCustomer]);

  // ============ ANIMATION VARIANTS ============
  const fadeIn = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const slideUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 40 },
  };

  const cartItemVariants = {
    initial: { opacity: 0, x: 20, height: 0 },
    animate: { opacity: 1, x: 0, height: 'auto' },
    exit: { opacity: 0, x: -20, height: 0 },
  };

  // ============ RENDER HELPERS ============

  function renderProductCard(product: Product, idx: number) {
    const catIds: string[] = JSON.parse(product.categoryIds || '[]');
    const firstCat = catIds.length > 0 ? categoryMap.get(catIds[0]) : null;
    const emoji = firstCat ? getCategoryEmoji(firstCat.name) : getCategoryEmoji(product.name);
    const hasSizes = !!product.sizeOptions;

    return (
      <motion.div
        key={product.id}
        className="pos-product-card premium-card p-3 flex flex-col items-center justify-center gap-1.5 min-h-[90px] md:min-h-[100px]"
        onClick={() => openQuickAdd(product)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.02, duration: 0.2 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {product.imageUrl ? (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: firstCat?.color ? `${firstCat.color}33` : 'rgba(196,138,58,0.15)' }}
          >
            {emoji}
          </div>
        )}
        <span className="text-xs md:text-sm font-medium text-white/90 text-center leading-tight line-clamp-2 px-0.5">
          {product.name}
        </span>
        <span className="text-[#C48A3A] font-bold text-xs md:text-sm">
          {formatCurrency(product.sellingPrice)}
        </span>
        {hasSizes && (
          <span className="text-[9px] text-white/40 font-medium tracking-wider uppercase">S / M / L</span>
        )}
      </motion.div>
    );
  }

  function renderCategoriesBar() {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-thin">
        {/* Special tabs */}
        <motion.button
          key="__all"
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            !selectedCategoryId && !specialTab
              ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] shadow-lg shadow-[#C48A3A]/20'
              : 'glass-subtle text-white/70 hover:text-white/90 hover:bg-white/[0.06]'
          }`}
          onClick={() => { handleSelectCategory(null); setSpecialTab(null); }}
          whileTap={{ scale: 0.95 }}
        >
          All
        </motion.button>

        <motion.button
          key="__favorites"
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
            specialTab === 'favorites'
              ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] shadow-lg shadow-[#C48A3A]/20'
              : 'glass-subtle text-white/70 hover:text-white/90 hover:bg-white/[0.06]'
          }`}
          onClick={() => handleSpecialTab('favorites')}
          whileTap={{ scale: 0.95 }}
        >
          <Heart className="w-3 h-3" fill={specialTab === 'favorites' ? '#111111' : 'none'} />
          Favorites
        </motion.button>

        <motion.button
          key="__recent"
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
            specialTab === 'recent'
              ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] shadow-lg shadow-[#C48A3A]/20'
              : 'glass-subtle text-white/70 hover:text-white/90 hover:bg-white/[0.06]'
          }`}
          onClick={() => handleSpecialTab('recent')}
          whileTap={{ scale: 0.95 }}
        >
          <Clock className="w-3 h-3" />
          Recent
        </motion.button>

        <div className="w-px h-6 bg-white/10 self-center flex-shrink-0 mx-1" />

        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
              selectedCategoryId === cat.id
                ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] shadow-lg shadow-[#C48A3A]/20'
                : 'glass-subtle text-white/70 hover:text-white/90 hover:bg-white/[0.06]'
            }`}
            onClick={() => handleSelectCategory(cat.id)}
            whileTap={{ scale: 0.95 }}
          >
            <span>{getCategoryEmoji(cat.name)}</span>
            {cat.name}
          </motion.button>
        ))}
      </div>
    );
  }

  function renderMobileSearch() {
    return (
      <div className="md:hidden relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => useUIStore.getState().setSearchQuery(e.target.value)}
          className="w-full glass-subtle rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#C48A3A]/50"
        />
        {searchQuery && (
          <button
            onClick={() => useUIStore.getState().setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  function renderProductGrid() {
    if (loading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 p-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="premium-card p-3 min-h-[90px] md:min-h-[100px] animate-shimmer" />
          ))}
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <motion.div
          className="flex flex-col items-center justify-center h-64 text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Search className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs mt-1">Try a different search or category</p>
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 p-1 overflow-y-auto flex-1 pr-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, idx) => renderProductCard(product, idx))}
        </AnimatePresence>
      </div>
    );
  }

  function renderOrderTypeSelector() {
    return (
      <div className="flex gap-1 p-1 glass-subtle rounded-xl">
        {ORDER_TYPES.map((ot) => (
          <button
            key={ot.value}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              orderType === ot.value
                ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111]'
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
            }`}
            onClick={() => setOrderType(ot.value)}
          >
            {ORDER_TYPE_ICONS[ot.value]}
            <span className="hidden sm:inline">{ot.label}</span>
          </button>
        ))}
      </div>
    );
  }

  function renderCartItem(item: CartItem) {
    const variantParts: string[] = [];
    if (item.size) variantParts.push(item.size);
    if (item.temperature) variantParts.push(item.temperature);
    if (item.sugarLevel) variantParts.push(`Sugar ${item.sugarLevel}`);
    if (item.iceLevel) variantParts.push(item.iceLevel);
    if (item.selectedAddons?.length) variantParts.push(`+${item.selectedAddons.map(a => a.name).join(', ')}`);

    return (
      <motion.div
        key={item.tempId}
        layout
        variants={cartItemVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="glass-subtle rounded-xl p-3 group"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{item.product.name}</p>
            {variantParts.length > 0 && (
              <p className="text-[10px] text-white/40 mt-0.5 truncate">{variantParts.join(' · ')}</p>
            )}
            {item.notes && (
              <p className="text-[10px] text-[#C48A3A]/70 mt-0.5 truncate italic">📝 {item.notes}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-[#C48A3A]">{formatCurrency(item.subtotal)}</span>
            <button
              onClick={() => removeFromCart(item.tempId)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-white/30">{formatCurrency(item.unitPrice)} ea.</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateCartQuantity(item.tempId, item.quantity - 1)}
              className="w-6 h-6 rounded-lg glass-subtle flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-xs font-bold text-white">{item.quantity}</span>
            <button
              onClick={() => updateCartQuantity(item.tempId, item.quantity + 1)}
              className="w-6 h-6 rounded-lg glass-subtle flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  function renderCartPanel() {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Current Order</h2>
            {itemCount > 0 && (
              <span className="bg-[#C48A3A] text-[#111111] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          {isMobile && (
            <button onClick={() => setMobileCartOpen(false)} className="text-white/40 hover:text-white/70">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Order Type */}
        {renderOrderTypeSelector()}

        {/* Selected Customer */}
        {selectedCustomer && (
          <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 glass-subtle rounded-lg text-xs">
            <User className="w-3 h-3 text-[#C48A3A]" />
            <span className="text-white/70">{selectedCustomer.name}</span>
            <button onClick={() => setSelectedCustomer(null)} className="ml-auto text-white/30 hover:text-white/60">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-2 min-h-0" style={{ maxHeight: isMobile ? '40vh' : 'calc(100vh - 480px)' }}>
          <AnimatePresence mode="popLayout">
            {cart.map(renderCartItem)}
          </AnimatePresence>
          {cart.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center h-32 text-white/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ShoppingBag className="w-10 h-10 mb-2" />
              <p className="text-xs">Cart is empty</p>
            </motion.div>
          )}
        </div>

        {/* Held Orders */}
        {heldOrders.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowHeldOrders(!showHeldOrders)}
              className="w-full flex items-center justify-between px-3 py-2 glass-subtle rounded-xl text-xs text-white/60 hover:text-white/80 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Pause className="w-3.5 h-3.5" />
                Held Orders ({heldOrders.length})
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHeldOrders ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showHeldOrders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1.5 space-y-1.5 max-h-32 overflow-y-auto">
                    {heldOrders.map((held) => (
                      <div key={held.id} className="flex items-center justify-between px-3 py-2 glass-subtle rounded-lg text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 truncate">
                            {held.cart.length} item{held.cart.length > 1 ? 's' : ''} · {ORDER_TYPES.find(o => o.value === held.orderType)?.label}
                          </p>
                          <p className="text-white/30 text-[10px]">
                            {new Date(held.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => resumeOrder(held.id)}
                            className="p-1.5 rounded-md hover:bg-[#C48A3A]/20 text-[#C48A3A] transition-colors"
                            title="Resume"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeHeldOrder(held.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Totals */}
        <div className="mt-3 space-y-1.5 pt-3 border-t border-white/[0.06]">
          <div className="flex justify-between text-xs text-white/50">
            <span>Net Sale</span>
            <span>{formatCurrency(subtotal - tax)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-1">
                <BadgePercent className="w-3 h-3" />
                Discount ({appliedDiscount?.type === 'PERCENTAGE' ? `${appliedDiscount.value}%` : appliedDiscount?.type})
              </span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-white/50">
            <span>VAT (12% incl.)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-1">
            <span>Total</span>
            <span className="text-[#C48A3A]">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 space-y-2">
          <button
            onClick={handlePauseOrder}
            disabled={cart.length === 0}
            className="w-full py-2.5 rounded-xl glass-subtle text-xs font-medium text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause Order
          </button>
          <motion.button
            onClick={() => {
              if (cart.length > 0) setCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] font-bold text-sm hover:shadow-lg hover:shadow-[#C48A3A]/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
            whileHover={cart.length > 0 ? { scale: 1.01 } : {}}
            whileTap={cart.length > 0 ? { scale: 0.99 } : {}}
          >
            Checkout · {formatCurrency(total)}
          </motion.button>
        </div>
      </div>
    );
  }

  function renderMobileCartButton() {
    if (cart.length === 0) return null;
    return (
      <motion.button
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] font-bold text-sm shadow-xl shadow-[#C48A3A]/30"
        onClick={() => setMobileCartOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingBag className="w-5 h-5" />
        <span>{itemCount}</span>
        <span className="text-[#111111]/70">·</span>
        <span>{formatCurrency(total)}</span>
      </motion.button>
    );
  }

  function renderMobileCartSheet() {
    if (!isMobile) return null;
    return (
      <AnimatePresence>
        {mobileCartOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCartOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 glass-strong rounded-t-3xl max-h-[85vh] overflow-y-auto p-4"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {renderCartPanel()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // ============ QUICK ADD DIALOG ============
  function renderQuickAddDialog() {
    if (!quickAddProduct) return null;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={() => setQuickAddProduct(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative z-10 w-full sm:max-w-md sm:rounded-2xl glass-strong rounded-t-3xl max-h-[90vh] overflow-y-auto"
          initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
          animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
          exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C48A3A]/15 flex items-center justify-center text-lg">
                  {getCategoryEmoji(quickAddProduct.name)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{quickAddProduct.name}</h3>
                  <p className="text-xs text-white/40">{formatCurrency(quickAddProduct.sellingPrice)}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickAddProduct(null)}
                className="w-8 h-8 rounded-lg glass-subtle flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Size Selection */}
            {quickAddProduct.sizeOptions && (
              <div className="mb-4">
                <label className="text-xs font-medium text-white/50 mb-2 block">Size</label>
                <div className="flex gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setQaSize(size)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        qaSize === size
                          ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111]'
                          : 'glass-subtle text-white/60 hover:text-white/90'
                      }`}
                    >
                      {size}
                      {SIZE_PRICE_ADJ[size] > 0 && (
                        <span className="block text-[10px] mt-0.5 opacity-70">+{formatCurrency(SIZE_PRICE_ADJ[size])}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Temperature (Hot/Cold) */}
            {quickAddProduct.hasHotCold && (
              <div className="mb-4">
                <label className="text-xs font-medium text-white/50 mb-2 block">Temperature</label>
                <div className="flex gap-2">
                  {TEMPERATURES.map((temp) => (
                    <button
                      key={temp}
                      onClick={() => setQaTemp(temp)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        qaTemp === temp
                          ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111]'
                          : 'glass-subtle text-white/60 hover:text-white/90'
                      }`}
                    >
                      {temp === 'Hot' ? '🔥' : '🧊'} {temp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sugar Level */}
            {quickAddProduct.hasSugarLevel && (
              <div className="mb-4">
                <label className="text-xs font-medium text-white/50 mb-2 block">Sugar Level</label>
                <div className="flex gap-1.5 flex-wrap">
                  {SUGAR_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setQaSugar(level)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        qaSugar === level
                          ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111]'
                          : 'glass-subtle text-white/60 hover:text-white/90'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ice Level */}
            {quickAddProduct.hasIceLevel && (
              <div className="mb-4">
                <label className="text-xs font-medium text-white/50 mb-2 block">Ice Level</label>
                <div className="flex gap-1.5 flex-wrap">
                  {ICE_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setQaIce(level)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        qaIce === level
                          ? 'bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111]'
                          : 'glass-subtle text-white/60 hover:text-white/90'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {parsedAddons.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium text-white/50 mb-2 block">Add-ons</label>
                <div className="space-y-1.5">
                  {parsedAddons.map((addon) => {
                    const isSelected = qaAddons.some((a) => a.name === addon.name);
                    return (
                      <button
                        key={addon.name}
                        onClick={() => toggleAddon(addon.name, addon.price)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                          isSelected
                            ? 'glass bg-[#C48A3A]/10 border-[#C48A3A]/30'
                            : 'glass-subtle text-white/60 hover:text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-[#C48A3A] border-[#C48A3A]' : 'border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-[#111111]" />}
                          </div>
                          <span className={isSelected ? 'text-white' : ''}>{addon.name}</span>
                        </div>
                        <span className="text-[#C48A3A] text-[11px]">+{formatCurrency(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="text-xs font-medium text-white/50 mb-2 block">Notes</label>
              <input
                type="text"
                value={qaNotes}
                onChange={(e) => setQaNotes(e.target.value)}
                placeholder="Special instructions..."
                className="w-full glass-subtle rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#C48A3A]/50"
              />
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 glass-subtle rounded-xl p-1">
                <button
                  onClick={() => setQaQty(Math.max(1, qaQty - 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-base font-bold text-white">{qaQty}</span>
                <button
                  onClick={() => setQaQty(qaQty + 1)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <motion.button
                onClick={handleQuickAdd}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] font-bold text-sm flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                Add to Cart · {formatCurrency(qaUnitPrice * qaQty)}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ============ CHECKOUT DIALOG ============
  function renderCheckoutDialog() {
    if (!isCheckoutOpen) return null;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={() => setCheckoutOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-2xl glass-strong rounded-2xl overflow-hidden max-h-[95vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white">Checkout</h2>
            <button
              onClick={() => setCheckoutOpen(false)}
              className="w-8 h-8 rounded-lg glass-subtle flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-5">
            {/* Order Summary */}
            <div>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Order Summary</h3>
              <div className="glass-subtle rounded-xl overflow-hidden">
                <div className="max-h-36 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.tempId} className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 truncate">
                          {item.quantity}x {item.product.name}
                          {item.size && <span className="text-white/40"> ({item.size})</span>}
                        </p>
                      </div>
                      <span className="text-xs text-white/60 ml-2 flex-shrink-0">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 bg-white/[0.02] space-y-1">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Net Sale</span>
                    <span>{formatCurrency(checkoutSubtotal - checkoutTax)}</span>
                  </div>
                  {checkoutDiscount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(checkoutDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-white/50">
                    <span>VAT (12% incl.)</span>
                    <span>{formatCurrency(checkoutTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/[0.06]">
                    <span>Total</span>
                    <span className="text-[#C48A3A]">{formatCurrency(checkoutTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Payment Method</h3>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setCheckoutPayment(pm.value as PaymentMethod)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                      checkoutPayment === pm.value
                        ? 'glass bg-[#C48A3A]/15 border-[#C48A3A]/40 text-[#C48A3A]'
                        : 'glass-subtle text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                    }`}
                  >
                    {PAYMENT_ICONS[pm.value]}
                    <span className="text-[10px] leading-tight text-center">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Amount */}
            {checkoutPayment === 'CASH' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Amount Tendered</h3>
                <div className="glass-subtle rounded-xl p-3 space-y-2">
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-transparent text-lg font-bold text-white placeholder:text-white/20 focus:outline-none"
                    autoFocus
                  />
                  {/* Quick amount buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[50, 100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashTendered(String(amt))}
                        className="px-3 py-1 rounded-lg glass-subtle text-[10px] text-white/50 hover:text-white hover:bg-[#C48A3A]/20 hover:text-[#C48A3A] transition-colors"
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                    <button
                      onClick={() => setCashTendered(String(Math.ceil(checkoutTotal)))}
                      className="px-3 py-1 rounded-lg glass-subtle text-[10px] text-[#C48A3A] hover:bg-[#C48A3A]/20 transition-colors"
                    >
                      Exact
                    </button>
                  </div>
                  {cashTenderedNum >= checkoutTotal && (
                    <div className="flex justify-between text-sm pt-1 border-t border-white/[0.06]">
                      <span className="text-white/50">Change</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(changeAmount)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Discount */}
            <div>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Discount</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => { setDiscountType(e.target.value as DiscountType | ''); if (e.target.value === '') setAppliedDiscount(null); }}
                    className="flex-1 glass-subtle rounded-xl px-3 py-2.5 text-xs text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[#C48A3A]/50 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#1E1E1E]">No Discount</option>
                    {DISCOUNT_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value} className="bg-[#1E1E1E]">{dt.label}</option>
                    ))}
                  </select>
                  {discountType && discountType !== 'SENIOR_CITIZEN' && discountType !== 'PWD' && discountType !== 'EMPLOYEE' && discountType !== 'PROMO' && (
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'PERCENTAGE' ? '%' : 'Amount'}
                      className="w-24 glass-subtle rounded-xl px-3 py-2.5 text-xs text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[#C48A3A]/50"
                    />
                  )}
                </div>
                {discountType === 'PROMO' && (
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code..."
                      className="w-full glass-subtle rounded-xl pl-9 pr-3 py-2.5 text-xs text-white bg-transparent placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#C48A3A]/50"
                    />
                  </div>
                )}
                {appliedDiscount && appliedDiscount.amount > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" />
                      Discount applied
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">-{formatCurrency(appliedDiscount.amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer */}
            <div>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Customer (Optional)</h3>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => handleSearchCustomer(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                  placeholder="Search customer name..."
                  className="w-full glass-subtle rounded-xl pl-9 pr-3 py-2.5 text-xs text-white bg-transparent placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#C48A3A]/50"
                />
                {selectedCustomer && (
                  <button
                    onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <AnimatePresence>
                  {showCustomerDropdown && customerResults.length > 0 && (
                    <motion.div
                      className="absolute top-full left-0 right-0 mt-1 glass-strong rounded-xl overflow-hidden z-20"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      {customerResults.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.06] transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#C48A3A]/15 flex items-center justify-center">
                              <User className="w-3 h-3 text-[#C48A3A]" />
                            </div>
                            <span className="text-xs text-white/80">{customer.name}</span>
                          </div>
                          <span className="text-[10px] text-white/30">{customer.loyaltyPoints} pts</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Error */}
            {orderError && (
              <motion.div
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-400">{orderError}</span>
              </motion.div>
            )}
          </div>

          {/* Complete Sale Button */}
          <div className="p-4 border-t border-white/[0.06]">
            <motion.button
              onClick={handleCompleteSale}
              disabled={isCompleting || cart.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] font-bold text-sm hover:shadow-xl hover:shadow-[#C48A3A]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={!isCompleting ? { scale: 1.01 } : {}}
              whileTap={!isCompleting ? { scale: 0.99 } : {}}
            >
              {isCompleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Complete Sale · {formatCurrency(checkoutTotal)}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ============ RECEIPT VIEW ============
  function renderReceiptView() {
    if (!isReceiptOpen || !currentReceiptOrder) return null;

    const order = currentReceiptOrder;
    const payLabel = PAYMENT_METHODS.find(pm => pm.value === order.paymentMethod)?.label ?? order.paymentMethod;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-lg"
          onClick={handleNewOrder}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-sm"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Receipt Paper */}
          <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden">
            {/* Torn edge effect */}
            <div className="h-3 bg-white relative">
              <svg className="absolute bottom-0 left-0 right-0 -translate-y-full" viewBox="0 0 400 12" preserveAspectRatio="none">
                <path d="M0,12 Q10,0 20,12 Q30,0 40,12 Q50,0 60,12 Q70,0 80,12 Q90,0 100,12 Q110,0 120,12 Q130,0 140,12 Q150,0 160,12 Q170,0 180,12 Q190,0 200,12 Q210,0 220,12 Q230,0 240,12 Q250,0 260,12 Q270,0 280,12 Q290,0 300,12 Q310,0 320,12 Q330,0 340,12 Q350,0 360,12 Q370,0 380,12 Q390,0 400,12" fill="white" />
              </svg>
            </div>

            <div className="px-6 py-4 receipt-font text-black">
              {/* Store Header */}
              <div className="text-center mb-3">
                <h2 className="text-base font-bold tracking-wide">O'Galley</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">123 Bonifacio Street, Makati City</p>
                <p className="text-[10px] text-gray-500">Tel: +63 2 8888 1234</p>
              </div>

              <div className="border-t border-dashed border-gray-300 my-2" />

              {/* Order Info */}
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-500">Order #{order.orderNumber}</span>
                <span className="text-gray-500">{ORDER_TYPES.find(o => o.value === order.orderType)?.label}</span>
              </div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-500">Cashier: {currentEmployee?.name ?? 'Staff'}</span>
                <span className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
              </div>

              <div className="border-t border-dashed border-gray-300 my-2" />

              {/* Items */}
              <div className="space-y-1.5">
                {(order.items ?? []).map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.quantity}x {item.productName}</span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                    {item.size && <div className="text-gray-400 text-[10px] ml-4">Size: {item.size}</div>}
                    {item.sugarLevel && <div className="text-gray-400 text-[10px] ml-4">Sugar: {item.sugarLevel}</div>}
                    {item.iceLevel && <div className="text-gray-400 text-[10px] ml-4">Ice: {item.iceLevel}</div>}
                    {item.temperature && <div className="text-gray-400 text-[10px] ml-4">{item.temperature}</div>}
                    {item.notes && <div className="text-gray-400 text-[10px] ml-4 italic">{item.notes}</div>}
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 my-2" />

              {/* Totals */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>Net Sale</span>
                  <span>{formatCurrency(Math.round((order.subtotal - (order.discountAmount || 0) - order.taxAmount) * 100) / 100)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount{order.discountType ? ` (${order.discountType})` : ''}</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>VAT (12% incl.)</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="border-t border-dashed border-gray-300 my-1" />
                <div className="flex justify-between text-sm font-bold">
                  <span>TOTAL</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-2" />

              {/* Payment Info */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>Payment</span>
                  <span>{payLabel}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(order.amountPaid)}</span>
                </div>
                {order.changeAmount > 0 && (
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Change</span>
                    <span>{formatCurrency(order.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 my-2" />

              <div className="text-center text-[10px] text-gray-400 pt-1">
                <p>Thank you for visiting O'Galley!</p>
                <p className="mt-0.5">Please come again</p>
              </div>
            </div>

            {/* Bottom torn edge */}
            <div className="h-3 bg-white relative">
              <svg className="absolute top-0 left-0 right-0 translate-y-full" viewBox="0 0 400 12" preserveAspectRatio="none">
                <path d="M0,0 Q10,12 20,0 Q30,12 40,0 Q50,12 60,0 Q70,12 80,0 Q90,12 100,0 Q110,12 120,0 Q130,12 140,0 Q150,12 160,0 Q170,12 180,0 Q190,12 200,0 Q210,12 220,0 Q230,12 240,0 Q250,12 260,0 Q270,12 280,0 Q290,12 300,0 Q310,12 320,0 Q330,12 340,0 Q350,12 360,0 Q370,12 380,0 Q390,12 400,0" fill="white" />
              </svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <motion.button
              onClick={handlePrintReceipt}
              className="flex-1 py-3 rounded-xl glass text-white/80 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </motion.button>
            <motion.button
              onClick={handleNewOrder}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#D4A050] text-[#111111] font-bold text-sm flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingBag className="w-4 h-4" />
              New Order
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <div className="h-full flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden bg-[#111111]">
      {/* Left Side: Categories + Product Grid */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Categories Bar */}
        <div className="flex-shrink-0 p-2 md:p-3">
          {renderCategoriesBar()}
        </div>

        {/* Mobile Search */}
        {renderMobileSearch()}

        {/* Product Grid */}
        {renderProductGrid()}
      </div>

      {/* Right Side: Cart Panel (Desktop) */}
      {!isMobile && (
        <div className="w-[380px] flex-shrink-0 hidden md:flex">
          <div className="w-full glass-strong rounded-2xl p-4 flex flex-col overflow-hidden">
            {renderCartPanel()}
          </div>
        </div>
      )}

      {/* Mobile Cart FAB */}
      <AnimatePresence>{renderMobileCartButton()}</AnimatePresence>

      {/* Mobile Cart Sheet */}
      {renderMobileCartSheet()}

      {/* Quick Add Dialog */}
      <AnimatePresence>{quickAddProduct && renderQuickAddDialog()}</AnimatePresence>

      {/* Checkout Dialog */}
      <AnimatePresence>{isCheckoutOpen && renderCheckoutDialog()}</AnimatePresence>

      {/* Receipt View */}
      <AnimatePresence>{isReceiptOpen && renderReceiptView()}</AnimatePresence>
    </div>
  );
}