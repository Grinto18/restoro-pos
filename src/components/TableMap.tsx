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
        return <span className="bg-red-100 text-red-700 border border-red-300 px-2.5 py-1 rounded-xl text-xs font-black">مشغولة</span>;
      case 'RESERVED':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-xl text-xs font-black">محجوزة</span>;
      case 'CLEANING':
        return <span className="bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-xl text-xs font-black">تنظيف</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl text-xs font-black">متاحة</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      {/* Top Controls: Zones & Actions */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <Grid className="w-6 h-6 text-blue-600" />
            <span>خريطة الصالة (Plan de Salle)</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setActiveZone(z)}
                className={`px-4 py-2.5 rounded-xl text-sm font-black transition active:scale-95 cursor-pointer ${
                  activeZone === z
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                {z === 'ALL' ? 'جميع المناطق' : z}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddTableModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black transition active:scale-95 shadow cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>إضافة طاولة</span>
          </button>

          <button
            onClick={loadTables}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition active:scale-95 cursor-pointer"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tables Grid (Large Cards with 28-32px table labels) */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
          {filteredTables.map((table) => {
            const isOccupied = table.status === 'OCCUPIED';
            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-5 rounded-3xl border-2 flex flex-col justify-between h-44 transition-all cursor-pointer relative shadow-sm hover:shadow-md active:scale-[0.98] ${
                  isOccupied
                    ? 'bg-red-50/70 border-red-300 hover:border-red-500'
                    : table.status === 'RESERVED'
                    ? 'bg-blue-50/70 border-blue-300 hover:border-blue-500'
                    : 'bg-white border-slate-200 hover:border-blue-500 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl font-black text-black">
                    {table.tableNumber}
                  </span>
                  {getStatusBadge(table.status)}
                </div>

                <div>
                  <div className="text-sm text-slate-600 font-extrabold">{table.zone}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-bold">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{table.capacity} مقاعد</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTableClick(table);
                    }}
                    className="text-sm text-blue-700 font-black hover:underline"
                  >
                    {isOccupied ? 'فتح الطلب' : '+ طلب جديد'}
                  </button>

                  {isOccupied && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransferFromTable(table);
                      }}
                      className="text-xs bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 flex items-center gap-1 font-black shadow-sm"
                      title="نقل الطلب لطاولة أخرى"
                    >
                      <MoveRight className="w-3.5 h-3.5 text-blue-600" />
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-xl text-black">
                نقل الطلب من الطاولة {transferFromTable.tableNumber}
              </h3>
              <button
                onClick={() => setTransferFromTable(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">اختر الطاولة الهدف:</label>
              <select
                value={transferToTableId || ''}
                onChange={(e) => setTransferToTableId(Number(e.target.value))}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base font-black focus:outline-none focus:border-blue-600"
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
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black text-lg rounded-xl active:scale-95 transition shadow-lg cursor-pointer"
            >
              تأكيد نقل الطلب
            </button>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">إضافة طاولة جديدة</h3>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">رقم أو اسم الطاولة:</label>
                <input
                  type="text"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="مثال: T21 أو VIP3"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-lg font-black focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">المنطقة:</label>
                <input
                  type="text"
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value)}
                  placeholder="الصالة الرئيسية، الشرفة..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">السعة (عدد المقاعد):</label>
                <input
                  type="number"
                  min="1"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-lg font-black focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              onClick={handleAddTable}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              حفظ الطاولة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
