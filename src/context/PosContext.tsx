import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, ProductAddon, RestaurantTable, Customer, CashShift } from '../types.ts';
import { api } from '../services/api.ts';
import { getOfflineOrders } from '../services/offlineStorage.ts';

interface PosContextType {
  cart: CartItem[];
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  selectedTable: RestaurantTable | null;
  selectedCustomer: Customer | null;
  selectedWaiter: string;
  discount: number;
  deliveryFee: number;
  deliveryAddress: string;
  notes: string;
  currentShift: CashShift | null;
  isShiftOpen: boolean;
  subtotal: number;
  total: number;
  heldOrdersCount: number;
  isOnline: boolean;
  offlineOrdersCount: number;
  receiptToPrint: any | null;

  // Actions
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  setSelectedTable: (table: RestaurantTable | null) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setSelectedWaiter: (waiter: string) => void;
  setDiscount: (discount: number) => void;
  setDeliveryFee: (fee: number) => void;
  setDeliveryAddress: (address: string) => void;
  setNotes: (notes: string) => void;
  addToCart: (product: Product, variant?: ProductVariant, addons?: ProductAddon[], quantity?: number) => void;
  updateCartItemQuantity: (id: string, delta: number) => void;
  setCartItemQuantity: (id: string, qty: number) => void;
  setCartItemPrice: (id: string, newPrice: number) => void;
  setCartItemNotes: (id: string, notes: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  loadHeldOrderIntoCart: (order: any) => void;
  refreshShift: () => Promise<void>;
  refreshHeldOrders: () => Promise<void>;
  refreshOfflineCount: () => Promise<void>;
  triggerSync: () => Promise<{ count: number }>;
  setReceiptToPrint: (receipt: any | null) => void;
  openCashDrawer: () => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<string>('المدير العام');
  const [discount, setDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [isShiftOpen, setIsShiftOpen] = useState<boolean>(false);
  const [heldOrdersCount, setHeldOrdersCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineOrdersCount, setOfflineOrdersCount] = useState<number>(0);
  const [receiptToPrint, setReceiptToPrint] = useState<any | null>(null);

  // Monitor network connectivity & refresh POS state when logged in
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const token = localStorage.getItem('golden_palace_auth_token');
    if (token) {
      refreshShift();
      refreshHeldOrders();
    }
    refreshOfflineCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshShift = async () => {
    try {
      const res = await api.getCurrentShift();
      if (res.isOpen && res.shift) {
        setCurrentShift(res.shift);
        setIsShiftOpen(true);
      } else {
        setCurrentShift(null);
        setIsShiftOpen(false);
      }
    } catch {
      // Offline fallback
    }
  };

  const refreshHeldOrders = async () => {
    try {
      const list = await api.getOrders({ heldOnly: true });
      setHeldOrdersCount(list.length);
    } catch {
      // Ignore
    }
  };

  const refreshOfflineCount = async () => {
    const list = await getOfflineOrders();
    setOfflineOrdersCount(list.length);
  };

  const triggerSync = async () => {
    if (!navigator.onLine) return { count: 0 };
    try {
      const res = await api.syncOfflineQueue();
      await refreshOfflineCount();
      await refreshShift();
      return res;
    } catch (err) {
      console.error('Offline sync failed:', err);
      return { count: 0 };
    }
  };

  // Add item to cart
  const addToCart = (product: Product, variant?: ProductVariant, addons: ProductAddon[] = [], quantity: number = 1) => {
    const basePrice = Number(product.price);
    const variantAdj = variant ? Number(variant.priceAdjustment) : 0;
    const addonsTotal = addons.reduce((sum, a) => sum + Number(a.price), 0);
    const unitPrice = basePrice + variantAdj + addonsTotal;

    // Check if identical item (same product, same variant, same addons) already in cart
    const existingIndex = cart.findIndex((item) => {
      if (item.productId !== product.id) return false;
      const vMatch = (!item.selectedVariant && !variant) || item.selectedVariant?.id === variant?.id;
      const aMatch =
        (item.selectedAddons?.length || 0) === addons.length &&
        addons.every((a) => item.selectedAddons?.some((ia) => ia.id === a.id));
      return vMatch && aMatch;
    });

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + quantity;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        total: updated[existingIndex].unitPrice * newQty,
      };
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        nameAr: product.nameAr,
        nameFr: product.nameFr,
        unitPrice,
        costPrice: Number(product.costPrice || 0),
        quantity,
        total: unitPrice * quantity,
        station: product.station,
        selectedVariant: variant,
        selectedAddons: addons,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItemQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty, total: item.unitPrice * newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setCartItemQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty, total: item.unitPrice * qty } : item))
    );
  };

  const setCartItemPrice = (id: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitPrice: newPrice, total: newPrice * item.quantity } : item))
    );
  };

  const setCartItemNotes = (id: string, itemNotes: string) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, notes: itemNotes } : item)));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDeliveryFee(0);
    setDeliveryAddress('');
    setNotes('');
    setSelectedTable(null);
    setSelectedCustomer(null);
  };

  const loadHeldOrderIntoCart = (order: any) => {
    const loadedItems: CartItem[] = (order.items || []).map((it: any) => ({
      id: `cart-held-${it.id}`,
      productId: it.productId,
      nameAr: it.nameAr,
      nameFr: it.nameFr,
      unitPrice: Number(it.unitPrice),
      costPrice: Number(it.costPrice || 0),
      quantity: Number(it.quantity),
      total: Number(it.total),
      station: it.station || 'MAIN_KITCHEN',
      notes: it.notes,
      selectedVariant: it.variantsJson ? JSON.parse(it.variantsJson) : undefined,
      selectedAddons: it.addonsJson ? JSON.parse(it.addonsJson) : undefined,
    }));

    setCart(loadedItems);
    setOrderType(order.type);
    setDiscount(Number(order.discount) || 0);
    setDeliveryFee(Number(order.deliveryFee) || 0);
    setNotes(order.notes || '');

    if (order.tableId) {
      setSelectedTable({
        id: order.tableId,
        tableNumber: order.tableNumber || `T${order.tableId}`,
        zone: 'الصالة الرئيسية',
        capacity: 4,
        status: 'OCCUPIED',
      });
    }

    if (order.customerId) {
      setSelectedCustomer({
        id: order.customerId,
        name: order.customerName || 'زبون',
        phone: order.customerPhone || '',
        totalOrders: 1,
        totalSpent: order.total,
      });
    }

    refreshHeldOrders();
  };

  const openCashDrawer = () => {
    // Physical cash drawers attached to thermal receipt printers trigger via ESC/POS command or audio/visual confirmation
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio might not be allowed before user interaction
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - discount + deliveryFee);

  return (
    <PosContext.Provider
      value={{
        cart,
        orderType,
        selectedTable,
        selectedCustomer,
        selectedWaiter,
        discount,
        deliveryFee,
        deliveryAddress,
        notes,
        currentShift,
        isShiftOpen,
        subtotal,
        total,
        heldOrdersCount,
        isOnline,
        offlineOrdersCount,
        receiptToPrint,
        setOrderType,
        setSelectedTable,
        setSelectedCustomer,
        setSelectedWaiter,
        setDiscount,
        setDeliveryFee,
        setDeliveryAddress,
        setNotes,
        addToCart,
        updateCartItemQuantity,
        setCartItemQuantity,
        setCartItemPrice,
        setCartItemNotes,
        removeFromCart,
        clearCart,
        loadHeldOrderIntoCart,
        refreshShift,
        refreshHeldOrders,
        refreshOfflineCount,
        triggerSync,
        setReceiptToPrint,
        openCashDrawer,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
};
