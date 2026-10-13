import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PosProvider, usePos } from './context/PosContext.tsx';
import { Header } from './components/Header.tsx';
import { Navigation, ActiveTab } from './components/Navigation.tsx';
import { PosTerminal } from './components/PosTerminal.tsx';
import { TableMap } from './components/TableMap.tsx';
import { KitchenDisplay } from './components/KitchenDisplay.tsx';
import { MenuManagement } from './components/MenuManagement.tsx';
import { InventoryManager } from './components/InventoryManager.tsx';
import { WasteManager } from './components/WasteManager.tsx';
import { PurchasesManager } from './components/PurchasesManager.tsx';
import { CustomersManager } from './components/CustomersManager.tsx';
import { DeliveryManager } from './components/DeliveryManager.tsx';
import { ExpensesManager } from './components/ExpensesManager.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { AuditLogView } from './components/AuditLogView.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { CashRegisterModal } from './components/CashRegisterModal.tsx';
import { HeldOrdersModal } from './components/HeldOrdersModal.tsx';
import { ReceiptPrint } from './components/ReceiptPrint.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { api } from './services/api.ts';

const MainAppContent: React.FC = () => {
  const { user, isLocked, isLoading } = useAuth();
  const {
    receiptToPrint,
    setReceiptToPrint,
    cart,
    subtotal,
    total,
    orderType,
    selectedTable,
    selectedCustomer,
    clearCart,
    openCashDrawer,
    refreshShift,
    refreshHeldOrders,
  } = usePos();

  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showCashRegisterModal, setShowCashRegisterModal] = useState<boolean>(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState<boolean>(false);

  // Refresh shift and held orders when user signs in
  useEffect(() => {
    if (user && !isLocked) {
      refreshShift();
      refreshHeldOrders();
    }
  }, [user, isLocked]);

  // Global POS Keyboard Shortcuts (F1, F2, F3, F4, F5, F10, F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('purchases');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('menu');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('customers');
      } else if (e.key === 'F10') {
        e.preventDefault();
        setActiveTab('reports');
      } else if (e.key === 'F12') {
        e.preventDefault();
        setShowCashRegisterModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowCashRegisterModal(false);
        setShowHeldOrdersModal(false);
        setReceiptToPrint(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCheckingOutRef = React.useRef(false);

  // Quick 1-click Cash Checkout
  const handleQuickCheckout = async (printTicket: boolean) => {
    if (cart.length === 0 || isCheckingOutRef.current) return;
    isCheckingOutRef.current = true;
    try {
      const checkoutKey = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const orderRes = await api.createOrder({
        type: orderType,
        tableId: selectedTable?.id,
        customerId: selectedCustomer?.id,
        items: cart,
        discount: 0,
        deliveryFee: 0,
        notes: null,
        isHeld: false,
        idempotencyKey: checkoutKey,
      });

      await api.processPayment({
        orderId: orderRes.id,
        payments: [{ method: 'CASH', amount: total, tenderAmount: total, changeAmount: 0 }],
        idempotencyKey: `pay-${checkoutKey}`,
      });

      openCashDrawer();

      const receiptData = {
        orderNumber: orderRes.orderNumber,
        dailySequence: orderRes.dailySequence,
        tableNumber: selectedTable?.tableNumber,
        customerName: selectedCustomer?.name,
        orderType,
        items: [...cart],
        subtotal,
        discount: 0,
        deliveryFee: 0,
        total,
        tenderAmount: total,
        changeAmount: 0,
        cashierName: user?.fullName || 'Admin',
        time: new Date().toLocaleTimeString('fr-FR'),
        date: new Date().toLocaleDateString('fr-FR'),
      };

      if (printTicket) {
        // Single unified direct spool & thermal print
        const { printerService } = await import('./services/printerService.ts');
        const p = printerService.getProfile();
        await printerService.sendDirectPrintJob(receiptData, p);
        setReceiptToPrint({ ...receiptData, alreadyAutoPrinted: true });
      }

      clearCart();
    } catch (err) {
      console.error('Quick checkout failed:', err);
    } finally {
      isCheckingOutRef.current = false;
    }
  };

  // If loading session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-blue-700 gap-4">
        <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-extrabold text-lg font-sans tracking-wide text-slate-900">جاري تشغيل GOLDEN PALACE POS...</p>
      </div>
    );
  }

  // If not logged in or screen is locked
  if (!user || isLocked) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 overflow-hidden font-sans">
      {/* 1. Top Header Bar (Terminal metrics, clock, user, shifts, offline status) */}
      <Header
        onOpenCashRegisterModal={() => setShowCashRegisterModal(true)}
        onOpenHeldOrdersModal={() => setShowHeldOrdersModal(true)}
      />

      {/* 2. PRO-SOLUTION Inspired Nav Launcher */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Main Workspace Router */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'pos' && (
          <PosTerminal
            onOpenPaymentModal={() => setShowPaymentModal(true)}
            onNavigateToTables={() => setActiveTab('tables')}
            onOpenHeldOrders={() => setShowHeldOrdersModal(true)}
            onQuickCheckout={handleQuickCheckout}
          />
        )}
        {activeTab === 'tables' && (
          <TableMap
            onSelectTableForOrder={(table) => {
              setActiveTab('pos');
            }}
          />
        )}
        {activeTab === 'kitchen' && <KitchenDisplay />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'waste' && <WasteManager />}
        {activeTab === 'purchases' && <PurchasesManager />}
        {activeTab === 'customers' && <CustomersManager />}
        {activeTab === 'delivery' && <DeliveryManager />}
        {activeTab === 'caisse' && (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <button
              onClick={() => setShowCashRegisterModal(true)}
              className="py-5 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-xl transition cursor-pointer"
            >
              فتح لوحة إدارة الصندوق والورديات (F12)
            </button>
          </div>
        )}
        {activeTab === 'expenses' && <ExpensesManager />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'audit' && <AuditLogView />}
        {activeTab === 'settings' && <SettingsModal />}
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(receiptData) => {
          setReceiptToPrint(receiptData);
        }}
      />

      <CashRegisterModal
        isOpen={showCashRegisterModal}
        onClose={() => setShowCashRegisterModal(false)}
      />

      <HeldOrdersModal
        isOpen={showHeldOrdersModal}
        onClose={() => setShowHeldOrdersModal(false)}
      />

      {receiptToPrint && (
        <ReceiptPrint data={receiptToPrint} onClose={() => setReceiptToPrint(null)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PosProvider>
        <MainAppContent />
      </PosProvider>
    </AuthProvider>
  );
}
