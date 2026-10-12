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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-xl w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                إدارة الصندوق والورديات (Gestion de Caisse)
              </h2>
              <p className="text-xs text-neutral-400">
                الكاشير: <span className="text-amber-300 font-bold">{user?.fullName}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-full bg-neutral-800 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('CURRENT')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'CURRENT' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400'
            }`}
          >
            الوردية الحالية
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENT')}
            disabled={!isShiftOpen}
            className={`flex-1 py-1.5 rounded-lg font-bold transition disabled:opacity-30 ${
              activeTab === 'MOVEMENT' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400'
            }`}
          >
            إيداع / سحب نقدي
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'HISTORY' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400'
            }`}
          >
            سجل الورديات السابقة
          </button>
        </div>

        {/* TAB 1: CURRENT SHIFT */}
        {activeTab === 'CURRENT' && (
          <div className="space-y-3">
            {isShiftOpen && currentShift ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 font-sans block">الرصيد الافتتاحي</span>
                    <span className="text-sm font-bold text-neutral-200">
                      {Number(currentShift.openingCash).toLocaleString()} DA
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] text-emerald-400 font-sans block">مبيعات نقدية</span>
                    <span className="text-sm font-bold text-emerald-400">
                      +{Number(currentShift.totalCashSales).toLocaleString()} DA
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] text-blue-400 font-sans block">مبيعات البطاقة/Baridi</span>
                    <span className="text-sm font-bold text-blue-400">
                      {(
                        Number(currentShift.totalCardSales) +
                        Number(currentShift.totalBaridimobSales) +
                        Number(currentShift.totalCcpSales)
                      ).toLocaleString()}{' '}
                      DA
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[10px] text-red-400 font-sans block">مصاريف / سحوبات</span>
                    <span className="text-sm font-bold text-red-400">
                      -(
                      {(
                        Number(currentShift.totalExpenses) + Number(currentShift.totalCashOut)
                      ).toLocaleString()}
                      ) DA
                    </span>
                  </div>
                </div>

                {/* Big Expected Cash */}
                <div className="p-3 bg-neutral-950 border border-amber-600/30 rounded-2xl flex items-center justify-between font-mono">
                  <div>
                    <span className="text-xs text-neutral-400 font-sans block font-bold">
                      النقد المتوقع تواجده في الدرج (Espèces Attendues):
                    </span>
                    <span className="text-2xl font-black text-amber-400">
                      {Number(currentShift.expectedCash || 0).toLocaleString()} DA
                    </span>
                  </div>
                  <button
                    onClick={openCashDrawer}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-sans font-bold text-xs rounded-xl border border-neutral-700"
                  >
                    فتح الدرج
                  </button>
                </div>

                {/* Close Shift Section */}
                <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>إغلاق الوردية (Clôture de Caisse / Rapport Z)</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-1">المبلغ الفعلي في الدرج (DA):</label>
                      <input
                        type="number"
                        value={closingCashInput}
                        onChange={(e) => setClosingCashInput(e.target.value)}
                        placeholder="المبلغ بعد الجرد"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-amber-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">ملاحظات الإغلاق:</label>
                      <input
                        type="text"
                        value={closeNotesInput}
                        onChange={(e) => setCloseNotesInput(e.target.value)}
                        placeholder="أي ملاحظات..."
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCloseShift}
                    disabled={!closingCashInput || isSubmitting}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition active:scale-95"
                  >
                    تأكيد إغلاق الوردية
                  </button>
                </div>
              </div>
            ) : (
              /* Open Shift Form */
              <div className="p-6 bg-neutral-950 rounded-2xl border border-neutral-800 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-neutral-100">الصندوق مغلق حالياً</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    يرجى إدخال الرصيد الافتتاحي (الفكة الأولية) لبدء استقبال الطلبات
                  </p>
                </div>

                <div className="max-w-xs mx-auto">
                  <label className="block text-xs text-neutral-400 mb-1 text-right">
                    الرصيد الافتتاحي بالدينار (DA):
                  </label>
                  <input
                    type="number"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    placeholder="مثال: 5000"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-center text-lg font-mono font-black text-amber-400"
                  />
                </div>

                <button
                  onClick={handleOpenShift}
                  disabled={isSubmitting}
                  className="w-full max-w-xs mx-auto py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-sm rounded-xl shadow-lg transition active:scale-95 block"
                >
                  فتح الوردية (Ouvrir la caisse)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CASH MOVEMENTS */}
        {activeTab === 'MOVEMENT' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMovementType('CASH_IN')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${
                  movementType === 'CASH_IN'
                    ? 'bg-emerald-500 text-black border-emerald-400'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>إيداع نقدي (Entrée d'argent)</span>
              </button>

              <button
                onClick={() => setMovementType('CASH_OUT')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold ${
                  movementType === 'CASH_OUT'
                    ? 'bg-red-500 text-white border-red-400'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>سحب نقدي (Sortie d'argent)</span>
              </button>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">المبلغ (DA):</label>
              <input
                type="number"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                placeholder="مثال: 3000"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">السبب والبيان:</label>
              <input
                type="text"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="مثال: إضافة فكة للصندوق، شراء مواد عاجلة..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
              />
            </div>

            <button
              onClick={handleRecordMovement}
              disabled={isSubmitting || !movementAmount || !movementReason}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition active:scale-95"
            >
              تسجيل الحركة النقدية
            </button>
          </div>
        )}

        {/* TAB 3: SHIFTS HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
            {shiftHistory.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-400 font-mono">وردية #{s.shiftNumber}</span>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(s.openedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-[11px] font-mono">
                  <div>
                    افتتاحي: <span className="text-neutral-300">{Number(s.openingCash)} DA</span>
                  </div>
                  <div>
                    مبيعات: <span className="text-emerald-400">{Number(s.totalCashSales)} DA</span>
                  </div>
                  <div>
                    فارق: <span className="text-amber-300">{Number(s.cashDifference || 0)} DA</span>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">الكاشير: {s.cashierName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
