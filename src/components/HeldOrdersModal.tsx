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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-amber-400">
              الطلبات المعلقة في الانتظار (Clients en attente)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-neutral-800 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
          {heldOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              لا توجد طلبات معلقة حالياً
            </div>
          ) : (
            heldOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-sm text-neutral-200">
                    {ord.orderNumber}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {ord.type === 'DINE_IN' ? `طاولة ${ord.tableNumber || '—'}` : ord.type}
                  </div>
                  <div className="text-amber-400 font-mono font-bold mt-1">
                    {Number(ord.total).toLocaleString()} DA
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleResume(ord)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 active:scale-95 transition"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>استئناف الطلب</span>
                  </button>

                  <button
                    onClick={() => handleCancelHeld(ord.id)}
                    className="p-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded-xl border border-red-800/40"
                    title="إلغاء"
                  >
                    <Trash2 className="w-4 h-4" />
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
