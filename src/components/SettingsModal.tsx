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

  const handleDownloadBackup = async () => {
    try {
      const backup = await api.exportBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `golden_palace_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('فشل تصدير النسخة الاحتياطية');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      {/* Header and Tab switcher */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>إعدادات النظام (Configuration)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-sm">
            <button
              onClick={() => setActiveTab('GENERAL')}
              className={`px-4 py-2 rounded-xl font-black transition cursor-pointer ${
                activeTab === 'GENERAL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-black'
              }`}
            >
              بيانات المطعم
            </button>
            <button
              onClick={() => setActiveTab('STAFF')}
              className={`px-4 py-2 rounded-xl font-black transition cursor-pointer ${
                activeTab === 'STAFF' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-black'
              }`}
            >
              الموظفين والأدوار (RBAC)
            </button>
            <button
              onClick={() => setActiveTab('BACKUP')}
              className={`px-4 py-2 rounded-xl font-black transition cursor-pointer ${
                activeTab === 'BACKUP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-black'
              }`}
            >
              النسخ الاحتياطي (Backup)
            </button>
            <button
              onClick={() => setActiveTab('PRINTER')}
              className={`px-4 py-2 rounded-xl font-black transition cursor-pointer ${
                activeTab === 'PRINTER' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-black'
              }`}
            >
              الطباعة والفواتير
            </button>
          </div>
        </div>

        {activeTab === 'GENERAL' && (
          <button
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Save className="w-5 h-5 stroke-[2.5]" />
            <span>حفظ الإعدادات</span>
          </button>
        )}
      </div>

      <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 p-6 mt-4 overflow-y-auto no-scrollbar shadow-sm">
        {/* TAB 1: GENERAL */}
        {activeTab === 'GENERAL' && (
          <div className="max-w-2xl space-y-4 text-sm font-bold">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1">اسم المطعم:</label>
                <input
                  type="text"
                  value={settings['restaurant_name'] || 'GOLDEN PALACE POS'}
                  onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">العلامة التجارية / الفرع:</label>
                <input
                  type="text"
                  value={settings['restaurant_brand'] || 'مطعم القصر الذهبي • عند الجيجلي'}
                  onChange={(e) => setSettings({ ...settings, restaurant_brand: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الهاتف الرسمي للمطعم:</label>
                <input
                  type="text"
                  value={settings['restaurant_phone'] || '0550123456'}
                  onChange={(e) => setSettings({ ...settings, restaurant_phone: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">العملة:</label>
                <input
                  type="text"
                  value={settings['currency'] || 'DZD'}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">العنوان الكامل:</label>
              <textarea
                rows={2}
                value={
                  settings['restaurant_address'] ||
                  'شارع بلهوشات، حسين داي، الجزائر العاصمة'
                }
                onChange={(e) => setSettings({ ...settings, restaurant_address: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 text-base focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('هل تريد إعادة بناء ومزامنة قائمة الطعام في قاعدة البيانات؟')) return;
                  try {
                    const res = await api.resetGrineMenu();
                    alert(res.message);
                    window.location.reload();
                  } catch (err: any) {
                    alert('خطأ: ' + err.message);
                  }
                }}
                className="py-3 px-5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-black rounded-2xl border-2 border-blue-200 text-sm flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <span>إعادة توليد وتحديث قائمة المطعم في قاعدة البيانات المحلية</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF (RBAC) */}
        {activeTab === 'STAFF' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 font-bold">
                الموظفون المصرح لهم بالدخول للنظام ورموز PIN الخاصة بهم
              </span>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>إضافة موظف جديد</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-200 font-black">
                  <tr>
                    <th className="p-4">الاسم الكامل</th>
                    <th className="p-4">اسم المستخدم</th>
                    <th className="p-4">الدور والوظيفة</th>
                    <th className="p-4">رمز PIN السريع</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold">
                  {staffUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/40 transition">
                      <td className="p-4 font-black text-slate-900 text-base">{u.fullName}</td>
                      <td className="p-4 text-blue-700">{u.username}</td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-xl text-xs font-black">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-black text-slate-900 text-base">{u.pin || '—'}</td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl text-xs font-black">
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
          <div className="max-w-md space-y-4 text-sm">
            <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-black font-black">
                <Database className="w-6 h-6 text-blue-600" />
                <span className="text-lg">تصدير نسخة احتياطية كاملة (Backup)</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-semibold">
                يقوم النظام بتصدير جميع بيانات المطعم (القوائم، الفواتير، المخزون، الطاولات،
                الزبائن، الموردين) كملف JSON آمن ومحمي ومحفوظ محلياً.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl transition flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>تحميل النسخة الاحتياطية الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PRINTER (Advanced Calibration & Diagnostic Station) */}
        {activeTab === 'PRINTER' && (
          <div className="max-w-4xl space-y-5 text-sm font-bold">
            {/* Top Status & Quick Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Printer Hardware Info Card */}
              <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-200 space-y-3 md:col-span-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black flex items-center gap-2">
                        <span>{printerProfile.printerName}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg font-black">
                          طابعة Windows الافتراضية
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-bold">
                        Driver: {printerProfile.driver} • مقاس الورق: {printerProfile.paperType}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm bg-blue-100 text-blue-800 font-black px-3 py-1.5 rounded-xl border border-blue-200">
                    العرض: {printerProfile.printableWidth} mm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-sm">
                  <div>
                    <label className="text-slate-700 block mb-1 font-black">اسم الطابعة في Windows:</label>
                    <input
                      type="text"
                      value={printerProfile.printerName}
                      onChange={(e) => {
                        const updated = { ...printerProfile, printerName: e.target.value };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      placeholder="CAFETERIA"
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-blue-700 font-black text-base"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block mb-1 font-black">اسم الدرايفر (Driver):</label>
                    <input
                      type="text"
                      value={printerProfile.driver}
                      onChange={(e) => {
                        const updated = { ...printerProfile, driver: e.target.value };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      placeholder="80Normal"
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">عرض رأس الطباعة:</span>
                    <span className="text-slate-900 font-black text-sm">
                      {printerProfile.printableWidth} mm (
                      {Math.round((printerProfile.printableWidth / 25.4) * 203)} dots)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">الهوامش (Margins):</span>
                    <span className="text-slate-900 font-black text-sm">0 mm (Zero-Margin)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">التغذية بعد الطباعة:</span>
                    <span className="text-slate-900 font-black text-sm">
                      {printerProfile.feedAfter} أسطر + قص آلي
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Instant Actions */}
              <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-200 flex flex-col justify-between gap-3 shadow-sm">
                <button
                  onClick={() => {
                    const testData = printerService.generateTestReceiptData(printerProfile);
                    setReceiptToPrint(testData);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <FileText className="w-5 h-5 stroke-[2.5]" />
                  <span>طباعة تذكرة فحص (80mm)</span>
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
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-black rounded-2xl text-sm flex items-center justify-center gap-2 border border-slate-300 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>إعادة طباعة آخر إيصال</span>
                </button>

                <button
                  onClick={openCashDrawer}
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-black rounded-2xl text-sm flex items-center justify-center gap-2 border border-slate-300 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>اختبار نبضة درج النقود</span>
                </button>
              </div>
            </div>

            {/* Printable Area Calibration Selector */}
            <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-200 space-y-4 shadow-sm">
              <h4 className="font-black text-base text-black flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>معايرة وضبط عرض منطقة الطباعة (Printable Area Calibration)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 shadow-md ring-2 ring-blue-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`font-black text-sm ${
                              isSelected ? 'text-blue-900' : 'text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </span>
                          {opt.isRecommended && (
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-xs font-black">
                              الموصى به
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">{opt.desc}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold">
                          Dots: {Math.round((opt.width / 25.4) * 203)} px
                        </span>
                        <span className={isSelected ? 'text-blue-700 font-black' : 'text-slate-500'}>
                          {isSelected ? '✓ مفعّل حالياً' : 'انقر للتفعيل'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hardware Parameters: Feed Lines & Auto Cut */}
            <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-200 space-y-4 shadow-sm">
              <h4 className="font-black text-base text-black">
                إعدادات تغذية الورق والقطع الآلي (Paper Feed & Cut)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">
                    عدد أسطر التغذية بعد الطباعة (Feed lines):
                  </label>
                  <select
                    value={printerProfile.feedAfter}
                    onChange={(e) => {
                      const updated = { ...printerProfile, feedAfter: parseInt(e.target.value) || 3 };
                      setPrinterProfile(updated);
                      printerService.saveProfile(updated);
                    }}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} أسطر فارغة (Feed {n} lines)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer bg-white p-4 rounded-2xl border-2 border-slate-200">
                    <input
                      type="checkbox"
                      checked={printerProfile.cutPaper}
                      onChange={(e) => {
                        const updated = { ...printerProfile, cutPaper: e.target.checked };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      className="accent-blue-600 w-5 h-5 rounded"
                    />
                    <span className="text-slate-900 font-bold text-sm">
                      قطع الورق التلقائي بعد الطباعة (Auto Cut)
                    </span>
                  </label>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer bg-white p-4 rounded-2xl border-2 border-slate-200">
                    <input
                      type="checkbox"
                      checked={printerProfile.cashDrawer}
                      onChange={(e) => {
                        const updated = { ...printerProfile, cashDrawer: e.target.checked };
                        setPrinterProfile(updated);
                        printerService.saveProfile(updated);
                      }}
                      className="accent-blue-600 w-5 h-5 rounded"
                    />
                    <span className="text-slate-900 font-bold text-sm">
                      فتح درج النقود تلقائياً عند الدفع النقدي
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-2xl text-black">إضافة موظف جديد</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 font-bold text-sm">
              <div>
                <label className="block text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="محمد قادري"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">اسم المستخدم للدخول *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="caissier2"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">كلمة المرور *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">رمز PIN السريع</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1111"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-blue-700 font-mono text-center font-black text-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الدور (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-900 font-black text-base"
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
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl active:scale-95 transition shadow-xl cursor-pointer"
            >
              حفظ الموظف
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
