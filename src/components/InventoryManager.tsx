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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <Package className="w-6 h-6 text-blue-600" />
            <span>إدارة المخزون والمواد الأولية (Stock & Ingrédients)</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المواد..."
              className="bg-slate-50 border-2 border-slate-200 rounded-xl pr-9 pl-4 py-2 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>مادة أولية جديدة</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 overflow-hidden flex flex-col mt-4 shadow-sm">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-200 font-black">
              <tr>
                <th className="p-4">المادة الأولية</th>
                <th className="p-4">الوحدة</th>
                <th className="p-4">الرصيد الحالي</th>
                <th className="p-4">الحد الأدنى</th>
                <th className="p-4">تكلفة الوحدة (DA)</th>
                <th className="p-4">المورد المعتمد</th>
                <th className="p-4 text-center">جرد / تسوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold">
              {filtered.map((ing) => {
                const stock = Number(ing.currentStock);
                const min = Number(ing.minStock);
                const isLow = stock <= min;

                return (
                  <tr key={ing.id} className="hover:bg-blue-50/40 transition">
                    <td className="p-4 font-black text-slate-900 text-base">
                      <div>{ing.nameAr}</div>
                      {ing.nameFr && <div className="text-xs text-slate-500 font-semibold">{ing.nameFr}</div>}
                    </td>
                    <td className="p-4 font-mono text-slate-700">{ing.unit}</td>
                    <td className="p-4 font-black text-base">
                      <span className={isLow ? 'text-red-700 bg-red-100 px-3 py-1 rounded-xl border border-red-300' : 'text-emerald-700'}>
                        {stock.toFixed(3)} {ing.unit}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{min.toFixed(3)} {ing.unit}</td>
                    <td className="p-4 font-black text-blue-700 text-base">
                      {Number(ing.costPerUnit).toLocaleString()} DA
                    </td>
                    <td className="p-4 text-slate-700">{ing.supplierName || '—'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setAdjustingIng(ing);
                          setActualQtyInput(String(stock));
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-xl text-black">
                تسوية جرد: {adjustingIng.nameAr}
              </h3>
              <button onClick={() => setAdjustingIng(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-sm font-bold">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700">
                الرصيد المسجل في النظام: <span className="text-blue-700 font-black text-base">{Number(adjustingIng.currentStock)} {adjustingIng.unit}</span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الكمية الفعلية الموجودة (Inventaire Réel):</label>
                <input
                  type="number"
                  step="0.001"
                  value={actualQtyInput}
                  onChange={(e) => setActualQtyInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-emerald-700 font-black text-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">السبب أو الملاحظة:</label>
                <input
                  type="text"
                  value={adjustReasonInput}
                  onChange={(e) => setAdjustReasonInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              onClick={handleExecuteAdjustment}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              تأكيد التسوية
            </button>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">إضافة مادة أولية للمخزن</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 font-bold text-sm">
              <div>
                <label className="block text-slate-700 mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  value={newIngNameAr}
                  onChange={(e) => setNewIngNameAr(e.target.value)}
                  placeholder="مثال: لحم مفروم"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الاسم بالفرنسية</label>
                <input
                  type="text"
                  value={newIngNameFr}
                  onChange={(e) => setNewIngNameFr(e.target.value)}
                  placeholder="Viande hachée"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">الوحدة</label>
                  <select
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                  >
                    <option value="KG">كيلوغرام (KG)</option>
                    <option value="G">غرام (G)</option>
                    <option value="L">لتر (L)</option>
                    <option value="ML">ميليلتر (ML)</option>
                    <option value="PIECE">حبة / علبة (PIECE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الحد الأدنى للتنبيه</label>
                  <input
                    type="number"
                    value={newIngMinStock}
                    onChange={(e) => setNewIngMinStock(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base font-black focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">سعر التكلفة لكل وحدة (DA)</label>
                <input
                  type="number"
                  value={newIngCost}
                  onChange={(e) => setNewIngCost(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-blue-700 text-xl font-black focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">المورد</label>
                <select
                  value={newIngSupplierId}
                  onChange={(e) => setNewIngSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-600"
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
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              حفظ المادة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
