export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'INVENTORY';

export interface User {
  id: number;
  uid: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
  pin?: string;
  isActive?: boolean;
}

export interface Category {
  id: number;
  nameAr: string;
  nameFr?: string | null;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  station: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  nameAr: string;
  nameFr?: string | null;
  priceAdjustment: string | number;
}

export interface ProductAddon {
  id: number;
  productId?: number | null;
  nameAr: string;
  nameFr?: string | null;
  price: string | number;
}

export interface ProductRecipeItem {
  id?: number;
  productId: number;
  ingredientId: number;
  quantity: string | number;
  ingredientName?: string;
}

export interface Product {
  id: number;
  categoryId: number;
  nameAr: string;
  nameFr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  price: string | number;
  costPrice?: string | number;
  image?: string | null;
  barcode?: string | null;
  isAvailable: boolean;
  station: string;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  recipes?: ProductRecipeItem[];
}

export interface RestaurantTable {
  id: number;
  tableNumber: string;
  zone: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
  currentOrderId?: number | null;
}

export interface CartItem {
  id: string; // unique cart line ID
  productId: number;
  nameAr: string;
  nameFr?: string | null;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  total: number;
  notes?: string;
  station: string;
  selectedVariant?: ProductVariant;
  selectedAddons?: ProductAddon[];
}

export interface Order {
  id: number;
  orderNumber: string;
  dailySequence: number;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableId?: number | null;
  tableNumber?: string;
  customerId?: number | null;
  customerName?: string;
  customerPhone?: string;
  status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  subtotal: string | number;
  discount: string | number;
  deliveryFee: string | number;
  total: string | number;
  paidAmount: string | number;
  changeAmount: string | number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  cashierId?: number | null;
  cashierName?: string;
  waiterId?: number | null;
  notes?: string | null;
  isHeld: boolean;
  heldAt?: string | null;
  idempotencyKey?: string;
  offlineId?: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  nameAr: string;
  nameFr?: string | null;
  unitPrice: string | number;
  costPrice?: string | number;
  quantity: number;
  total: string | number;
  notes?: string | null;
  station: string;
  status: string;
  variantsJson?: string | null;
  addonsJson?: string | null;
}

export interface PaymentRecord {
  id?: number;
  orderId: number;
  method: 'CASH' | 'CARD' | 'CCP' | 'BARIDIMOB' | 'OTHER';
  amount: number;
  tenderAmount?: number;
  changeAmount?: number;
  transactionRef?: string;
}

export interface CashShift {
  id: number;
  shiftNumber: number;
  cashierId: number;
  cashierName?: string;
  openingCash: string | number;
  closingCash?: string | number | null;
  expectedCash?: string | number | null;
  cashDifference?: string | number | null;
  totalCashSales: string | number;
  totalCardSales: string | number;
  totalCcpSales: string | number;
  totalBaridimobSales: string | number;
  totalExpenses: string | number;
  totalCashIn: string | number;
  totalCashOut: string | number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string | null;
  notes?: string | null;
  movements?: CashMovement[];
}

export interface CashMovement {
  id: number;
  shiftId: number;
  type: 'CASH_IN' | 'CASH_OUT' | 'EXPENSE';
  amount: string | number;
  reason: string;
  performedBy?: number;
  createdAt: string;
}

export interface Ingredient {
  id: number;
  nameAr: string;
  nameFr?: string | null;
  unit: string;
  currentStock: string | number;
  minStock: string | number;
  maxStock?: string | number | null;
  costPerUnit: string | number;
  supplierId?: number | null;
  supplierName?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  balance: string | number;
  notes?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  totalOrders: number;
  totalSpent: string | number;
}

export interface DeliveryOrder {
  id: number;
  orderId: number;
  orderNumber?: string;
  orderTotal?: string | number;
  customerId?: number | null;
  customerName?: string;
  customerPhone?: string;
  driverName?: string | null;
  driverPhone?: string | null;
  deliveryAddress: string;
  deliveryFee: string | number;
  status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  notes?: string | null;
  createdAt: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: string | number;
  description: string;
  date: string;
  userId?: number;
  userName?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface RestaurantSettings {
  restaurant_name: string;
  restaurant_brand: string;
  restaurant_address: string;
  restaurant_phone: string;
  currency: string;
  receipt_size: '80mm' | '58mm' | 'A4';
  tax_rate: string;
  default_language: string;
  theme: string;
}

// -------------------------------------------------------------
// Thermal Printer Profiles & Diagnostics (CAFETERIA 80mm - Windows)
// -------------------------------------------------------------
export type PaperType = '80mm' | '58mm' | 'A4';
export type PrintMethod = 'BROWSER' | 'ESCPOS_RAW' | 'LOCAL_BRIDGE';

export interface PrinterProfile {
  name: string; // e.g. "CAFETERIA 80mm"
  printerName: string; // Windows printer name: "CAFETERIA"
  driver: string; // Driver name: "80Normal"
  paperType: PaperType; // 80mm
  paperWidth: number; // 80 (mm)
  printableWidth: number; // 72 (mm) - standard 576 dots
  margins: number; // 0 (mm)
  scale: number; // 100 (%)
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  feedBefore: number; // 0 lines
  feedAfter: number; // 3-5 lines
  copies: number; // 1
  cutPaper: boolean; // true
  cashDrawer: boolean; // true
  printMethod: PrintMethod;
  bridgeUrl?: string; // e.g. "ws://localhost:8182" or "http://localhost:8181"
}

export interface PrintJobResult {
  success: boolean;
  jobId?: string;
  method: PrintMethod;
  status: 'PRINTED' | 'FAILED' | 'PENDING';
  error?: string;
  timestamp: string;
}
