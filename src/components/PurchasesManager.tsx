import React, { useState, useEffect } from 'react';
import { Supplier, Ingredient } from '../types.ts';
import { api } from '../services/api.ts';
import {
  FileSpreadsheet,
  Plus,
  Users,
  Building,
  Phone,
  Trash2,
  Check,
  X,
  Calendar,
  DollarSign,
  PackageCheck,
} from 'lucide-react';

export const PurchasesManager: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'PURCHASES' | 'SUPPLIERS'>('PURCHASES');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Purchase modal
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseItemsList, setPurchaseItemsList] = useState<
    { ingredientId: number; quantity: string; unitCost: string }[]
  >([]);

  // New Supplier modal
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [supName, setSupName] = useState<string>('');
  const [supContact, setSupContact] = useState<string>('');
  const [supPhone, setSupPhone] = useState<string>('');
  const [supAddress, setSupAddress] = useState<string>('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [p, s, ings] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getInventory(),
      ]);
      setPurchases(p);
      setSuppliers(s);
      setIngredients(ings);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPurchaseItem = () => {
    if (ingredients.length === 0) return;
    setPurchaseItemsList([
      ...purchaseItemsList,
      { ingredientId: ingredients[0].id, quantity: '10', unitCost: String(ingredients[0].costPerUnit) },
    ]);
  };

  const handleSavePurchase = async () => {
    if (!selectedSupplierId || purchaseItemsList.length === 0) {
      alert('يرجى اختيار المورد وإضافة بند واحد على الأقل');
      return;
    }

    try {
      await api.createPurchase({
        supplierId: Number(selectedSupplierId),
        invoiceDate,
        items: purchaseItemsList.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: parseFloat(item.quantity) || 0,
          unitCost: parseFloat(item.unitCost) || 0,
        })),
      });
      setShowPurchaseModal(false);
      setPurchaseItemsList([]);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ فاتورة الشراء');
    }
  };

  const handleSaveSupplier = async () => {
    if (!supName.trim()) return;
    try {
      await api.createSupplier({
        name: supName.trim(),
        contactPerson: supContact.trim() || null,
        phone: supPhone.trim() || null,
        address: supAddress.trim() || null,
      });
      setShowSupplierModal(false);
      setSupName('');
      setSupContact('');
      setSupPhone('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة المورد');
    }
  };

  const totalPurchaseCalc = purchaseItemsList.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitCost) || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-4 select-none">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-extrabold text-xl text-slate-900 flex items-center gap-2.5 pl-4 border-l-2 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span>المشتريات والموردين (Achats & Fournisseurs)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('PURCHASES')}
              className={`px-5 py-2 rounded-lg font-bold text-base transition-all ${
                activeSubTab === 'PURCHASES'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فواتير الشراء
            </button>
            <button
              onClick={() => setActiveSubTab('SUPPLIERS')}
              className={`px-5 py-2 rounded-lg font-bold text-base transition-all ${
                activeSubTab === 'SUPPLIERS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دليل الموردين
            </button>
          </div>
        </div>

        {activeSubTab === 'PURCHASES' ? (
          <button
            onClick={() => {
              setSelectedSupplierId(suppliers[0]?.id ? String(suppliers[0].id) : '');
              setPurchaseItemsList([]);
              setShowPurchaseModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>تسجيل فاتورة شراء (Saisie Achat)</span>
          </button>
        ) : (
          <button
            onClick={() => setShowSupplierModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>مورد جديد</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col mt-4">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          {activeSubTab === 'PURCHASES' ? (
            <table className="w-full text-right text-base">
              <thead className="bg-slate-900 text-white border-b-2 border-slate-800 font-bold text-lg">
                <tr>
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">المورد</th>
                  <th className="p-4">المبلغ الإجمالي (DA)</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">المستلم</th>
                  <th className="p-4">البنود المشتراة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-bold text-lg">
                      لا توجد فواتير مشتريات مسجلة
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 transition">
                      <td className="p-4 font-mono font-bold text-blue-600">{p.purchaseNumber}</td>
                      <td className="p-4 font-bold text-slate-900">{p.supplierName}</td>
                      <td className="p-4 font-mono font-black text-blue-700 text-lg">
                        {Number(p.totalAmount).toLocaleString()} DA
                      </td>
                      <td className="p-4 font-mono text-slate-600 font-bold">{p.invoiceDate}</td>
                      <td className="p-4 text-slate-700">{p.receivedByName || '—'}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {p.items?.map((it: any) => `${it.ingredientName}: ${it.quantity}`).join(' • ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-right text-base">
              <thead className="bg-slate-900 text-white border-b-2 border-slate-800 font-bold text-lg">
                <tr>
                  <th className="p-4">المورد</th>
                  <th className="p-4">الشخص المسؤول</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">العنوان</th>
                  <th className="p-4">الرصيد (DA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400 font-bold text-lg">
                      لا يوجد موردين مسجلين
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-blue-50/50 transition">
                      <td className="p-4 font-bold text-slate-900">{s.name}</td>
                      <td className="p-4 text-slate-700">{s.contactPerson || '—'}</td>
                      <td className="p-4 font-mono text-blue-600 font-bold">{s.phone || '—'}</td>
                      <td className="p-4 text-slate-600">{s.address || '—'}</td>
                      <td className="p-4 font-mono font-black text-slate-900 text-lg">
                        {Number(s.balance).toLocaleString()} DA
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h3 className="font-extrabold text-2xl text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-7 h-7 text-blue-600" />
                <span>فاتورة مشتريات جديدة (تزيد المخزون)</span>
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-base mb-1.5">المورد *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-base mb-1.5">تاريخ الفاتورة</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-lg">المواد المشتراة:</span>
                <button
                  onClick={handleAddPurchaseItem}
                  className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3.5 py-1.5 rounded-xl text-sm font-black transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مادة</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                {purchaseItemsList.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    اضغط "إضافة مادة" لإدراج المواد المشتراة
                  </div>
                ) : (
                  purchaseItemsList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border-2 border-slate-200"
                    >
                      <select
                        value={item.ingredientId}
                        onChange={(e) => {
                          const updated = [...purchaseItemsList];
                          updated[idx].ingredientId = Number(e.target.value);
                          setPurchaseItemsList(updated);
                        }}
                        className="flex-1 bg-white border-2 border-slate-200 rounded-lg p-2 text-slate-900 font-bold text-sm focus:border-blue-600"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.nameAr} ({ing.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...purchaseItemsList];
                          updated[idx].quantity = e.target.value;
                          setPurchaseItemsList(updated);
                        }}
                        className="w-24 bg-white border-2 border-slate-200 rounded-lg p-2 text-center font-mono font-bold text-sm text-slate-900 focus:border-blue-600"
                      />

                      <input
                        type="number"
                        placeholder="السعر الفردي"
                        value={item.unitCost}
                        onChange={(e) => {
                          const updated = [...purchaseItemsList];
                          updated[idx].unitCost = e.target.value;
                          setPurchaseItemsList(updated);
                        }}
                        className="w-28 bg-white border-2 border-slate-200 rounded-lg p-2 text-center font-mono font-extrabold text-sm text-blue-700 focus:border-blue-600"
                      />

                      <button
                        onClick={() => {
                          setPurchaseItemsList(purchaseItemsList.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 flex items-center justify-between">
              <span className="text-base text-blue-900 font-bold">الإجمالي النهائي:</span>
              <span className="text-3xl font-black text-blue-700 font-mono">
                {totalPurchaseCalc.toLocaleString()} DA
              </span>
            </div>

            <button
              onClick={handleSavePurchase}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition"
            >
              تأكيد وإدخال للمخزون
            </button>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h3 className="font-extrabold text-2xl text-slate-900 flex items-center gap-2">
                <Building className="w-6 h-6 text-blue-600" />
                <span>إضافة مورد جديد</span>
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">اسم المؤسسة أو المورد *</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="مؤسسة اللحوم والأسماك"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-semibold text-base focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">الشخص المسؤول (Contact):</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  placeholder="السيد كمال"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-semibold text-base focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">الهاتف:</label>
                <input
                  type="tel"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="0551223344"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold text-base focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-base mb-1">العنوان:</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="الجزائر العاصمة..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-semibold text-base focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSupplier}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition mt-2"
            >
              حفظ المورد
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
