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
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-84px)] overflow-hidden bg-white text-slate-900 select-none">
      {/* ============================================================== */}
      {/* RIGHT SIDE (in RTL): CART, TOTALS & TOUCH FUNCTION BUTTONS     */}
      {/* Clean White, Dark Accents, Royal Blue Primary Actions          */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[480px] xl:w-[530px] bg-slate-50 border-l-2 border-slate-200 flex flex-col shrink-0 shadow-lg">
        {/* Order Mode Switcher (Dine In / Takeaway / Delivery) */}
        <div className="p-2.5 bg-white border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setOrderType('DINE_IN')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
              orderType === 'DINE_IN'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>في الصالة (Dine-in)</span>
          </button>
          <button
            onClick={() => setOrderType('TAKEAWAY')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
              orderType === 'TAKEAWAY'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>محمول (Emporter)</span>
          </button>
          <button
            onClick={() => setOrderType('DELIVERY')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
              orderType === 'DELIVERY'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>توصيل (Livraison)</span>
          </button>
        </div>

        {/* Quick Context Selectors (Table, Client, Notes) */}
        <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-sm gap-2">
          {orderType === 'DINE_IN' && (
            <button
              onClick={() => setShowTableModal(true)}
              className="flex-1 flex items-center justify-between bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 shadow-sm"
            >
              <span className="text-xs font-bold text-slate-500">الطاولة:</span>
              <span className="font-extrabold text-blue-700 text-base">
                {selectedTable ? selectedTable.tableNumber : 'اختر طاولة'}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex-1 flex items-center justify-between bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 shadow-sm"
          >
            <span className="text-xs font-bold text-slate-500">الزبون:</span>
            <span className="font-extrabold text-slate-900 truncate max-w-[130px] text-sm">
              {selectedCustomer ? selectedCustomer.name : 'زبون عادي'}
            </span>
          </button>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-extrabold flex items-center gap-1.5 active:scale-95 transition"
              title="إفراغ السلة (Annuler)"
            >
              <Trash2 className="w-4 h-4" />
              <span>إفراغ</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar min-h-0 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <ShoppingBag className="w-16 h-16 stroke-[1.5] text-slate-300 mb-3" />
              <p className="font-black text-lg text-slate-700">السلة فارغة</p>
              <p className="text-sm text-slate-500 mt-1">اضغط على أي طبق من القائمة لإضافته للطلب</p>
            </div>
          ) : (
            cart.map((item) => {
              const isSelected = selectedCartItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCartItemId(item.id)}
                  className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-600 shadow-md ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-extrabold text-base text-slate-900 flex items-center gap-2 leading-snug">
                        <span>{item.nameAr}</span>
                        {item.nameFr && (
                          <span className="text-xs text-slate-500 font-semibold">
                            ({item.nameFr})
                          </span>
                        )}
                      </div>

                      {/* Variant and Add-ons badges */}
                      {(item.selectedVariant || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs">
                          {item.selectedVariant && (
                            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                              {item.selectedVariant.nameAr}
                            </span>
                          )}
                          {item.selectedAddons?.map((a, i) => (
                            <span
                              key={i}
                              className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              +{a.nameAr} ({Number(a.price)} DA)
                            </span>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-xs text-blue-700 font-semibold mt-1">
                          ملاحظة: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Line total (Large 20-22px font) */}
                    <div className="text-left font-black text-lg text-blue-700 shrink-0">
                      {item.total.toLocaleString()} <span className="text-xs font-bold text-slate-600">DA</span>
                    </div>
                  </div>

                  {/* Quantity and Controls */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-sm">
                    <div className="text-slate-600 font-bold text-xs">
                      {item.unitPrice} DA × {item.quantity}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartItemQuantity(item.id, -1);
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-800 active:scale-95 font-bold"
                      >
                        <Minus className="w-4 h-4" />
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
                        className="min-w-10 h-8 px-2 rounded-lg bg-white border-2 border-blue-600 font-extrabold text-center text-blue-700 text-base hover:bg-blue-50 shadow-sm"
                        title="تعديل الكمية والملاحظات"
                      >
                        {item.quantity}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartItemQuantity(item.id, 1);
                        }}
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center active:scale-95 font-bold shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mr-1.5 active:scale-95"
                        title="حذف هذا الصنف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================= */}
        {/* TOTALS DISPLAY (High contrast, 28-32px Total)              */}
        {/* ========================================================= */}
        <div className="p-3.5 bg-slate-50 border-t-2 border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-sm text-slate-600 font-bold">
            <span>المبلغ الأولي (Sous-total):</span>
            <span className="font-extrabold text-slate-800 text-base">{subtotal.toFixed(2)} DA</span>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-red-600 font-bold">
              <span>الخصم (Remise):</span>
              <span className="font-extrabold">-{discount.toFixed(2)} DA</span>
            </div>
          )}

          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-sm text-blue-700 font-bold">
              <span>التوصيل (Livraison):</span>
              <span className="font-extrabold">+{deliveryFee.toFixed(2)} DA</span>
            </div>
          )}

          {/* Big Bold Total - 28px to 32px */}
          <div className="flex items-baseline justify-between pt-2 border-t-2 border-slate-300">
            <span className="text-base text-black uppercase tracking-wider font-extrabold">
              المجموع الإجمالي:
            </span>
            <span className="text-3xl font-black text-blue-700 tracking-tight">
              {total.toLocaleString()} <span className="text-lg font-extrabold text-slate-700">DA</span>
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOUCH ACTION BUTTONS GRID                                 */}
        {/* Big Large Buttons with Royal Blue Highlights              */}
        {/* ========================================================= */}
        <div className="p-3 bg-white border-t-2 border-slate-200 space-y-2">
          {/* Quick Item Modifier Bar */}
          <div className="grid grid-cols-4 gap-1.5">
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
              className="bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-800 border border-blue-200 font-extrabold py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center transition active:scale-95"
            >
              <Plus className="w-4 h-4 mb-0.5 text-blue-600" />
              <span>إضافات</span>
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
              className="bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-800 border border-blue-200 font-extrabold py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center transition active:scale-95"
            >
              <FileText className="w-4 h-4 mb-0.5 text-blue-600" />
              <span>تعديل</span>
            </button>

            <button
              onClick={() => {
                if (selectedCartItem) {
                  setEditPriceInput(String(selectedCartItem.unitPrice));
                  setShowItemEditModal(true);
                }
              }}
              disabled={!selectedCartItem}
              className="bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-800 border border-blue-200 font-extrabold py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center transition active:scale-95"
            >
              <DollarSign className="w-4 h-4 mb-0.5 text-blue-600" />
              <span>السعر</span>
            </button>

            <button
              onClick={() => {
                if (selectedCartItem) {
                  setEditQtyInput(String(selectedCartItem.quantity));
                  setShowItemEditModal(true);
                }
              }}
              disabled={!selectedCartItem}
              className="bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-800 border border-blue-200 font-extrabold py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center transition active:scale-95"
            >
              <Layers className="w-4 h-4 mb-0.5 text-blue-600" />
              <span>الكمية</span>
            </button>
          </div>

          {/* Central Actions: Nouvelle commande, Mettre en attente, Plan de salle */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={clearCart}
              className="bg-slate-900 hover:bg-black text-white font-extrabold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>طلب جديد</span>
            </button>

            <button
              onClick={handleHoldCurrentOrder}
              disabled={cart.length === 0 || isHoldingOrder}
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 disabled:opacity-40 font-extrabold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <PauseCircle className="w-4 h-4 text-blue-600" />
              <span>تعليق الطلب</span>
            </button>

            <button
              onClick={onNavigateToTables}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-extrabold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>الصالة</span>
            </button>
          </div>

          {/* Checkout & Tickets Primary Actions: [طباعة الفاتورة], [الدفع], [فاتورة أولية] */}
          <div className="space-y-2 pt-1">
            {/* Primary Main Action: طباعة الفاتورة (Large Royal Blue Button, 20-22px font) */}
            <button
              onClick={() => onQuickCheckout(true)}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black py-4 px-4 rounded-2xl text-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition cursor-pointer"
              title="حفظ الطلب فورياً في قاعدة البيانات وإرسال الفاتورة إلى طابعة Windows الحرارية"
            >
              <Printer className="w-6 h-6 text-white stroke-[2.5]" />
              <span className="tracking-wide">تأكيد البيع والطباعة الفورية</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* Encaisser (Full Payment Modal with Split Bill / Multi Tender) */}
              <button
                onClick={onOpenPaymentModal}
                disabled={cart.length === 0}
                className="bg-black hover:bg-slate-900 disabled:opacity-40 text-white font-extrabold py-3 px-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
              >
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span>الدفع والتسديد (Paiement)</span>
              </button>

              {/* Direct Addition (Bon Addition) */}
              <button
                onClick={handlePrintAddition}
                disabled={cart.length === 0}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 border border-slate-300 font-extrabold py-3 px-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
                title="طباعة الفاتورة للزبون بدون إغلاق الحساب (Addition)"
              >
                <FileText className="w-5 h-5 text-blue-600" />
                <span>فاتورة أولية (Addition)</span>
              </button>
            </div>
          </div>

          {/* Secondary Function Buttons (Cuisine, Addition, Remise, Tiroir, Re-print) */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            <button
              onClick={handleSendToKitchen}
              disabled={cart.length === 0}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-extrabold py-2 px-1 rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition active:scale-95 text-xs"
              title="إرسال تذكرة المطبخ"
            >
              <ChefHat className="w-4 h-4 text-blue-600 shrink-0" />
              <span>المطبخ</span>
            </button>

            <button
              onClick={handlePrintAddition}
              disabled={cart.length === 0}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-extrabold py-2 px-1 rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition active:scale-95 text-xs"
              title="طباعة الفاتورة للزبون (Addition)"
            >
              <Printer className="w-4 h-4 text-blue-600 shrink-0" />
              <span>فاتورة أولية</span>
            </button>

            <button
              onClick={() => setShowDiscountModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-2 px-1 rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition active:scale-95 text-xs"
              title="تطبيق خصم"
            >
              <Percent className="w-4 h-4 text-blue-600 shrink-0" />
              <span>خصم</span>
            </button>

            <button
              onClick={openCashDrawer}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-2 px-1 rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition active:scale-95 text-xs"
              title="فتح درج النقود"
            >
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>الدرج</span>
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
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-2 px-1 rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition active:scale-95 text-xs"
              title="إعادة طباعة آخر إيصال / فحص الطابعة"
            >
              <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
              <span>إعادة طباعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CENTER & LEFT: SEARCH, CATEGORIES TABS & PRODUCT GRID          */}
      {/* Crisp White Background, Large Clear Cards, Royal Blue Selection*/}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 p-4 space-y-3 min-w-0">
        {/* Search & Barcode Scan Bar */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="ابحث عن طبق أو امسح الباركود..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-11 pl-4 py-2.5 text-lg font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="text-base font-black text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 hidden sm:block shrink-0">
            {filteredProducts.length} طبق
          </div>
        </div>

        {/* Categories Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 py-1">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-5 py-3 rounded-xl font-black text-base flex items-center gap-2 transition active:scale-95 shrink-0 cursor-pointer shadow-sm ${
              selectedCategoryId === 'ALL'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-200'
            }`}
          >
            <Utensils className="w-5 h-5" />
            <span>الكل (Tous)</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-3 rounded-xl font-black text-base flex items-center gap-2 transition active:scale-95 shrink-0 cursor-pointer shadow-sm ${
                  isSelected
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-200'
                }`}
              >
                {getCatIcon(cat.nameAr)}
                <div className="text-right leading-tight">
                  <div className="text-base font-black">{cat.nameAr}</div>
                  {cat.nameFr && (
                    <div className={`text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {cat.nameFr}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Products Grid (Tactile Touch Cards - Large Clear Labels and Prices) */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Utensils className="w-16 h-16 mb-3 stroke-[1.5] text-slate-300" />
              <p className="text-xl font-black text-slate-600">لا توجد أطباق مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 pb-3">
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
                    className={`relative p-4 rounded-2xl border-2 text-right flex flex-col justify-between min-h-[140px] transition-all active:scale-[0.98] select-none cursor-pointer shadow-sm ${
                      product.isAvailable
                        ? 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-600 hover:shadow-md'
                        : 'bg-slate-100 border-slate-200 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      {/* Product Name (20 to 24px) */}
                      <div className="font-black text-xl text-slate-900 line-clamp-2 leading-tight">
                        {product.nameAr}
                      </div>

                      {product.nameFr && (
                        <div className="text-xs text-slate-500 font-semibold line-clamp-1 mt-1">
                          {product.nameFr}
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-200">
                      {/* Price in DA (24 to 30px) */}
                      <div className="font-black text-2xl text-blue-700 tracking-tight">
                        {priceNum.toLocaleString()}{' '}
                        <span className="text-sm font-black text-slate-700">DA</span>
                      </div>

                      {hasOptions && (
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-lg">
                          خيارات
                        </span>
                      )}

                      {!product.isAvailable && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-lg border border-red-200 font-bold">
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-2xl text-black">
                  {activeProductForOptions.nameAr}
                </h3>
                <p className="text-sm font-bold text-slate-600 mt-0.5">
                  السعر الأساسي: {Number(activeProductForOptions.price).toLocaleString()} DA
                </p>
              </div>
              <button
                onClick={() => setActiveProductForOptions(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Variants (Sizes) */}
            {activeProductForOptions.variants && activeProductForOptions.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-base font-black text-black">اختر الحجم (Taille):</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {activeProductForOptions.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const adj = Number(v.priceAdjustment);
                    const fullVariantPrice = Number(activeProductForOptions.price) + adj;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3.5 rounded-2xl text-center border-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-blue-50/50 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-lg font-black">{v.nameAr}</div>
                        <div className={`text-base font-extrabold mt-1 ${isSelected ? 'text-blue-100' : 'text-blue-700'}`}>
                          {fullVariantPrice.toLocaleString()} DA
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addons */}
            {activeProductForOptions.addons && activeProductForOptions.addons.length > 0 && (
              <div className="space-y-2">
                <label className="text-base font-black text-black">الإضافات الاختيارية (Suppléments):</label>
                <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto no-scrollbar p-1">
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
                        className={`p-3 rounded-2xl flex items-center justify-between text-sm border-2 transition cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm ring-1 ring-blue-400'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-extrabold text-base">{a.nameAr}</span>
                        <span className="font-black text-base text-blue-700">+{Number(a.price)} DA</span>
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
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>تأكيد وإضافة للطلب — {computedTotal.toLocaleString()} DA</span>
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-xl text-black">
                تعديل الصنف: {selectedCartItem.nameAr}
              </h3>
              <button
                onClick={() => setShowItemEditModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الكمية:</label>
                <input
                  type="number"
                  min="1"
                  value={editQtyInput}
                  onChange={(e) => setEditQtyInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">السعر الفردي (DA):</label>
                <input
                  type="number"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظة للمطبخ (Note):</label>
                <input
                  type="text"
                  value={editNotesInput}
                  onChange={(e) => setEditNotesInput(e.target.value)}
                  placeholder="مثال: بدون بصل، صوص حار..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
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
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl active:scale-95 transition shadow-lg"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-xl text-black">تطبيق خصم (Remise)</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">مبلغ الخصم بالدينار (DA):</label>
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="مثال: 200"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-blue-700 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {[50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDiscountInput(String(amt))}
                  className="bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-sm font-black py-2 rounded-xl border border-slate-200"
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
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl active:scale-95 transition shadow-lg"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">اختر طاولة للطلب</h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1 no-scrollbar">
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
                    className={`p-3.5 rounded-2xl text-center border-2 font-black transition active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                        : isOccupied
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-white hover:bg-blue-50/50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="text-xl font-black">{t.tableNumber}</div>
                    <div className={`text-xs mt-1 font-bold ${isSelected ? 'text-blue-100' : isOccupied ? 'text-red-500' : 'text-slate-500'}`}>
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">بيانات الزبون (Client)</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم الزبون:</label>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="مثال: كمال قادري"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  placeholder="0791223344"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">عنوان التوصيل:</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="الشارع، العمارة، الطابق..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
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
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-lg"
            >
              حفظ وتحديد الزبون
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
