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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      {/* Top Controls: Stations & Refresh */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <span>نظام شاشة المطبخ (KDS)</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {stations.map((s) => {
              const Icon = s.icon;
              const isSelected = activeStation === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStation(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                    isSelected
                      ? 'bg-orange-500 text-black shadow'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-orange-500 focus:ring-orange-500"
            />
            <span>تحديث تلقائي</span>
          </label>

          <button
            onClick={loadTickets}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pt-4 no-scrollbar">
        {tickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500">
            <ChefHat className="w-16 h-16 stroke-[1.2] text-neutral-700 mb-2" />
            <h3 className="text-base font-bold text-neutral-400">لا توجد طلبات قيد التحضير حالياً</h3>
            <p className="text-xs text-neutral-600">ستظهر التذاكر الجديدة تلقائياً عند طلبها من الكاشير</p>
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
                  className={`w-80 h-full flex flex-col rounded-2xl border shadow-xl bg-neutral-900 shrink-0 overflow-hidden ${
                    isUrgent
                      ? 'border-red-600/80'
                      : isWarning
                      ? 'border-amber-500/80'
                      : 'border-neutral-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3 border-b flex items-center justify-between text-xs font-bold ${
                      isUrgent
                        ? 'bg-red-950/80 text-red-200 border-red-800'
                        : isWarning
                        ? 'bg-amber-950/80 text-amber-200 border-amber-800'
                        : 'bg-neutral-950 text-neutral-200 border-neutral-800'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-base font-black text-amber-400 block">
                        {ticket.orderNumber}
                      </span>
                      <span className="text-[11px] opacity-80">
                        {ticket.type === 'DINE_IN'
                          ? `طاولة ${ticket.tableNumber || '—'}`
                          : ticket.type === 'DELIVERY'
                          ? 'توصيل منزلي'
                          : 'طلب محمول'}
                      </span>
                    </div>

                    <div className="text-left font-mono">
                      <div className="flex items-center gap-1 text-sm font-black">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span>{elapsed} د</span>
                      </div>
                      <span className="text-[10px] opacity-70">
                        {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                    {ticket.items?.map((item: any) => {
                      const isReady = item.status === 'READY';
                      const isPreparing = item.status === 'PREPARING';

                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border transition ${
                            isReady
                              ? 'bg-emerald-950/30 border-emerald-600/50 text-emerald-200 opacity-80'
                              : isPreparing
                              ? 'bg-amber-950/30 border-amber-600/50 text-amber-100'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono font-black text-base text-amber-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                {item.quantity}×
                              </span>
                              <div>
                                <span className="font-bold text-sm">{item.nameAr}</span>
                                {item.nameFr && (
                                  <span className="text-[10px] text-neutral-400 font-normal block">
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
                              className={`px-2 py-1 rounded text-[10px] font-bold transition active:scale-95 ${
                                isReady
                                  ? 'bg-emerald-500 text-black'
                                  : isPreparing
                                  ? 'bg-amber-500 text-black animate-pulse'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                              }`}
                            >
                              {isReady ? 'جاهز ✓' : isPreparing ? 'قيد التحضير...' : 'بدء التحضير'}
                            </button>
                          </div>

                          {item.notes && (
                            <div className="mt-1.5 text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                              ⚠️ {item.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Notes & Actions */}
                  {ticket.notes && (
                    <div className="px-3 py-1.5 bg-neutral-950/80 border-t border-neutral-800 text-xs text-amber-300">
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
