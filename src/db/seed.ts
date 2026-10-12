import bcrypt from 'bcryptjs';
import { db } from './index.ts';
import {
  categories,
  products,
  productVariants,
  productAddons,
  restaurantTables,
  users,
  suppliers,
  ingredients,
  productRecipes,
  restaurantSettings,
  customers,
} from './schema.ts';

export async function seedDatabase() {
  console.log('--- Starting Golden Palace POS Database Seeding ---');

  // 1. Settings
  const settingsData = [
    { key: 'restaurant_name', value: 'القصر الذهبي - GOLDEN PALACE' },
    { key: 'restaurant_brand', value: 'عند الجيجلي • حسين داي' },
    { key: 'restaurant_address', value: 'شارع بلهوشات، حسين داي، الجزائر، بجانب فندق Oasis' },
    { key: 'restaurant_phone', value: '0791755614' },
    { key: 'currency', value: 'DZD' },
    { key: 'receipt_size', value: '80mm' },
    { key: 'tax_rate', value: '0' },
    { key: 'default_language', value: 'ar' },
    { key: 'kds_refresh_interval', value: '5000' },
    { key: 'theme', value: 'gold-dark' },
  ];

  for (const s of settingsData) {
    await db.insert(restaurantSettings).values(s).onConflictDoUpdate({
      target: restaurantSettings.key,
      set: { value: s.value },
    });
  }

  // 2. Default Users
  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const managerPass = bcrypt.hashSync('manager123', salt);
  const cashierPass = bcrypt.hashSync('cashier123', salt);
  const waiterPass = bcrypt.hashSync('waiter123', salt);
  const kitchenPass = bcrypt.hashSync('kitchen123', salt);
  const inventoryPass = bcrypt.hashSync('inventory123', salt);

  const initialUsers = [
    {
      uid: 'user-admin-001',
      username: 'admin',
      email: 'admin@goldenpalace.dz',
      passwordHash: adminPass,
      pin: '1234',
      fullName: 'المدير العام (Admin)',
      role: 'ADMIN',
      phone: '0791755614',
    },
    {
      uid: 'user-mgr-002',
      username: 'manager',
      email: 'manager@goldenpalace.dz',
      passwordHash: managerPass,
      pin: '2222',
      fullName: 'نبيل مسؤول المطعم (Manager)',
      phone: '0773861939',
      role: 'MANAGER',
    },
    {
      uid: 'user-csh-003',
      username: 'caissier1',
      email: 'caisse1@goldenpalace.dz',
      passwordHash: cashierPass,
      pin: '1111',
      fullName: 'كاشير الوردية 1 (Cashier)',
      phone: '0550123456',
      role: 'CASHIER',
    },
    {
      uid: 'user-wtr-004',
      username: 'serveur1',
      email: 'serveur1@goldenpalace.dz',
      passwordHash: waiterPass,
      pin: '4444',
      fullName: 'أمين (نادل صالة)',
      phone: '0660123456',
      role: 'WAITER',
    },
    {
      uid: 'user-ktc-005',
      username: 'cuisine',
      email: 'cuisine@goldenpalace.dz',
      passwordHash: kitchenPass,
      pin: '3333',
      fullName: 'الشيف مراد (المطبخ)',
      phone: '0770123456',
      role: 'KITCHEN',
    },
    {
      uid: 'user-inv-006',
      username: 'stock',
      email: 'stock@goldenpalace.dz',
      passwordHash: inventoryPass,
      pin: '5555',
      fullName: 'مسؤول المخزن والجرد',
      phone: '0555667788',
      role: 'INVENTORY',
    },
  ];

  for (const u of initialUsers) {
    await db.insert(users).values(u).onConflictDoNothing();
  }

  // 3. Tables
  const zones = [
    { prefix: 'T', count: 14, zone: 'الصالة الرئيسية', cap: 4 },
    { prefix: 'TR', count: 6, zone: 'الشرفة الخارجية', cap: 4 },
    { prefix: 'VIP', count: 3, zone: 'صالون VIP والعائلات', cap: 8 },
  ];

  for (const z of zones) {
    for (let i = 1; i <= z.count; i++) {
      const tableNumber = `${z.prefix}${i < 10 ? '0' : ''}${i}`;
      await db.insert(restaurantTables).values({
        tableNumber,
        zone: z.zone,
        capacity: z.cap,
        status: 'AVAILABLE',
      }).onConflictDoNothing();
    }
  }

  // 4. Categories
  const initialCategories = [
    { nameAr: 'المقبلات والشوربات', nameFr: 'Entrées & Soupes', nameEn: 'Appetizers & Soups', icon: 'Soup', color: 'red', sortOrder: 1, station: 'MAIN_KITCHEN' },
    { nameAr: 'الأطباق الرئيسية', nameFr: 'Plats Principaux', nameEn: 'Main Dishes', icon: 'UtensilsCrossed', color: 'amber', sortOrder: 2, station: 'MAIN_KITCHEN' },
    { nameAr: 'المشاوي على الجمر', nameFr: 'Grillades', nameEn: 'Charcoal Grill', icon: 'Flame', color: 'orange', sortOrder: 3, station: 'GRILL' },
    { nameAr: 'مأكولات بحرية وأسماك', nameFr: 'Poissons & Fruits de mer', nameEn: 'Seafood', icon: 'Fish', color: 'blue', sortOrder: 4, station: 'MAIN_KITCHEN' },
    { nameAr: 'طاكوس وسندويتشات', nameFr: 'Tacos & Sandwiches', nameEn: 'Tacos & Wraps', icon: 'Sandwich', color: 'yellow', sortOrder: 5, station: 'MAIN_KITCHEN' },
    { nameAr: 'سلطات طازجة', nameFr: 'Salades Fraîches', nameEn: 'Salads', icon: 'Salad', color: 'emerald', sortOrder: 6, station: 'MAIN_KITCHEN' },
    { nameAr: 'التحلية والحلويات', nameFr: 'Desserts & Douceurs', nameEn: 'Desserts', icon: 'Cake', color: 'pink', sortOrder: 7, station: 'DESSERT' },
    { nameAr: 'المشروبات والعصائر', nameFr: 'Boissons & Jus', nameEn: 'Drinks & Juices', icon: 'GlassWater', color: 'cyan', sortOrder: 8, station: 'DRINKS' },
  ];

  const catMap = new Map<string, number>();
  for (const cat of initialCategories) {
    const inserted = await db.insert(categories).values(cat).returning();
    if (inserted[0]) {
      catMap.set(cat.nameAr, inserted[0].id);
    }
  }

  // 5. Suppliers
  const supList = [
    { name: 'مؤسسة سوق الجملة للأسماك - العاصمة', contactPerson: 'الحاج بلقاسم', phone: '0551223344', address: 'ميناء الصيد - الجزائر', balance: '0' },
    { name: 'مذابح الأطلس للحوم والدواجن الطازجة', contactPerson: 'كمال الونشريسي', phone: '0661334455', address: 'بئر توتة', balance: '0' },
    { name: 'شركة البركة للخضار والفواكه', contactPerson: 'عيسى بلهوشات', phone: '0771445566', address: 'حسين داي', balance: '0' },
    { name: 'موزع المشروبات والألبان سيدي موسى', contactPerson: 'فاروق التاجر', phone: '0552778899', address: 'الجزائر العاصمة', balance: '0' },
  ];

  const supMap = new Map<string, number>();
  for (const sup of supList) {
    const res = await db.insert(suppliers).values(sup).returning();
    if (res[0]) supMap.set(sup.name, res[0].id);
  }

  // 6. Ingredients
  const ingList = [
    { nameAr: 'دجاج طازج مجزأ', nameFr: 'Poulet frais', unit: 'KG', currentStock: '45.000', minStock: '10.000', costPerUnit: '520.00', supplierId: supMap.get('مذابح الأطلس للحوم والدواجن الطازجة') },
    { nameAr: 'لحم عجل مفروم ومشوي', nameFr: 'Viande hachée', unit: 'KG', currentStock: '30.000', minStock: '8.000', costPerUnit: '1750.00', supplierId: supMap.get('مذابح الأطلس للحوم والدواجن الطازجة') },
    { nameAr: 'سمك طازج متنوع', nameFr: 'Poisson frais', unit: 'KG', currentStock: '25.000', minStock: '5.000', costPerUnit: '1200.00', supplierId: supMap.get('مؤسسة سوق الجملة للأسماك - العاصمة') },
    { nameAr: 'جمبري كروفات طازج', nameFr: 'Crevettes fraîches', unit: 'KG', currentStock: '18.000', minStock: '4.000', costPerUnit: '2200.00', supplierId: supMap.get('مؤسسة سوق الجملة للأسماك - العاصمة') },
    { nameAr: 'فريك شوربة أصلي', nameFr: 'Frik de blé', unit: 'KG', currentStock: '40.000', minStock: '10.000', costPerUnit: '350.00', supplierId: supMap.get('شركة البركة للخضار والفواكه') },
    { nameAr: 'خضار مشكلة طازجة', nameFr: 'Légumes variés', unit: 'KG', currentStock: '80.000', minStock: '20.000', costPerUnit: '120.00', supplierId: supMap.get('شركة البركة للخضار والفواكه') },
    { nameAr: 'أرز بسمتي فاخر', nameFr: 'Riz basmati', unit: 'KG', currentStock: '50.000', minStock: '15.000', costPerUnit: '280.00', supplierId: supMap.get('شركة البركة للخضار والفواكه') },
    { nameAr: 'بطاطا للقلي (فريت)', nameFr: 'Pommes de terre', unit: 'KG', currentStock: '120.000', minStock: '30.000', costPerUnit: '90.00', supplierId: supMap.get('شركة البركة للخضار والفواكه') },
    { nameAr: 'جبن شيدر وصلصة الجبن', nameFr: 'Fromage & Sauce', unit: 'KG', currentStock: '25.000', minStock: '5.000', costPerUnit: '950.00', supplierId: supMap.get('موزع المشروبات والألبان سيدي موسى') },
    { nameAr: 'مشروب غازي علب', nameFr: 'Boissons canettes', unit: 'PIECE', currentStock: '150.000', minStock: '30.000', costPerUnit: '65.00', supplierId: supMap.get('موزع المشروبات والألبان سيدي موسى') },
    { nameAr: 'ماء معدني 0.5L', nameFr: 'Eau minérale 0.5L', unit: 'PIECE', currentStock: '200.000', minStock: '50.000', costPerUnit: '30.00', supplierId: supMap.get('موزع المشروبات والألبان سيدي موسى') },
  ];

  const ingMap = new Map<string, number>();
  for (const ing of ingList) {
    const res = await db.insert(ingredients).values(ing).returning();
    if (res[0]) ingMap.set(ing.nameAr, res[0].id);
  }

  // 7. Products (Matching the user's touchscreen photo items & restaurant menu)
  const productList = [
    // المقبلات والشوربات
    { cat: 'المقبلات والشوربات', nameAr: 'حساء حوت', nameFr: 'Soupe de poisson', price: '400.00', cost: '140.00', station: 'MAIN_KITCHEN', barcode: 'GP-SOU-01', ingr: [{ name: 'سمك طازج متنوع', qty: '0.150' }] },
    { cat: 'المقبلات والشوربات', nameAr: 'حريرة جزائرية', nameFr: 'Harira algérienne', price: '200.00', cost: '60.00', station: 'MAIN_KITCHEN', barcode: 'GP-SOU-02', ingr: [{ name: 'خضار مشكلة طازجة', qty: '0.200' }, { name: 'لحم عجل مفروم ومشوي', qty: '0.050' }] },
    { cat: 'المقبلات والشوربات', nameAr: 'شربة فريك', nameFr: 'Chorba frik', price: '200.00', cost: '60.00', station: 'MAIN_KITCHEN', barcode: 'GP-SOU-03', ingr: [{ name: 'فريك شوربة أصلي', qty: '0.060' }, { name: 'لحم عجل مفروم ومشوي', qty: '0.050' }] },
    { cat: 'المقبلات والشوربات', nameAr: 'حساء خضر', nameFr: 'Soupe de légumes', price: '200.00', cost: '50.00', station: 'MAIN_KITCHEN', barcode: 'GP-SOU-04', ingr: [{ name: 'خضار مشكلة طازجة', qty: '0.250' }] },
    { cat: 'المقبلات والشوربات', nameAr: 'حساء كروفات', nameFr: 'Soupe aux crevettes', price: '400.00', cost: '150.00', station: 'MAIN_KITCHEN', barcode: 'GP-SOU-05', ingr: [{ name: 'جمبري كروفات طازج', qty: '0.100' }] },

    // الأطباق الرئيسية
    { cat: 'الأطباق الرئيسية', nameAr: 'طاجين الزيتون الفاخر', nameFr: 'Tajine Zitoun Royal', price: '850.00', cost: '320.00', station: 'MAIN_KITCHEN', barcode: 'GP-PLT-01', ingr: [{ name: 'دجاج طازج مجزأ', qty: '0.250' }, { name: 'خضار مشكلة طازجة', qty: '0.150' }] },
    { cat: 'الأطباق الرئيسية', nameAr: 'طبق دجاج محمر (نصف دجاجة)', nameFr: 'Demi Poulet Rôti', price: '750.00', cost: '280.00', station: 'MAIN_KITCHEN', barcode: 'GP-PLT-02', ingr: [{ name: 'دجاج طازج مجزأ', qty: '0.500' }, { name: 'بطاطا للقلي (فريت)', qty: '0.200' }] },
    { cat: 'الأطباق الرئيسية', nameAr: 'طبق شخشوخة قسنطينية', nameFr: 'Chakhchoukha Constantinoise', price: '900.00', cost: '350.00', station: 'MAIN_KITCHEN', barcode: 'GP-PLT-03', ingr: [{ name: 'لحم عجل مفروم ومشوي', qty: '0.200' }] },
    { cat: 'الأطباق الرئيسية', nameAr: 'طبق روز بالقصر الذهبي', nameFr: 'Riz Golden Palace', price: '650.00', cost: '220.00', station: 'MAIN_KITCHEN', barcode: 'GP-PLT-04', ingr: [{ name: 'أرز بسمتي فاخر', qty: '0.200' }, { name: 'دجاج طازج مجزأ', qty: '0.150' }] },

    // المشاوي
    { cat: 'المشاوي على الجمر', nameAr: 'شواء مشكل فاخر (Mixte Grill)', nameFr: 'Mixte Grillade', price: '1400.00', cost: '580.00', station: 'GRILL', barcode: 'GP-GRL-01', ingr: [{ name: 'لحم عجل مفروم ومشوي', qty: '0.200' }, { name: 'دجاج طازج مجزأ', qty: '0.200' }] },
    { cat: 'المشاوي على الجمر', nameAr: 'كباب لحم على الفحم', nameFr: 'Brochettes Kebab', price: '950.00', cost: '380.00', station: 'GRILL', barcode: 'GP-GRL-02', ingr: [{ name: 'لحم عجل مفروم ومشوي', qty: '0.250' }] },
    { cat: 'المشاوي على الجمر', nameAr: 'شيش طاووق دجاج متبل', nameFr: 'Chiche Taouk', price: '850.00', cost: '300.00', station: 'GRILL', barcode: 'GP-GRL-03', ingr: [{ name: 'دجاج طازج مجزأ', qty: '0.300' }] },

    // مأكولات بحرية
    { cat: 'مأكولات بحرية وأسماك', nameAr: 'صحن سلمون مشوي طازج', nameFr: 'Saumon Frais Grillé', price: '1800.00', cost: '780.00', station: 'MAIN_KITCHEN', barcode: 'GP-SEA-01', ingr: [{ name: 'سمك طازج متنوع', qty: '0.350' }] },
    { cat: 'مأكولات بحرية وأسماك', nameAr: 'طبق كروفات مقلية بالثوم والأعشاب', nameFr: 'Crevettes Sautées à l\'ail', price: '1500.00', cost: '620.00', station: 'MAIN_KITCHEN', barcode: 'GP-SEA-02', ingr: [{ name: 'جمبري كروفات طازج', qty: '0.250' }] },
    { cat: 'مأكولات بحرية وأسماك', nameAr: 'سمك سردين مقلي بالدرمولة', nameFr: 'Sardines Chermoula', price: '600.00', cost: '200.00', station: 'MAIN_KITCHEN', barcode: 'GP-SEA-03', ingr: [{ name: 'سمك طازج متنوع', qty: '0.300' }] },

    // طاكوس وسندويتشات
    { cat: 'طاكوس وسندويتشات', nameAr: 'طاكوس القصر الذهبي ميكس', nameFr: 'Tacos Golden Mixte', price: '650.00', cost: '250.00', station: 'MAIN_KITCHEN', barcode: 'GP-TAC-01', ingr: [{ name: 'دجاج طازج مجزأ', qty: '0.120' }, { name: 'لحم عجل مفروم ومشوي', qty: '0.080' }, { name: 'جبن شيدر وصلصة الجبن', qty: '0.060' }, { name: 'بطاطا للقلي (فريت)', qty: '0.100' }] },
    { cat: 'طاكوس وسندويتشات', nameAr: 'طاكوس دجاج كرسبي', nameFr: 'Tacos Poulet Crispy', price: '500.00', cost: '180.00', station: 'MAIN_KITCHEN', barcode: 'GP-TAC-02', ingr: [{ name: 'دجاج طازج مجزأ', qty: '0.180' }, { name: 'جبن شيدر وصلصة الجبن', qty: '0.050' }] },

    // سلطات
    { cat: 'سلطات طازجة', nameAr: 'سلطة مشكلة جزائرية', nameFr: 'Salade Composée', price: '350.00', cost: '90.00', station: 'MAIN_KITCHEN', barcode: 'GP-SAL-01', ingr: [{ name: 'خضار مشكلة طازجة', qty: '0.300' }] },
    { cat: 'سلطات طازجة', nameAr: 'سلطة سيزر بالدجاج المقرمش', nameFr: 'Salade César Poulet', price: '500.00', cost: '160.00', station: 'MAIN_KITCHEN', barcode: 'GP-SAL-02', ingr: [{ name: 'خضار مشكلة طازجة', qty: '0.200' }, { name: 'دجاج طازج مجزأ', qty: '0.100' }] },

    // التحلية
    { cat: 'التحلية والحلويات', nameAr: 'قلب اللوز الجزائري التقليدي', nameFr: 'Kalb El Louz', price: '200.00', cost: '50.00', station: 'DESSERT', barcode: 'GP-DES-01', ingr: [] },
    { cat: 'التحلية والحلويات', nameAr: 'محلبي بماء الزهر والقرفة', nameFr: 'Mhalbi Traditionnel', price: '250.00', cost: '60.00', station: 'DESSERT', barcode: 'GP-DES-02', ingr: [] },
    { cat: 'التحلية والحلويات', nameAr: 'سلطة فواكه طازجة', nameFr: 'Salade de fruits frais', price: '350.00', cost: '110.00', station: 'DESSERT', barcode: 'GP-DES-03', ingr: [] },

    // المشروبات
    { cat: 'المشروبات والعصائر', nameAr: 'كوكا كولا / حمود بوعلام 33cl', nameFr: 'Canette 33cl Hamoud/Coca', price: '150.00', cost: '65.00', station: 'DRINKS', barcode: 'GP-DRK-01', ingr: [{ name: 'مشروب غازي علب', qty: '1.000' }] },
    { cat: 'المشروبات والعصائر', nameAr: 'ماء معدني لالة خديجة 0.5L', nameFr: 'Eau Minérale 0.5L', price: '80.00', cost: '30.00', station: 'DRINKS', barcode: 'GP-DRK-02', ingr: [{ name: 'ماء معدني 0.5L', qty: '1.000' }] },
    { cat: 'المشروبات والعصائر', nameAr: 'عصير برتقال طبيعي طازج', nameFr: 'Jus d\'Orange Pressé', price: '300.00', cost: '90.00', station: 'DRINKS', barcode: 'GP-DRK-03', ingr: [] },
  ];

  for (const p of productList) {
    const catId = catMap.get(p.cat) || 1;
    const inserted = await db.insert(products).values({
      categoryId: catId,
      nameAr: p.nameAr,
      nameFr: p.nameFr,
      nameEn: p.nameAr,
      price: p.price,
      costPrice: p.cost,
      barcode: p.barcode,
      station: p.station,
      isAvailable: true,
    }).returning();

    const prod = inserted[0];
    if (prod) {
      // Add Variants for Tacos & Drinks
      if (p.nameAr.includes('طاكوس')) {
        await db.insert(productVariants).values([
          { productId: prod.id, nameAr: 'حجم عادي (M)', nameFr: 'Normal', priceAdjustment: '0' },
          { productId: prod.id, nameAr: 'حجم كبير (L)', nameFr: 'Grand', priceAdjustment: '150.00' },
          { productId: prod.id, nameAr: 'حجم عائلي (XL)', nameFr: 'Mega XL', priceAdjustment: '300.00' },
        ]);
        await db.insert(productAddons).values([
          { productId: prod.id, nameAr: 'إضافة جبن شيدر ذائب', nameFr: 'Extra Cheddar', price: '100.00' },
          { productId: prod.id, nameAr: 'إضافة صلصة باربيكيو ومدخنة', nameFr: 'Sauce Barbecue', price: '50.00' },
          { productId: prod.id, nameAr: 'إضافة بطاطا مقلية مضاعفة', nameFr: 'Extra Frites', price: '100.00' },
        ]);
      } else if (p.nameAr.includes('شواء') || p.nameAr.includes('كباب')) {
        await db.insert(productVariants).values([
          { productId: prod.id, nameAr: 'وجبة فردية', nameFr: 'Individuel', priceAdjustment: '0' },
          { productId: prod.id, nameAr: 'وجبة مزدوجة لشخصين', nameFr: 'Double (2 pers)', priceAdjustment: '800.00' },
        ]);
      }

      // Link recipes
      for (const recipeItem of p.ingr) {
        const ingId = ingMap.get(recipeItem.name);
        if (ingId) {
          await db.insert(productRecipes).values({
            productId: prod.id,
            ingredientId: ingId,
            quantity: recipeItem.qty,
          });
        }
      }
    }
  }

  // 8. Sample Customers
  const initialCustomers = [
    { name: 'زبون أنونيم (عابر سبيل)', phone: '0000000000', address: 'حسين داي', notes: 'زبون المطعم اليومي' },
    { name: 'السيد كمال قادري', phone: '0791223344', address: 'شارع بلهوشات عمارة 4', notes: 'زبون دائم للتوصيل' },
    { name: 'فندق Oasis - خدمة الغرف', phone: '021778899', address: 'بجانب المطعم - فندق Oasis', notes: 'طلبات خاصة' },
  ];

  for (const c of initialCustomers) {
    await db.insert(customers).values(c).onConflictDoNothing();
  }

  console.log('--- Golden Palace POS Database Seeding Completed Successfully! ---');
}
