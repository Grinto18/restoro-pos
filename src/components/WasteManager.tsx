import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { AlertOctagon, Plus, Trash2, Calendar, User, DollarSign, X } from 'lucide-react';

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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl text-slate-900">سجل الهدر والتالف (Gestion des Pertes)</h2>
            <p className="text-sm text-slate-500 font-medium">متابعة الفواقد وتلفيات المخزون وتكلفة الهدر في المطبخ</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>تسجيل تالف جديد</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col mt-4">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-base">
            <thead className="bg-slate-900 text-white border-b-2 border-slate-800 font-bold text-lg">
              <tr>
                <th className="p-4">المادة</th>
                <th className="p-4">الكمية التالفة</th>
                <th className="p-4">السبب</th>
                <th className="p-4">قيمة الخسارة (DA)</th>
                <th className="p-4">الموظف المسجل</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {wasteList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-bold text-lg">
                    لا توجد فواقد أو تالف مسجل
                  </td>
                </tr>
              ) : (
                wasteList.map((w) => (
                  <tr key={w.id} className="hover:bg-blue-50/50 transition">
                    <td className="p-4 font-bold text-slate-900 text-lg">{w.name}</td>
                    <td className="p-4 font-mono font-bold text-rose-600 text-lg">
                      {Number(w.quantity)} {w.unit}
                    </td>
                    <td className="p-4">
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg text-sm font-black">
                        {w.reason}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-rose-700 font-extrabold text-xl">
                      {Number(w.cost).toLocaleString()} DA
                    </td>
                    <td className="p-4 text-slate-700">{w.employeeName || '—'}</td>
                    <td className="p-4 text-slate-500 font-mono font-bold">
                      {new Date(w.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{w.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h3 className="font-extrabold text-2xl text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-rose-600" />
                <span>تسجيل مادة تالفة (Perte)</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">اختر من المخزون:</label>
                <select
                  value={selectedIngId}
                  onChange={(e) => handleSelectIngredient(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:border-blue-600 focus:bg-white"
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
                <label className="block text-slate-700 font-bold text-base mb-1">اسم المادة:</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-semibold text-base focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-base mb-1">الكمية:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold text-base focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-base mb-1">الوحدة:</label>
                  <input
                    type="text"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold text-base focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">سبب التلف:</label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:border-blue-600 focus:bg-white"
                >
                  <option value="EXPIRED">منتهي الصلاحية (Périmé)</option>
                  <option value="DAMAGED">تالف أو فاسد (Abîmé)</option>
                  <option value="BURNED">محروق أثناء الطهي (Brûlé)</option>
                  <option value="SPILLED">منسكب أو مهدور (Renversé)</option>
                  <option value="OTHER">أخرى (Autre)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">التكلفة التقديرية (DA):</label>
                <input
                  type="number"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-rose-700 font-mono font-extrabold text-xl focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveWaste}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition mt-2"
            >
              تأكيد وتسجيل الهدر
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
