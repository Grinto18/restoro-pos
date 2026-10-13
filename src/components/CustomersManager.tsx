import React, { useState, useEffect } from 'react';
import { Customer } from '../types.ts';
import { api } from '../services/api.ts';
import { Users, Plus, Phone, MapPin, Search, X } from 'lucide-react';

export const CustomersManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleAdd = async () => {
    if (!name || !phone) return;
    try {
      await api.createCustomer({ name, phone, address, notes });
      setShowAddModal(false);
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الزبون');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <Users className="w-6 h-6 text-blue-600" />
            <span>إدارة الزبائن (Fichier Clients)</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف..."
              className="bg-slate-50 border-2 border-slate-200 rounded-xl pr-9 pl-4 py-2 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>زبون جديد</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 overflow-hidden flex flex-col mt-4 shadow-sm">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-200 font-black">
              <tr>
                <th className="p-4">اسم الزبون</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">العنوان</th>
                <th className="p-4">ملاحظات</th>
                <th className="p-4">عدد الطلبات</th>
                <th className="p-4">إجمالي الاستهلاك</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/40 transition">
                  <td className="p-4 font-black text-slate-900 text-base">{c.name}</td>
                  <td className="p-4 font-mono text-blue-700">{c.phone}</td>
                  <td className="p-4 text-slate-600">{c.address || '—'}</td>
                  <td className="p-4 text-slate-500">{c.notes || '—'}</td>
                  <td className="p-4 font-black text-slate-800">{c.totalOrders}</td>
                  <td className="p-4 font-black text-blue-700 text-lg">
                    {Number(c.totalSpent).toLocaleString()} DA
                  </td>
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
              <h3 className="font-black text-2xl text-black">إضافة زبون جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 font-bold text-sm">
              <div>
                <label className="block text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="كمال قادري"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0791223344"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">العنوان</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="شارع بلهوشات..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="زبون دائم..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              حفظ الزبون
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
