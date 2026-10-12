import React, { useState, useEffect } from 'react';
import { Product, Category, Ingredient } from '../types.ts';
import { api } from '../services/api.ts';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  History,
  Save,
  X,
  Search,
  Check,
  Tag,
  DollarSign,
  Layers,
  ChefHat,
  Package,
} from 'lucide-react';

export const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | 'ALL'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Product modal
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isNewProduct, setIsNewProduct] = useState<boolean>(false);

  // Category modal
  const [showCatModal, setShowCatModal] = useState<boolean>(false);
  const [catNameAr, setCatNameAr] = useState<string>('');
  const [catNameFr, setCatNameFr] = useState<string>('');
  const [catStation, setCatStation] = useState<string>('MAIN_KITCHEN');

  // Price history modal
  const [priceHistoryProd, setPriceHistoryProd] = useState<Product | null>(null);
  const [priceHistoryList, setPriceHistoryList] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [cats, prods, ings] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getInventory(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setIngredients(ings);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailable = async (prodId: number) => {
    try {
      await api.toggleProductAvailability(prodId);
      await loadAll();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleDeleteProduct = async (prodId: number) => {
    if (!confirm('هل أنت متأكد من تعطيل هذا الطبق؟ لن يتم مسح بياناته من الفواتير القديمة.')) return;
    try {
      await api.deleteProduct(prodId);
      await loadAll();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleViewPriceHistory = async (prod: Product) => {
    setPriceHistoryProd(prod);
    try {
      const hist = await api.getProductPriceHistory(prod.id);
      setPriceHistoryList(hist);
    } catch (err) {
      console.error('Failed to load price history:', err);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct.nameAr || !editingProduct.price || !editingProduct.categoryId) {
      alert('يرجى ملء الاسم والسعر والفئة');
      return;
    }

    try {
      if (isNewProduct) {
        await api.createProduct(editingProduct);
      } else {
        await api.updateProduct(editingProduct.id, editingProduct);
      }
      setEditingProduct(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الطبق');
    }
  };

  const handleSaveCategory = async () => {
    if (!catNameAr.trim()) return;
    try {
      await api.createCategory({
        nameAr: catNameAr.trim(),
        nameFr: catNameFr.trim() || null,
        station: catStation,
      });
      setShowCatModal(false);
      setCatNameAr('');
      setCatNameFr('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الفئة');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCatId === 'ALL' || p.categoryId === selectedCatId;
    const matchesSearch =
      search === '' ||
      p.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameFr && p.nameFr.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <span>إدارة قائمة الطعام والأسعار</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في القائمة..."
              className="bg-neutral-950 border border-neutral-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>فئة جديدة</span>
          </button>

          <button
            onClick={() => {
              setIsNewProduct(true);
              setEditingProduct({
                nameAr: '',
                nameFr: '',
                price: '',
                costPrice: '0',
                categoryId: categories[0]?.id || 1,
                station: 'MAIN_KITCHEN',
                barcode: '',
                isAvailable: true,
                variants: [],
                addons: [],
                recipes: [],
              });
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>طبق جديد (Nouveau Plat)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-3 pt-3 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-56 bg-neutral-900 rounded-2xl border border-neutral-800 p-2 overflow-y-auto no-scrollbar shrink-0">
          <div className="font-bold text-xs text-neutral-400 px-2 py-1.5">الفئات (Catégories)</div>
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition mb-1 ${
              selectedCatId === 'ALL'
                ? 'bg-amber-500 text-black shadow'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            جميع الأصناف ({products.length})
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition mb-1 flex items-center justify-between ${
                selectedCatId === c.id
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span>{c.nameAr}</span>
              <span className="text-[10px] opacity-75 font-mono">
                {products.filter((p) => p.categoryId === c.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Products Table */}
        <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 no-scrollbar">
            <table className="w-full text-right text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
                <tr>
                  <th className="p-3">الطبق</th>
                  <th className="p-3">الفئة</th>
                  <th className="p-3">سعر البيع (DA)</th>
                  <th className="p-3">التكلفة (DA)</th>
                  <th className="p-3">المحطة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-800/50 transition">
                    <td className="p-3">
                      <div className="font-bold text-sm text-neutral-100">{p.nameAr}</div>
                      {p.nameFr && <div className="text-[11px] text-neutral-400">{p.nameFr}</div>}
                      {p.barcode && <div className="text-[10px] text-neutral-500 font-mono">#{p.barcode}</div>}
                    </td>
                    <td className="p-3 text-neutral-300">
                      {categories.find((c) => c.id === p.categoryId)?.nameAr || '—'}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400 text-sm">
                      {Number(p.price).toLocaleString()} DA
                    </td>
                    <td className="p-3 font-mono text-neutral-400">
                      {Number(p.costPrice || 0).toLocaleString()} DA
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700">
                        {p.station}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleAvailable(p.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                          p.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {p.isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{p.isAvailable ? 'متوفر' : 'غير متوفر'}</span>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewPriceHistory(p)}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700"
                          title="سجل تعديلات السعر"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setIsNewProduct(false);
                            setEditingProduct({ ...p });
                          }}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40"
                          title="تعطيل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Edit / Add Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-base text-amber-400">
                {isNewProduct ? 'إضافة طبق جديد' : `تعديل: ${editingProduct.nameAr}`}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  value={editingProduct.nameAr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                  placeholder="مثال: شواء مشكل فاخر"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الاسم بالفرنسية</label>
                <input
                  type="text"
                  value={editingProduct.nameFr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameFr: e.target.value })}
                  placeholder="Mixte Grillade"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">سعر البيع (DA) *</label>
                <input
                  type="number"
                  value={editingProduct.price || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  placeholder="1400"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-amber-300 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">تكلفة الإنتاج (DA)</label>
                <input
                  type="number"
                  value={editingProduct.costPrice || '0'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الفئة *</label>
                <select
                  value={editingProduct.categoryId || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: Number(e.target.value) })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">محطة التحضير (Station)</label>
                <select
                  value={editingProduct.station || 'MAIN_KITCHEN'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, station: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                >
                  <option value="MAIN_KITCHEN">المطبخ الرئيسي (Main Kitchen)</option>
                  <option value="GRILL">مشاوي وفحم (Grill)</option>
                  <option value="DESSERT">الحلويات والتحلية (Dessert)</option>
                  <option value="DRINKS">المشروبات والبار (Drinks)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الباركود (Code-barres)</label>
                <input
                  type="text"
                  value={editingProduct.barcode || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                  placeholder="GP-GRL-01"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              {!isNewProduct && (
                <div>
                  <label className="block text-neutral-400 mb-1">سبب تغيير السعر (للتوثيق)</label>
                  <input
                    type="text"
                    value={editingProduct.reasonForPriceChange || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reasonForPriceChange: e.target.value })}
                    placeholder="مثال: زيادة تكلفة المواد الخام"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                  />
                </div>
              )}
            </div>

            {/* Recipe Ingredients Linking Section */}
            <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">مكونات الوصفة وخصم المخزون التلقائي:</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentRecipes = editingProduct.recipes || [];
                    setEditingProduct({
                      ...editingProduct,
                      recipes: [...currentRecipes, { ingredientId: ingredients[0]?.id || 1, quantity: '0.100' }],
                    });
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-1 rounded text-[11px] font-bold"
                >
                  + إضافة مادة للوصفة
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {editingProduct.recipes?.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <select
                      value={r.ingredientId}
                      onChange={(e) => {
                        const updated = [...editingProduct.recipes];
                        updated[idx].ingredientId = Number(e.target.value);
                        setEditingProduct({ ...editingProduct, recipes: updated });
                      }}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-1 text-neutral-200 text-xs"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.nameAr} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.001"
                      value={r.quantity}
                      onChange={(e) => {
                        const updated = [...editingProduct.recipes];
                        updated[idx].quantity = e.target.value;
                        setEditingProduct({ ...editingProduct, recipes: updated });
                      }}
                      className="w-20 bg-neutral-900 border border-neutral-700 rounded p-1 text-center font-mono text-xs text-neutral-100"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.recipes.filter((_: any, i: number) => i !== idx);
                        setEditingProduct({ ...editingProduct, recipes: updated });
                      }}
                      className="p-1 text-red-400 hover:bg-red-950 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Variants (e.g. Sizes: L, XL) */}
            <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">الأحجام والمتغيرات (مثل: حجم L و XL):</span>
                <button
                  type="button"
                  onClick={() => {
                    const cur = editingProduct.variants || [];
                    setEditingProduct({
                      ...editingProduct,
                      variants: [...cur, { nameAr: 'حجم جديد', priceAdjustment: '0' }],
                    });
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-1 rounded text-[11px] font-bold"
                >
                  + إضافة حجم / متغير
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {editingProduct.variants?.map((v: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <input
                      type="text"
                      placeholder="اسم الحجم (مثلاً: حجم XL)"
                      value={v.nameAr || ''}
                      onChange={(e) => {
                        const updated = [...editingProduct.variants];
                        updated[idx].nameAr = e.target.value;
                        setEditingProduct({ ...editingProduct, variants: updated });
                      }}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-1 text-neutral-200 text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-neutral-400">فارق السعر:</span>
                      <input
                        type="number"
                        placeholder="+DA"
                        value={v.priceAdjustment ?? '0'}
                        onChange={(e) => {
                          const updated = [...editingProduct.variants];
                          updated[idx].priceAdjustment = e.target.value;
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="w-20 bg-neutral-900 border border-neutral-700 rounded p-1 text-center font-mono text-xs text-amber-300 font-bold"
                      />
                      <span className="text-[10px] text-neutral-400">DA</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.variants.filter((_: any, i: number) => i !== idx);
                        setEditingProduct({ ...editingProduct, variants: updated });
                      }}
                      className="p-1 text-red-400 hover:bg-red-950 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Addons (e.g. Extras: صلصة بيضاء, فرماج) */}
            <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">الإضافات والخيارات الاختيارية (مثل: صلصة بيضاء، فرماج):</span>
                <button
                  type="button"
                  onClick={() => {
                    const cur = editingProduct.addons || [];
                    setEditingProduct({
                      ...editingProduct,
                      addons: [...cur, { nameAr: 'إضافة جديدة', price: '100' }],
                    });
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-1 rounded text-[11px] font-bold"
                >
                  + إضافة خيار إضافي
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {editingProduct.addons?.map((a: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <input
                      type="text"
                      placeholder="اسم الإضافة (مثلاً: فرماج)"
                      value={a.nameAr || ''}
                      onChange={(e) => {
                        const updated = [...editingProduct.addons];
                        updated[idx].nameAr = e.target.value;
                        setEditingProduct({ ...editingProduct, addons: updated });
                      }}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-1 text-neutral-200 text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-neutral-400">السعر:</span>
                      <input
                        type="number"
                        placeholder="DA"
                        value={a.price ?? '0'}
                        onChange={(e) => {
                          const updated = [...editingProduct.addons];
                          updated[idx].price = e.target.value;
                          setEditingProduct({ ...editingProduct, addons: updated });
                        }}
                        className="w-20 bg-neutral-900 border border-neutral-700 rounded p-1 text-center font-mono text-xs text-amber-300 font-bold"
                      />
                      <span className="text-[10px] text-neutral-400">DA</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.addons.filter((_: any, i: number) => i !== idx);
                        setEditingProduct({ ...editingProduct, addons: updated });
                      }}
                      className="p-1 text-red-400 hover:bg-red-950 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProduct}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg active:scale-95 transition"
            >
              حفظ الطبق
            </button>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-amber-400">إضافة فئة جديدة</h3>
              <button onClick={() => setShowCatModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">اسم الفئة بالعربية *</label>
                <input
                  type="text"
                  value={catNameAr}
                  onChange={(e) => setCatNameAr(e.target.value)}
                  placeholder="مثال: مأكولات بحرية"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الاسم بالفرنسية</label>
                <input
                  type="text"
                  value={catNameFr}
                  onChange={(e) => setCatNameFr(e.target.value)}
                  placeholder="Poissons & Fruits de mer"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">المحطة الموجهة لها</label>
                <select
                  value={catStation}
                  onChange={(e) => setCatStation(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                >
                  <option value="MAIN_KITCHEN">المطبخ الرئيسي</option>
                  <option value="GRILL">مشاوي وفحم</option>
                  <option value="DESSERT">تحلية وحلويات</option>
                  <option value="DRINKS">مشروبات</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveCategory}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              حفظ الفئة
            </button>
          </div>
        </div>
      )}

      {/* Price History Audit Modal */}
      {priceHistoryProd && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div>
                <h3 className="font-bold text-sm text-cyan-400">سجل تعديلات سعر:</h3>
                <p className="text-xs text-neutral-200 font-bold">{priceHistoryProd.nameAr}</p>
              </div>
              <button onClick={() => setPriceHistoryProd(null)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {priceHistoryList.length === 0 ? (
                <p className="text-center text-xs text-neutral-500 py-6">لم يتم تغيير سعر هذا الطبق من قبل</p>
              ) : (
                priceHistoryList.map((h, i) => (
                  <div key={i} className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-mono">
                        <span className="line-through text-red-400">{Number(h.oldPrice)} DA</span>
                        <span className="mx-2 text-neutral-500">→</span>
                        <span className="font-bold text-emerald-400">{Number(h.newPrice)} DA</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(h.changedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {h.reason && <p className="text-[11px] text-neutral-400 mt-1">السبب: {h.reason}</p>}
                    <p className="text-[10px] text-neutral-500 mt-0.5">المستخدم: {h.changedBy || 'Admin'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
