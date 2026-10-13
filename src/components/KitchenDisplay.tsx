import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  ChefHat,
  Flame,
  GlassWater,
  Cake,
  Clock,
  CheckCircle2,
  RefreshCw,
  Bell,
  Utensils,
  MapPin,
  CheckCheck,
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeStation, setActiveStation] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => {
      if (autoRefresh) loadTickets();
    }, 6000);
    return () => clearInterval(interval);
  }, [activeStation, autoRefresh]);

  const loadTickets = async () => {
    try {
      const data = await api.getKitchenTickets(activeStation);
      setTickets(data);
    } catch (err) {
      console.error('Failed to load kitchen tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: number, nextStatus: string) => {
    try {
      await api.updateKitchenItemStatus(itemId, nextStatus);
      await loadTickets();
    } catch (err) {
      console.error('Failed to update kitchen item:', err);
    }
  };

  const getElapsedMinutes = (dateStr: string) => {
    const elapsed = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(0, elapsed);
  };

  const stations = [
    { id: 'ALL', label: 'الكل (Toutes Stations)', icon: ChefHat },
    { id: 'MAIN_KITCHEN', label: 'المطبخ الرئيسي', icon: ChefHat },
    { id: 'GRILL', label: 'مشاوي وفحم (Grill)', icon: Flame },
    { id: 'DESSERT', label: 'تحلية وحلويات', icon: Cake },
    { id: 'DRINKS', label: 'مشروبات وعصائر', icon: GlassWater },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      {/* Top Controls: Stations & Refresh */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <ChefHat className="w-6 h-6 text-blue-600" />
            <span>شاشة المطبخ (KDS)</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {stations.map((s) => {
              const Icon = s.icon;
              const isSelected = activeStation === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStation(s.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span>تحديث تلقائي</span>
          </label>

          <button
            onClick={loadTickets}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-95 cursor-pointer"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pt-4 no-scrollbar">
        {tickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ChefHat className="w-16 h-16 stroke-[1.5] text-slate-300 mb-3" />
            <h3 className="text-xl font-black text-slate-700">لا توجد طلبات قيد التحضير حالياً</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">ستظهر التذاكر الجديدة تلقائياً عند طلبها من الكاشير</p>
          </div>
        ) : (
          <div className="flex gap-4 h-full pb-2">
            {tickets.map((ticket) => {
              const elapsed = getElapsedMinutes(ticket.createdAt);
              const isUrgent = elapsed > 15;
              const isWarning = elapsed > 8 && !isUrgent;

              return (
                <div
                  key={ticket.id}
                  className={`w-88 h-full flex flex-col rounded-3xl border-2 shadow-md bg-white shrink-0 overflow-hidden ${
                    isUrgent
                      ? 'border-red-400 ring-2 ring-red-200'
                      : isWarning
                      ? 'border-blue-400 ring-2 ring-blue-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-4 border-b-2 flex items-center justify-between text-sm font-black ${
                      isUrgent
                        ? 'bg-red-50 text-red-900 border-red-200'
                        : isWarning
                        ? 'bg-blue-50 text-blue-900 border-blue-200'
                        : 'bg-slate-100 text-slate-900 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-xl font-black text-black block">
                        {ticket.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {ticket.type === 'DINE_IN'
                          ? `طاولة ${ticket.tableNumber || '—'}`
                          : ticket.type === 'DELIVERY'
                          ? 'توصيل منزلي'
                          : 'طلب محمول'}
                      </span>
                    </div>

                    <div className="text-left font-mono">
                      <div className="flex items-center gap-1.5 text-base font-black text-blue-700">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{elapsed} د</span>
                      </div>
                      <span className="text-xs text-slate-500 font-bold">
                        {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 no-scrollbar bg-slate-50/50">
                    {ticket.items?.map((item: any) => {
                      const isReady = item.status === 'READY';
                      const isPreparing = item.status === 'PREPARING';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border-2 transition ${
                            isReady
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 opacity-80'
                              : isPreparing
                              ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-baseline gap-2.5">
                              <span className="font-mono font-black text-lg text-blue-700 bg-blue-100 px-2.5 py-1 rounded-xl border border-blue-200">
                                {item.quantity}×
                              </span>
                              <div>
                                <span className="font-black text-base text-slate-900">{item.nameAr}</span>
                                {item.nameFr && (
                                  <span className="text-xs text-slate-500 font-semibold block">
                                    {item.nameFr}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const next =
                                  item.status === 'NEW'
                                    ? 'PREPARING'
                                    : item.status === 'PREPARING'
                                    ? 'READY'
                                    : 'SERVED';
                                handleUpdateItemStatus(item.id, next);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
                                isReady
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isPreparing
                                  ? 'bg-blue-600 text-white shadow-md animate-pulse'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                              }`}
                            >
                              {isReady ? 'جاهز ✓' : isPreparing ? 'قيد التحضير...' : 'بدء التحضير'}
                            </button>
                          </div>

                          {item.notes && (
                            <div className="mt-2 text-xs text-blue-900 font-extrabold bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200">
                              ملاحظة: {item.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Notes & Actions */}
                  {ticket.notes && (
                    <div className="px-4 py-2.5 bg-slate-100 border-t-2 border-slate-200 text-xs font-bold text-slate-700">
                      ملاحظة عامة: {ticket.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
