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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-yellow-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <Receipt className="w-5 h-5 text-yellow-500" />
            <span>المصاريف والنفقات (Charges)</span>
          </div>

          <div className="font-mono text-xs bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800 text-neutral-300">
            الإجمالي: <span className="font-bold text-yellow-400">{totalExpenses.toLocaleString()} DA</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>مصروف جديد</span>
        </button>
      </div>

      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col mt-3">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
              <tr>
                <th className="p-3">الفئة</th>
                <th className="p-3">البيان والتفاصيل</th>
                <th className="p-3">المبلغ (DA)</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-800/50 transition">
                  <td className="p-3">
                    <span className="bg-yellow-950/60 text-yellow-300 border border-yellow-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-neutral-100">{e.description}</td>
                  <td className="p-3 font-mono font-bold text-yellow-400 text-sm">
                    {Number(e.amount).toLocaleString()} DA
                  </td>
                  <td className="p-3 font-mono text-neutral-400">{e.date}</td>
                  <td className="p-3 text-neutral-300">{e.userName || '—'}</td>
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
              <h3 className="font-bold text-sm text-yellow-400">تسجيل مصروف جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">نوع المصروف:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
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
                <label className="block text-neutral-400 mb-1">المبلغ بالدينار (DA) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثال: 4500"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-amber-300 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">البيان / الوصف *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء سونلغاز لشهر سبتمبر"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleAddExpense}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              حفظ المصروف
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
