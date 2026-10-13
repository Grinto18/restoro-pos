import React, { useState, useEffect } from 'react';
import { usePos } from '../context/PosContext.tsx';
import { api } from '../services/api.ts';
import { PauseCircle, PlayCircle, Trash2, X, Clock } from 'lucide-react';

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({ isOpen, onClose }) => {
  const { loadHeldOrderIntoCart } = usePos();
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) loadHeldOrders();
  }, [isOpen]);

  const loadHeldOrders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOrders({ heldOnly: true });
      setHeldOrders(data);
    } catch (err) {
      console.error('Failed to load held orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async (order: any) => {
    try {
      await api.resumeHeldOrder(order.id);
      loadHeldOrderIntoCart(order);
      onClose();
    } catch (err: any) {
      alert(err.message || 'فشل استرجاع الطلب المعلق');
    }
  };

  const handleCancelHeld = async (orderId: number) => {
    if (!confirm('هل تريد إلغاء هذا الطلب المعلق نهائياً؟')) return;
    try {
      await api.cancelOrder(orderId, 'إلغاء من شاشة الانتظار');
      await loadHeldOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-900">
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
              <PauseCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-black">
                الطلبات المعلقة في الانتظار (Clients en attente)
              </h3>
              <p className="text-sm font-bold text-slate-500 mt-0.5">
                {heldOrders.length} طلبات معلقة محفوظة
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
          {heldOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-base">
              لا توجد طلبات معلقة حالياً
            </div>
          ) : (
            heldOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 flex items-center justify-between gap-3 text-sm shadow-sm"
              >
                <div>
                  <div className="font-black text-lg text-slate-900">
                    {ord.orderNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-500 mt-0.5">
                    {ord.type === 'DINE_IN' ? `طاولة ${ord.tableNumber || '—'}` : ord.type}
                  </div>
                  <div className="text-blue-700 font-black text-xl mt-1">
                    {Number(ord.total).toLocaleString()} DA
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResume(ord)}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm flex items-center gap-1.5 active:scale-95 transition shadow cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>استئناف الطلب</span>
                  </button>

                  <button
                    onClick={() => handleCancelHeld(ord.id)}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 active:scale-95 transition cursor-pointer"
                    title="إلغاء الطلب"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
