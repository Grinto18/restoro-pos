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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-cyan-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
            <span>المشتريات والموردين (Achats & Fournisseurs)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveSubTab('PURCHASES')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeSubTab === 'PURCHASES' ? 'bg-cyan-500 text-black shadow' : 'text-neutral-400'
              }`}
            >
              فواتير الشراء (F1)
            </button>
            <button
              onClick={() => setActiveSubTab('SUPPLIERS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeSubTab === 'SUPPLIERS' ? 'bg-cyan-500 text-black shadow' : 'text-neutral-400'
              }`}
            >
              الموردين (F4)
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
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل فاتورة شراء (Saisie Achat)</span>
          </button>
        ) : (
          <button
            onClick={() => setShowSupplierModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>مورد جديد</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col mt-3">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          {activeSubTab === 'PURCHASES' ? (
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">المورد</th>
                  <th className="p-3">المبلغ الإجمالي (DA)</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">المستلم</th>
                  <th className="p-3">البنود المشتراة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-800/50 transition">
                    <td className="p-3 font-mono font-bold text-cyan-400">{p.purchaseNumber}</td>
                    <td className="p-3 font-bold text-neutral-100">{p.supplierName}</td>
                    <td className="p-3 font-mono font-bold text-amber-400 text-sm">
                      {Number(p.totalAmount).toLocaleString()} DA
                    </td>
                    <td className="p-3 font-mono text-neutral-400">{p.invoiceDate}</td>
                    <td className="p-3 text-neutral-300">{p.receivedByName || '—'}</td>
                    <td className="p-3 text-[11px] text-neutral-300">
                      {p.items?.map((it: any) => `${it.ingredientName}: ${it.quantity}`).join(' • ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
                <tr>
                  <th className="p-3">المورد</th>
                  <th className="p-3">الشخص المسؤول</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">العنوان</th>
                  <th className="p-3">الرصيد (DA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-800/50 transition">
                    <td className="p-3 font-bold text-neutral-100">{s.name}</td>
                    <td className="p-3 text-neutral-300">{s.contactPerson || '—'}</td>
                    <td className="p-3 font-mono text-cyan-400">{s.phone || '—'}</td>
                    <td className="p-3 text-neutral-400">{s.address || '—'}</td>
                    <td className="p-3 font-mono font-bold text-neutral-200">
                      {Number(s.balance).toLocaleString()} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-base text-cyan-400">فاتورة مشتريات جديدة (تزيد المخزون)</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">المورد *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">تاريخ الفاتورة</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300">المواد المشتراة:</span>
                <button
                  onClick={handleAddPurchaseItem}
                  className="bg-neutral-800 hover:bg-neutral-700 text-cyan-300 px-2 py-1 rounded text-[11px] font-bold"
                >
                  + إضافة مادة
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {purchaseItemsList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                    <select
                      value={item.ingredientId}
                      onChange={(e) => {
                        const updated = [...purchaseItemsList];
                        updated[idx].ingredientId = Number(e.target.value);
                        setPurchaseItemsList(updated);
                      }}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-1.5 text-neutral-100 text-xs"
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
                      className="w-20 bg-neutral-900 border border-neutral-700 rounded p-1.5 text-center font-mono text-xs text-neutral-100"
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
                      className="w-24 bg-neutral-900 border border-neutral-700 rounded p-1.5 text-center font-mono text-xs text-amber-300 font-bold"
                    />

                    <button
                      onClick={() => {
                        setPurchaseItemsList(purchaseItemsList.filter((_, i) => i !== idx));
                      }}
                      className="p-1 text-red-400 hover:bg-red-950 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between font-mono">
              <span className="text-xs text-neutral-400 font-sans">الإجمالي:</span>
              <span className="text-xl font-black text-amber-400">{totalPurchaseCalc.toLocaleString()} DA</span>
            </div>

            <button
              onClick={handleSavePurchase}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              تأكيد وإدخال للمخزون
            </button>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-cyan-400">إضافة مورد جديد</h3>
              <button onClick={() => setShowSupplierModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">اسم المؤسسة أو المورد *</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="مؤسسة اللحوم والأسماك"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الشخص المسؤول (Contact):</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  placeholder="السيد كمال"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الهاتف:</label>
                <input
                  type="tel"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="0551223344"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">العنوان:</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="الجزائر العاصمة..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSupplier}
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              حفظ المورد
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
