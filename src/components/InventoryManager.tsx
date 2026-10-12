import React, { useState, useEffect } from 'react';
import { Ingredient, Supplier } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Package,
  Plus,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Adjustment modal
  const [adjustingIng, setAdjustingIng] = useState<Ingredient | null>(null);
  const [actualQtyInput, setActualQtyInput] = useState<string>('');
  const [adjustReasonInput, setAdjustReasonInput] = useState<string>('جرد دوري');

  // New Ingredient modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newIngNameAr, setNewIngNameAr] = useState<string>('');
  const [newIngNameFr, setNewIngNameFr] = useState<string>('');
  const [newIngUnit, setNewIngUnit] = useState<string>('KG');
  const [newIngMinStock, setNewIngMinStock] = useState<string>('5');
  const [newIngCost, setNewIngCost] = useState<string>('500');
  const [newIngSupplierId, setNewIngSupplierId] = useState<string>('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [ings, sups] = await Promise.all([api.getInventory(), api.getSuppliers()]);
      setIngredients(ings);
      setSuppliers(sups);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAdjustment = async () => {
    if (!adjustingIng || actualQtyInput === '') return;
    try {
      await api.adjustStock({
        ingredientId: adjustingIng.id,
        actualQuantity: parseFloat(actualQtyInput),
        reason: adjustReasonInput,
      });
      setAdjustingIng(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل تسوية المخزون');
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngNameAr.trim()) return;
    try {
      await api.createIngredient({
        nameAr: newIngNameAr.trim(),
        nameFr: newIngNameFr.trim() || null,
        unit: newIngUnit,
        minStock: parseFloat(newIngMinStock) || 1,
        costPerUnit: parseFloat(newIngCost) || 0,
        supplierId: newIngSupplierId ? Number(newIngSupplierId) : null,
      });
      setShowAddModal(false);
      setNewIngNameAr('');
      setNewIngNameFr('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة المادة');
    }
  };

  const filtered = ingredients.filter(
    (i) =>
      i.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      (i.nameFr && i.nameFr.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <Package className="w-5 h-5 text-amber-500" />
            <span>إدارة المخزون والمواد الأولية</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المواد..."
              className="bg-neutral-950 border border-neutral-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>مادة أولية جديدة</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col mt-3">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
              <tr>
                <th className="p-3">المادة الأولية</th>
                <th className="p-3">الوحدة</th>
                <th className="p-3">الرصيد الحالي</th>
                <th className="p-3">الحد الأدنى</th>
                <th className="p-3">تكلفة الوحدة (DA)</th>
                <th className="p-3">المورد المعتمد</th>
                <th className="p-3 text-center">جرد / تسوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium">
              {filtered.map((ing) => {
                const stock = Number(ing.currentStock);
                const min = Number(ing.minStock);
                const isLow = stock <= min;

                return (
                  <tr key={ing.id} className="hover:bg-neutral-800/50 transition">
                    <td className="p-3 font-bold text-neutral-100">
                      <div>{ing.nameAr}</div>
                      {ing.nameFr && <div className="text-[10px] text-neutral-400">{ing.nameFr}</div>}
                    </td>
                    <td className="p-3 font-mono text-neutral-300">{ing.unit}</td>
                    <td className="p-3 font-mono font-bold text-sm">
                      <span className={isLow ? 'text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/60' : 'text-emerald-400'}>
                        {stock.toFixed(3)} {ing.unit}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-neutral-400">{min.toFixed(3)} {ing.unit}</td>
                    <td className="p-3 font-mono text-amber-300 font-bold">
                      {Number(ing.costPerUnit).toLocaleString()} DA
                    </td>
                    <td className="p-3 text-neutral-300">{ing.supplierName || '—'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setAdjustingIng(ing);
                          setActualQtyInput(String(stock));
                        }}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-lg text-[11px] font-bold"
                      >
                        جرد وتسوية
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {adjustingIng && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-cyan-400">
                تسوية جرد: {adjustingIng.nameAr}
              </h3>
              <button onClick={() => setAdjustingIng(null)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-neutral-950 rounded-lg text-neutral-400 font-mono">
                الرصيد المسجل في النظام: <span className="text-amber-400 font-bold">{Number(adjustingIng.currentStock)} {adjustingIng.unit}</span>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الكمية الفعلية الموجودة (Inventaire Réel):</label>
                <input
                  type="number"
                  step="0.001"
                  value={actualQtyInput}
                  onChange={(e) => setActualQtyInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono font-bold text-base text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">السبب أو الملاحظة:</label>
                <input
                  type="text"
                  value={adjustReasonInput}
                  onChange={(e) => setAdjustReasonInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>
            </div>

            <button
              onClick={handleExecuteAdjustment}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              تأكيد التسوية
            </button>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-amber-400">إضافة مادة أولية للمخزن</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  value={newIngNameAr}
                  onChange={(e) => setNewIngNameAr(e.target.value)}
                  placeholder="مثال: لحم مفروم"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الاسم بالفرنسية</label>
                <input
                  type="text"
                  value={newIngNameFr}
                  onChange={(e) => setNewIngNameFr(e.target.value)}
                  placeholder="Viande hachée"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1">الوحدة</label>
                  <select
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                  >
                    <option value="KG">كيلوغرام (KG)</option>
                    <option value="G">غرام (G)</option>
                    <option value="L">لتر (L)</option>
                    <option value="ML">ميليلتر (ML)</option>
                    <option value="PIECE">حبة / علبة (PIECE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">الحد الأدنى للتنبيه</label>
                  <input
                    type="number"
                    value={newIngMinStock}
                    onChange={(e) => setNewIngMinStock(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">سعر التكلفة لكل وحدة (DA)</label>
                <input
                  type="number"
                  value={newIngCost}
                  onChange={(e) => setNewIngCost(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono text-amber-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">المورد</label>
                <select
                  value={newIngSupplierId}
                  onChange={(e) => setNewIngSupplierId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                >
                  <option value="">-- اختياري --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddIngredient}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              حفظ المادة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
