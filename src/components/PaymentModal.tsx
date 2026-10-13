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

  const handleCompletePayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create Order in database
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-black text-black flex items-center gap-2">
              <Banknote className="w-7 h-7 text-blue-600" />
              <span>تسديد الفاتورة (Encaissement)</span>
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-0.5">
              {orderType === 'DINE_IN' && selectedTable
                ? `الطاولة ${selectedTable.tableNumber}`
                : orderType === 'DELIVERY'
                ? 'طلب توصيل'
                : 'طلب محمول'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-sm text-center font-black">
            {errorMessage}
          </div>
        )}

        {/* Big Displays: Total, Tendered, Change (24-30px fonts) */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-center">
          <div className="p-3 rounded-xl bg-white border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-black block">
              المجموع المطلوب
            </span>
            <span className="text-2xl font-black text-blue-700">
              {total.toLocaleString()} <span className="text-sm font-bold text-slate-600">DA</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-black block">
              المبلغ المقبوض
            </span>
            <span className="text-2xl font-black text-slate-900">
              {tenderNum.toLocaleString()} <span className="text-sm font-bold text-slate-600">DA</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-black block">
              الباقي للزبون
            </span>
            <span className="text-2xl font-black text-emerald-700">
              {changeDue.toLocaleString()} <span className="text-sm font-bold text-slate-600">DA</span>
            </span>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div>
          <label className="block text-sm font-black text-black mb-2">
            طريقة الدفع (Mode de paiement):
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { id: 'CASH', label: 'نقدي (Espèces)', icon: Banknote },
              { id: 'CARD', label: 'بطاقة بنكية (Carte)', icon: CreditCard },
              { id: 'BARIDIMOB', label: 'بريدي موب (BaridiMob)', icon: Smartphone },
              { id: 'CCP', label: 'حساب CCP / صك', icon: Building },
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
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition text-sm font-black cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-blue-50/50 hover:border-blue-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-center">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Numpad & Quick Cash Notes (100, 200, 500, 1000, 2000 DA) */}
        {activeMethod === 'CASH' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Quick Cash Banknotes */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-600">
                أوراق نقدية سريعة (Billets):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 500, 1000, 2000].map((noteVal) => (
                  <button
                    key={noteVal}
                    onClick={() => handleAddTender(noteVal)}
                    className="p-3 rounded-xl bg-slate-100 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-300 text-blue-700 font-black text-base active:scale-95 transition shadow-sm"
                  >
                    +{noteVal} DA
                  </button>
                ))}
                <button
                  onClick={() => setTenderInput(String(total))}
                  className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-800 font-black text-sm active:scale-95 transition shadow-sm"
                >
                  المبلغ الدقيق
                </button>
              </div>
            </div>

            {/* Touch Numpad */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-base">
              {['7', '8', '9', 'C', '4', '5', '6', 'EXACT', '1', '2', '3', '00', '0', '.'].map(
                (btn) => (
                  <button
                    key={btn}
                    onClick={() => handleNumpadPress(btn)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-900 font-black active:scale-95 transition flex items-center justify-center text-lg"
                  >
                    {btn}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Bottom Options & Submit */}
        <div className="pt-3 border-t-2 border-slate-200 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={printReceiptOnSuccess}
              onChange={(e) => setPrintReceiptOnSuccess(e.target.checked)}
              className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
            />
            <Printer className="w-5 h-5 text-blue-600" />
            <span>طباعة الفاتورة تلقائياً عند الدفع</span>
          </label>

          <button
            onClick={handleCompletePayment}
            disabled={isProcessing}
            className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xl rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
          >
            {isProcessing ? (
              <span>جاري المعالجة...</span>
            ) : (
              <>
                <Check className="w-6 h-6 stroke-[3]" />
                <span>تأكيد الدفع (Valider le paiement)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
