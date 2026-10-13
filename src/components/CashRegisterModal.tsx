import React, { useState, useEffect } from 'react';
import { usePos } from '../context/PosContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Coins,
  X,
  Lock,
  Unlock,
  ArrowDownRight,
  ArrowUpRight,
  History,
  AlertTriangle,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ isOpen, onClose }) => {
  const { currentShift, isShiftOpen, refreshShift, openCashDrawer } = usePos();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'MOVEMENT' | 'HISTORY'>('CURRENT');
  const [openingCashInput, setOpeningCashInput] = useState<string>('5000');
  const [closingCashInput, setClosingCashInput] = useState<string>('');
  const [closeNotesInput, setCloseNotesInput] = useState<string>('');
  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      refreshShift();
      if (activeTab === 'HISTORY') loadHistory();
    }
  }, [isOpen, activeTab]);

  const loadHistory = async () => {
    try {
      const data = await api.getShiftHistory();
      setShiftHistory(data);
    } catch (err) {
      console.error('Failed to load shift history:', err);
    }
  };

  const handleOpenShift = async () => {
    setIsSubmitting(true);
    try {
      await api.openShift(parseFloat(openingCashInput) || 0);
      await refreshShift();
      openCashDrawer();
    } catch (err: any) {
      alert(err.message || 'فشل فتح الصندوق');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    setIsSubmitting(true);
    try {
      await api.closeShift(currentShift.id, parseFloat(closingCashInput) || 0, closeNotesInput);
      await refreshShift();
      openCashDrawer();
      onClose();
    } catch (err: any) {
      alert(err.message || 'فشل إغلاق الصندوق');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordMovement = async () => {
    if (!currentShift || !movementAmount || !movementReason) return;
    setIsSubmitting(true);
    try {
      await api.recordCashMovement({
        shiftId: currentShift.id,
        type: movementType,
        amount: parseFloat(movementAmount) || 0,
        reason: movementReason,
      });
      setMovementAmount('');
      setMovementReason('');
      await refreshShift();
      openCashDrawer();
      setActiveTab('CURRENT');
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل حركة الصندوق');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-black">
                إدارة الصندوق والورديات (Gestion de Caisse)
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-0.5">
                الكاشير: <span className="text-blue-700 font-black">{user?.fullName}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-sm">
          <button
            onClick={() => setActiveTab('CURRENT')}
            className={`flex-1 py-2.5 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'CURRENT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:text-black hover:bg-white/60'
            }`}
          >
            الوردية الحالية
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENT')}
            disabled={!isShiftOpen}
            className={`flex-1 py-2.5 rounded-xl font-black transition disabled:opacity-30 cursor-pointer ${
              activeTab === 'MOVEMENT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:text-black hover:bg-white/60'
            }`}
          >
            إيداع / سحب نقدي
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2.5 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:text-black hover:bg-white/60'
            }`}
          >
            سجل الورديات السابقة
          </button>
        </div>

        {/* TAB 1: CURRENT SHIFT */}
        {activeTab === 'CURRENT' && (
          <div className="space-y-4">
            {isShiftOpen && currentShift ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200">
                    <span className="text-xs text-slate-500 font-black block">الرصيد الافتتاحي</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {Number(currentShift.openingCash).toLocaleString()} DA
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
                    <span className="text-xs text-emerald-700 font-black block">مبيعات نقدية</span>
                    <span className="text-lg font-black text-emerald-800 mt-1 block">
                      +{Number(currentShift.totalCashSales).toLocaleString()} DA
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-200">
                    <span className="text-xs text-blue-700 font-black block">مبيعات البطاقة/Baridi</span>
                    <span className="text-lg font-black text-blue-800 mt-1 block">
                      {(
                        Number(currentShift.totalCardSales) +
                        Number(currentShift.totalBaridimobSales) +
                        Number(currentShift.totalCcpSales)
                      ).toLocaleString()}{' '}
                      DA
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200">
                    <span className="text-xs text-red-700 font-black block">مصاريف / سحوبات</span>
                    <span className="text-lg font-black text-red-800 mt-1 block">
                      -(
                      {(
                        Number(currentShift.totalExpenses) + Number(currentShift.totalCashOut)
                      ).toLocaleString()}
                      ) DA
                    </span>
                  </div>
                </div>

                {/* Big Expected Cash (28px font) */}
                <div className="p-4 bg-blue-50/70 border-2 border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-600 block font-black">
                      النقد المتوقع تواجده في الدرج (Espèces Attendues):
                    </span>
                    <span className="text-3xl font-black text-blue-700 mt-0.5 block">
                      {Number(currentShift.expectedCash || 0).toLocaleString()} DA
                    </span>
                  </div>
                  <button
                    onClick={openCashDrawer}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-700 font-black text-sm rounded-xl border-2 border-blue-300 shadow-sm active:scale-95 transition cursor-pointer"
                  >
                    فتح الدرج
                  </button>
                </div>

                {/* Close Shift Section */}
                <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-sm font-black text-red-700 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-600" />
                    <span>إغلاق الوردية (Clôture de Caisse / Rapport Z)</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">المبلغ الفعلي في الدرج (DA):</label>
                      <input
                        type="number"
                        value={closingCashInput}
                        onChange={(e) => setClosingCashInput(e.target.value)}
                        placeholder="المبلغ بعد الجرد"
                        className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-lg focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">ملاحظات الإغلاق:</label>
                      <input
                        type="text"
                        value={closeNotesInput}
                        onChange={(e) => setCloseNotesInput(e.target.value)}
                        placeholder="أي ملاحظات..."
                        className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCloseShift}
                    disabled={!closingCashInput || isSubmitting}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-black text-base rounded-xl transition active:scale-95 shadow-md cursor-pointer"
                  >
                    تأكيد إغلاق الوردية
                  </button>
                </div>
              </div>
            ) : (
              /* Open Shift Form */
              <div className="p-8 bg-slate-50 rounded-2xl border-2 border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <AlertTriangle className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black">الصندوق مغلق حالياً</h3>
                  <p className="text-sm font-bold text-slate-500 mt-1">
                    يرجى إدخال الرصيد الافتتاحي (الفكة الأولية) لبدء استقبال الطلبات
                  </p>
                </div>

                <div className="max-w-sm mx-auto text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    الرصيد الافتتاحي بالدينار (DA):
                  </label>
                  <input
                    type="number"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    placeholder="مثال: 5000"
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-center text-2xl font-black text-blue-700 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                <button
                  onClick={handleOpenShift}
                  disabled={isSubmitting}
                  className="w-full max-w-sm mx-auto py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl transition active:scale-95 block cursor-pointer"
                >
                  فتح الوردية (Ouvrir la caisse)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CASH MOVEMENTS */}
        {activeTab === 'MOVEMENT' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMovementType('CASH_IN')}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-base cursor-pointer ${
                  movementType === 'CASH_IN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-5 h-5" />
                <span>إيداع نقدي (Entrée d'argent)</span>
              </button>

              <button
                onClick={() => setMovementType('CASH_OUT')}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-base cursor-pointer ${
                  movementType === 'CASH_OUT'
                    ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>سحب نقدي (Sortie d'argent)</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ (DA):</label>
              <input
                type="number"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                placeholder="مثال: 3000"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-xl focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">السبب والبيان:</label>
              <input
                type="text"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="مثال: إضافة فكة للصندوق، شراء مواد عاجلة..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <button
              onClick={handleRecordMovement}
              disabled={isSubmitting || !movementAmount || !movementReason}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black text-lg rounded-2xl transition active:scale-95 shadow-xl cursor-pointer"
            >
              تسجيل الحركة النقدية
            </button>
          </div>
        )}

        {/* TAB 3: SHIFTS HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
            {shiftHistory.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm">
                <div className="flex items-center justify-between font-black">
                  <span className="text-blue-700 text-base">وردية #{s.shiftNumber}</span>
                  <span className="text-xs text-slate-500 font-bold">
                    {new Date(s.openedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm font-black">
                  <div>
                    افتتاحي: <span className="text-slate-800">{Number(s.openingCash).toLocaleString()} DA</span>
                  </div>
                  <div>
                    مبيعات: <span className="text-emerald-700">{Number(s.totalCashSales).toLocaleString()} DA</span>
                  </div>
                  <div>
                    فارق: <span className="text-blue-700">{Number(s.cashDifference || 0).toLocaleString()} DA</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-1">الكاشير: {s.cashierName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
