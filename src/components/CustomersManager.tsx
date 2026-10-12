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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-teal-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <Users className="w-5 h-5 text-teal-500" />
            <span>إدارة الزبائن (Fichier Clients)</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف..."
              className="bg-neutral-950 border border-neutral-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-500 hover:bg-teal-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>زبون جديد</span>
        </button>
      </div>

      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col mt-3">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
              <tr>
                <th className="p-3">اسم الزبون</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">العنوان</th>
                <th className="p-3">ملاحظات</th>
                <th className="p-3">عدد الطلبات</th>
                <th className="p-3">إجمالي الاستهلاك</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-800/50 transition">
                  <td className="p-3 font-bold text-neutral-100">{c.name}</td>
                  <td className="p-3 font-mono text-cyan-400">{c.phone}</td>
                  <td className="p-3 text-neutral-300">{c.address || '—'}</td>
                  <td className="p-3 text-neutral-400">{c.notes || '—'}</td>
                  <td className="p-3 font-mono font-bold text-neutral-200">{c.totalOrders}</td>
                  <td className="p-3 font-mono font-bold text-amber-400">
                    {Number(c.totalSpent).toLocaleString()} DA
                  </td>
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
              <h3 className="font-bold text-sm text-teal-400">إضافة زبون جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="كمال قادري"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0791223344"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">العنوان</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="شارع بلهوشات..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="زبون دائم..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              حفظ الزبون
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
