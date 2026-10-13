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
        await api.createProduct({
          nameAr: editingProduct.nameAr,
          nameFr: editingProduct.nameFr,
          price: parseFloat(editingProduct.price) || 0,
          costPrice: parseFloat(editingProduct.costPrice) || 0,
          categoryId: Number(editingProduct.categoryId),
          station: editingProduct.station || 'MAIN_KITCHEN',
          barcode: editingProduct.barcode || undefined,
          isAvailable: editingProduct.isAvailable ?? true,
          variants: editingProduct.variants,
          addons: editingProduct.addons,
          recipes: editingProduct.recipes,
        });
      } else {
        await api.updateProduct(editingProduct.id, {
          nameAr: editingProduct.nameAr,
          nameFr: editingProduct.nameFr,
          price: parseFloat(editingProduct.price) || 0,
          costPrice: parseFloat(editingProduct.costPrice) || 0,
          categoryId: Number(editingProduct.categoryId),
          station: editingProduct.station || 'MAIN_KITCHEN',
          barcode: editingProduct.barcode || undefined,
          isAvailable: editingProduct.isAvailable,
          reasonForPriceChange: editingProduct.reasonForPriceChange,
          variants: editingProduct.variants,
          addons: editingProduct.addons,
          recipes: editingProduct.recipes,
        });
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
        nameFr: catNameFr.trim() || undefined,
        station: catStation,
      });
      setShowCatModal(false);
      setCatNameAr('');
      setCatNameFr('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الفئة');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCatId === 'ALL' || p.categoryId === selectedCatId;
    const matchSearch =
      !search ||
      p.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameFr && p.nameFr.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <UtensilsCrossed className="w-6 h-6 text-blue-600" />
            <span>قائمة الأطباق والأسعار (Menu & Plats)</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في القائمة..."
              className="bg-slate-50 border-2 border-slate-200 rounded-xl pr-9 pl-4 py-2 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCatModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl border-2 border-slate-300 text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-600 stroke-[3]" />
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>طبق جديد (Nouveau Plat)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 pt-4 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-64 bg-white rounded-3xl border-2 border-slate-200 p-3 overflow-y-auto no-scrollbar shrink-0 shadow-sm">
          <div className="font-black text-sm text-black px-3 py-2 border-b border-slate-100 mb-2">الفئات (Catégories)</div>
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-sm font-black transition mb-1.5 cursor-pointer ${
              selectedCatId === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-800 hover:bg-slate-100'
            }`}
          >
            جميع الأصناف ({products.length})
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`w-full text-right px-4 py-3 rounded-2xl text-sm font-black transition mb-1.5 flex items-center justify-between cursor-pointer ${
                selectedCatId === c.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>{c.nameAr}</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${selectedCatId === c.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {products.filter((p) => p.categoryId === c.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Products Table */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto flex-1 no-scrollbar">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-200 font-black">
                <tr>
                  <th className="p-4">الطبق</th>
                  <th className="p-4">الفئة</th>
                  <th className="p-4">سعر البيع (DA)</th>
                  <th className="p-4">التكلفة (DA)</th>
                  <th className="p-4">المحطة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-bold">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition">
                    <td className="p-4">
                      <div className="font-black text-lg text-slate-900">{p.nameAr}</div>
                      {p.nameFr && <div className="text-xs text-slate-500 font-semibold">{p.nameFr}</div>}
                      {p.barcode && <div className="text-xs text-slate-400 font-mono">#{p.barcode}</div>}
                    </td>
                    <td className="p-4 text-slate-700 font-extrabold">
                      {categories.find((c) => c.id === p.categoryId)?.nameAr || '—'}
                    </td>
                    <td className="p-4 font-black text-blue-700 text-xl">
                      {Number(p.price).toLocaleString()} DA
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {Number(p.costPrice || 0).toLocaleString()} DA
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
                        {p.station}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleAvailable(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                          p.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {p.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{p.isAvailable ? 'متوفر' : 'غير متوفر'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewPriceHistory(p)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 cursor-pointer shadow-sm"
                          title="سجل تعديلات السعر"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsNewProduct(false);
                            setEditingProduct({ ...p });
                          }}
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer shadow-sm"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer shadow-sm"
                          title="تعطيل"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">
                {isNewProduct ? 'إضافة طبق جديد' : `تعديل: ${editingProduct.nameAr}`}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <div>
                <label className="block text-slate-700 mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  value={editingProduct.nameAr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                  placeholder="مثال: شواء مشكل فاخر"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الاسم بالفرنسية</label>
                <input
                  type="text"
                  value={editingProduct.nameFr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameFr: e.target.value })}
                  placeholder="Mixte Grillade"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">سعر البيع (DA) *</label>
                <input
                  type="number"
                  value={editingProduct.price || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  placeholder="1400"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-blue-700 font-black text-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">تكلفة الإنتاج (DA)</label>
                <input
                  type="number"
                  value={editingProduct.costPrice || '0'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الفئة *</label>
                <select
                  value={editingProduct.categoryId || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: Number(e.target.value) })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">محطة التحضير (Station)</label>
                <select
                  value={editingProduct.station || 'MAIN_KITCHEN'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, station: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                >
                  <option value="MAIN_KITCHEN">المطبخ الرئيسي (Main Kitchen)</option>
                  <option value="GRILL">مشاوي وفحم (Grill)</option>
                  <option value="DESSERT">الحلويات والتحلية (Dessert)</option>
                  <option value="DRINKS">المشروبات والبار (Drinks)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الباركود (Code-barres)</label>
                <input
                  type="text"
                  value={editingProduct.barcode || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                  placeholder="GP-GRL-01"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              {!isNewProduct && (
                <div>
                  <label className="block text-slate-700 mb-1">سبب تغيير السعر (للتوثيق)</label>
                  <input
                    type="text"
                    value={editingProduct.reasonForPriceChange || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reasonForPriceChange: e.target.value })}
                    placeholder="مثال: زيادة تكلفة المواد الخام"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}
            </div>

            {/* Recipe Ingredients Linking Section */}
            <div className="pt-3 border-t-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-black">مكونات الوصفة وخصم المخزون التلقائي:</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentRecipes = editingProduct.recipes || [];
                    setEditingProduct({
                      ...editingProduct,
                      recipes: [...currentRecipes, { ingredientId: ingredients[0]?.id || 1, quantity: '0.100' }],
                    });
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-black"
                >
                  + إضافة مادة للوصفة
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                {editingProduct.recipes?.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <select
                      value={r.ingredientId}
                      onChange={(e) => {
                        const updated = [...editingProduct.recipes];
                        updated[idx].ingredientId = Number(e.target.value);
                        setEditingProduct({ ...editingProduct, recipes: updated });
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold text-sm"
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
                      className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-center font-mono text-sm text-slate-900 font-black"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.recipes.filter((_: any, i: number) => i !== idx);
                        setEditingProduct({ ...editingProduct, recipes: updated });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Variants (Sizes) */}
            <div className="pt-3 border-t-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-black">الأحجام والمتغيرات (مثل: حجم L و XL):</span>
                <button
                  type="button"
                  onClick={() => {
                    const cur = editingProduct.variants || [];
                    setEditingProduct({
                      ...editingProduct,
                      variants: [...cur, { nameAr: 'حجم جديد', priceAdjustment: '0' }],
                    });
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-black"
                >
                  + إضافة حجم / متغير
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                {editingProduct.variants?.map((v: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="اسم الحجم (مثلاً: حجم XL)"
                      value={v.nameAr || ''}
                      onChange={(e) => {
                        const updated = [...editingProduct.variants];
                        updated[idx].nameAr = e.target.value;
                        setEditingProduct({ ...editingProduct, variants: updated });
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-sm font-bold"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-bold">فارق السعر:</span>
                      <input
                        type="number"
                        placeholder="+DA"
                        value={v.priceAdjustment ?? '0'}
                        onChange={(e) => {
                          const updated = [...editingProduct.variants];
                          updated[idx].priceAdjustment = e.target.value;
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-center font-mono text-sm text-blue-700 font-black"
                      />
                      <span className="text-xs text-slate-500 font-bold">DA</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.variants.filter((_: any, i: number) => i !== idx);
                        setEditingProduct({ ...editingProduct, variants: updated });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Addons */}
            <div className="pt-3 border-t-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-black">الإضافات الاختيارية (صلصة، فرماج...):</span>
                <button
                  type="button"
                  onClick={() => {
                    const cur = editingProduct.addons || [];
                    setEditingProduct({
                      ...editingProduct,
                      addons: [...cur, { nameAr: 'إضافة جديدة', price: '100' }],
                    });
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-black"
                >
                  + إضافة خيار إضافي
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                {editingProduct.addons?.map((a: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="اسم الإضافة (مثلاً: فرماج)"
                      value={a.nameAr || ''}
                      onChange={(e) => {
                        const updated = [...editingProduct.addons];
                        updated[idx].nameAr = e.target.value;
                        setEditingProduct({ ...editingProduct, addons: updated });
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-sm font-bold"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-bold">السعر:</span>
                      <input
                        type="number"
                        placeholder="DA"
                        value={a.price ?? '0'}
                        onChange={(e) => {
                          const updated = [...editingProduct.addons];
                          updated[idx].price = e.target.value;
                          setEditingProduct({ ...editingProduct, addons: updated });
                        }}
                        className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-center font-mono text-sm text-blue-700 font-black"
                      />
                      <span className="text-xs text-slate-500 font-bold">DA</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.addons.filter((_: any, i: number) => i !== idx);
                        setEditingProduct({ ...editingProduct, addons: updated });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProduct}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-xl active:scale-95 transition cursor-pointer"
            >
              حفظ الطبق
            </button>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">إضافة فئة جديدة</h3>
              <button onClick={() => setShowCatModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 font-bold text-sm">
              <div>
                <label className="block text-slate-700 mb-1">اسم الفئة بالعربية *</label>
                <input
                  type="text"
                  value={catNameAr}
                  onChange={(e) => setCatNameAr(e.target.value)}
                  placeholder="مثال: مأكولات بحرية"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الاسم بالفرنسية</label>
                <input
                  type="text"
                  value={catNameFr}
                  onChange={(e) => setCatNameFr(e.target.value)}
                  placeholder="Poissons & Fruits de mer"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">المحطة الموجهة لها</label>
                <select
                  value={catStation}
                  onChange={(e) => setCatStation(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
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
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              حفظ الفئة
            </button>
          </div>
        </div>
      )}

      {/* Price History Audit Modal */}
      {priceHistoryProd && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-xl text-black">سجل تعديلات سعر:</h3>
                <p className="text-base text-blue-700 font-black">{priceHistoryProd.nameAr}</p>
              </div>
              <button onClick={() => setPriceHistoryProd(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar">
              {priceHistoryList.length === 0 ? (
                <p className="text-center text-sm font-bold text-slate-400 py-8">لم يتم تغيير سعر هذا الطبق من قبل</p>
              ) : (
                priceHistoryList.map((h, i) => (
                  <div key={i} className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-black">
                        <span className="line-through text-red-600">{Number(h.oldPrice)} DA</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="text-blue-700 font-black">{Number(h.newPrice)} DA</span>
                      </div>
                      <span className="text-xs text-slate-500 font-bold">
                        {new Date(h.changedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {h.reason && <p className="text-xs text-slate-700 mt-1 font-bold">السبب: {h.reason}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">المستخدم: {h.changedBy || 'Admin'}</p>
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
