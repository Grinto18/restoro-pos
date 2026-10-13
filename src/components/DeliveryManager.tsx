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
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PREPARING':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <Truck className="w-6 h-6 text-blue-600" />
            <span>إدارة ومتابعة طلبات التوصيل (Livraison)</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
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
                className={`px-4 py-2.5 rounded-xl text-sm font-black transition active:scale-95 cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={loadDeliveries}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer"
          title="تحديث"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Deliveries Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-4">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Truck className="w-16 h-16 stroke-[1.5] mb-2 text-slate-300" />
            <p className="text-lg font-black text-slate-600">لا توجد طلبات توصيل مطابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="bg-white border-2 border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-black text-xl text-black block">
                      {d.orderNumber}
                    </span>
                    <span className="text-sm font-black text-blue-700">
                      {d.customerName || 'زبون عام'}
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-black border ${getStatusColor(d.status)}`}>
                    {d.status === 'DELIVERED'
                      ? 'تم التسليم'
                      : d.status === 'OUT_FOR_DELIVERY'
                      ? 'مع السائق'
                      : d.status === 'PREPARING'
                      ? 'قيد التحضير'
                      : d.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2 text-blue-700 font-mono">
                    <Phone className="w-4 h-4" />
                    <span>{d.customerPhone || '—'}</span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-800">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{d.deliveryAddress}</span>
                  </div>

                  {d.driverName && (
                    <div className="flex items-center gap-2 text-slate-600 pt-1">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>السائق: {d.driverName} ({d.driverPhone || '—'})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="font-black text-blue-700 text-2xl">
                    {Number(d.orderTotal || 0).toLocaleString()} <span className="text-sm text-slate-600">DA</span>
                  </div>

                  <button
                    onClick={() => {
                      setEditingDelivery(d);
                      setDriverNameInput(d.driverName || '');
                      setDriverPhoneInput(d.driverPhone || '');
                      setSelectedStatus(d.status);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition active:scale-95 shadow cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-xl text-black">
                تحديث التوصيل: {editingDelivery.orderNumber}
              </h3>
              <button onClick={() => setEditingDelivery(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-sm font-bold">
              <div>
                <label className="block text-slate-700 mb-1">حالة التوصيل:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                >
                  <option value="NEW">جديد (New)</option>
                  <option value="PREPARING">قيد التحضير في المطبخ</option>
                  <option value="OUT_FOR_DELIVERY">خرج للتوصيل مع السائق</option>
                  <option value="DELIVERED">تم التسليم بنجاح (Livré)</option>
                  <option value="CANCELLED">ملغى (Annulé)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">اسم السائق (Livreur):</label>
                <input
                  type="text"
                  value={driverNameInput}
                  onChange={(e) => setDriverNameInput(e.target.value)}
                  placeholder="مثال: يوسف"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">رقم هاتف السائق:</label>
                <input
                  type="tel"
                  value={driverPhoneInput}
                  onChange={(e) => setDriverPhoneInput(e.target.value)}
                  placeholder="0661223344"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateStatus}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              حفظ وتحديث
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
