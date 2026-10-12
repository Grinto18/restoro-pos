import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { usePos } from '../context/PosContext.tsx';
import { api } from '../services/api.ts';
import { printerService } from '../services/printerService.ts';
import { PrinterProfile } from '../types.ts';
import {
  Settings,
  X,
  Users,
  Database,
  Printer,
  Shield,
  Save,
  Download,
  Upload,
  Plus,
  Lock,
  Key,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Terminal,
  FileText,
  ChevronDown,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { user } = useAuth();
  const { setReceiptToPrint, openCashDrawer } = usePos();
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'STAFF' | 'BACKUP' | 'PRINTER'>('GENERAL');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Printer Profile State
  const [printerProfile, setPrinterProfile] = useState<PrinterProfile>(printerService.getProfile());
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [showTroubleshootDetails, setShowTroubleshootDetails] = useState<boolean>(true);

  // New staff modal
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('1234');
  const [newRole, setNewRole] = useState<string>('CASHIER');

  useEffect(() => {
    loadSettings();
    loadStaff();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadStaff = async () => {
    try {
      const u = await api.getUsers();
      setStaffUsers(u);
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.updateSettings(settings);
      alert('تم حفظ إعدادات المطعم بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    }
  };

  const handleCreateStaff = async () => {
    if (!newUsername || !newFullName || !newPassword) return;
    try {
      await api.createUser({
        username: newUsername,
        email: newEmail || `${newUsername}@goldenpalace.dz`,
        fullName: newFullName,
        password: newPassword,
        pin: newPin,
        role: newRole,
      });
      setShowAddStaffModal(false);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      await loadStaff();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء المستخدم');
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backups/export';
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>إعدادات النظام والموظفين (Configuration & Backup)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('GENERAL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'GENERAL' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400'
              }`}
            >
              بيانات المطعم
            </button>
            <button
              onClick={() => setActiveTab('STAFF')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'STAFF' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400'
              }`}
            >
              الموظفين والأدوار (RBAC)
            </button>
            <button
              onClick={() => setActiveTab('BACKUP')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'BACKUP' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400'
              }`}
            >
              النسخ الاحتياطي (Backup)
            </button>
            <button
              onClick={() => setActiveTab('PRINTER')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'PRINTER' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400'
              }`}
            >
              الطباعة والفواتير
            </button>
          </div>
        </div>

        {activeTab === 'GENERAL' && (
          <button
            onClick={handleSaveSettings}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
        )}
      </div>

      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mt-3 overflow-y-auto no-scrollbar">
        {/* TAB 1: GENERAL */}
        {activeTab === 'GENERAL' && (
          <div className="max-w-2xl space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">اسم المطعم:</label>
                <input
                  type="text"
                  value={settings['restaurant_name'] || 'GRINE RESTAURANT'}
                  onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">العلامة التجارية / الفرع:</label>
                <input
                  type="text"
                  value={settings['restaurant_brand'] || 'Grine Restaurant • مطعم قرين'}
                  onChange={(e) => setSettings({ ...settings, restaurant_brand: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">الهاتف الرسمي للمطعم:</label>
                <input
                  type="text"
                  value={settings['restaurant_phone'] || '0550123456'}
                  onChange={(e) => setSettings({ ...settings, restaurant_phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">العملة:</label>
                <input
                  type="text"
                  value={settings['currency'] || 'DZD'}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">العنوان الكامل:</label>
              <textarea
                rows={2}
                value={
                  settings['restaurant_address'] ||
                  'الجزائر العاصمة • مطعم قرين للمأكولات الراقية'
                }
                onChange={(e) => setSettings({ ...settings, restaurant_address: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
              />
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('هل تريد إعادة بناء ومزامنة قائمة Grine Restaurant الكاملة في قاعدة البيانات؟')) return;
                  try {
                    const res = await api.resetGrineMenu();
                    alert(res.message);
                    window.location.reload();
                  } catch (err: any) {
                    alert('خطأ: ' + err.message);
                  }
                }}
                className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl border border-amber-500/40 text-xs flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة توليد وتحديث قائمة مطعم Grine Restaurant في قاعدة البيانات</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF (RBAC) */}
        {activeTab === 'STAFF' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                الموظفون المصرح لهم بالدخول للنظام ورموز PIN الخاصة بهم
              </span>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة موظف جديد</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
                  <tr>
                    <th className="p-3">الاسم الكامل</th>
                    <th className="p-3">اسم المستخدم</th>
                    <th className="p-3">الدور والوظيفة</th>
                    <th className="p-3">رمز PIN السريع</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-medium">
                  {staffUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-3 font-bold text-neutral-100">{u.fullName}</td>
                      <td className="p-3 font-mono text-cyan-400">{u.username}</td>
                      <td className="p-3">
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-neutral-200">{u.pin || '—'}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          نشط
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BACKUP */}
        {activeTab === 'BACKUP' && (
          <div className="max-w-md space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Database className="w-5 h-5" />
                <span className="text-sm">تصدير نسخة احتياطية كاملة (Backup)</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                يقوم النظام بتصدير جميع بيانات المطعم (القوائم، الفواتير، المخزون، الطاولات،
                الزبائن، الموردين) كملف JSON آمن ومحمي.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                <span>تحميل النسخة الاحتياطية الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PRINTER (Advanced Calibration & Diagnostic Station) */}
        {activeTab === 'PRINTER' && (
          <div className="max-w-4xl space-y-4 text-xs">
            {/* Top Status & Quick Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Printer Hardware Info Card */}
              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                        <span>{printerProfile.printerName}</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                          Default Windows Printer
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Driver: {printerProfile.driver} • مقاس الورق: {printerProfile.paperType}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-1 rounded-lg border border-amber-500/30">
                    العرض الفعّال: {printerProfile.printableWidth} mm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                  <div>
                    <label className="text-neutral-400 block mb-0.5 font-bold">اسم الطابعة في Windows (Printer Name):</label>
                    <input
                      type="text"
                      value={printerProfile.printerName}
                      onChange={(e) => {
                        const updated = { ...printerProfile, printerName: e.target.value };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      placeholder="CAFETERIA"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-0.5 font-bold">اسم الدرايفر (Driver):</label>
                    <input
                      type="text"
                      value={printerProfile.driver}
                      onChange={(e) => {
                        const updated = { ...printerProfile, driver: e.target.value };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      placeholder="80Normal"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-neutral-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block">عرض رأس الطباعة:</span>
                    <span className="text-neutral-200 font-bold font-mono">
                      {printerProfile.printableWidth} mm (
                      {Math.round((printerProfile.printableWidth / 25.4) * 203)} dots)
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">الهوامش (Margins):</span>
                    <span className="text-neutral-200 font-bold font-mono">0 mm (Zero-Margin)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">التغذية بعد الطباعة:</span>
                    <span className="text-neutral-200 font-bold font-mono">
                      {printerProfile.feedAfter} أسطر + قص آلي
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Instant Actions */}
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex flex-col justify-between gap-2">
                <button
                  onClick={() => {
                    const testData = printerService.generateTestReceiptData(printerProfile);
                    setReceiptToPrint(testData);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>طباعة تذكرة فحص ومعايرة (80mm)</span>
                </button>

                <button
                  onClick={() => {
                    const lastReceipt = printerService.getLastReceipt();
                    if (lastReceipt) {
                      setReceiptToPrint(lastReceipt);
                    } else {
                      const testData = printerService.generateTestReceiptData(printerProfile);
                      setReceiptToPrint(testData);
                    }
                  }}
                  className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 border border-neutral-700 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>إعادة طباعة آخر إيصال</span>
                </button>

                <button
                  onClick={openCashDrawer}
                  className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium rounded-xl text-[11px] flex items-center justify-center gap-1.5 border border-neutral-700 transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>اختبار نبضة درج النقود (Kick Drawer)</span>
                </button>
              </div>
            </div>

            {/* Printable Area Calibration Selector (The Core Fix for 80Normal Clipping) */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span>معايرة وضبط عرض منطقة الطباعة (Printable Area Calibration)</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    اختر العرض الأنسب لطابعتك لمنع قص المحتوى جهة اليسار الناتج عن إزاحة درايفر Windows.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  {
                    width: 70,
                    label: '70 mm (وضع الأمان العالي - Safe Margin)',
                    desc: '★ موصى به فورياً لحل مشكلة قص اليسار مع درايفر 80Normal بدون تعديل إعدادات Windows.',
                    isRecommended: true,
                  },
                  {
                    width: 72,
                    label: '72 mm (المعيار القياسي لطابعات 80mm)',
                    desc: 'عرض رأس الطباعة القياسي (576 dots @ 203 DPI) لورق 80mm بهوامش فيزيائية 4mm.',
                    isRecommended: false,
                  },
                  {
                    width: 68,
                    label: '68 mm (أقصى حماية من القص)',
                    desc: 'يضمن عدم خروج أي نص حتى مع هوامش طابعة كبيرة أو رول غير متوازن.',
                    isRecommended: false,
                  },
                  {
                    width: 74,
                    label: '74 mm (عرض موسع)',
                    desc: 'لطابعات الإيصالات الحديثة ذات الهوامش الحافية الضيقة جداً.',
                    isRecommended: false,
                  },
                  {
                    width: 76,
                    label: '76 mm (شبه كامل)',
                    desc: 'أقصى عرض مدعوم لبعض طابعات الإيصالات عالية الدقة.',
                    isRecommended: false,
                  },
                  {
                    width: 80,
                    label: '80 mm (كامل عرض الورقة الفيزيائية)',
                    desc: 'بدون أي هوامش أمان؛ قد يتعرض للقص إذا كان الدرايفر يقتطع حواف الرول.',
                    isRecommended: false,
                  },
                ].map((opt) => {
                  const isSelected = printerProfile.printableWidth === opt.width;
                  return (
                    <div
                      key={opt.width}
                      onClick={() => {
                        const updated: PrinterProfile = {
                          ...printerProfile,
                          printableWidth: opt.width,
                        };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-neutral-900/80 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-bold text-xs ${
                              isSelected ? 'text-amber-300' : 'text-neutral-200'
                            }`}
                          >
                            {opt.label}
                          </span>
                          {opt.isRecommended && (
                            <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[9px] font-black">
                              الحل الموصى به
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-relaxed">{opt.desc}</p>
                      </div>

                      <div className="mt-2 pt-1 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-500">
                          Dots: {Math.round((opt.width / 25.4) * 203)} px
                        </span>
                        <span className={isSelected ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
                          {isSelected ? '✓ مفعّل حالياً' : 'انقر للتفعيل'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hardware Parameters: Feed Lines & Auto Cut */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
              <h4 className="font-bold text-sm text-neutral-200">
                إعدادات تغذية الورق والقطع الآلي (Paper Feed & Cut)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">
                    عدد أسطر التغذية بعد الطباعة (Feed lines):
                  </label>
                  <select
                    value={printerProfile.feedAfter}
                    onChange={(e) => {
                      const updated = { ...printerProfile, feedAfter: parseInt(e.target.value) || 3 };
                      setPrinterProfile(updated);
                      printerService.saveProfile(updated);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} أسطر فارغة (Feed {n} lines)
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    يضمن خروج الإيصال بالكامل بعد سكين القطع التلقائي.
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    <input
                      type="checkbox"
                      checked={printerProfile.cutPaper}
                      onChange={(e) => {
                        const updated = { ...printerProfile, cutPaper: e.target.checked };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      className="accent-amber-500 w-4 h-4 rounded"
                    />
                    <span className="text-neutral-200 font-semibold text-xs">
                      قطع الورق التلقائي بعد الطباعة (Auto Cut)
                    </span>
                  </label>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    <input
                      type="checkbox"
                      checked={printerProfile.cashDrawer}
                      onChange={(e) => {
                        const updated = { ...printerProfile, cashDrawer: e.target.checked };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      className="accent-amber-500 w-4 h-4 rounded"
                    />
                    <span className="text-neutral-200 font-semibold text-xs">
                      فتح درج النقود تلقائياً عند الدفع النقدي
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Comprehensive Windows Driver & Troubleshooting Guide */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
              <div
                onClick={() => setShowTroubleshootDetails(!showTroubleshootDetails)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-sm text-neutral-100">
                    دليل تشخيص وإصلاح مشكلة Driver 80Normal في Windows خطوة بخطوة
                  </h4>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform ${
                    showTroubleshootDetails ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {showTroubleshootDetails && (
                <div className="space-y-3 text-[11px] text-neutral-300 pt-2 border-t border-neutral-800/80 leading-relaxed">
                  {/* Case 1: Windows Test Page */}
                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                    <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      <span>1. لماذا تظهر صفحة اختبار Windows (Test Page) مقصوصة أفقيًا؟</span>
                    </div>
                    <p className="text-neutral-300">
                      صفحة اختبار Windows تطبع مباشرة عبر محرك GDI الخاص بنظام Windows دون أي علاقة
                      بالمتصفح. سبب القص هو أن درايفر <strong className="text-white">80Normal</strong>{' '}
                      يكون افتراضياً مضبوطاً على مقاس صفحة <strong className="text-white">Letter</strong>{' '}
                      أو <strong className="text-white">A4</strong> مع هوامش 20mm، أو أن العرض القابل
                      للطباعة داخله محدد بـ 58mm (384 dots) بدلاً من 72mm (576 dots).
                    </p>
                  </div>

                  {/* Case 2: Step-by-Step Fix in Windows */}
                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 space-y-2">
                    <div className="font-bold text-amber-400 text-xs">
                      2. خطوات ضبط إعدادات طابعة CAFETERIA في Windows 10/11:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-300 pr-1">
                      <li>
                        افتح <strong className="text-white">Settings</strong> في Windows ثم انتقل إلى{' '}
                        <strong className="text-white">Bluetooth & devices</strong> ثم{' '}
                        <strong className="text-white">Printers & scanners</strong>.
                      </li>
                      <li>
                        اختر الطابعة <strong className="text-white">CAFETERIA</strong> واضغط على{' '}
                        <strong className="text-white">Printing Preferences</strong> (تفضيلات الطباعة).
                      </li>
                      <li>
                        في علامة تبويب <strong className="text-white">Layout / Paper Quality</strong> أو{' '}
                        <strong className="text-white">Advanced</strong>:
                      </li>
                      <ul className="list-disc list-inside pr-4 text-amber-300/90 space-y-0.5">
                        <li>
                          غيّر <strong className="text-white">Paper Size</strong> من Letter/A4 إلى:{' '}
                          <strong className="text-white">80 x 297 mm</strong> أو{' '}
                          <strong className="text-white">Receipt 80mm</strong>.
                        </li>
                        <li>
                          إذا لم تجد هذا الخيار، أنشئ مقاساً مخصصاً (Custom Paper Size):{' '}
                          <strong className="text-white">Width: 80 mm (أو 72 mm)</strong> و{' '}
                          <strong className="text-white">Length: 297 mm</strong>.
                        </li>
                        <li>
                          اضبط الهوامش (<strong className="text-white">Margins</strong>) على:{' '}
                          <strong className="text-white">0 mm</strong> من جميع الجهات.
                        </li>
                      </ul>
                      <li>
                        اضغط <strong className="text-white">Apply</strong> ثم{' '}
                        <strong className="text-white">OK</strong>، ثم أعد تجربة طباعة صفحة الاختبار.
                      </li>
                    </ol>
                  </div>

                  {/* Case 3: Driver Replacements */}
                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                    <div className="font-bold text-amber-400 text-xs">
                      3. التعريفات البديلة الموصى بها في حال استمرار المشكلة مع 80Normal:
                    </div>
                    <p className="text-neutral-300">
                      بعض نسخ تعريف 80Normal الصينية تعاني من خلل داخلي في ملف PPD/GDI. يمكنك حل ذلك
                      بتغيير التعريف إلى:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pr-1 text-neutral-300">
                      <li>
                        <strong className="text-white">POS-80 Official Driver</strong> (مثل Xprinter XP-N160I /
                        Rongta RP80 / Hoin 80mm).
                      </li>
                      <li>
                        <strong className="text-white">Generic / Text Only</strong> (المدمج افتراضياً داخل
                        نظام Windows) والذي يرسل أوامر ASCII و ESC/POS مباشرة للرأس بدون معالجة رسومية.
                      </li>
                      <li>
                        <strong className="text-white">Epson TM-T20 Generic Receipt Driver</strong>: متوافق
                        مع 99% من طابعات الـ 80mm الصينية.
                      </li>
                    </ul>
                  </div>

                  {/* Case 4: Raw Spooling Direct CMD */}
                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>4. أمر سطر الأوامر (Windows CMD) للطباعة المباشرة دون الحاجة لأي Driver:</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(printerService.getWindowsSpoolCommand());
                          setCopiedCmd(true);
                          setTimeout(() => setCopiedCmd(false), 2000);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-amber-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                      >
                        {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCmd ? 'تم النسخ!' : 'نسخ الأمر'}</span>
                      </button>
                    </div>
                    <code className="block bg-black px-2.5 py-1.5 rounded-lg text-cyan-300 font-mono text-[10px] select-all border border-neutral-800">
                      {printerService.getWindowsSpoolCommand()}
                    </code>
                    <p className="text-[10px] text-neutral-400">
                      يقوم هذا الأمر بإرسال ملف الأوامر الخام ESC/POS (.prn) مباشرة إلى منفذ الطابعة
                      المشتركة دون معالجة GDI من نظام Windows، مما يتجاوز أي عيوب في تعريف 80Normal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-sm text-amber-400">إضافة موظف جديد</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 rounded bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="محمد قادري"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">اسم المستخدم للدخول *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="caissier2"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">كلمة المرور *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1">رمز PIN السريع</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1111"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-mono text-center font-bold text-base text-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">الدور (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-bold"
                  >
                    <option value="CASHIER">كاشير (CASHIER)</option>
                    <option value="WAITER">نادل (WAITER)</option>
                    <option value="KITCHEN">مطبخ (KITCHEN)</option>
                    <option value="MANAGER">مسؤول (MANAGER)</option>
                    <option value="INVENTORY">مخزون (INVENTORY)</option>
                    <option value="ADMIN">مدير عام (ADMIN)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateStaff}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl active:scale-95 transition"
            >
              حفظ الموظف
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
