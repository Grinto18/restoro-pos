import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Category, RestaurantTable, Customer, ProductVariant, ProductAddon } from '../types.ts';
import { api } from '../services/api.ts';
import { printerService } from '../services/printerService.ts';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Utensils,
  ShoppingBag,
  Truck,
  Layers,
  ChefHat,
  Printer,
  PauseCircle,
  PlayCircle,
  Percent,
  X,
  Check,
  Tag,
  FileText,
  User,
  MapPin,
  Flame,
  Soup,
  Fish,
  Sandwich,
  Salad,
  Cake,
  GlassWater,
  Pizza,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface PosTerminalProps {
  onOpenPaymentModal: () => void;
  onNavigateToTables: () => void;
  onOpenHeldOrders: () => void;
  onQuickCheckout: (printTicket: boolean) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  onOpenPaymentModal,
  onNavigateToTables,
  onOpenHeldOrders,
  onQuickCheckout,
}) => {
  const { user } = useAuth();
  const {
    cart,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    selectedCustomer,
    setSelectedCustomer,
    selectedWaiter,
    setSelectedWaiter,
    discount,
    setDiscount,
    deliveryFee,
    setDeliveryFee,
    deliveryAddress,
    setDeliveryAddress,
    notes,
    setNotes,
    subtotal,
    total,
    addToCart,
    updateCartItemQuantity,
    setCartItemQuantity,
    setCartItemPrice,
    setCartItemNotes,
    removeFromCart,
    clearCart,
    openCashDrawer,
    setReceiptToPrint,
  } = usePos();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);

  // Modals state
  const [activeProductForOptions, setActiveProductForOptions] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [discountInput, setDiscountInput] = useState<string>('');
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [tablesList, setTablesList] = useState<RestaurantTable[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');
  const [showItemEditModal, setShowItemEditModal] = useState<boolean>(false);
  const [editQtyInput, setEditQtyInput] = useState<string>('1');
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editNotesInput, setEditNotesInput] = useState<string>('');
  const [isHoldingOrder, setIsHoldingOrder] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load Categories & Products & Tables
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, prods, tables] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getTables(),
      ]);
      setCategories(cats.filter((c: Category) => c.isActive));
      setProducts(prods);
      setTablesList(tables);
      if (cats.length > 0 && selectedCategoryId === 'ALL') {
        setSelectedCategoryId('ALL');
      }
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryId === 'ALL' || p.categoryId === selectedCategoryId;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameFr && p.nameFr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery.trim()));
    return matchesCategory && matchesSearch;
  });

  // Handle clicking product
  const handleProductClick = (product: Product) => {
    if (!product.isAvailable) return;

    const hasVariants = product.variants && product.variants.length > 0;
    const hasAddons = product.addons && product.addons.length > 0;

    if (hasVariants || hasAddons) {
      setActiveProductForOptions(product);
      setSelectedVariant(hasVariants ? product.variants![0] : undefined);
      setSelectedAddons([]);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmProductWithOptions = () => {
    if (activeProductForOptions) {
      addToCart(activeProductForOptions, selectedVariant, selectedAddons);
      setActiveProductForOptions(null);
    }
  };

  // Barcode enter key
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const matched = products.find(
        (p) => p.barcode === searchQuery.trim() || p.barcode === `GP-${searchQuery.trim()}`
      );
      if (matched) {
        handleProductClick(matched);
        setSearchQuery('');
      }
    }
  };

  // Hold current order
  const handleHoldCurrentOrder = async () => {
    if (cart.length === 0) return;
    setIsHoldingOrder(true);
    try {
      await api.createOrder({
        type: orderType,
        tableId: selectedTable?.id,
        customerId: selectedCustomer?.id,
        items: cart,
        discount,
        deliveryFee,
        notes,
        isHeld: true,
      });
      clearCart();
    } catch (err) {
      console.error('Failed to hold order:', err);
    } finally {
      setIsHoldingOrder(false);
    }
  };

  // Print kitchen order ticket (Bon Cuisine)
  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    try {
      // Create or update order in kitchen state
      const created = await api.createOrder({
        type: orderType,
        tableId: selectedTable?.id,
        customerId: selectedCustomer?.id,
        items: cart,
        discount,
        deliveryFee,
        notes,
        isHeld: false,
      });

      // Prepare kitchen receipt print
      setReceiptToPrint({
        isKitchenTicket: true,
        orderNumber: created.orderNumber,
        tableNumber: selectedTable?.tableNumber,
        orderType,
        items: cart,
        notes,
        time: new Date().toLocaleTimeString('fr-FR'),
      });
    } catch (err) {
      console.error('Failed to send kitchen ticket:', err);
    }
  };

  // Print Bill (Addition) preview
  const handlePrintAddition = () => {
    if (cart.length === 0) return;
    setReceiptToPrint({
      isAddition: true,
      orderNumber: `BON-${Date.now().toString().slice(-4)}`,
      tableNumber: selectedTable?.tableNumber,
      customerName: selectedCustomer?.name,
      orderType,
      items: cart,
      subtotal,
      discount,
      deliveryFee,
      total,
      cashierName: user?.fullName || 'Admin',
      time: new Date().toLocaleTimeString('fr-FR'),
      date: new Date().toLocaleDateString('fr-FR'),
    });
  };

  const selectedCartItem = cart.find((i) => i.id === selectedCartItemId);

  // Category Icon helper
  const getCatIcon = (nameAr: string) => {
    if (nameAr.includes('بيتزا') || nameAr.includes('Pizza')) return <Pizza className="w-4 h-4" />;
    if (nameAr.includes('شورب') || nameAr.includes('مقبلات')) return <Soup className="w-4 h-4" />;
    if (nameAr.includes('مشاوي') || nameAr.includes('جمر')) return <Flame className="w-4 h-4" />;
    if (nameAr.includes('بحر') || nameAr.includes('سمك')) return <Fish className="w-4 h-4" />;
    if (nameAr.includes('طاكوس') || nameAr.includes('سندويتش')) return <Sandwich className="w-4 h-4" />;
    if (nameAr.includes('سلط')) return <Salad className="w-4 h-4" />;
    if (nameAr.includes('تحلية') || nameAr.includes('حلو')) return <Cake className="w-4 h-4" />;
    if (nameAr.includes('مشروب') || nameAr.includes('عصير')) return <GlassWater className="w-4 h-4" />;
    return <Utensils className="w-4 h-4" />;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* ============================================================== */}
      {/* RIGHT SIDE (in RTL): CART, TOTALS & TOUCH FUNCTION BUTTONS     */}
      {/* Inspired directly by photo 1 (Big amounts, Cyan action keys)    */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[480px] xl:w-[520px] bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
        {/* Order Mode Switcher (Dine In / Takeaway / Delivery) */}
        <div className="p-2 bg-neutral-950 border-b border-neutral-800 flex items-center gap-1.5">
          <button
            onClick={() => setOrderType('DINE_IN')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
              orderType === 'DINE_IN'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>في الصالة (Dine-in)</span>
          </button>
          <button
            onClick={() => setOrderType('TAKEAWAY')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
              orderType === 'TAKEAWAY'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>محمول (Emporter)</span>
          </button>
          <button
            onClick={() => setOrderType('DELIVERY')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
              orderType === 'DELIVERY'
                ? 'bg-purple-500 text-white shadow'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>توصيل (Livraison)</span>
          </button>
        </div>

        {/* Quick Context Selectors (Table, Client, Notes) */}
        <div className="px-2 py-1.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs gap-1.5">
          {orderType === 'DINE_IN' && (
            <button
              onClick={() => setShowTableModal(true)}
              className="flex-1 flex items-center justify-between bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded border border-neutral-700 text-neutral-200"
            >
              <span className="text-[11px] text-neutral-400">الطاولة:</span>
              <span className="font-bold text-cyan-400">
                {selectedTable ? selectedTable.tableNumber : 'اختر طاولة'}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex-1 flex items-center justify-between bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded border border-neutral-700 text-neutral-200"
          >
            <span className="text-[11px] text-neutral-400">الزبون:</span>
            <span className="font-semibold text-emerald-400 truncate max-w-[120px]">
              {selectedCustomer ? selectedCustomer.name : 'زبون عادي'}
            </span>
          </button>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="bg-red-950/40 hover:bg-red-900/60 text-red-300 px-2 py-1 rounded border border-red-800/40 text-[11px] flex items-center gap-1"
              title="إفراغ السلة (Annuler)"
            >
              <Trash2 className="w-3 h-3" />
              <span>إلغاء</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar min-h-0 bg-neutral-950/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-12">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] text-neutral-700 mb-2" />
              <p className="font-bold text-sm text-neutral-400">السلة فارغة</p>
              <p className="text-xs text-neutral-500">اختر من قائمة الأطباق لإضافة أصناف</p>
            </div>
          ) : (
            cart.map((item) => {
              const isSelected = selectedCartItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCartItemId(item.id)}
                  className={`p-2 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60 shadow'
                      : 'bg-neutral-800/70 border-neutral-700/50 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                        <span>{item.nameAr}</span>
                        {item.nameFr && (
                          <span className="text-[11px] text-neutral-400 font-normal">
                            ({item.nameFr})
                          </span>
                        )}
                      </div>

                      {/* Variant and Add-ons badges */}
                      {(item.selectedVariant || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                        <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                          {item.selectedVariant && (
                            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                              {item.selectedVariant.nameAr}
                            </span>
                          )}
                          {item.selectedAddons?.map((a, i) => (
                            <span
                              key={i}
                              className="bg-neutral-700 text-neutral-300 px-1.5 py-0.2 rounded"
                            >
                              +{a.nameAr} ({Number(a.price)} DA)
                            </span>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-[10px] text-amber-400 italic mt-0.5">
                          ملاحظة: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Line total */}
                    <div className="text-left font-mono font-bold text-sm text-amber-400">
                      {item.total.toLocaleString()} DA
                    </div>
                  </div>

                  {/* Quantity and Controls */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-700/40 text-xs">
                    <div className="text-neutral-400 font-mono text-[11px]">
                      {item.unitPrice} DA × {item.quantity}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartItemQuantity(item.id, -1);
                        }}
                        className="w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-neutral-200 active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCartItemId(item.id);
                          setEditQtyInput(String(item.quantity));
                          setEditPriceInput(String(item.unitPrice));
                          setEditNotesInput(item.notes || '');
                          setShowItemEditModal(true);
                        }}
                        className="min-w-8 h-6 px-1.5 rounded bg-neutral-900 border border-neutral-700 font-mono font-bold text-center text-amber-300 hover:border-amber-500"
                        title="تعديل الكمية والملاحظات"
                      >
                        {item.quantity}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartItemQuantity(item.id, 1);
                        }}
                        className="w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-neutral-200 active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        className="w-6 h-6 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 flex items-center justify-center mr-1 active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================= */}
        {/* TOTALS DISPLAY (Direct representation of Photo 1)          */}
        {/* MONTANT, REMISE, TOTAL A PAYER (Big Red/Gold font), etc.    */}
        {/* ========================================================= */}
        <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 space-y-1 font-mono">
          <div className="flex items-center justify-between text-xs text-cyan-400">
            <span>MONTANT (المبلغ الأولي):</span>
            <span className="font-bold text-sm">{subtotal.toFixed(2)} DA</span>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-xs text-blue-400">
              <span>REMISE (الخصم):</span>
              <span className="font-bold">-{discount.toFixed(2)} DA</span>
            </div>
          )}

          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-xs text-purple-400">
              <span>LIVRAISON (التوصيل):</span>
              <span className="font-bold">+{deliveryFee.toFixed(2)} DA</span>
            </div>
          )}

          {/* Big Bold Red/Gold Total as seen in Photo 1 */}
          <div className="flex items-baseline justify-between pt-1 border-t border-neutral-800">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-sans font-bold">
              TOTAL À PAYER:
            </span>
            <span className="text-2xl font-black text-amber-400 tracking-tight drop-shadow">
              {total.toLocaleString()} <span className="text-sm font-bold text-amber-500">DA</span>
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOUCH ACTION BUTTONS GRID (Cyan & Colorful Keys - Photo 1) */}
        {/* + Supplém, Modifier, Emporter, Prix, Quantité, Annuler... */}
        {/* ========================================================= */}
        <div className="p-2 bg-neutral-900 border-t border-neutral-800 space-y-1.5">
          {/* Quick Item Modifier Bar (Turquoise / Cyan keys from Photo 1) */}
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => {
                if (selectedCartItem) {
                  setEditNotesInput(selectedCartItem.notes || '');
                  setEditQtyInput(String(selectedCartItem.quantity));
                  setEditPriceInput(String(selectedCartItem.unitPrice));
                  setShowItemEditModal(true);
                }
              }}
              disabled={!selectedCartItem}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold py-1.5 px-1 rounded text-[11px] flex flex-col items-center justify-center transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 mb-0.5" />
              <span>+ Supplém.</span>
            </button>

            <button
              onClick={() => {
                if (selectedCartItem) {
                  setEditNotesInput(selectedCartItem.notes || '');
                  setEditQtyInput(String(selectedCartItem.quantity));
                  setEditPriceInput(String(selectedCartItem.unitPrice));
                  setShowItemEditModal(true);
                }
              }}
              disabled={!selectedCartItem}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold py-1.5 px-1 rounded text-[11px] flex flex-col items-center justify-center transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 mb-0.5" />
              <span>Modifier</span>
            </button>

            <button
              onClick={() => {
                if (selectedCartItem) {
                  setEditPriceInput(String(selectedCartItem.unitPrice));
                  setShowItemEditModal(true);
                }
              }}
              disabled={!selectedCartItem}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold py-1.5 px-1 rounded text-[11px] flex flex-col items-center justify-center transition active:scale-95"
            >
              <DollarSign className="w-3.5 h-3.5 mb-0.5" />
              <span>Prix</span>
            </button>

            <button
              onClick={() => {
                if (selectedCartItem) {
                  setEditQtyInput(String(selectedCartItem.quantity));
                  setShowItemEditModal(true);
                }
              }}
              disabled={!selectedCartItem}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold py-1.5 px-1 rounded text-[11px] flex flex-col items-center justify-center transition active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 mb-0.5" />
              <span>Quantité</span>
            </button>
          </div>

          {/* Central Actions (Directly from Photo 1) */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Nouvelle commande */}
            <button
              onClick={clearCart}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle commande</span>
            </button>

            {/* Clients en attente (Hold Order) */}
            <button
              onClick={handleHoldCurrentOrder}
              disabled={cart.length === 0 || isHoldingOrder}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-2 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Mettre en attente</span>
            </button>

            {/* Plan de salle */}
            <button
              onClick={onNavigateToTables}
              className="bg-sky-700 hover:bg-sky-600 text-white font-bold py-2 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
            >
              <MapPin className="w-4 h-4" />
              <span>Plan de salle</span>
            </button>
          </div>

          {/* Quick Modifier Action Keys: [حذف] and [تعديل الكمية] as in layout */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                if (selectedCartItem) {
                  removeFromCart(selectedCartItem.id);
                  setSelectedCartItemId(null);
                } else if (cart.length > 0) {
                  removeFromCart(cart[cart.length - 1].id);
                }
              }}
              disabled={cart.length === 0}
              className="bg-red-950/60 hover:bg-red-900/80 disabled:opacity-40 text-red-300 border border-red-800/60 font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
              title="حذف الصنف المحدد أو الأخير من السلة"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف الصنف (Supprimer)</span>
            </button>

            <button
              onClick={() => {
                if (selectedCartItem) {
                  setEditQtyInput(String(selectedCartItem.quantity));
                  setEditPriceInput(String(selectedCartItem.unitPrice));
                  setEditNotesInput(selectedCartItem.notes || '');
                  setShowItemEditModal(true);
                } else if (cart.length > 0) {
                  const last = cart[cart.length - 1];
                  setSelectedCartItemId(last.id);
                  setEditQtyInput(String(last.quantity));
                  setEditPriceInput(String(last.unitPrice));
                  setEditNotesInput(last.notes || '');
                  setShowItemEditModal(true);
                }
              }}
              disabled={cart.length === 0}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-cyan-300 border border-neutral-700 font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
              title="تعديل كمية الصنف"
            >
              <Layers className="w-4 h-4" />
              <span>تعديل الكمية (Quantité)</span>
            </button>
          </div>

          {/* Checkout & Tickets Primary Actions: [طباعة الفاتورة] */}
          <div className="space-y-1.5 pt-0.5">
            {/* Primary Main Action: طباعة الفاتورة */}
            <button
              onClick={() => onQuickCheckout(true)}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-black font-black py-3.5 px-3 rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 active:scale-95 transition cursor-pointer"
              title="حفظ الطلب فورياً في قاعدة البيانات وإرسال الفاتورة إلى طابعة Windows الحرارية"
            >
              <Printer className="w-5 h-5 text-black stroke-[2.5]" />
              <span className="tracking-wide">طباعة الفاتورة (حفظ وطباعة فورية)</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              {/* Encaisser (Full Payment Modal with Split Bill / Multi Tender) */}
              <button
                onClick={onOpenPaymentModal}
                disabled={cart.length === 0}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-black font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
              >
                <DollarSign className="w-4 h-4" />
                <span>تسديد مخصص (Encaisser)</span>
              </button>

              {/* Direct Addition (Bon Addition) */}
              <button
                onClick={handlePrintAddition}
                disabled={cart.length === 0}
                className="bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 text-cyan-300 font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-neutral-700 shadow active:scale-95 transition"
                title="طباعة الفاتورة للزبون بدون إغلاق الحساب (Addition)"
              >
                <FileText className="w-4 h-4" />
                <span>فاتورة أولية (Addition)</span>
              </button>
            </div>
          </div>

          {/* Secondary Buttons (Bon Cuisine, Addition, Remise, Tiroir, Réimprimer) */}
          <div className="grid grid-cols-5 gap-1 text-[10px]">
            <button
              onClick={handleSendToKitchen}
              disabled={cart.length === 0}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-orange-300 font-medium py-1.5 px-0.5 rounded flex items-center justify-center gap-1 border border-neutral-700"
              title="إرسال تذكرة المطبخ"
            >
              <ChefHat className="w-3.5 h-3.5 shrink-0" />
              <span>Cuisine</span>
            </button>

            <button
              onClick={handlePrintAddition}
              disabled={cart.length === 0}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-cyan-300 font-medium py-1.5 px-0.5 rounded flex items-center justify-center gap-1 border border-neutral-700"
              title="طباعة الفاتورة للزبون (Addition)"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Addition</span>
            </button>

            <button
              onClick={() => setShowDiscountModal(true)}
              className="bg-neutral-800 hover:bg-neutral-700 text-yellow-300 font-medium py-1.5 px-0.5 rounded flex items-center justify-center gap-1 border border-neutral-700"
              title="تطبيق خصم"
            >
              <Percent className="w-3.5 h-3.5 shrink-0" />
              <span>Remise</span>
            </button>

            <button
              onClick={openCashDrawer}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-1.5 px-0.5 rounded flex items-center justify-center gap-1 border border-neutral-700"
              title="فتح درج النقود"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Tiroir</span>
            </button>

            <button
              onClick={() => {
                const last = printerService.getLastReceipt();
                if (last) {
                  setReceiptToPrint(last);
                } else {
                  const p = printerService.getProfile();
                  setReceiptToPrint(printerService.generateTestReceiptData(p));
                }
              }}
              className="bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-medium py-1.5 px-0.5 rounded flex items-center justify-center gap-1 border border-neutral-700"
              title="إعادة طباعة آخر إيصال / فحص الطابعة"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Re-print</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CENTER & LEFT: SEARCH, CATEGORIES TABS & PRODUCT GRID          */}
      {/* Matching user touchscreen photo 1 layout                       */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950 p-2 space-y-2 min-w-0">
        {/* Search & Barcode Scan Bar */}
        <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-lg border border-neutral-800 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="ابحث بالاسم أو امسح الباركود (Rechercher un plat)..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-400 font-mono px-2 hidden sm:block">
            {filteredProducts.length} طبق
          </div>
        </div>

        {/* Categories Tabs Bar (المقبلات, الأطباق الرئيسية, المشاوي, مأكولات بحرية...) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-0.5">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
              selectedCategoryId === 'ALL'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>الكل (Tous)</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow ring-1 ring-amber-400'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                }`}
              >
                {getCatIcon(cat.nameAr)}
                <div className="text-right leading-tight">
                  <div>{cat.nameAr}</div>
                  {cat.nameFr && (
                    <div className="text-[9px] opacity-70 font-normal">{cat.nameFr}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Products Grid (Tactile Touch Cards like Photo 1) */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
              <Utensils className="w-10 h-10 mb-2 stroke-[1.2]" />
              <p className="text-sm font-semibold">لا توجد أطباق مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 pb-2">
              {filteredProducts.map((product) => {
                const priceNum = Number(product.price);
                const hasOptions =
                  (product.variants && product.variants.length > 0) ||
                  (product.addons && product.addons.length > 0);

                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    disabled={!product.isAvailable}
                    className={`relative p-3 rounded-xl border text-right flex flex-col justify-between h-28 transition-all active:scale-[0.98] select-none ${
                      product.isAvailable
                        ? 'bg-gradient-to-b from-neutral-900 to-neutral-900/90 hover:from-neutral-850 hover:to-neutral-800 border-neutral-800 hover:border-amber-500/50 shadow-md hover:shadow-amber-500/10'
                        : 'bg-neutral-900/40 border-neutral-800/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      {/* Product Name */}
                      <div className="font-bold text-sm text-neutral-100 line-clamp-2 leading-snug">
                        {product.nameAr}
                      </div>

                      {product.nameFr && (
                        <div className="text-[10px] text-neutral-400 font-mono line-clamp-1 mt-0.5">
                          {product.nameFr}
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-2 pt-1 border-t border-neutral-800/60">
                      {/* Price in DA (Like the photo: 400DA, 200DA) */}
                      <div className="font-mono font-black text-amber-400 text-sm">
                        {priceNum.toLocaleString()} <span className="text-[10px] font-normal text-amber-500">DA</span>
                      </div>

                      {hasOptions && (
                        <span className="text-[9px] bg-neutral-800 text-amber-300 px-1 py-0.5 rounded border border-neutral-700">
                          خيارات
                        </span>
                      )}

                      {!product.isAvailable && (
                        <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800">
                          غير متوفر
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: Product Variants & Add-ons Picker Modal               */}
      {/* ============================================================== */}
      {activeProductForOptions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div>
                <h3 className="font-bold text-base text-amber-400">
                  {activeProductForOptions.nameAr}
                </h3>
                <p className="text-xs text-neutral-400">
                  السعر الأساسي: {Number(activeProductForOptions.price)} DA
                </p>
              </div>
              <button
                onClick={() => setActiveProductForOptions(null)}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variants (e.g., L and XL) */}
            {activeProductForOptions.variants && activeProductForOptions.variants.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">اختر الحجم (Taille):</label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {activeProductForOptions.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const adj = Number(v.priceAdjustment);
                    const fullVariantPrice = Number(activeProductForOptions.price) + adj;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl text-center border transition ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black ring-2 ring-amber-400/50'
                            : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-750 font-bold'
                        }`}
                      >
                        <div className="text-sm font-bold">{v.nameAr}</div>
                        <div className={`text-xs font-mono mt-0.5 ${isSelected ? 'text-black font-black' : 'text-amber-400'}`}>
                          {fullVariantPrice} دج
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addons (e.g., صلصة بيضاء +100 دج, فرماج +150 دج) */}
            {activeProductForOptions.addons && activeProductForOptions.addons.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">الإضافات الاختيارية (Suppléments):</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                  {activeProductForOptions.addons.map((a) => {
                    const isChecked = selectedAddons.some((sa) => sa.id === a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedAddons(selectedAddons.filter((sa) => sa.id !== a.id));
                          } else {
                            setSelectedAddons([...selectedAddons, a]);
                          }
                        }}
                        className={`p-2.5 rounded-xl flex items-center justify-between text-xs border transition ${
                          isChecked
                            ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow ring-1 ring-amber-500/50'
                            : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span className="font-bold">{a.nameAr}</span>
                        <span className="font-mono font-bold text-amber-400">+{Number(a.price)} دج</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Total preview and Confirm Button */}
            {(() => {
              const base = Number(activeProductForOptions.price);
              const variantAdj = selectedVariant ? Number(selectedVariant.priceAdjustment) : 0;
              const addonsSum = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
              const computedTotal = base + variantAdj + addonsSum;

              return (
                <button
                  onClick={handleConfirmProductWithOptions}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>تأكيد وإضافة لسلة الطلب — {computedTotal.toLocaleString()} دج</span>
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Item Edit Modal (Price, Qty, Note)                    */}
      {/* ============================================================== */}
      {showItemEditModal && selectedCartItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-neutral-200">
                تعديل الصنف: {selectedCartItem.nameAr}
              </h3>
              <button
                onClick={() => setShowItemEditModal(false)}
                className="p-1 rounded bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">الكمية:</label>
                <input
                  type="number"
                  min="1"
                  value={editQtyInput}
                  onChange={(e) => setEditQtyInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">السعر الفردي (DA):</label>
                <input
                  type="number"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">ملاحظة للمطبخ (Note):</label>
                <input
                  type="text"
                  value={editNotesInput}
                  onChange={(e) => setEditNotesInput(e.target.value)}
                  placeholder="مثال: بدون بصل، صوص حار..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const newQty = parseInt(editQtyInput) || 1;
                const newPrice = parseFloat(editPriceInput) || selectedCartItem.unitPrice;
                setCartItemQuantity(selectedCartItem.id, newQty);
                setCartItemPrice(selectedCartItem.id, newPrice);
                setCartItemNotes(selectedCartItem.id, editNotesInput);
                setShowItemEditModal(false);
              }}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded-lg active:scale-95 transition"
            >
              حفظ التعديلات
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Discount Modal (Remise)                              */}
      {/* ============================================================== */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-yellow-400">تطبيق خصم (Remise)</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-1 rounded bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">مبلغ الخصم بالدينار (DA):</label>
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="مثال: 200"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-base font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDiscountInput(String(amt))}
                  className="bg-neutral-800 hover:bg-neutral-700 text-xs font-mono py-1 rounded border border-neutral-700 text-neutral-200"
                >
                  {amt} DA
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setDiscount(Math.max(0, parseFloat(discountInput) || 0));
                setShowDiscountModal(false);
              }}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg active:scale-95 transition"
            >
              تطبيق الخصم
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: Table Quick Selector                                 */}
      {/* ============================================================== */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-cyan-400">اختر طاولة للطلب</h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1 no-scrollbar">
              {tablesList.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                const isOccupied = t.status === 'OCCUPIED';
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTable(t);
                      setShowTableModal(false);
                    }}
                    className={`p-2 rounded-xl text-center border font-bold text-xs transition active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400'
                        : isOccupied
                        ? 'bg-red-950/60 border-red-700/60 text-red-300'
                        : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                    }`}
                  >
                    <div className="text-sm font-mono">{t.tableNumber}</div>
                    <div className="text-[9px] opacity-75 font-normal">
                      {isOccupied ? 'مشغولة' : `${t.capacity} مقاعد`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: Customer Quick Selector                               */}
      {/* ============================================================== */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-emerald-400">بيانات الزبون (Client)</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-1 rounded bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">اسم الزبون:</label>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="مثال: كمال قادري"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  placeholder="0791223344"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 font-mono"
                />
              </div>

              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-neutral-400 mb-1">عنوان التوصيل:</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="الشارع، العمارة، الطابق..."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (customerNameInput.trim()) {
                  setSelectedCustomer({
                    id: 0,
                    name: customerNameInput.trim(),
                    phone: customerPhoneInput.trim() || '0000000000',
                    totalOrders: 1,
                    totalSpent: '0',
                  });
                }
                setShowCustomerModal(false);
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg active:scale-95 transition"
            >
              حفظ وتحديد الزبون
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
