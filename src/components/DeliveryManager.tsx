import React, { useState, useEffect } from 'react';
import { DeliveryOrder } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Truck,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  RefreshCw,
} from 'lucide-react';

export const DeliveryManager: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryOrder | null>(null);
  const [driverNameInput, setDriverNameInput] = useState<string>('');
  const [driverPhoneInput, setDriverPhoneInput] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('OUT_FOR_DELIVERY');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDeliveries();
      setDeliveries(data);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingDelivery) return;
    try {
      await api.updateDeliveryStatus(editingDelivery.id, {
        status: selectedStatus,
        driverName: driverNameInput || undefined,
        driverPhone: driverPhoneInput || undefined,
      });
      setEditingDelivery(null);
      await loadDeliveries();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث حالة التوصيل');
    }
  };

  const filtered = deliveries.filter((d) => activeFilter === 'ALL' || d.status === activeFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'PREPARING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-purple-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <Truck className="w-5 h-5 text-purple-500" />
            <span>إدارة ومتابعة طلبات التوصيل (Livraison)</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'NEW', label: 'جديدة' },
              { id: 'PREPARING', label: 'قيد التحضير' },
              { id: 'OUT_FOR_DELIVERY', label: 'مع السائق' },
              { id: 'DELIVERED', label: 'تم التسليم' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                  activeFilter === f.id
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={loadDeliveries}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Deliveries Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-3">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
            <Truck className="w-12 h-12 stroke-[1.2] mb-2" />
            <p className="text-sm font-bold">لا توجد طلبات توصيل مطابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm font-bold text-amber-400 block">
                      {d.orderNumber}
                    </span>
                    <span className="text-xs font-bold text-neutral-200">
                      {d.customerName || 'زبون'}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(d.status)}`}>
                    {d.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-neutral-300">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{d.customerPhone || '—'}</span>
                  </div>

                  <div className="flex items-start gap-1.5 text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{d.deliveryAddress}</span>
                  </div>

                  {d.driverName && (
                    <div className="flex items-center gap-1.5 text-neutral-400 pt-1">
                      <User className="w-3.5 h-3.5" />
                      <span>السائق: {d.driverName} ({d.driverPhone || '—'})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                  <div className="font-mono font-bold text-amber-400 text-sm">
                    {Number(d.orderTotal || 0).toLocaleString()} DA
                  </div>

                  <button
                    onClick={() => {
                      setEditingDelivery(d);
                      setDriverNameInput(d.driverName || '');
                      setDriverPhoneInput(d.driverPhone || '');
                      setSelectedStatus(d.status);
                    }}
                    className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded-lg text-xs font-bold transition active:scale-95"
                  >
                    تحديث الحالة / السائق
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {editingDelivery && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-purple-400">
                تحديث التوصيل: {editingDelivery.orderNumber}
              </h3>
              <button onClick={() => setEditingDelivery(null)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">حالة التوصيل:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                >
                  <option value="NEW">جديد (New)</option>
                  <option value="PREPARING">قيد التحضير في المطبخ</option>
                  <option value="OUT_FOR_DELIVERY">خرج للتوصيل مع السائق</option>
                  <option value="DELIVERED">تم التسليم بنجاح (Livré)</option>
                  <option value="CANCELLED">ملغى (Annulé)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">اسم السائق (Livreur):</label>
                <input
                  type="text"
                  value={driverNameInput}
                  onChange={(e) => setDriverNameInput(e.target.value)}
                  placeholder="مثال: يوسف"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">رقم هاتف السائق:</label>
                <input
                  type="tel"
                  value={driverPhoneInput}
                  onChange={(e) => setDriverPhoneInput(e.target.value)}
                  placeholder="0661223344"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateStatus}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl active:scale-95 transition"
            >
              حفظ وتحديث
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
