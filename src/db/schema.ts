import { boolean, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users & Staff Authentication / RBAC
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or staff UUID
  username: text('username').notNull().unique(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  pin: text('pin'), // 4-6 digit quick touch PIN
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('CASHIER'), // ADMIN, MANAGER, CASHIER, WAITER, KITCHEN, INVENTORY
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameFr: text('name_fr'),
  nameEn: text('name_en'),
  icon: text('icon'),
  color: text('color').default('amber'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  station: text('station').notNull().default('MAIN_KITCHEN'), // MAIN_KITCHEN, GRILL, DRINKS, DESSERT
});

// 3. Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  nameAr: text('name_ar').notNull(),
  nameFr: text('name_fr'),
  nameEn: text('name_en'),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }).notNull().default('0'),
  image: text('image'),
  barcode: text('barcode'),
  isAvailable: boolean('is_available').notNull().default(true),
  station: text('station').notNull().default('MAIN_KITCHEN'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Product Variants (e.g., Small, Medium, Large)
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  nameAr: text('name_ar').notNull(),
  nameFr: text('name_fr'),
  priceAdjustment: numeric('price_adjustment', { precision: 10, scale: 2 }).notNull().default('0'),
});

// 5. Product Add-ons (e.g., Extra Cheese, Sauce, Fries)
export const productAddons = pgTable('product_addons', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id),
  nameAr: text('name_ar').notNull(),
  nameFr: text('name_fr'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
});

// 6. Price History Audit
export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  oldPrice: numeric('old_price', { precision: 10, scale: 2 }).notNull(),
  newPrice: numeric('new_price', { precision: 10, scale: 2 }).notNull(),
  changedByUserId: integer('changed_by_user_id').references(() => users.id),
  reason: text('reason'),
  changedAt: timestamp('changed_at').defaultNow(),
});

// 7. Restaurant Tables & Zones
export const restaurantTables = pgTable('restaurant_tables', {
  id: serial('id').primaryKey(),
  tableNumber: text('table_number').notNull().unique(),
  zone: text('zone').notNull().default('MAIN_HALL'), // MAIN_HALL, TERRACE, VIP, FAMILY
  capacity: integer('capacity').notNull().default(4),
  status: text('status').notNull().default('AVAILABLE'), // AVAILABLE, OCCUPIED, RESERVED, CLEANING
  currentOrderId: integer('current_order_id'),
  posX: integer('pos_x').default(0),
  posY: integer('pos_y').default(0),
});

// 8. Customers CRM
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  address: text('address'),
  notes: text('notes'),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  dailySequence: integer('daily_sequence').notNull().default(1),
  type: text('type').notNull().default('DINE_IN'), // DINE_IN, TAKEAWAY, DELIVERY
  tableId: integer('table_id').references(() => restaurantTables.id),
  customerId: integer('customer_id').references(() => customers.id),
  status: text('status').notNull().default('NEW'), // NEW, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0'),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  changeAmount: numeric('change_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  paymentStatus: text('payment_status').notNull().default('UNPAID'), // UNPAID, PARTIALLY_PAID, PAID
  cashierId: integer('cashier_id').references(() => users.id),
  waiterId: integer('waiter_id').references(() => users.id),
  notes: text('notes'),
  isHeld: boolean('is_held').notNull().default(false),
  heldAt: timestamp('held_at'),
  idempotencyKey: text('idempotency_key').unique(),
  offlineId: text('offline_id'),
  shiftId: integer('shift_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. Order Items (Preserving immutable unit_price)
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  nameAr: text('name_ar').notNull(),
  nameFr: text('name_fr'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }).notNull().default('0'),
  quantity: integer('quantity').notNull().default(1),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  station: text('station').notNull().default('MAIN_KITCHEN'),
  status: text('status').notNull().default('NEW'), // NEW, CONFIRMED, PREPARING, READY, SERVED, CANCELLED
  variantsJson: text('variants_json'),
  addonsJson: text('addons_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Payments & Split Tender
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  method: text('method').notNull(), // CASH, CARD, CCP, BARIDIMOB, OTHER
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  tenderAmount: numeric('tender_amount', { precision: 10, scale: 2 }),
  changeAmount: numeric('change_amount', { precision: 10, scale: 2 }).default('0'),
  transactionRef: text('transaction_ref'),
  cashierId: integer('cashier_id').references(() => users.id),
  shiftId: integer('shift_id'),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Cash Register Shifts (Caisse)
export const cashShifts = pgTable('cash_shifts', {
  id: serial('id').primaryKey(),
  shiftNumber: integer('shift_number').notNull(),
  cashierId: integer('cashier_id').references(() => users.id).notNull(),
  openingCash: numeric('opening_cash', { precision: 12, scale: 2 }).notNull().default('0'),
  closingCash: numeric('closing_cash', { precision: 12, scale: 2 }),
  expectedCash: numeric('expected_cash', { precision: 12, scale: 2 }),
  cashDifference: numeric('cash_difference', { precision: 12, scale: 2 }),
  totalCashSales: numeric('total_cash_sales', { precision: 12, scale: 2 }).notNull().default('0'),
  totalCardSales: numeric('total_card_sales', { precision: 12, scale: 2 }).notNull().default('0'),
  totalCcpSales: numeric('total_ccp_sales', { precision: 12, scale: 2 }).notNull().default('0'),
  totalBaridimobSales: numeric('total_baridimob_sales', { precision: 12, scale: 2 }).notNull().default('0'),
  totalExpenses: numeric('total_expenses', { precision: 12, scale: 2 }).notNull().default('0'),
  totalCashIn: numeric('total_cash_in', { precision: 12, scale: 2 }).notNull().default('0'),
  totalCashOut: numeric('total_cash_out', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('OPEN'), // OPEN, CLOSED
  openedAt: timestamp('opened_at').defaultNow(),
  closedAt: timestamp('closed_at'),
  notes: text('notes'),
});

// 13. Cash Movements (In / Out / Expense)
export const cashMovements = pgTable('cash_movements', {
  id: serial('id').primaryKey(),
  shiftId: integer('shift_id').references(() => cashShifts.id).notNull(),
  type: text('type').notNull(), // CASH_IN, CASH_OUT, EXPENSE
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  performedBy: integer('performed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Suppliers
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Ingredients
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameFr: text('name_fr'),
  unit: text('unit').notNull(), // KG, G, L, ML, PIECE
  currentStock: numeric('current_stock', { precision: 10, scale: 3 }).notNull().default('0'),
  minStock: numeric('min_stock', { precision: 10, scale: 3 }).notNull().default('1'),
  maxStock: numeric('max_stock', { precision: 10, scale: 3 }),
  costPerUnit: numeric('cost_per_unit', { precision: 10, scale: 2 }).notNull().default('0'),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 16. Product Recipes (Bill of Materials)
export const productRecipes = pgTable('product_recipes', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
});

// 17. Inventory Movements
export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id).notNull(),
  type: text('type').notNull(), // STOCK_IN, STOCK_OUT, ADJUSTMENT, WASTE, SALE_DEDUCTION, PURCHASE
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }),
  referenceType: text('reference_type'),
  referenceId: integer('reference_id'),
  performedBy: integer('performed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. Waste Records (Pertes)
export const wasteRecords = pgTable('waste_records', {
  id: serial('id').primaryKey(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id),
  productId: integer('product_id').references(() => products.id),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  reason: text('reason').notNull(), // EXPIRED, DAMAGED, BURNED, SPILLED, OTHER
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull().default('0'),
  employeeId: integer('employee_id').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. Purchases (Achats)
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  purchaseNumber: text('purchase_number').notNull().unique(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentStatus: text('payment_status').notNull().default('PAID'),
  invoiceDate: text('invoice_date').notNull(),
  receivedBy: integer('received_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 20. Purchase Items
export const purchaseItems = pgTable('purchase_items', {
  id: serial('id').primaryKey(),
  purchaseId: integer('purchase_id').references(() => purchases.id).notNull(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
});

// 21. Delivery Orders
export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  driverName: text('driver_name'),
  driverPhone: text('driver_phone'),
  deliveryAddress: text('delivery_address').notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('NEW'), // NEW, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  deliveredAt: timestamp('delivered_at'),
});

// 22. Expenses (Charges)
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(), // ELECTRICITY, GAS, RENT, TRANSPORT, MAINTENANCE, SUPPLIES, OTHER
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: text('date').notNull(),
  userId: integer('user_id').references(() => users.id),
  shiftId: integer('shift_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 23. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  userName: text('user_name'),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 24. Restaurant Settings
export const restaurantSettings = pgTable('restaurant_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  addons: many(productAddons),
  recipes: many(productRecipes),
  orderItems: many(orderItems),
  priceHistory: many(priceHistory),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(restaurantTables, {
    fields: [orders.tableId],
    references: [restaurantTables.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  cashier: one(users, {
    fields: [orders.cashierId],
    references: [users.id],
  }),
  waiter: one(users, {
    fields: [orders.waiterId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  delivery: one(deliveries, {
    fields: [orders.id],
    references: [deliveries.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  cashier: one(users, {
    fields: [payments.cashierId],
    references: [users.id],
  }),
}));

export const cashShiftsRelations = relations(cashShifts, ({ one, many }) => ({
  cashier: one(users, {
    fields: [cashShifts.cashierId],
    references: [users.id],
  }),
  movements: many(cashMovements),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [ingredients.supplierId],
    references: [suppliers.id],
  }),
  recipes: many(productRecipes),
  movements: many(inventoryMovements),
}));

export const productRecipesRelations = relations(productRecipes, ({ one }) => ({
  product: one(products, {
    fields: [productRecipes.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [productRecipes.ingredientId],
    references: [ingredients.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseItems),
}));
