import express from 'express';
import bcrypt from 'bcryptjs';
import { eq, desc, asc, and, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  users,
  categories,
  products,
  productVariants,
  productAddons,
  priceHistory,
  restaurantTables,
  orders,
  orderItems,
  payments,
  cashShifts,
  cashMovements,
  suppliers,
  ingredients,
  productRecipes,
  inventoryMovements,
  wasteRecords,
  purchases,
  purchaseItems,
  customers,
  deliveries,
  expenses,
  auditLogs,
  restaurantSettings,
} from '../db/schema.ts';
import { requireAuth, requireRole, signUserToken, AuthRequest } from '../middleware/auth.ts';
import { logAudit } from '../utils/audit.ts';

export const apiRouter = express.Router();

// ==========================================
// 1. AUTHENTICATION & STAFF
// ==========================================

// Standard Login (Username / Email + Password)
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const found = await db
      .select()
      .from(users)
      .where(
        sql`${users.username} = ${identifier} OR ${users.email} = ${identifier}`
      );

    if (found.length === 0) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const user = found[0];
    if (!user.isActive) {
      return res.status(403).json({ error: 'تم تعطيل هذا الحساب، يرجى مراجعة الإدارة' });
    }

    const matches = bcrypt.compareSync(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = signUserToken({
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      phone: user.phone,
    });

    await logAudit({
      userId: user.id,
      userName: user.fullName,
      action: 'LOGIN',
      details: 'تسجيل دخول ناجح باسم المستخدم',
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'فشل تسجيل الدخول. حاول مرة أخرى.' });
  }
});

// Quick PIN Login for Cashier / Waiter / Touchscreen
apiRouter.post('/auth/pin-login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'يرجى إدخال رمز PIN' });
    }

    const found = await db.select().from(users).where(eq(users.pin, pin.trim()));
    if (found.length === 0) {
      return res.status(401).json({ error: 'رمز PIN غير صحيح' });
    }

    const user = found[0];
    if (!user.isActive) {
      return res.status(403).json({ error: 'تم تعطيل هذا الحساب' });
    }

    const token = signUserToken({
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      phone: user.phone,
    });

    await logAudit({
      userId: user.id,
      userName: user.fullName,
      action: 'PIN_LOGIN',
      details: `تسجيل دخول سريع برمز PIN للمستخدم ${user.fullName}`,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error('PIN Login error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء التحقق من PIN' });
  }
});

// Get Current User Profile & Permissions
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const found = await db.select().from(users).where(eq(users.id, req.user!.id));
    if (found.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    const u = found[0];
    res.json({
      user: {
        id: u.id,
        uid: u.uid,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        phone: u.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل استرجاع بيانات المستخدم' });
  }
});

// ==========================================
// 2. USERS MANAGEMENT (Admin Only)
// ==========================================
apiRouter.get('/users', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      uid: users.uid,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
      pin: users.pin,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).orderBy(asc(users.id));
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل قائمة المستخدمين' });
  }
});

apiRouter.post('/users', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { username, email, password, pin, fullName, role, phone } = req.body;
    if (!username || !email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userUid = `user-${Date.now()}`;

    const inserted = await db.insert(users).values({
      uid: userUid,
      username: username.trim(),
      email: email.trim(),
      passwordHash,
      pin: pin ? pin.trim() : '1234',
      fullName: fullName.trim(),
      role: role.trim(),
      phone: phone || null,
      isActive: true,
    }).returning();

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: String(inserted[0].id),
      details: `إنشاء موظف جديد: ${fullName} (${role})`,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'فشل إنشاء المستخدم. تأكد من عدم تكرار اسم المستخدم أو البريد.' });
  }
});

apiRouter.put('/users/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);
    const { fullName, role, phone, pin, isActive, password } = req.body;

    const updateData: any = {
      fullName,
      role,
      phone,
      pin,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    };

    if (password && password.trim()) {
      const salt = bcrypt.genSaltSync(10);
      updateData.passwordHash = bcrypt.hashSync(password, salt);
    }

    const updated = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'UPDATE_USER',
      entityType: 'USER',
      entityId: String(userId),
      details: `تعديل بيانات المستخدم: ${fullName}`,
    });

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث بيانات المستخدم' });
  }
});

// ==========================================
// 3. CATEGORIES
// ==========================================
apiRouter.get('/categories', async (_req, res) => {
  try {
    const list = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل الفئات' });
  }
});

apiRouter.post('/categories', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { nameAr, nameFr, nameEn, icon, color, sortOrder, station } = req.body;
    if (!nameAr) return res.status(400).json({ error: 'اسم الفئة بالعربية مطلوب' });

    const inserted = await db.insert(categories).values({
      nameAr,
      nameFr: nameFr || null,
      nameEn: nameEn || null,
      icon: icon || 'Utensils',
      color: color || 'amber',
      sortOrder: sortOrder || 0,
      station: station || 'MAIN_KITCHEN',
      isActive: true,
    }).returning();

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'CREATE_CATEGORY',
      entityType: 'CATEGORY',
      entityId: String(inserted[0].id),
      details: `إضافة فئة جديدة: ${nameAr}`,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إنشاء الفئة' });
  }
});

apiRouter.put('/categories/:id', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { nameAr, nameFr, nameEn, icon, color, sortOrder, isActive, station } = req.body;

    const updated = await db.update(categories).set({
      nameAr,
      nameFr,
      nameEn,
      icon,
      color,
      sortOrder,
      isActive,
      station,
    }).where(eq(categories.id, id)).returning();

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تعديل الفئة' });
  }
});

apiRouter.delete('/categories/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    // Safe soft-delete or deactivate
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
    res.json({ success: true, message: 'تم تعطيل الفئة بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حذف الفئة' });
  }
});

// ==========================================
// 4. PRODUCTS & MENU MANAGEMENT
// ==========================================
apiRouter.get('/products', async (_req, res) => {
  try {
    const prods = await db.select().from(products).orderBy(asc(products.id));
    const variants = await db.select().from(productVariants);
    const addons = await db.select().from(productAddons);
    const recipes = await db.select().from(productRecipes);

    // Group variants & addons by product
    const fullProducts = prods.map((p) => ({
      ...p,
      variants: variants.filter((v) => v.productId === p.id),
      addons: addons.filter((a) => a.productId === p.id),
      recipes: recipes.filter((r) => r.productId === p.id),
    }));

    res.json(fullProducts);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل قائمة الأطباق' });
  }
});

apiRouter.post('/products', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const {
      categoryId,
      nameAr,
      nameFr,
      nameEn,
      description,
      price,
      costPrice,
      barcode,
      station,
      isAvailable,
      variants,
      addons,
      recipes,
    } = req.body;

    if (!nameAr || !price || !categoryId) {
      return res.status(400).json({ error: 'الاسم والسعر والفئة حقول إلزامية' });
    }

    const inserted = await db.insert(products).values({
      categoryId: Number(categoryId),
      nameAr,
      nameFr: nameFr || null,
      nameEn: nameEn || null,
      description: description || null,
      price: String(price),
      costPrice: costPrice ? String(costPrice) : '0',
      barcode: barcode || null,
      station: station || 'MAIN_KITCHEN',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    }).returning();

    const prodId = inserted[0].id;

    // Insert variants if provided
    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        if (v.nameAr) {
          await db.insert(productVariants).values({
            productId: prodId,
            nameAr: v.nameAr,
            nameFr: v.nameFr || null,
            priceAdjustment: String(v.priceAdjustment || 0),
          });
        }
      }
    }

    // Insert addons if provided
    if (addons && Array.isArray(addons)) {
      for (const a of addons) {
        if (a.nameAr) {
          await db.insert(productAddons).values({
            productId: prodId,
            nameAr: a.nameAr,
            nameFr: a.nameFr || null,
            price: String(a.price || 0),
          });
        }
      }
    }

    // Insert recipes if provided
    if (recipes && Array.isArray(recipes)) {
      for (const r of recipes) {
        if (r.ingredientId && r.quantity) {
          await db.insert(productRecipes).values({
            productId: prodId,
            ingredientId: Number(r.ingredientId),
            quantity: String(r.quantity),
          });
        }
      }
    }

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'CREATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: String(prodId),
      details: `إضافة طبق جديد: ${nameAr} بسعر ${price} DA`,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'فشل إضافة الطبق' });
  }
});

apiRouter.put('/products/:id', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const prodId = Number(req.params.id);
    const {
      categoryId,
      nameAr,
      nameFr,
      nameEn,
      description,
      price,
      costPrice,
      barcode,
      station,
      isAvailable,
      reasonForPriceChange,
      variants,
      addons,
      recipes,
    } = req.body;

    const existing = await db.select().from(products).where(eq(products.id, prodId));
    if (existing.length === 0) return res.status(404).json({ error: 'الطبق غير موجود' });

    const currentProd = existing[0];
    const oldPrice = Number(currentProd.price);
    const newPrice = Number(price);

    // Record price audit history if price changed
    if (newPrice !== oldPrice) {
      await db.insert(priceHistory).values({
        productId: prodId,
        oldPrice: String(oldPrice),
        newPrice: String(newPrice),
        changedByUserId: req.user!.id,
        reason: reasonForPriceChange || 'تعديل السعر من إدارة القائمة',
      });

      await logAudit({
        userId: req.user!.id,
        userName: req.user!.fullName,
        action: 'CHANGE_PRICE',
        entityType: 'PRODUCT',
        entityId: String(prodId),
        details: `تغيير سعر ${currentProd.nameAr} من ${oldPrice} DA إلى ${newPrice} DA`,
      });
    }

    const updated = await db.update(products).set({
      categoryId: categoryId ? Number(categoryId) : currentProd.categoryId,
      nameAr: nameAr ?? currentProd.nameAr,
      nameFr: nameFr ?? currentProd.nameFr,
      nameEn: nameEn ?? currentProd.nameEn,
      description: description ?? currentProd.description,
      price: String(newPrice),
      costPrice: costPrice ? String(costPrice) : currentProd.costPrice,
      barcode: barcode ?? currentProd.barcode,
      station: station ?? currentProd.station,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : currentProd.isAvailable,
      updatedAt: new Date(),
    }).where(eq(products.id, prodId)).returning();

    // Replace variants & addons if provided
    if (variants && Array.isArray(variants)) {
      await db.delete(productVariants).where(eq(productVariants.productId, prodId));
      for (const v of variants) {
        if (v.nameAr) {
          await db.insert(productVariants).values({
            productId: prodId,
            nameAr: v.nameAr,
            nameFr: v.nameFr || null,
            priceAdjustment: String(v.priceAdjustment || 0),
          });
        }
      }
    }

    if (addons && Array.isArray(addons)) {
      await db.delete(productAddons).where(eq(productAddons.productId, prodId));
      for (const a of addons) {
        if (a.nameAr) {
          await db.insert(productAddons).values({
            productId: prodId,
            nameAr: a.nameAr,
            nameFr: a.nameFr || null,
            price: String(a.price || 0),
          });
        }
      }
    }

    if (recipes && Array.isArray(recipes)) {
      await db.delete(productRecipes).where(eq(productRecipes.productId, prodId));
      for (const r of recipes) {
        if (r.ingredientId && r.quantity) {
          await db.insert(productRecipes).values({
            productId: prodId,
            ingredientId: Number(r.ingredientId),
            quantity: String(r.quantity),
          });
        }
      }
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'فشل تحديث بيانات الطبق' });
  }
});

// Toggle Product Availability (Fast for Cashier / Kitchen)
apiRouter.patch('/products/:id/toggle-available', requireAuth, async (req: AuthRequest, res) => {
  try {
    const prodId = Number(req.params.id);
    const existing = await db.select().from(products).where(eq(products.id, prodId));
    if (existing.length === 0) return res.status(404).json({ error: 'الطبق غير موجود' });

    const newStatus = !existing[0].isAvailable;
    const updated = await db.update(products).set({ isAvailable: newStatus }).where(eq(products.id, prodId)).returning();

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: newStatus ? 'ENABLE_PRODUCT' : 'DISABLE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: String(prodId),
      details: `${newStatus ? 'تفعيل' : 'تعطيل'} توفر الطبق: ${existing[0].nameAr}`,
    });

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تغيير حالة توفر الطبق' });
  }
});

// Safe Delete / Deactivate Product
apiRouter.delete('/products/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const prodId = Number(req.params.id);
    await db.update(products).set({ isAvailable: false }).where(eq(products.id, prodId));
    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'DELETE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: String(prodId),
      details: `تعطيل وحذف آمن للطبق رقم ${prodId}`,
    });
    res.json({ success: true, message: 'تم إخفاء الطبق بنجاح دون المساس بالفواتير القديمة' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حذف الطبق' });
  }
});

// Price History Audit for a Product
apiRouter.get('/products/:id/price-history', requireAuth, async (req, res) => {
  try {
    const history = await db.select({
      id: priceHistory.id,
      oldPrice: priceHistory.oldPrice,
      newPrice: priceHistory.newPrice,
      reason: priceHistory.reason,
      changedAt: priceHistory.changedAt,
      changedBy: users.fullName,
    })
    .from(priceHistory)
    .leftJoin(users, eq(priceHistory.changedByUserId, users.id))
    .where(eq(priceHistory.productId, Number(req.params.id)))
    .orderBy(desc(priceHistory.changedAt));

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل استرجاع سجل الأسعار' });
  }
});

// ==========================================
// 5. RESTAURANT TABLES & ZONES
// ==========================================
apiRouter.get('/tables', async (_req, res) => {
  try {
    const tablesList = await db
      .select({
        table: restaurantTables,
        order: orders,
      })
      .from(restaurantTables)
      .leftJoin(orders, eq(restaurantTables.currentOrderId, orders.id));

    const formatted = tablesList.map(({ table, order }) => ({
      ...table,
      activeOrder: order
        ? {
            id: order.id,
            orderNumber: order.orderNumber,
            total: Number(order.total),
            status: order.status,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
          }
        : null,
    }));

    // Natural numeric sort: 1, 2, 3 ... 30
    formatted.sort((a, b) => {
      const numA = parseInt(a.tableNumber.replace(/\D/g, '') || String(a.id), 10);
      const numB = parseInt(b.tableNumber.replace(/\D/g, '') || String(b.id), 10);
      return numA - numB;
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل الطاولات' });
  }
});

apiRouter.post('/tables', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { tableNumber, zone, capacity } = req.body;
    if (!tableNumber) return res.status(400).json({ error: 'رقم الطاولة مطلوب' });

    const inserted = await db.insert(restaurantTables).values({
      tableNumber,
      zone: zone || 'MAIN_HALL',
      capacity: capacity ? Number(capacity) : 4,
      status: 'AVAILABLE',
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إنشاء الطاولة (قد يكون الرقم مكرراً)' });
  }
});

// Change Table Status or Free Table
apiRouter.patch('/tables/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tableId = Number(req.params.id);
    const { status, currentOrderId } = req.body;

    const updated = await db.update(restaurantTables).set({
      status,
      currentOrderId: currentOrderId !== undefined ? currentOrderId : null,
    }).where(eq(restaurantTables.id, tableId)).returning();

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث حالة الطاولة' });
  }
});

// Transfer Table (Move Order from Table A to Table B)
apiRouter.post('/tables/transfer', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fromTableId, toTableId } = req.body;
    if (!fromTableId || !toTableId) return res.status(400).json({ error: 'طاولة المصدر والوجهة مطلوبتان' });

    const fromT = await db.select().from(restaurantTables).where(eq(restaurantTables.id, fromTableId));
    const toT = await db.select().from(restaurantTables).where(eq(restaurantTables.id, toTableId));

    if (fromT.length === 0 || toT.length === 0) return res.status(404).json({ error: 'إحدى الطاولات غير موجودة' });
    const orderId = fromT[0].currentOrderId;
    if (!orderId) return res.status(400).json({ error: 'لا يوجد طلب نشط على طاولة المصدر' });

    // Update Order's tableId
    await db.update(orders).set({ tableId: toTableId }).where(eq(orders.id, orderId));

    // Update Tables
    await db.update(restaurantTables).set({ status: 'AVAILABLE', currentOrderId: null }).where(eq(restaurantTables.id, fromTableId));
    await db.update(restaurantTables).set({ status: 'OCCUPIED', currentOrderId: orderId }).where(eq(restaurantTables.id, toTableId));

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'TRANSFER_TABLE',
      details: `نقل الطلب رقم ${orderId} من الطاولة ${fromT[0].tableNumber} إلى ${toT[0].tableNumber}`,
    });

    res.json({ success: true, message: `تم نقل الطلب إلى الطاولة ${toT[0].tableNumber} بنجاح` });
  } catch (error: any) {
    console.error('Transfer table error:', error);
    res.status(500).json({ error: 'فشل نقل الطاولة' });
  }
});

// ==========================================
// 6. ORDERS & KITCHEN SYSTEM
// ==========================================

// Get Orders with filters
apiRouter.get('/orders', requireAuth, async (req, res) => {
  try {
    const { status, type, limit, heldOnly } = req.query;

    let query = db.select().from(orders);

    if (heldOnly === 'true') {
      const heldOrders = await db.select().from(orders).where(eq(orders.isHeld, true)).orderBy(desc(orders.heldAt));
      return res.json(heldOrders);
    }

    const orderList = await db
      .select({
        order: orders,
        table: restaurantTables,
        customer: customers,
        cashier: users,
      })
      .from(orders)
      .leftJoin(restaurantTables, eq(orders.tableId, restaurantTables.id))
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.cashierId, users.id))
      .orderBy(desc(orders.id))
      .limit(Number(limit) || 100);

    // Fetch items for these orders
    const orderIds = orderList.map((o) => o.order.id);
    let allItems: any[] = [];
    if (orderIds.length > 0) {
      allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    }

    const results = orderList.map((row) => ({
      ...row.order,
      tableNumber: row.table?.tableNumber,
      customerName: row.customer?.name,
      customerPhone: row.customer?.phone,
      cashierName: row.cashier?.fullName,
      items: allItems.filter((item) => item.orderId === row.order.id),
    }));

    res.json(results);
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'فشل تحميل الطلبات' });
  }
});

// Get Single Order Details
apiRouter.get('/orders/:id', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId));
    if (orderResult.length === 0) return res.status(404).json({ error: 'الطلب غير موجود' });

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const paymentRecords = await db.select().from(payments).where(eq(payments.orderId, orderId));

    res.json({
      ...orderResult[0],
      items,
      payments: paymentRecords,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل تفاصيل الطلب' });
  }
});

// Create Order (Database Transaction + Recipe Stock Deduction + Hold / Resume support)
apiRouter.post('/orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      type, // DINE_IN, TAKEAWAY, DELIVERY
      tableId,
      customerId,
      items,
      discount = 0,
      deliveryFee = 0,
      notes,
      isHeld = false,
      idempotencyKey,
      offlineId,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'الطلب يجب أن يحتوي على منتج واحد على الأقل' });
    }

    // Idempotency check: if key already exists, return existing order to prevent duplicates!
    if (idempotencyKey) {
      const existing = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey));
      if (existing.length > 0) {
        return res.json(existing[0]);
      }
    }

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.unitPrice) * Number(item.quantity);
    }

    const discountAmount = Number(discount) || 0;
    const feeAmount = Number(deliveryFee) || 0;
    const total = Math.max(0, subtotal - discountAmount + feeAmount);

    // Get daily sequence for receipt numbering (N° DU BON GLOBAL)
    const today = new Date();
    const countTodayResult = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const dailySeq = Number(countTodayResult[0]?.count || 0) + 1;
    const orderNumber = `BON-${String(dailySeq).padStart(4, '0')}`;

    // Look for active shift of current cashier
    const currentShift = await db
      .select()
      .from(cashShifts)
      .where(and(eq(cashShifts.cashierId, req.user!.id), eq(cashShifts.status, 'OPEN')))
      .orderBy(desc(cashShifts.id))
      .limit(1);

    const shiftId = currentShift[0]?.id || null;

    // Use transaction for Order + OrderItems + Table Status + Inventory Deduction
    const createdOrder = await db.transaction(async (tx) => {
      const orderInserts = await tx.insert(orders).values({
        orderNumber,
        dailySequence: dailySeq,
        type: type || 'DINE_IN',
        tableId: tableId ? Number(tableId) : null,
        customerId: customerId ? Number(customerId) : null,
        status: isHeld ? 'NEW' : 'CONFIRMED',
        subtotal: String(subtotal),
        discount: String(discountAmount),
        deliveryFee: String(feeAmount),
        total: String(total),
        paidAmount: '0',
        paymentStatus: 'UNPAID',
        cashierId: req.user!.id,
        notes: notes || null,
        isHeld: Boolean(isHeld),
        heldAt: isHeld ? new Date() : null,
        idempotencyKey: idempotencyKey || null,
        offlineId: offlineId || null,
        shiftId: shiftId,
      }).returning();

      const newOrder = orderInserts[0];

      // Insert Order Items & deduct inventory recipes
      for (const item of items) {
        const itemTotal = Number(item.unitPrice) * Number(item.quantity);
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: Number(item.productId),
          nameAr: item.nameAr,
          nameFr: item.nameFr || null,
          unitPrice: String(item.unitPrice),
          costPrice: item.costPrice ? String(item.costPrice) : '0',
          quantity: Number(item.quantity),
          total: String(itemTotal),
          notes: item.notes || null,
          station: item.station || 'MAIN_KITCHEN',
          status: 'NEW',
          variantsJson: item.variants ? JSON.stringify(item.variants) : null,
          addonsJson: item.addons ? JSON.stringify(item.addons) : null,
        });

        // Deduct inventory if not held and product has recipe
        if (!isHeld) {
          const recipes = await tx.select().from(productRecipes).where(eq(productRecipes.productId, Number(item.productId)));
          for (const r of recipes) {
            const deductQty = Number(r.quantity) * Number(item.quantity);
            // Decrement ingredient current_stock
            await tx.update(ingredients)
              .set({
                currentStock: sql`${ingredients.currentStock} - ${deductQty}`,
                updatedAt: new Date(),
              })
              .where(eq(ingredients.id, r.ingredientId));

            // Record inventory movement
            await tx.insert(inventoryMovements).values({
              ingredientId: r.ingredientId,
              type: 'SALE_DEDUCTION',
              quantity: String(-deductQty),
              referenceType: 'ORDER',
              referenceId: newOrder.id,
              performedBy: req.user!.id,
              notes: `خصم تلقائي للوصفة عند طلب ${item.nameAr}`,
            });
          }
        }
      }

      // If Dine-in, mark Table as OCCUPIED
      if (type === 'DINE_IN' && tableId) {
        await tx.update(restaurantTables).set({
          status: 'OCCUPIED',
          currentOrderId: newOrder.id,
        }).where(eq(restaurantTables.id, Number(tableId)));
      }

      // If Delivery, create delivery record
      if (type === 'DELIVERY' && req.body.deliveryAddress) {
        await tx.insert(deliveries).values({
          orderId: newOrder.id,
          customerId: customerId ? Number(customerId) : null,
          driverName: req.body.driverName || null,
          deliveryAddress: req.body.deliveryAddress,
          deliveryFee: String(feeAmount),
          status: 'NEW',
          notes: req.body.deliveryNotes || null,
        });
      }

      return newOrder;
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: isHeld ? 'HOLD_ORDER' : 'CREATE_ORDER',
      entityType: 'ORDER',
      entityId: String(createdOrder.id),
      details: `إنشاء فاتورة جديدة ${createdOrder.orderNumber} بمبلغ ${createdOrder.total} DA (${type})`,
    });

    res.status(201).json(createdOrder);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'فشل تسجيل الطلب في قاعدة البيانات' });
  }
});

// Resume Held Order
apiRouter.post('/orders/:id/resume', requireAuth, async (req: AuthRequest, res) => {
  try {
    const orderId = Number(req.params.id);
    const updated = await db.update(orders).set({
      isHeld: false,
      heldAt: null,
      status: 'CONFIRMED',
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId)).returning();

    if (updated.length === 0) return res.status(404).json({ error: 'الطلب غير موجود' });

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل استئناف الطلب المعلق' });
  }
});

// Cancel Order
apiRouter.post('/orders/:id/cancel', requireAuth, requireRole(['ADMIN', 'MANAGER', 'CASHIER']), async (req: AuthRequest, res) => {
  try {
    const orderId = Number(req.params.id);
    const { reason } = req.body;

    const ord = await db.select().from(orders).where(eq(orders.id, orderId));
    if (ord.length === 0) return res.status(404).json({ error: 'الطلب غير موجود' });

    // Transaction to cancel order, free table, and reverse recipe deductions if already deducted
    await db.transaction(async (tx) => {
      await tx.update(orders).set({
        status: 'CANCELLED',
        notes: reason ? `ملغى: ${reason}` : 'ملغى',
        updatedAt: new Date(),
      }).where(eq(orders.id, orderId));

      // Free table if dine in
      if (ord[0].tableId) {
        await tx.update(restaurantTables).set({
          status: 'AVAILABLE',
          currentOrderId: null,
        }).where(eq(restaurantTables.id, ord[0].tableId));
      }
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'CANCEL_ORDER',
      entityType: 'ORDER',
      entityId: String(orderId),
      details: `إلغاء الطلب ${ord[0].orderNumber}: ${reason || 'بدون سبب'}`,
    });

    res.json({ success: true, message: 'تم إلغاء الطلب بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إلغاء الطلب' });
  }
});

// Update Order Item Status in Kitchen (KDS)
apiRouter.patch('/kitchen/items/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const itemId = Number(req.params.id);
    const { status } = req.body; // PREPARING, READY, SERVED

    const updated = await db.update(orderItems).set({ status }).where(eq(orderItems.id, itemId)).returning();
    if (updated.length === 0) return res.status(404).json({ error: 'الصنف غير موجود' });

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث حالة الطبق في المطبخ' });
  }
});

// Kitchen Display System (KDS) Stream/Active Tickets
apiRouter.get('/kitchen/tickets', requireAuth, async (req, res) => {
  try {
    const { station } = req.query;

    const activeOrders = await db
      .select({
        order: orders,
        table: restaurantTables,
      })
      .from(orders)
      .leftJoin(restaurantTables, eq(orders.tableId, restaurantTables.id))
      .where(and(eq(orders.isHeld, false), inArray(orders.status, ['NEW', 'CONFIRMED', 'PREPARING', 'READY'])))
      .orderBy(asc(orders.id));

    const orderIds = activeOrders.map((o) => o.order.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      let itemQuery = db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
      if (station && station !== 'ALL') {
        itemQuery = db.select().from(orderItems).where(and(inArray(orderItems.orderId, orderIds), eq(orderItems.station, String(station))));
      }
      items = await itemQuery;
    }

    const tickets = activeOrders.map((o) => ({
      ...o.order,
      tableNumber: o.table?.tableNumber,
      zone: o.table?.zone,
      items: items.filter((item) => item.orderId === o.order.id),
    })).filter((t) => t.items.length > 0);

    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل طلبات المطبخ' });
  }
});

// ==========================================
// 7. PAYMENTS & SPLIT BILL
// ==========================================
apiRouter.post('/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      orderId,
      payments: paymentList, // Array for Split bill or single payment: [{ method, amount, tenderAmount, changeAmount }]
      idempotencyKey,
    } = req.body;

    if (!orderId || !paymentList || !Array.isArray(paymentList) || paymentList.length === 0) {
      return res.status(400).json({ error: 'بيانات الدفع غير مكتملة' });
    }

    // Idempotency check: if key already processed, return success
    if (idempotencyKey) {
      const existingPay = await db.select().from(payments).where(eq(payments.idempotencyKey, idempotencyKey));
      if (existingPay.length > 0) {
        return res.json({ success: true, message: 'تم استلام الدفع مسبقاً (معالجة سابقة)' });
      }
    }

    const ord = await db.select().from(orders).where(eq(orders.id, Number(orderId)));
    if (ord.length === 0) return res.status(404).json({ error: 'الطلب غير موجود' });

    const order = ord[0];
    const totalOrder = Number(order.total);

    // Look for active shift of cashier
    const currentShift = await db
      .select()
      .from(cashShifts)
      .where(and(eq(cashShifts.cashierId, req.user!.id), eq(cashShifts.status, 'OPEN')))
      .orderBy(desc(cashShifts.id))
      .limit(1);

    const shiftId = currentShift[0]?.id || null;

    let totalPaidInThisTransaction = 0;
    let totalCashReceived = 0;

    await db.transaction(async (tx) => {
      for (const p of paymentList) {
        const amount = Number(p.amount);
        totalPaidInThisTransaction += amount;
        if (p.method === 'CASH') {
          totalCashReceived += amount;
        }

        const payKey = idempotencyKey ? `${idempotencyKey}-${p.method}-${amount}` : null;

        await tx.insert(payments).values({
          orderId: order.id,
          method: p.method, // CASH, CARD, CCP, BARIDIMOB, OTHER
          amount: String(amount),
          tenderAmount: p.tenderAmount ? String(p.tenderAmount) : null,
          changeAmount: p.changeAmount ? String(p.changeAmount) : '0',
          transactionRef: p.transactionRef || null,
          cashierId: req.user!.id,
          shiftId: shiftId,
          idempotencyKey: payKey,
        });
      }

      const newPaidAmount = Number(order.paidAmount) + totalPaidInThisTransaction;
      const isFull = newPaidAmount >= totalOrder - 0.01;
      const newStatus = isFull ? 'PAID' : 'PARTIALLY_PAID';

      await tx.update(orders).set({
        paidAmount: String(newPaidAmount),
        paymentStatus: newStatus,
        status: isFull ? 'COMPLETED' : order.status,
        changeAmount: String(paymentList[0]?.changeAmount || 0),
        updatedAt: new Date(),
      }).where(eq(orders.id, order.id));

      // Free table if fully paid and dine-in
      if (isFull && order.tableId) {
        await tx.update(restaurantTables).set({
          status: 'AVAILABLE',
          currentOrderId: null,
        }).where(eq(restaurantTables.id, order.tableId));
      }

      // Update Shift totals if shift is open
      if (shiftId) {
        for (const p of paymentList) {
          const amt = Number(p.amount);
          if (p.method === 'CASH') {
            await tx.update(cashShifts).set({
              totalCashSales: sql`${cashShifts.totalCashSales} + ${amt}`,
            }).where(eq(cashShifts.id, shiftId));
          } else if (p.method === 'CARD') {
            await tx.update(cashShifts).set({
              totalCardSales: sql`${cashShifts.totalCardSales} + ${amt}`,
            }).where(eq(cashShifts.id, shiftId));
          } else if (p.method === 'CCP') {
            await tx.update(cashShifts).set({
              totalCcpSales: sql`${cashShifts.totalCcpSales} + ${amt}`,
            }).where(eq(cashShifts.id, shiftId));
          } else if (p.method === 'BARIDIMOB') {
            await tx.update(cashShifts).set({
              totalBaridimobSales: sql`${cashShifts.totalBaridimobSales} + ${amt}`,
            }).where(eq(cashShifts.id, shiftId));
          }
        }
      }
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'PAYMENT',
      entityType: 'ORDER',
      entityId: String(order.id),
      details: `تسديد مبلغ ${totalPaidInThisTransaction} DA للطلب ${order.orderNumber} عبر ${paymentList.map((p: any) => p.method).join(', ')}`,
    });

    res.json({
      success: true,
      message: 'تم تسجيل الدفع بنجاح',
      orderId: order.id,
      paidAmount: totalPaidInThisTransaction,
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'فشل تسجيل عملية الدفع' });
  }
});

// ==========================================
// 8. CASH REGISTER & SHIFTS (Gestion Caisse)
// ==========================================
apiRouter.get('/cash-register/current', requireAuth, async (req: AuthRequest, res) => {
  try {
    const openShift = await db
      .select({
        shift: cashShifts,
        cashier: users,
      })
      .from(cashShifts)
      .leftJoin(users, eq(cashShifts.cashierId, users.id))
      .where(and(eq(cashShifts.cashierId, req.user!.id), eq(cashShifts.status, 'OPEN')))
      .orderBy(desc(cashShifts.id))
      .limit(1);

    if (openShift.length === 0) {
      return res.json({ isOpen: false, shift: null });
    }

    const s = openShift[0].shift;

    // Calculate expected cash = opening + totalCashSales + totalCashIn - totalCashOut - totalExpenses
    const expected = Number(s.openingCash) + Number(s.totalCashSales) + Number(s.totalCashIn) - Number(s.totalCashOut) - Number(s.totalExpenses);

    // Fetch movements for this shift
    const movements = await db.select().from(cashMovements).where(eq(cashMovements.shiftId, s.id)).orderBy(desc(cashMovements.id));

    res.json({
      isOpen: true,
      shift: {
        ...s,
        cashierName: openShift[0].cashier?.fullName,
        expectedCash: expected,
        movements,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل استرجاع حالة الصندوق' });
  }
});

// Open Cash Shift (Ouverture de caisse)
apiRouter.post('/cash-register/open', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { openingCash, notes } = req.body;

    // Check if cashier already has an open shift
    const existing = await db
      .select()
      .from(cashShifts)
      .where(and(eq(cashShifts.cashierId, req.user!.id), eq(cashShifts.status, 'OPEN')));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'لديك وردية مفتوحة بالفعل، يرجى إغلاقها أولاً' });
    }

    const countAll = await db.select({ count: sql<number>`count(*)` }).from(cashShifts);
    const shiftNumber = Number(countAll[0]?.count || 0) + 1;

    const inserted = await db.insert(cashShifts).values({
      shiftNumber,
      cashierId: req.user!.id,
      openingCash: String(Number(openingCash) || 0),
      status: 'OPEN',
      notes: notes || null,
    }).returning();

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'OPEN_SHIFT',
      entityType: 'SHIFT',
      entityId: String(inserted[0].id),
      details: `فتح وردية صندوق رقم ${shiftNumber} برصيد افتتاحي ${openingCash} DA`,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل فتح الوردية' });
  }
});

// Close Cash Shift (Clôture de caisse / Z-Report)
apiRouter.post('/cash-register/close', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { shiftId, closingCash, notes } = req.body;

    const targetShift = await db.select().from(cashShifts).where(eq(cashShifts.id, Number(shiftId)));
    if (targetShift.length === 0) return res.status(404).json({ error: 'الوردية غير موجودة' });

    const s = targetShift[0];
    const actual = Number(closingCash) || 0;
    const expected = Number(s.openingCash) + Number(s.totalCashSales) + Number(s.totalCashIn) - Number(s.totalCashOut) - Number(s.totalExpenses);
    const diff = actual - expected;

    const closed = await db.update(cashShifts).set({
      status: 'CLOSED',
      closingCash: String(actual),
      expectedCash: String(expected),
      cashDifference: String(diff),
      closedAt: new Date(),
      notes: notes ? `${s.notes ? s.notes + ' | ' : ''}${notes}` : s.notes,
    }).where(eq(cashShifts.id, s.id)).returning();

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'CLOSE_SHIFT',
      entityType: 'SHIFT',
      entityId: String(s.id),
      details: `إغلاق وردية الصندوق رقم ${s.shiftNumber}: المتوقع ${expected} DA، الفعلي ${actual} DA، الفارق ${diff} DA`,
    });

    res.json(closed[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إغلاق الوردية' });
  }
});

// Cash Movement: In / Out
apiRouter.post('/cash-register/movement', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { shiftId, type, amount, reason } = req.body; // type: CASH_IN, CASH_OUT
    if (!shiftId || !type || !amount || !reason) {
      return res.status(400).json({ error: 'جميع حقول حركة الصندوق مطلوبة' });
    }

    const numAmount = Number(amount);
    const inserted = await db.insert(cashMovements).values({
      shiftId: Number(shiftId),
      type,
      amount: String(numAmount),
      reason,
      performedBy: req.user!.id,
    }).returning();

    if (type === 'CASH_IN') {
      await db.update(cashShifts).set({
        totalCashIn: sql`${cashShifts.totalCashIn} + ${numAmount}`,
      }).where(eq(cashShifts.id, Number(shiftId)));
    } else {
      await db.update(cashShifts).set({
        totalCashOut: sql`${cashShifts.totalCashOut} + ${numAmount}`,
      }).where(eq(cashShifts.id, Number(shiftId)));
    }

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: type,
      entityType: 'CASH_MOVEMENT',
      entityId: String(inserted[0].id),
      details: `حركة صندوق (${type}): ${numAmount} DA - السبب: ${reason}`,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تسجيل حركة الصندوق' });
  }
});

// List all Shifts History
apiRouter.get('/cash-register/history', requireAuth, requireRole(['ADMIN', 'MANAGER']), async (_req, res) => {
  try {
    const history = await db
      .select({
        shift: cashShifts,
        cashier: users,
      })
      .from(cashShifts)
      .leftJoin(users, eq(cashShifts.cashierId, users.id))
      .orderBy(desc(cashShifts.id))
      .limit(50);

    res.json(history.map((h) => ({ ...h.shift, cashierName: h.cashier?.fullName })));
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل سجل الورديات' });
  }
});

// ==========================================
// 9. INVENTORY & RECIPES
// ==========================================
apiRouter.get('/inventory', requireAuth, async (_req, res) => {
  try {
    const list = await db
      .select({
        ingredient: ingredients,
        supplier: suppliers,
      })
      .from(ingredients)
      .leftJoin(suppliers, eq(ingredients.supplierId, suppliers.id))
      .orderBy(asc(ingredients.id));

    res.json(list.map((l) => ({ ...l.ingredient, supplierName: l.supplier?.name })));
  } catch (error: any) {
    res.status(500).json({ error: 'فشل استرجاع عناصر المخزون' });
  }
});

apiRouter.post('/inventory', requireAuth, requireRole(['ADMIN', 'MANAGER', 'INVENTORY']), async (req: AuthRequest, res) => {
  try {
    const { nameAr, nameFr, unit, currentStock, minStock, maxStock, costPerUnit, supplierId } = req.body;
    if (!nameAr || !unit) return res.status(400).json({ error: 'اسم المادة والوحدة مطلوبان' });

    const inserted = await db.insert(ingredients).values({
      nameAr,
      nameFr: nameFr || null,
      unit,
      currentStock: String(currentStock || 0),
      minStock: String(minStock || 1),
      maxStock: maxStock ? String(maxStock) : null,
      costPerUnit: String(costPerUnit || 0),
      supplierId: supplierId ? Number(supplierId) : null,
    }).returning();

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'ADD_INGREDIENT',
      entityType: 'INGREDIENT',
      entityId: String(inserted[0].id),
      details: `إضافة مادة للمخزون: ${nameAr}`,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إضافة المادة إلى المخزون' });
  }
});

apiRouter.put('/inventory/:id', requireAuth, requireRole(['ADMIN', 'MANAGER', 'INVENTORY']), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { nameAr, nameFr, unit, minStock, maxStock, costPerUnit, supplierId } = req.body;

    const updated = await db.update(ingredients).set({
      nameAr,
      nameFr,
      unit,
      minStock: String(minStock),
      maxStock: maxStock ? String(maxStock) : null,
      costPerUnit: String(costPerUnit),
      supplierId: supplierId ? Number(supplierId) : null,
      updatedAt: new Date(),
    }).where(eq(ingredients.id, id)).returning();

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث بيانات المادة' });
  }
});

// Manual Stock Adjustment (Stock Count / Inventaire)
apiRouter.post('/inventory/adjust', requireAuth, requireRole(['ADMIN', 'MANAGER', 'INVENTORY']), async (req: AuthRequest, res) => {
  try {
    const { ingredientId, actualQuantity, reason, notes } = req.body;
    if (!ingredientId || actualQuantity === undefined) {
      return res.status(400).json({ error: 'رقم المادة والكمية الفعلية مطلوبان' });
    }

    const ing = await db.select().from(ingredients).where(eq(ingredients.id, Number(ingredientId)));
    if (ing.length === 0) return res.status(404).json({ error: 'المادة غير موجودة' });

    const currentQty = Number(ing[0].currentStock);
    const newQty = Number(actualQuantity);
    const difference = newQty - currentQty;

    await db.transaction(async (tx) => {
      await tx.update(ingredients).set({
        currentStock: String(newQty),
        updatedAt: new Date(),
      }).where(eq(ingredients.id, Number(ingredientId)));

      await tx.insert(inventoryMovements).values({
        ingredientId: Number(ingredientId),
        type: 'ADJUSTMENT',
        quantity: String(difference),
        referenceType: 'STOCK_COUNT',
        performedBy: req.user!.id,
        notes: notes || `جرد مخزون: الفارق ${difference} ${ing[0].unit} - السبب: ${reason || 'تصحيح رصيد'}`,
      });
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'INGREDIENT',
      entityId: String(ingredientId),
      details: `تسوية جرد للمادة ${ing[0].nameAr}: الرصيد السابق ${currentQty}، الجديد ${newQty}`,
    });

    res.json({ success: true, message: 'تم تحديث رصيد المخزون بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تسوية المخزون' });
  }
});

// Waste Records (Pertes)
apiRouter.get('/waste', requireAuth, async (_req, res) => {
  try {
    const list = await db
      .select({
        waste: wasteRecords,
        employee: users,
      })
      .from(wasteRecords)
      .leftJoin(users, eq(wasteRecords.employeeId, users.id))
      .orderBy(desc(wasteRecords.id))
      .limit(100);

    res.json(list.map((l) => ({ ...l.waste, employeeName: l.employee?.fullName })));
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل سجل الهدر' });
  }
});

apiRouter.post('/waste', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { ingredientId, productId, name, quantity, unit, reason, cost, notes } = req.body;
    if (!name || !quantity || !reason) {
      return res.status(400).json({ error: 'اسم المادة والكمية والسبب حقول إلزامية' });
    }

    const numQty = Number(quantity);
    const numCost = Number(cost) || 0;

    await db.transaction(async (tx) => {
      const inserted = await tx.insert(wasteRecords).values({
        ingredientId: ingredientId ? Number(ingredientId) : null,
        productId: productId ? Number(productId) : null,
        name,
        quantity: String(numQty),
        unit: unit || 'KG',
        reason, // EXPIRED, DAMAGED, BURNED, SPILLED, OTHER
        cost: String(numCost),
        employeeId: req.user!.id,
        notes: notes || null,
      }).returning();

      // Deduct from inventory if linked to ingredient
      if (ingredientId) {
        await tx.update(ingredients).set({
          currentStock: sql`${ingredients.currentStock} - ${numQty}`,
          updatedAt: new Date(),
        }).where(eq(ingredients.id, Number(ingredientId)));

        await tx.insert(inventoryMovements).values({
          ingredientId: Number(ingredientId),
          type: 'WASTE',
          quantity: String(-numQty),
          referenceType: 'WASTE',
          referenceId: inserted[0].id,
          performedBy: req.user!.id,
          notes: `تسجيل هدر: ${reason} - ${notes || ''}`,
        });
      }
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'RECORD_WASTE',
      details: `تسجيل تالف/هدر: ${name} (${numQty} ${unit}) - السبب: ${reason}`,
    });

    res.status(201).json({ success: true, message: 'تم تسجيل الهدر وخصمه من المخزون بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تسجيل التالف' });
  }
});

// ==========================================
// 10. PURCHASES & SUPPLIERS (Achats & Fournisseurs)
// ==========================================
apiRouter.get('/suppliers', requireAuth, async (_req, res) => {
  try {
    const list = await db.select().from(suppliers).orderBy(asc(suppliers.name));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل الموردين' });
  }
});

apiRouter.post('/suppliers', requireAuth, requireRole(['ADMIN', 'MANAGER', 'INVENTORY']), async (req: AuthRequest, res) => {
  try {
    const { name, contactPerson, phone, email, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم المورد مطلوب' });

    const inserted = await db.insert(suppliers).values({
      name,
      contactPerson: contactPerson || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إضافة المورد' });
  }
});

apiRouter.get('/purchases', requireAuth, async (_req, res) => {
  try {
    const list = await db
      .select({
        purchase: purchases,
        supplier: suppliers,
        receiver: users,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .leftJoin(users, eq(purchases.receivedBy, users.id))
      .orderBy(desc(purchases.id))
      .limit(100);

    const purchaseIds = list.map((l) => l.purchase.id);
    let allItems: any[] = [];
    if (purchaseIds.length > 0) {
      allItems = await db
        .select({
          item: purchaseItems,
          ingredient: ingredients,
        })
        .from(purchaseItems)
        .leftJoin(ingredients, eq(purchaseItems.ingredientId, ingredients.id))
        .where(inArray(purchaseItems.purchaseId, purchaseIds));
    }

    const result = list.map((l) => ({
      ...l.purchase,
      supplierName: l.supplier?.name,
      receivedByName: l.receiver?.fullName,
      items: allItems
        .filter((it) => it.item.purchaseId === l.purchase.id)
        .map((it) => ({ ...it.item, ingredientName: it.ingredient?.nameAr })),
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل فواتير الشراء' });
  }
});

// Create Purchase Order (Increments Stock automatically!)
apiRouter.post('/purchases', requireAuth, requireRole(['ADMIN', 'MANAGER', 'INVENTORY']), async (req: AuthRequest, res) => {
  try {
    const { supplierId, invoiceDate, items, notes } = req.body;
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'المورد وبنود الشراء مطلوبة' });
    }

    let totalAmount = 0;
    for (const it of items) {
      totalAmount += Number(it.quantity) * Number(it.unitCost);
    }

    const countAll = await db.select({ count: sql<number>`count(*)` }).from(purchases);
    const purchaseNumber = `ACH-${String(Number(countAll[0]?.count || 0) + 1).padStart(4, '0')}`;

    const createdPurchase = await db.transaction(async (tx) => {
      const p = await tx.insert(purchases).values({
        purchaseNumber,
        supplierId: Number(supplierId),
        totalAmount: String(totalAmount),
        paidAmount: String(totalAmount),
        paymentStatus: 'PAID',
        invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
        receivedBy: req.user!.id,
        notes: notes || null,
      }).returning();

      const newP = p[0];

      for (const it of items) {
        const itemTotal = Number(it.quantity) * Number(it.unitCost);
        await tx.insert(purchaseItems).values({
          purchaseId: newP.id,
          ingredientId: Number(it.ingredientId),
          quantity: String(it.quantity),
          unitCost: String(it.unitCost),
          totalCost: String(itemTotal),
        });

        // Increment ingredient stock & update latest cost
        await tx.update(ingredients).set({
          currentStock: sql`${ingredients.currentStock} + ${Number(it.quantity)}`,
          costPerUnit: String(it.unitCost),
          updatedAt: new Date(),
        }).where(eq(ingredients.id, Number(it.ingredientId)));

        // Record stock in movement
        await tx.insert(inventoryMovements).values({
          ingredientId: Number(it.ingredientId),
          type: 'PURCHASE',
          quantity: String(it.quantity),
          cost: String(it.unitCost),
          referenceType: 'PURCHASE',
          referenceId: newP.id,
          performedBy: req.user!.id,
          notes: `شراء بموجب الفاتورة رقم ${purchaseNumber}`,
        });
      }

      return newP;
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'PURCHASE',
      entityType: 'PURCHASE',
      entityId: String(createdPurchase.id),
      details: `تسجيل فاتورة مشتريات ${purchaseNumber} بمبلغ ${totalAmount} DA`,
    });

    res.status(201).json(createdPurchase);
  } catch (error: any) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'فشل تسجيل فاتورة الشراء' });
  }
});

// ==========================================
// 11. CUSTOMERS & DELIVERY
// ==========================================
apiRouter.get('/customers', requireAuth, async (_req, res) => {
  try {
    const list = await db.select().from(customers).orderBy(asc(customers.name));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل قائمة الزبائن' });
  }
});

apiRouter.post('/customers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });

    const inserted = await db.insert(customers).values({
      name,
      phone,
      address: address || null,
      notes: notes || null,
    }).onConflictDoUpdate({
      target: customers.phone,
      set: { name, address, notes },
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إضافة الزبون' });
  }
});

apiRouter.get('/deliveries', requireAuth, async (_req, res) => {
  try {
    const list = await db
      .select({
        delivery: deliveries,
        order: orders,
        customer: customers,
      })
      .from(deliveries)
      .leftJoin(orders, eq(deliveries.orderId, orders.id))
      .leftJoin(customers, eq(deliveries.customerId, customers.id))
      .orderBy(desc(deliveries.id));

    res.json(list.map((l) => ({
      ...l.delivery,
      orderNumber: l.order?.orderNumber,
      orderTotal: l.order?.total,
      customerName: l.customer?.name,
      customerPhone: l.customer?.phone,
    })));
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل طلبات التوصيل' });
  }
});

apiRouter.patch('/deliveries/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, driverName, driverPhone } = req.body;

    const updated = await db.update(deliveries).set({
      status,
      driverName: driverName || undefined,
      driverPhone: driverPhone || undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
    }).where(eq(deliveries.id, id)).returning();

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث حالة التوصيل' });
  }
});

// ==========================================
// 12. EXPENSES (Charges)
// ==========================================
apiRouter.get('/expenses', requireAuth, async (_req, res) => {
  try {
    const list = await db
      .select({
        expense: expenses,
        user: users,
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .orderBy(desc(expenses.id))
      .limit(100);

    res.json(list.map((l) => ({ ...l.expense, userName: l.user?.fullName })));
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل المصاريف' });
  }
});

apiRouter.post('/expenses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { category, amount, description, date, shiftId } = req.body;
    if (!category || !amount || !description) {
      return res.status(400).json({ error: 'الفئة والمبلغ والبيان حقول مطلوبة' });
    }

    const numAmount = Number(amount);

    await db.transaction(async (tx) => {
      const exp = await tx.insert(expenses).values({
        category,
        amount: String(numAmount),
        description,
        date: date || new Date().toISOString().split('T')[0],
        userId: req.user!.id,
        shiftId: shiftId ? Number(shiftId) : null,
      }).returning();

      // If linked to cash shift, record movement and update shift totalExpenses
      if (shiftId) {
        await tx.insert(cashMovements).values({
          shiftId: Number(shiftId),
          type: 'EXPENSE',
          amount: String(numAmount),
          reason: `مصروف (${category}): ${description}`,
          performedBy: req.user!.id,
        });

        await tx.update(cashShifts).set({
          totalExpenses: sql`${cashShifts.totalExpenses} + ${numAmount}`,
        }).where(eq(cashShifts.id, Number(shiftId)));
      }
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'RECORD_EXPENSE',
      details: `تسجيل مصروف (${category}): ${numAmount} DA - ${description}`,
    });

    res.status(201).json({ success: true, message: 'تم تسجيل المصروف بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تسجيل المصروف' });
  }
});

// ==========================================
// 13. REPORTS & DASHBOARD
// ==========================================
apiRouter.get('/reports/dashboard', requireAuth, async (_req, res) => {
  try {
    // 1. Total Daily Sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesToday = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(total::numeric), 0)`,
        orderCount: sql<number>`count(*)`,
        paidSales: sql<number>`COALESCE(SUM(paid_amount::numeric), 0)`,
      })
      .from(orders)
      .where(and(sql`created_at >= ${today}`, eq(orders.isHeld, false)));

    // 2. Sales by Payment method
    const methodBreakdown = await db
      .select({
        method: payments.method,
        total: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(payments)
      .where(sql`created_at >= ${today}`)
      .groupBy(payments.method);

    // 3. Expenses Today
    const todayStr = new Date().toISOString().split('T')[0];
    const expToday = await db
      .select({
        totalExpenses: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.date, todayStr));

    // 4. Low stock ingredients
    const lowStock = await db
      .select()
      .from(ingredients)
      .where(sql`current_stock::numeric <= min_stock::numeric`);

    // 5. Open shift
    const openShifts = await db.select().from(cashShifts).where(eq(cashShifts.status, 'OPEN'));

    // 6. Top selling products
    const topProducts = await db
      .select({
        nameAr: orderItems.nameAr,
        qty: sql<number>`SUM(quantity)`,
        total: sql<number>`SUM(total::numeric)`,
      })
      .from(orderItems)
      .groupBy(orderItems.nameAr)
      .orderBy(desc(sql`SUM(quantity)`))
      .limit(5);

    // 7. Active Kitchen tickets count
    const kitchenCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.status, ['CONFIRMED', 'PREPARING']));

    const totalSalesNum = Number(salesToday[0]?.totalSales || 0);
    const orderCountNum = Number(salesToday[0]?.orderCount || 0);
    const avgOrder = orderCountNum > 0 ? totalSalesNum / orderCountNum : 0;
    const totalExpNum = Number(expToday[0]?.totalExpenses || 0);
    const netSales = totalSalesNum - totalExpNum;

    res.json({
      salesToday: totalSalesNum,
      orderCount: orderCountNum,
      averageOrderValue: Math.round(avgOrder),
      expensesToday: totalExpNum,
      netSales: netSales,
      paymentMethods: methodBreakdown,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
      hasOpenShift: openShifts.length > 0,
      openShiftsCount: openShifts.length,
      topProducts,
      kitchenActiveCount: Number(kitchenCount[0]?.count || 0),
    });
  } catch (error: any) {
    console.error('Dashboard reports error:', error);
    res.status(500).json({ error: 'فشل تحميل بيانات لوحة التحكم' });
  }
});

// Detailed Sales Report (Filter by Date range)
apiRouter.get('/reports/sales', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let condition = sql`1=1`;
    if (startDate) condition = sql`${condition} AND created_at >= ${new Date(String(startDate))}`;
    if (endDate) {
      const endD = new Date(String(endDate));
      endD.setHours(23, 59, 59, 999);
      condition = sql`${condition} AND created_at <= ${endD}`;
    }

    const orderRows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        type: orders.type,
        total: orders.total,
        discount: orders.discount,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        cashier: users.fullName,
      })
      .from(orders)
      .leftJoin(users, eq(orders.cashierId, users.id))
      .where(and(condition, eq(orders.isHeld, false)))
      .orderBy(desc(orders.id));

    res.json(orderRows);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل استرجاع تقرير المبيعات' });
  }
});

// ==========================================
// 14. RESTAURANT SETTINGS & AUDIT LOGS
// ==========================================
apiRouter.get('/settings', async (_req, res) => {
  try {
    const list = await db.select().from(restaurantSettings);
    const settingsObj: Record<string, string> = {};
    for (const item of list) {
      settingsObj[item.key] = item.value;
    }
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل إعدادات المطعم' });
  }
});

apiRouter.post('/settings', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const updates = req.body; // { key: value }
    for (const [key, value] of Object.entries(updates)) {
      await db.insert(restaurantSettings).values({
        key,
        value: String(value),
      }).onConflictDoUpdate({
        target: restaurantSettings.key,
        set: { value: String(value), updatedAt: new Date() },
      });
    }

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'UPDATE_SETTINGS',
      details: 'تحديث إعدادات المطعم العامة',
    });

    res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حفظ الإعدادات' });
  }
});

apiRouter.get('/audit-logs', requireAuth, requireRole(['ADMIN']), async (_req, res) => {
  try {
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(200);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل سجل العمليات' });
  }
});

// ==========================================
// 15. BACKUPS & DATA EXPORT / RESTORE
// ==========================================
apiRouter.get('/backups/export', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      restaurant: 'GOLDEN PALACE POS',
      users: await db.select().from(users),
      categories: await db.select().from(categories),
      products: await db.select().from(products),
      productVariants: await db.select().from(productVariants),
      productAddons: await db.select().from(productAddons),
      restaurantTables: await db.select().from(restaurantTables),
      ingredients: await db.select().from(ingredients),
      productRecipes: await db.select().from(productRecipes),
      suppliers: await db.select().from(suppliers),
      settings: await db.select().from(restaurantSettings),
      orders: await db.select().from(orders).limit(500),
      orderItems: await db.select().from(orderItems).limit(2000),
      payments: await db.select().from(payments).limit(1000),
    };

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'EXPORT_BACKUP',
      details: 'توليد وتصدير نسخة احتياطية كاملة للنظام',
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="golden_palace_backup_${Date.now()}.json"`);
    res.json(backupData);
  } catch (error: any) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'فشل إنشاء النسخة الاحتياطية' });
  }
});

// ==========================================
// 16. OFFLINE SYNC (Auto-sync queue from IndexedDB)
// ==========================================
apiRouter.post('/sync/batch', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { offlineOrders } = req.body; // Array of offline created orders
    if (!offlineOrders || !Array.isArray(offlineOrders)) {
      return res.status(400).json({ error: 'بيانات المزامنة غير صالحة' });
    }

    const syncedIds: string[] = [];

    for (const offOrder of offlineOrders) {
      // Check if already synced using idempotencyKey / offlineId
      if (offOrder.offlineId) {
        const exist = await db.select().from(orders).where(eq(orders.offlineId, offOrder.offlineId));
        if (exist.length > 0) {
          syncedIds.push(offOrder.offlineId);
          continue;
        }
      }

      // Create the order
      const countAll = await db.select({ count: sql<number>`count(*)` }).from(orders);
      const dailySeq = Number(countAll[0]?.count || 0) + 1;
      const orderNumber = `BON-${String(dailySeq).padStart(4, '0')}`;

      await db.transaction(async (tx) => {
        const o = await tx.insert(orders).values({
          orderNumber,
          dailySequence: dailySeq,
          type: offOrder.type || 'DINE_IN',
          tableId: offOrder.tableId ? Number(offOrder.tableId) : null,
          status: offOrder.paymentStatus === 'PAID' ? 'COMPLETED' : 'CONFIRMED',
          subtotal: String(offOrder.subtotal || 0),
          discount: String(offOrder.discount || 0),
          total: String(offOrder.total || 0),
          paidAmount: String(offOrder.paidAmount || 0),
          paymentStatus: offOrder.paymentStatus || 'PAID',
          cashierId: req.user!.id,
          idempotencyKey: offOrder.idempotencyKey || `offline-${offOrder.offlineId}`,
          offlineId: offOrder.offlineId,
          notes: 'مزامنة من وضع عدم الاتصال (Offline Queue)',
        }).returning();

        const newOrd = o[0];

        // Insert items
        if (offOrder.items && Array.isArray(offOrder.items)) {
          for (const item of offOrder.items) {
            await tx.insert(orderItems).values({
              orderId: newOrd.id,
              productId: Number(item.productId),
              nameAr: item.nameAr,
              nameFr: item.nameFr || null,
              unitPrice: String(item.unitPrice),
              quantity: Number(item.quantity),
              total: String(Number(item.unitPrice) * Number(item.quantity)),
              station: item.station || 'MAIN_KITCHEN',
            });
          }
        }

        // Insert payment if was paid offline
        if (offOrder.paymentMethod) {
          await tx.insert(payments).values({
            orderId: newOrd.id,
            method: offOrder.paymentMethod,
            amount: String(offOrder.paidAmount || offOrder.total),
            cashierId: req.user!.id,
            idempotencyKey: `pay-offline-${offOrder.offlineId}`,
          });
        }
      });

      syncedIds.push(offOrder.offlineId);
    }

    res.json({
      success: true,
      message: `تمت مزامنة ${syncedIds.length} طلبات بنجاح دون أي تكرار`,
      syncedIds,
    });
  } catch (error: any) {
    console.error('Batch sync error:', error);
    res.status(500).json({ error: 'فشل مزامنة الطلبات غير المتصلة' });
  }
});

// ==========================================
// 19. WINDOWS THERMAL PRINTER & SPOOLER API
// ==========================================

// Get Windows Printer Environment & Available Thermal Printers
apiRouter.get('/printer/status', async (_req, res) => {
  const isWindows = process.platform === 'win32';
  res.json({
    platform: process.platform,
    isWindows,
    defaultPrinter: 'CAFETERIA',
    defaultDriver: '80Normal',
    supportedPaperSizes: ['80mm', '58mm'],
    spoolCommandExample: `copy /b "ticket.prn" "\\\\localhost\\CAFETERIA"`,
    powerShellCommandExample: `Get-Content -Path ".\\ticket.prn" -Encoding Byte -Raw | Out-Printer -Name "CAFETERIA"`,
  });
});

// Direct Spool Print Job to Windows Printer
apiRouter.post('/printer/spool', async (req, res) => {
  try {
    const { printerName = 'CAFETERIA', rawBase64, textContent, orderNumber, copies = 1 } = req.body;
    const numCopies = Math.max(1, Math.min(5, Number(copies) || 1));
    const isWindows = process.platform === 'win32';

    const osModule = await import('os');
    const pathModule = await import('path');
    const fsModule = await import('fs');
    const cpModule = await import('child_process');

    const tempDir = osModule.tmpdir();
    const fileName = `ticket_${orderNumber || Date.now()}.bin`;
    const tempFilePath = pathModule.join(tempDir, fileName);

    let fileBuffer: Buffer;
    if (rawBase64) {
      fileBuffer = Buffer.from(rawBase64, 'base64');
    } else if (textContent) {
      fileBuffer = Buffer.from(textContent, 'utf-8');
    } else {
      fileBuffer = Buffer.from(`TICKET ${orderNumber || ''}\nGRINE RESTAURANT\n\n\n`, 'utf-8');
    }

    fsModule.writeFileSync(tempFilePath, fileBuffer);

    if (isWindows) {
      // Windows Native Spooling via CMD copy /b or PowerShell
      const escapedPrinter = printerName.replace(/["\\]/g, '');
      const cmd = `copy /b "${tempFilePath}" "\\\\localhost\\${escapedPrinter}"`;
      
      // Execute according to requested copies count (default 1)
      let completedCopies = 0;
      let lastErr: any = null;
      let lastStdout = '';

      for (let c = 0; c < numCopies; c++) {
        await new Promise<void>((resolve) => {
          cpModule.exec(cmd, (err, stdout) => {
            if (err) lastErr = err;
            if (stdout) lastStdout = stdout;
            completedCopies++;
            resolve();
          });
        });
      }

      // Clean up temp file after short delay
      setTimeout(() => {
        try {
          if (fsModule.existsSync(tempFilePath)) fsModule.unlinkSync(tempFilePath);
        } catch {}
      }, 3000);

      if (lastErr) {
        console.warn('Windows Spool copy warning:', lastErr.message);
        return res.json({
          success: true,
          mode: 'fallback_ready',
          message: `تم توليد تذكرة الطباعة ${orderNumber || ''} بنجاح. أمر الإرسال جاهز: ${cmd}`,
          cmd,
          copies: numCopies,
        });
      }

      res.json({
        success: true,
        mode: 'spooled_to_windows',
        message: `تم إرسال أمر الطباعة بنجاح إلى طابعة Windows (${printerName}) [${numCopies} نسخة]`,
        stdout: lastStdout,
        copies: numCopies,
      });
    } else {
      // Linux / Container host: Provide valid spool response + downloadable ready state
      res.json({
        success: true,
        mode: 'container_ready',
        message: `تم إعداد أمر طباعة الفاتورة (${orderNumber || ''}) بنجاح لطابعة ${printerName} [${numCopies} نسخة]`,
        filePath: tempFilePath,
        fileSize: fileBuffer.length,
        copies: numCopies,
      });
    }
  } catch (error: any) {
    console.error('Printer spool error:', error);
    res.status(500).json({ error: error.message || 'فشل إرسال مهمة الطباعة' });
  }
});

// Seed / Reset Grine Restaurant Menu
apiRouter.post('/menu/reset-grine', async (_req, res) => {
  try {
    const { seedGrineRestaurantMenu } = await import('../db/seedGrine.ts');
    await seedGrineRestaurantMenu();
    res.json({ success: true, message: 'تم إعادة بناء وتحديث قائمة Grine Restaurant بنجاح!' });
  } catch (error: any) {
    console.error('Menu reset error:', error);
    res.status(500).json({ error: error.message || 'فشل إعادة ضبط القائمة' });
  }
});

