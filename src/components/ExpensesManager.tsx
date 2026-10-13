import React, { useState, useEffect } from 'react';
import { Expense } from '../types.ts';
import { usePos } from '../context/PosContext.tsx';
import { api } from '../services/api.ts';
import { Receipt, Plus, DollarSign, Calendar, Tag, X } from 'lucide-react';

export const ExpensesManager: React.FC = () => {
  const { currentShift } = usePos();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('ELECTRICITY');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  };

  const handleAddExpense = async () => {
    if (!amount || !description) return;
    try {
      await api.createExpense({
        category,
        amount: parseFloat(amount),
        description,
        date,
        shiftId: currentShift?.id || null,
      });
      setShowAddModal(false);
      setAmount('');
      setDescription('');
      await loadExpenses();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل المصروف');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>المصاريف والنفقات (Charges)</span>
          </div>

          <div className="text-sm bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 text-slate-800 font-bold">
            الإجمالي: <span className="font-black text-red-600 text-lg">{totalExpenses.toLocaleString()} DA</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>مصروف جديد</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 overflow-hidden flex flex-col mt-4 shadow-sm">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-200 font-black">
              <tr>
                <th className="p-4">الفئة</th>
                <th className="p-4">البيان والتفاصيل</th>
                <th className="p-4">المبلغ (DA)</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">المسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-blue-50/40 transition">
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-xl text-xs font-black">
                      {e.category}
                    </span>
                  </td>
                  <td className="p-4 font-black text-slate-900 text-base">{e.description}</td>
                  <td className="p-4 font-black text-red-600 text-lg">
                    {Number(e.amount).toLocaleString()} DA
                  </td>
                  <td className="p-4 font-mono text-slate-500">{e.date}</td>
                  <td className="p-4 text-slate-700">{e.userName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">تسجيل مصروف جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 font-bold text-sm">
              <div>
                <label className="block text-slate-700 mb-1">نوع المصروف:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                >
                  <option value="ELECTRICITY">كهرباء (Électricité)</option>
                  <option value="GAS">غاز (Gaz)</option>
                  <option value="RENT">إيجار المحل (Loyer)</option>
                  <option value="TRANSPORT">نقل ومحروقات (Transport)</option>
                  <option value="MAINTENANCE">صيانة وإصلاحات (Maintenance)</option>
                  <option value="SUPPLIES">مواد تنظيف واستهلاك (Fournitures)</option>
                  <option value="OTHER">مصاريف متنوعة أخرى (Autre)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">المبلغ بالدينار (DA) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثال: 4500"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-red-600 font-black text-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">البيان / الوصف *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء سونلغاز لشهر سبتمبر"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              onClick={handleAddExpense}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              حفظ المصروف
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
