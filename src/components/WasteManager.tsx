import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { AlertTriangle, Plus, Trash2, Calendar, User, DollarSign, X } from 'lucide-react';

export const WasteManager: React.FC = () => {
  const [wasteList, setWasteList] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [selectedIngId, setSelectedIngId] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [qtyInput, setQtyInput] = useState<string>('1');
  const [unitInput, setUnitInput] = useState<string>('KG');
  const [costInput, setCostInput] = useState<string>('0');
  const [reasonInput, setReasonInput] = useState<string>('EXPIRED');
  const [notesInput, setNotesInput] = useState<string>('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [w, ings] = await Promise.all([api.getWasteRecords(), api.getInventory()]);
      setWasteList(w);
      setIngredients(ings);
    } catch (err) {
      console.error('Failed to load waste records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectIngredient = (ingIdStr: string) => {
    setSelectedIngId(ingIdStr);
    const ing = ingredients.find((i) => i.id === Number(ingIdStr));
    if (ing) {
      setNameInput(ing.nameAr);
      setUnitInput(ing.unit);
      setCostInput(String(Number(ing.costPerUnit) * (parseFloat(qtyInput) || 1)));
    }
  };

  const handleSaveWaste = async () => {
    if (!nameInput || !qtyInput) return;
    try {
      await api.recordWaste({
        ingredientId: selectedIngId ? Number(selectedIngId) : null,
        name: nameInput,
        quantity: parseFloat(qtyInput),
        unit: unitInput,
        cost: parseFloat(costInput) || 0,
        reason: reasonInput,
        notes: notesInput,
      });
      setShowAddModal(false);
      setNameInput('');
      setSelectedIngId('');
      setNotesInput('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل التالف');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="font-bold text-sm text-red-400 flex items-center gap-1.5">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span>سجل الهدر والتالف (Gestion des Pertes)</span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل تالف جديد</span>
        </button>
      </div>

      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col mt-3">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
              <tr>
                <th className="p-3">المادة</th>
                <th className="p-3">الكمية التالفة</th>
                <th className="p-3">السبب</th>
                <th className="p-3">قيمة الخسارة (DA)</th>
                <th className="p-3">الموظف المسجل</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium">
              {wasteList.map((w) => (
                <tr key={w.id} className="hover:bg-neutral-800/50 transition">
                  <td className="p-3 font-bold text-neutral-100">{w.name}</td>
                  <td className="p-3 font-mono font-bold text-red-400">
                    {Number(w.quantity)} {w.unit}
                  </td>
                  <td className="p-3">
                    <span className="bg-red-950/60 text-red-300 border border-red-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                      {w.reason}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-amber-300 font-bold">
                    {Number(w.cost).toLocaleString()} DA
                  </td>
                  <td className="p-3 text-neutral-300">{w.employeeName || '—'}</td>
                  <td className="p-3 text-neutral-400 font-mono">
                    {new Date(w.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-3 text-neutral-400 text-[11px]">{w.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-red-400">تسجيل مادة تالفة (Perte)</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">اختر من المخزون:</label>
                <select
                  value={selectedIngId}
                  onChange={(e) => handleSelectIngredient(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                >
                  <option value="">-- أو اكتب يدوياً أدناه --</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">اسم المادة:</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1">الكمية:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">الوحدة:</label>
                  <input
                    type="text"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">سبب التلف:</label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                >
                  <option value="EXPIRED">منتهي الصلاحية (Périmé)</option>
                  <option value="DAMAGED">تالف أو فاسد (Abîmé)</option>
                  <option value="BURNED">محروق أثناء الطهي (Brûlé)</option>
                  <option value="SPILLED">منسكب أو مهدور (Renversé)</option>
                  <option value="OTHER">أخرى (Autre)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">التكلفة التقديرية (DA):</label>
                <input
                  type="number"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono text-red-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>
            </div>

            <button
              onClick={handleSaveWaste}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl active:scale-95 transition"
            >
              تأكيد وتسجيل الهدر
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
