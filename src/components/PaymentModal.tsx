import React, { useState } from 'react';
import { usePos } from '../context/PosContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  X,
  Check,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  RotateCcw,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const {
    cart,
    orderType,
    selectedTable,
    selectedCustomer,
    selectedWaiter,
    discount,
    deliveryFee,
    deliveryAddress,
    notes,
    subtotal,
    total,
    clearCart,
    openCashDrawer,
  } = usePos();

  const [paymentEntries, setPaymentEntries] = useState<
    { method: 'CASH' | 'CARD' | 'CCP' | 'BARIDIMOB' | 'OTHER'; amount: number }[]
  >([{ method: 'CASH', amount: total }]);

  const [activeMethod, setActiveMethod] = useState<'CASH' | 'CARD' | 'CCP' | 'BARIDIMOB' | 'OTHER'>('CASH');
  const [tenderInput, setTenderInput] = useState<string>(String(total));
  const [printReceiptOnSuccess, setPrintReceiptOnSuccess] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const totalAssigned = paymentEntries.reduce((sum, p) => sum + p.amount, 0);
  const remainingDue = Math.max(0, total - totalAssigned);

  const tenderNum = parseFloat(tenderInput) || 0;
  const changeDue = Math.max(0, tenderNum - total);

  // Quick cash amount addition
  const handleAddTender = (amount: number) => {
    const current = parseFloat(tenderInput) || 0;
    setTenderInput(String(current + amount));
  };

  const handleNumpadPress = (val: string) => {
    if (val === 'C') {
      setTenderInput('');
    } else if (val === 'EXACT') {
      setTenderInput(String(total));
    } else {
      setTenderInput((prev) => (prev === '0' ? val : prev + val));
    }
  };

  // Add split payment method
  const handleAddSplitEntry = (method: 'CASH' | 'CARD' | 'CCP' | 'BARIDIMOB' | 'OTHER', amount: number) => {
    const existing = paymentEntries.filter((p) => p.method !== method);
    setPaymentEntries([...existing, { method, amount }]);
  };

  const handleCompletePayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create Order in database (or offline queue)
      const idempotencyKey = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const orderRes = await api.createOrder({
        type: orderType,
        tableId: selectedTable?.id,
        customerId: selectedCustomer?.id,
        items: cart,
        discount,
        deliveryFee,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
        notes,
        isHeld: false,
        idempotencyKey,
      });

      // 2. Process Payment
      const paymentsPayload = paymentEntries.map((p) => ({
        method: p.method,
        amount: p.amount,
        tenderAmount: p.method === 'CASH' ? tenderNum : p.amount,
        changeAmount: p.method === 'CASH' ? changeDue : 0,
      }));

      await api.processPayment({
        orderId: orderRes.id,
        payments: paymentsPayload,
        idempotencyKey: `txn-${idempotencyKey}`,
      });

      // 3. Trigger cash drawer
      openCashDrawer();

      // 4. Prepare receipt payload
      const receiptData = {
        orderNumber: orderRes.orderNumber,
        dailySequence: orderRes.dailySequence,
        tableNumber: selectedTable?.tableNumber,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        orderType,
        items: cart,
        subtotal,
        discount,
        deliveryFee,
        total,
        payments: paymentsPayload,
        tenderAmount: tenderNum,
        changeAmount: changeDue,
        cashierName: user?.fullName || 'Admin',
        time: new Date().toLocaleTimeString('fr-FR'),
        date: new Date().toLocaleDateString('fr-FR'),
      };

      clearCart();
      onSuccess(receiptData);
      onClose();
    } catch (err: any) {
      console.error('Payment failure:', err);
      setErrorMessage(err.message || 'فشلت معالجة عملية الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-500" />
              <span>تسديد الفاتورة (Encaissement)</span>
            </h2>
            <p className="text-xs text-neutral-400">
              {orderType === 'DINE_IN' && selectedTable
                ? `الطاولة ${selectedTable.tableNumber}`
                : orderType === 'DELIVERY'
                ? 'طلب توصيل'
                : 'طلب محمول'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs text-center font-bold">
            {errorMessage}
          </div>
        )}

        {/* Big Display: Total, Tendered, Change */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-3 rounded-2xl border border-neutral-800 font-mono text-center">
          <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase font-sans font-bold block">
              TOTAL À PAYER
            </span>
            <span className="text-xl font-black text-amber-400">
              {total.toLocaleString()} <span className="text-xs font-normal">DA</span>
            </span>
          </div>

          <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] text-cyan-400 uppercase font-sans font-bold block">
              VERSÉ (المقبوض)
            </span>
            <span className="text-xl font-black text-cyan-300">
              {tenderNum.toLocaleString()} <span className="text-xs font-normal">DA</span>
            </span>
          </div>

          <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">
              RENDU (الباقي للزبون)
            </span>
            <span className="text-xl font-black text-emerald-400">
              {changeDue.toLocaleString()} <span className="text-xs font-normal">DA</span>
            </span>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div>
          <label className="block text-xs font-bold text-neutral-300 mb-1.5">
            طريقة الدفع (Mode de paiement):
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'CASH', label: 'نقدي (Espèces)', icon: Banknote, color: 'hover:border-emerald-500' },
              { id: 'CARD', label: 'بطاقة بنكية (Carte/TPE)', icon: CreditCard, color: 'hover:border-blue-500' },
              { id: 'BARIDIMOB', label: 'بريدي موب (BaridiMob)', icon: Smartphone, color: 'hover:border-amber-500' },
              { id: 'CCP', label: 'حساب CCP / صك', icon: Building, color: 'hover:border-purple-500' },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = activeMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMethod(m.id as any);
                    setPaymentEntries([{ method: m.id as any, amount: total }]);
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-xs font-bold ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md ring-2 ring-amber-400/50'
                      : `bg-neutral-800 text-neutral-300 border-neutral-700 ${m.color}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-center">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Numpad & Quick Cash Notes (100, 200, 500, 1000, 2000 DA) */}
        {activeMethod === 'CASH' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Quick Cash Banknotes */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-neutral-400 font-bold">
                أوراق نقدية سريعة (Billets):
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[100, 200, 500, 1000, 2000].map((noteVal) => (
                  <button
                    key={noteVal}
                    onClick={() => handleAddTender(noteVal)}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-300 font-mono font-bold text-xs active:scale-95 transition"
                  >
                    +{noteVal} DA
                  </button>
                ))}
                <button
                  onClick={() => setTenderInput(String(total))}
                  className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-xs active:scale-95 transition"
                >
                  المبلغ الدقيق
                </button>
              </div>
            </div>

            {/* Touch Numpad */}
            <div className="grid grid-cols-4 gap-1 font-mono text-sm">
              {['7', '8', '9', 'C', '4', '5', '6', 'EXACT', '1', '2', '3', '00', '0', '.'].map(
                (btn) => (
                  <button
                    key={btn}
                    onClick={() => handleNumpadPress(btn)}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-200 font-bold active:scale-95 transition flex items-center justify-center"
                  >
                    {btn}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Bottom Options & Submit */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={printReceiptOnSuccess}
              onChange={(e) => setPrintReceiptOnSuccess(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
            />
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة الفاتورة تلقائياً عند الدفع</span>
          </label>

          <button
            onClick={handleCompletePayment}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-black font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            {isProcessing ? (
              <span>جاري المعالجة...</span>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>تأكيد الدفع (Valider le paiement)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
