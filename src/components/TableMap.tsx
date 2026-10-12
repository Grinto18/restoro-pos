import React, { useState, useEffect } from 'react';
import { RestaurantTable } from '../types.ts';
import { usePos } from '../context/PosContext.tsx';
import { api } from '../services/api.ts';
import {
  Grid,
  Plus,
  RefreshCw,
  Users,
  MoveRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

interface TableMapProps {
  onSelectTableForOrder: (table: RestaurantTable) => void;
}

export const TableMap: React.FC<TableMapProps> = ({ onSelectTableForOrder }) => {
  const { setSelectedTable, setOrderType } = usePos();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeZone, setActiveZone] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Transfer modal
  const [transferFromTable, setTransferFromTable] = useState<RestaurantTable | null>(null);
  const [transferToTableId, setTransferToTableId] = useState<number | null>(null);

  // Add Table modal
  const [showAddTableModal, setShowAddTableModal] = useState<boolean>(false);
  const [newTableNum, setNewTableNum] = useState<string>('');
  const [newTableZone, setNewTableZone] = useState<string>('الصالة الرئيسية');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTables();
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const zones = ['ALL', ...Array.from(new Set(tables.map((t) => t.zone)))];

  const filteredTables = tables.filter((t) => activeZone === 'ALL' || t.zone === activeZone);

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    setOrderType('DINE_IN');
    onSelectTableForOrder(table);
  };

  const handleExecuteTransfer = async () => {
    if (!transferFromTable || !transferToTableId) return;
    try {
      await api.transferTable(transferFromTable.id, transferToTableId);
      setTransferFromTable(null);
      setTransferToTableId(null);
      await loadTables();
    } catch (err: any) {
      alert(err.message || 'فشل نقل الطاولة');
    }
  };

  const handleAddTable = async () => {
    if (!newTableNum.trim()) return;
    try {
      await api.createTable({
        tableNumber: newTableNum.trim(),
        zone: newTableZone,
        capacity: newTableCapacity,
      });
      setShowAddTableModal(false);
      setNewTableNum('');
      await loadTables();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الطاولة');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">مشغولة</span>;
      case 'RESERVED':
        return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded text-[10px] font-bold">محجوزة</span>;
      case 'CLEANING':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] font-bold">تنظيف</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">متاحة</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      {/* Top Controls: Zones & Actions */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5 pl-2 border-l border-neutral-800">
            <Grid className="w-5 h-5 text-amber-500" />
            <span>خريطة الصالة (Plan de Salle)</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setActiveZone(z)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                  activeZone === z
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                {z === 'ALL' ? 'جميع المناطق' : z}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddTableModal(true)}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 px-3 py-1.5 rounded-xl border border-neutral-700 text-xs font-bold transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طاولة</span>
          </button>

          <button
            onClick={loadTables}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition active:scale-95"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-6">
          {filteredTables.map((table) => {
            const isOccupied = table.status === 'OCCUPIED';
            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-4 rounded-2xl border flex flex-col justify-between h-40 transition-all cursor-pointer relative shadow-lg active:scale-[0.98] ${
                  isOccupied
                    ? 'bg-gradient-to-b from-red-950/70 to-neutral-900 border-red-700/60 hover:border-red-500'
                    : table.status === 'RESERVED'
                    ? 'bg-gradient-to-b from-sky-950/70 to-neutral-900 border-sky-700/60 hover:border-sky-500'
                    : 'bg-gradient-to-b from-neutral-900 to-neutral-900/90 border-neutral-800 hover:border-amber-500/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-2xl font-black text-neutral-100">
                    {table.tableNumber}
                  </span>
                  {getStatusBadge(table.status)}
                </div>

                <div>
                  <div className="text-xs text-neutral-400 font-semibold">{table.zone}</div>
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.capacity} مقاعد</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTableClick(table);
                    }}
                    className="text-xs text-amber-400 font-bold hover:underline"
                  >
                    {isOccupied ? 'فتح الطلب' : '+ طلب جديد'}
                  </button>

                  {isOccupied && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransferFromTable(table);
                      }}
                      className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded border border-neutral-700 flex items-center gap-1"
                      title="نقل الطلب لطاولة أخرى"
                    >
                      <MoveRight className="w-3 h-3" />
                      <span>نقل</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transfer Table Modal */}
      {transferFromTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-cyan-400">
                نقل الطلب من الطاولة {transferFromTable.tableNumber}
              </h3>
              <button
                onClick={() => setTransferFromTable(null)}
                className="p-1 rounded bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">اختر الطاولة الهدف:</label>
              <select
                value={transferToTableId || ''}
                onChange={(e) => setTransferToTableId(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 text-sm font-bold"
              >
                <option value="">-- اختر طاولة شاغرة --</option>
                {tables
                  .filter((t) => t.id !== transferFromTable.id && t.status === 'AVAILABLE')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      الطاولة {t.tableNumber} ({t.zone})
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleExecuteTransfer}
              disabled={!transferToTableId}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold text-xs rounded-lg active:scale-95 transition"
            >
              تأكيد نقل الطلب
            </button>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-amber-400">إضافة طاولة جديدة</h3>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="p-1 rounded bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">رقم أو اسم الطاولة:</label>
                <input
                  type="text"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="مثال: T21 أو VIP3"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">المنطقة:</label>
                <input
                  type="text"
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value)}
                  placeholder="الصالة الرئيسية، الشرفة..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">السعة (عدد المقاعد):</label>
                <input
                  type="number"
                  min="1"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleAddTable}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg active:scale-95 transition"
            >
              حفظ الطاولة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
