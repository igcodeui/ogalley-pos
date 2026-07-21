import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Store
  await prisma.store.upsert({
    where: { id: 'store-1' },
    update: {},
    create: {
      id: 'store-1',
      name: "O'Galley",
      address: '123 Bonifacio Street, Makati City, Philippines',
      phone: '+63 2 8888 1234',
      email: 'hello@ogalley.ph',
      taxRate: 0.12,
      currency: 'PHP',
      footerMessage: "Thank you for visiting O'Galley!",
    },
  });

  // Categories
  const categories = [
    { id: 'cat-coffee', name: 'Coffee', icon: 'Coffee', color: '#8B5E3C', sortOrder: 1 },
    { id: 'cat-noncoffee', name: 'Non-Coffee', icon: 'CupSoda', color: '#6B8BAE', sortOrder: 2 },
    { id: 'cat-pastries', name: 'Pastries', icon: 'Croissant', color: '#C48A3A', sortOrder: 3 },
    { id: 'cat-rice', name: 'Rice Meals', icon: 'UtensilsCrossed', color: '#6B8E6B', sortOrder: 4 },
    { id: 'cat-desserts', name: 'Desserts', icon: 'CakeSlice', color: '#8B6B8E', sortOrder: 5 },
    { id: 'cat-snacks', name: 'Snacks', icon: 'Cookie', color: '#AE8B6B', sortOrder: 6 },
    { id: 'cat-seasonal', name: 'Seasonal', icon: 'Sparkles', color: '#D4A050', sortOrder: 7 },
    { id: 'cat-combo', name: 'Combo Meals', icon: 'Combo', color: '#4D8B8E', sortOrder: 8 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { id: c.id }, update: {}, create: c });
  }

  // Products
  const products = [
    { id: 'prod-1', name: 'Americano', description: 'Rich espresso with hot water', sku: 'COF-001', costPrice: 35, sellingPrice: 85, categoryIds: '["cat-coffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":15},{"name":"Large","priceAdjustment":30}]', isFavorite: true },
    { id: 'prod-2', name: 'Cappuccino', description: 'Espresso with steamed milk foam', sku: 'COF-002', costPrice: 40, sellingPrice: 120, categoryIds: '["cat-coffee"]', hasSugarLevel: true, hasIceLevel: false, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":20},{"name":"Large","priceAdjustment":40}]', isFavorite: true },
    { id: 'prod-3', name: 'Caramel Macchiato', description: 'Vanilla-flavored latte with caramel drizzle', sku: 'COF-003', costPrice: 45, sellingPrice: 145, categoryIds: '["cat-coffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":25},{"name":"Large","priceAdjustment":50}]', isFavorite: true },
    { id: 'prod-4', name: 'Espresso', description: 'Double shot of premium espresso', sku: 'COF-004', costPrice: 30, sellingPrice: 75, categoryIds: '["cat-coffee"]', hasSugarLevel: true, hasIceLevel: false, hasHotCold: true },
    { id: 'prod-5', name: 'Cafe Latte', description: 'Espresso with steamed milk', sku: 'COF-005', costPrice: 40, sellingPrice: 110, categoryIds: '["cat-coffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":20},{"name":"Large","priceAdjustment":40}]' },
    { id: 'prod-6', name: 'Mocha', description: 'Espresso with chocolate and steamed milk', sku: 'COF-006', costPrice: 45, sellingPrice: 135, categoryIds: '["cat-coffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":25},{"name":"Large","priceAdjustment":50}]' },
    { id: 'prod-7', name: 'Spanish Latte', description: 'Espresso with condensed milk', sku: 'COF-007', costPrice: 42, sellingPrice: 125, categoryIds: '["cat-coffee"]', hasSugarLevel: false, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":20},{"name":"Large","priceAdjustment":40}]', isFavorite: true },
    { id: 'prod-8', name: 'Flat White', description: 'Double shot espresso with microfoam', sku: 'COF-008', costPrice: 42, sellingPrice: 115, categoryIds: '["cat-coffee"]', hasSugarLevel: true, hasIceLevel: false, hasHotCold: true },
    { id: 'prod-9', name: 'Matcha Latte', description: 'Premium Japanese matcha with milk', sku: 'NC-001', costPrice: 50, sellingPrice: 140, categoryIds: '["cat-noncoffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":20},{"name":"Large","priceAdjustment":40}]', isFavorite: true },
    { id: 'prod-10', name: 'Chocolate Frappe', description: 'Blended chocolate with whipped cream', sku: 'NC-002', costPrice: 45, sellingPrice: 130, categoryIds: '["cat-noncoffee"]', hasSugarLevel: true, hasIceLevel: false, hasHotCold: false, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":25},{"name":"Large","priceAdjustment":50}]' },
    { id: 'prod-11', name: 'Strawberry Smoothie', description: 'Fresh strawberry blended smoothie', sku: 'NC-003', costPrice: 55, sellingPrice: 145, categoryIds: '["cat-noncoffee"]', hasSugarLevel: true, hasIceLevel: false, hasHotCold: false, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":25},{"name":"Large","priceAdjustment":50}]' },
    { id: 'prod-12', name: 'Taro Milk Tea', description: 'Creamy taro with boba pearls', sku: 'NC-004', costPrice: 48, sellingPrice: 135, categoryIds: '["cat-noncoffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: false, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":20},{"name":"Large","priceAdjustment":40}]', addons: '[{"name":"Boba Pearls","price":25,"isDefault":true},{"name":"Pudding","price":20},{"name":"Nata de Coco","price":15}]', isFavorite: true },
    { id: 'prod-13', name: 'Fresh Lemonade', description: 'Freshly squeezed lemon juice', sku: 'NC-005', costPrice: 30, sellingPrice: 95, categoryIds: '["cat-noncoffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: false },
    { id: 'prod-14', name: 'Mango Shake', description: 'Fresh Philippine mango shake', sku: 'NC-006', costPrice: 50, sellingPrice: 125, categoryIds: '["cat-noncoffee"]', hasSugarLevel: true, hasIceLevel: false, hasHotCold: false },
    { id: 'prod-15', name: 'Croissant', description: 'Buttery French-style croissant', sku: 'PAS-001', costPrice: 35, sellingPrice: 85, categoryIds: '["cat-pastries"]', isFavorite: true },
    { id: 'prod-16', name: 'Chocolate Croissant', description: 'Croissant filled with dark chocolate', sku: 'PAS-002', costPrice: 40, sellingPrice: 95, categoryIds: '["cat-pastries"]' },
    { id: 'prod-17', name: 'Blueberry Muffin', description: 'Freshly baked blueberry muffin', sku: 'PAS-003', costPrice: 30, sellingPrice: 75, categoryIds: '["cat-pastries"]' },
    { id: 'prod-18', name: 'Cinnamon Roll', description: 'Warm cinnamon roll with cream cheese glaze', sku: 'PAS-004', costPrice: 38, sellingPrice: 90, categoryIds: '["cat-pastries"]', isFavorite: true },
    { id: 'prod-19', name: 'Banana Bread', description: 'Homemade banana bread with walnuts', sku: 'PAS-005', costPrice: 32, sellingPrice: 80, categoryIds: '["cat-pastries"]' },
    { id: 'prod-20', name: 'Butter Cake Slice', description: 'Rich butter cake slice', sku: 'PAS-006', costPrice: 35, sellingPrice: 85, categoryIds: '["cat-pastries"]' },
    { id: 'prod-21', name: 'Chicken Teriyaki Bowl', description: 'Grilled chicken with teriyaki sauce on rice', sku: 'RM-001', costPrice: 80, sellingPrice: 185, categoryIds: '["cat-rice"]', addons: '[{"name":"Extra Rice","price":30},{"name":"Fried Egg","price":20},{"name":"Miso Soup","price":35}]', isFavorite: true },
    { id: 'prod-22', name: 'Beef Tapa Bowl', description: 'Cured beef tapa with garlic rice and egg', sku: 'RM-002', costPrice: 95, sellingPrice: 210, categoryIds: '["cat-rice"]', addons: '[{"name":"Extra Rice","price":30},{"name":"Extra Egg","price":20}]' },
    { id: 'prod-23', name: 'Pork Adobo Rice', description: 'Classic Filipino pork adobo with rice', sku: 'RM-003', costPrice: 70, sellingPrice: 165, categoryIds: '["cat-rice"]', addons: '[{"name":"Extra Rice","price":30}]' },
    { id: 'prod-24', name: 'Spaghetti Meatballs', description: 'Pasta with homemade meatballs', sku: 'RM-004', costPrice: 65, sellingPrice: 155, categoryIds: '["cat-rice"]', addons: '[{"name":"Garlic Bread","price":25},{"name":"Extra Cheese","price":20}]' },
    { id: 'prod-25', name: 'Chicken Pesto Pasta', description: 'Grilled chicken with pesto cream sauce', sku: 'RM-005', costPrice: 75, sellingPrice: 175, categoryIds: '["cat-rice"]', addons: '[{"name":"Garlic Bread","price":25}]' },
    { id: 'prod-26', name: 'Tiramisu', description: 'Classic Italian tiramisu', sku: 'DES-001', costPrice: 55, sellingPrice: 145, categoryIds: '["cat-desserts"]', isFavorite: true },
    { id: 'prod-27', name: 'Cheesecake', description: 'New York-style cheesecake', sku: 'DES-002', costPrice: 50, sellingPrice: 135, categoryIds: '["cat-desserts"]' },
    { id: 'prod-28', name: 'Choco Lava Cake', description: 'Warm chocolate cake with molten center', sku: 'DES-003', costPrice: 45, sellingPrice: 125, categoryIds: '["cat-desserts"]', isFavorite: true },
    { id: 'prod-29', name: 'Creme Brulee', description: 'Classic French custard with caramelized sugar', sku: 'DES-004', costPrice: 48, sellingPrice: 140, categoryIds: '["cat-desserts"]' },
    { id: 'prod-30', name: 'French Fries', description: 'Crispy golden french fries', sku: 'SNK-001', costPrice: 25, sellingPrice: 75, categoryIds: '["cat-snacks"]', addons: '[{"name":"Cheese Sauce","price":20},{"name":"Sriracha Mayo","price":15}]' },
    { id: 'prod-31', name: 'Nachos Supreme', description: 'Loaded nachos with cheese and jalapenos', sku: 'SNK-002', costPrice: 40, sellingPrice: 115, categoryIds: '["cat-snacks"]' },
    { id: 'prod-32', name: 'Chicken Wings', description: '6-piece buffalo chicken wings', sku: 'SNK-003', costPrice: 55, sellingPrice: 145, categoryIds: '["cat-snacks"]', isFavorite: true },
    { id: 'prod-33', name: 'Pumpkin Spice Latte', description: 'Seasonal pumpkin spice flavored latte', sku: 'SEA-001', costPrice: 48, sellingPrice: 155, categoryIds: '["cat-seasonal","cat-coffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":20},{"name":"Large","priceAdjustment":40}]' },
    { id: 'prod-34', name: 'Ube Latte', description: 'Purple yam flavored latte', sku: 'SEA-002', costPrice: 50, sellingPrice: 150, categoryIds: '["cat-seasonal","cat-coffee"]', hasSugarLevel: true, hasIceLevel: true, hasHotCold: true, sizeOptions: '[{"name":"Small","priceAdjustment":0},{"name":"Medium","priceAdjustment":20},{"name":"Large","priceAdjustment":40}]' },
    { id: 'prod-35', name: 'Morning Combo', description: 'Any coffee + Croissant', sku: 'COM-001', costPrice: 65, sellingPrice: 145, categoryIds: '["cat-combo"]' },
    { id: 'prod-36', name: 'Meal Deal A', description: 'Rice Meal + Drink + Dessert', sku: 'COM-002', costPrice: 120, sellingPrice: 299, categoryIds: '["cat-combo"]', isFavorite: true },
    { id: 'prod-37', name: 'Snack Box', description: '2 Pastries + 2 Drinks', sku: 'COM-003', costPrice: 100, sellingPrice: 245, categoryIds: '["cat-combo"]' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, isAvailable: true, sortOrder: 0 },
    });
  }

  // Inventory
  for (const p of products) {
    await prisma.inventoryItem.upsert({
      where: { id: `inv-${p.id}` },
      update: {},
      create: {
        id: `inv-${p.id}`,
        productId: p.id,
        currentStock: Math.floor(Math.random() * 80) + 20,
        minStock: 5,
        unit: 'pcs',
        costPrice: p.costPrice,
        lastRestocked: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      },
    });
  }

  // Employees
  const employees = [
    { id: 'emp-1', name: 'Maria Santos', email: 'maria@ogalley.ph', phone: '+63 917 123 4567', role: 'OWNER', pin: '1234', isActive: true, hireDate: '2023-01-15T00:00:00.000Z', hourlyRate: 0, commissionRate: 0 },
    { id: 'emp-2', name: 'Juan Dela Cruz', email: 'juan@ogalley.ph', phone: '+63 917 234 5678', role: 'ADMIN', pin: '1234', isActive: true, hireDate: '2023-03-01T00:00:00.000Z', hourlyRate: 0, commissionRate: 0 },
    { id: 'emp-3', name: 'Ana Reyes', email: 'ana@ogalley.ph', phone: '+63 917 345 6789', role: 'MANAGER', pin: '1234', isActive: true, hireDate: '2023-06-15T00:00:00.000Z', hourlyRate: 350, commissionRate: 0.02 },
    { id: 'emp-4', name: 'Carlos Garcia', email: 'carlos@ogalley.ph', phone: '+63 917 456 7890', role: 'CASHIER', pin: '1234', isActive: true, hireDate: '2024-01-10T00:00:00.000Z', hourlyRate: 280, commissionRate: 0.015 },
    { id: 'emp-5', name: 'Sofia Lim', email: 'sofia@ogalley.ph', phone: '+63 917 567 8901', role: 'CASHIER', pin: '1234', isActive: true, hireDate: '2024-03-20T00:00:00.000Z', hourlyRate: 280, commissionRate: 0.015 },
    { id: 'emp-6', name: 'Miguel Torres', email: 'miguel@ogalley.ph', phone: '+63 917 678 9012', role: 'INVENTORY', pin: '1234', isActive: true, hireDate: '2024-02-01T00:00:00.000Z', hourlyRate: 300, commissionRate: 0 },
  ];
  for (const e of employees) {
    await prisma.employee.upsert({ where: { id: e.id }, update: {}, create: e as any });
  }

  // Customers
  const customers = [
    { id: 'cust-1', name: 'Roberto Villanueva', phone: '+63 918 111 2222', email: 'roberto@email.com', loyaltyPoints: 1250, cashbackBalance: 50, membershipLevel: 'GOLD', totalSpent: 18500, totalVisits: 87 },
    { id: 'cust-2', name: 'Carmen Aquino', phone: '+63 918 222 3333', email: 'carmen@email.com', loyaltyPoints: 450, cashbackBalance: 0, membershipLevel: 'SILVER', totalSpent: 7200, totalVisits: 34 },
    { id: 'cust-3', name: 'Ricardo Mendoza', phone: '+63 918 333 4444', loyaltyPoints: 80, cashbackBalance: 0, membershipLevel: 'BRONZE', totalSpent: 2100, totalVisits: 12 },
    { id: 'cust-4', name: 'Isabella Cruz', phone: '+63 918 444 5555', email: 'isabella@email.com', loyaltyPoints: 3500, cashbackBalance: 150, membershipLevel: 'PLATINUM', totalSpent: 62000, totalVisits: 210 },
    { id: 'cust-5', name: 'Diego Ramos', phone: '+63 918 555 6666', loyaltyPoints: 200, cashbackBalance: 0, membershipLevel: 'BRONZE', totalSpent: 3500, totalVisits: 18 },
    { id: 'cust-6', name: 'Elena Flores', phone: '+63 918 666 7777', email: 'elena@email.com', loyaltyPoints: 890, cashbackBalance: 25, membershipLevel: 'SILVER', totalSpent: 12800, totalVisits: 56 },
    { id: 'cust-7', name: 'Andrei Bautista', phone: '+63 918 777 8888', loyaltyPoints: 150, cashbackBalance: 0, membershipLevel: 'BRONZE', totalSpent: 1800, totalVisits: 8 },
    { id: 'cust-8', name: 'Patricia Dizon', phone: '+63 918 888 9999', email: 'patricia@email.com', loyaltyPoints: 2100, cashbackBalance: 80, membershipLevel: 'GOLD', totalSpent: 24000, totalVisits: 95 },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({ where: { id: c.id }, update: {}, create: c as any });
  }

  // Generate sample orders
  const orderCount = 250;
  const now = new Date();
  for (let i = 0; i < orderCount; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 14) + 7;
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - daysAgo);
    orderDate.setHours(hoursAgo, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

    const numItems = Math.floor(Math.random() * 4) + 1;
    const usedProducts = new Set<number>();
    let subtotal = 0;
    const orderItems: any[] = [];

    for (let j = 0; j < numItems; j++) {
      let prodIdx: number;
      do { prodIdx = Math.floor(Math.random() * products.length); } while (usedProducts.has(prodIdx));
      usedProducts.add(prodIdx);

      const prod = products[prodIdx];
      const qty = Math.floor(Math.random() * 3) + 1;
      let unitPrice = prod.sellingPrice;
      if (prod.sizeOptions) {
        const sizes = JSON.parse(prod.sizeOptions);
        if (sizes.length > 0) {
          const rs = sizes[Math.floor(Math.random() * sizes.length)];
          unitPrice += rs.priceAdjustment;
        }
      }
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;
      orderItems.push({
        id: `oi-${i}-${j}`,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice,
        subtotal: itemSubtotal,
        costPrice: prod.costPrice,
        profit: (unitPrice - prod.costPrice) * qty,
        createdAt: orderDate.toISOString(),
      });
    }

    const discountAmt = Math.random() > 0.85 ? Math.round(subtotal * 0.2 * 100) / 100 : 0;
    const taxable = subtotal - discountAmt;
    const tax = Math.round(taxable * 0.12 * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;
    const ds = `${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}`;
    const seq = String(i + 1).padStart(4, '0');
    const methods = ['CASH', 'CASH', 'CASH', 'CREDIT_CARD', 'GCASH', 'MAYA', 'DEBIT_CARD'];
    const pm = methods[Math.floor(Math.random() * methods.length)];

    await prisma.order.create({
      data: {
        id: `order-${i}-${crypto.randomUUID().slice(0, 8)}`,
        orderNumber: `ORD-${ds}-${seq}-${i}`,
        customerId: Math.random() > 0.4 ? customers[Math.floor(Math.random() * customers.length)].id : null,
        employeeId: employees[3 + Math.floor(Math.random() * 3)].id,
        orderType: (['DINE_IN', 'DINE_IN', 'DINE_IN', 'TAKE_OUT', 'TAKE_OUT', 'DELIVERY'] as const)[Math.floor(Math.random() * 6)],
        status: Math.random() > 0.05 ? 'COMPLETED' : (Math.random() > 0.5 ? 'REFUND' : 'VOID'),
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: discountAmt,
        discountType: discountAmt > 0 ? 'PERCENTAGE' : null,
        taxAmount: tax,
        totalAmount: total,
        amountPaid: total,
        changeAmount: pm === 'CASH' ? Math.round((total - total + Math.ceil(total / 50) * 50 - total) * 100) / 100 : 0,
        paymentMethod: pm,
        loyaltyPointsEarned: Math.floor(total / 50),
        receiptPrinted: true,
        createdAt: orderDate.toISOString(),
        items: { create: orderItems },
        payments: { create: { id: `pay-${i}-${crypto.randomUUID().slice(0, 8)}`, method: pm, amount: total } },
      },
    });
  }

  // Sales performance
  for (const emp of employees.slice(3)) {
    for (let d = 0; d < 30; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const sales = Math.round((Math.random() * 15000 + 3000) * 100) / 100;
      const txns = Math.floor(Math.random() * 25) + 5;
      await prisma.salesPerformance.upsert({
        where: { id: `sp-${emp.id}-${d}` },
        update: {},
        create: {
          id: `sp-${emp.id}-${d}`, employeeId: emp.id, date: date.toISOString(),
          totalSales: sales, transactionCount: txns,
          averageOrderValue: Math.round((sales / txns) * 100) / 100,
          commission: Math.round(sales * 0.015 * 100) / 100,
        },
      });
    }
  }

  console.log('Database seeded successfully!');
  console.log(`  - ${products.length} products`);
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${orderCount} sample orders`);
  console.log(`  - ${employees.length} employees`);
  console.log(`  - ${customers.length} customers`);
}

main().catch(console.error).finally(() => prisma.$disconnect());