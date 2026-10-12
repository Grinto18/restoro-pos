import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Sparkles, AlertCircle, CheckCircle2, RotateCcw, Sliders } from 'lucide-react';
import { printerService } from '../services/printerService.ts';
import { PrinterProfile } from '../types.ts';

interface ReceiptPrintProps {
  data: any | null;
  onClose: () => void;
  onOpenPrinterSettings?: () => void;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({
  data,
  onClose,
  onOpenPrinterSettings,
}) => {
  const [profile, setProfile] = useState<PrinterProfile>(printerService.getProfile());
  const [printStatus, setPrintStatus] = useState<'IDLE' | 'PRINTING' | 'PRINTED' | 'FAILED'>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (data) {
      const p = printerService.getProfile();
      setProfile(p);
      printerService.setLastReceipt(data);
      printerService.applyPrintStyles(p);
    }
  }, [data]);

  if (!data) return null;

  const isKitchen = Boolean(data.isKitchenTicket);
  const isDiagnostic = Boolean(data.isDiagnosticTest);

  // Method 1: Direct Windows Spooler & Browser Thermal Print
  const handleBrowserPrint = async () => {
    setPrintStatus('PRINTING');
    setStatusMessage('جاري إرسال مهمة الطباعة الحقيقية إلى طابعة Windows (' + profile.printerName + ')...');

    const result = await printerService.sendDirectPrintJob(data, profile);
    if (result.success) {
      setPrintStatus('PRINTED');
      setStatusMessage(result.message);
    } else {
      setPrintStatus('FAILED');
      setStatusMessage(`فشل الطباعة: ${result.message}`);
    }
  };

  // Method 2: Web Serial USB Direct Hardware Print
  const handleWebSerialPrint = async () => {
    try {
      setPrintStatus('PRINTING');
      setStatusMessage('جاري الاتصال المباشر بمنفذ USB/Serial للطابعة الحرارية...');
      await printerService.printViaWebSerial(data, profile);
      setPrintStatus('PRINTED');
      setStatusMessage('تمت الطباعة مباشرة عبر Web Serial بنجاح وقص الورقة!');
    } catch (err: any) {
      setPrintStatus('FAILED');
      setStatusMessage(`فشل Web Serial: ${err.message}`);
    }
  };

  // Method 3: ESC/POS Raw File Download
  const handleDownloadEscPos = () => {
    try {
      printerService.downloadEscPosFile(
        data,
        profile,
        `ticket_${data.orderNumber || 'receipt'}.prn`
      );
      setPrintStatus('PRINTED');
      setStatusMessage('تم توليد وتنزيل ملف الأوامر الخام ESC/POS (.prn).');
    } catch (err: any) {
      setPrintStatus('FAILED');
      setStatusMessage(`فشل توليد أوامر ESC/POS: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-md w-full p-4 shadow-2xl space-y-3">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500" />
            <div>
              <span className="font-bold text-sm text-neutral-100 block">
                {isDiagnostic
                  ? 'معاينة تذكرة الفحص والمعايرة'
                  : isKitchen
                  ? 'تذكرة المطبخ (Bon Cuisine)'
                  : 'معاينة إيصال الزبون'}
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                الطابعة: {profile.printerName} • العرض الآمن: {profile.printableWidth}mm
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBrowserPrint}
              disabled={printStatus === 'PRINTING'}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black text-xs font-black rounded-lg transition active:scale-95 shadow flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>إرسال للطابعة (Windows)</span>
            </button>

            {'serial' in navigator && (
              <button
                onClick={handleWebSerialPrint}
                className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 rounded-lg text-xs border border-neutral-700 font-mono font-bold flex items-center gap-1"
                title="طباعة مباشرة عبر منفذ USB/Serial بدون تعريف"
              >
                <span>USB Serial</span>
              </button>
            )}

            <button
              onClick={handleDownloadEscPos}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs border border-neutral-700"
              title="تصدير ملف خام ESC/POS"
            >
              <Download className="w-4 h-4" />
            </button>

            <button onClick={onClose} className="p-1 rounded-full bg-neutral-800 text-neutral-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {printStatus !== 'IDLE' && (
          <div
            className={`p-2 rounded-xl text-xs flex items-center gap-2 font-bold ${
              printStatus === 'PRINTED'
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                : printStatus === 'FAILED'
                ? 'bg-red-950/80 border border-red-700 text-red-300'
                : 'bg-amber-950/80 border border-amber-700 text-amber-300'
            }`}
          >
            {printStatus === 'PRINTED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : printStatus === 'FAILED' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Printable Width Adjustment Quick Bar */}
        <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-[11px] print:hidden">
          <div className="text-neutral-400 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>عرض رأس الطباعة:</span>
          </div>
          <div className="flex items-center gap-1">
            {[68, 70, 72, 74, 76, 80].map((w) => (
              <button
                key={w}
                onClick={() => {
                  const updated = { ...profile, printableWidth: w };
                  setProfile(updated);
                  printerService.saveProfile(updated);
                }}
                className={`px-2 py-0.5 rounded font-mono font-bold transition text-xs ${
                  profile.printableWidth === w
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title={w === 70 ? 'عرض الحماية الفائقة الموصى به' : w === 72 ? 'الافتراضي القياسي 576 dots' : `${w}mm`}
              >
                {w}mm {w === 70 ? '★' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Windows CMD Spool Command Bar for Diagnostics */}
        {isDiagnostic && (
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-[10px] text-neutral-300 space-y-1 print:hidden">
            <div className="flex items-center justify-between font-mono text-amber-400 font-bold">
              <span>أمر الطباعة المباشرة لتخطي مشاكل Driver 80Normal (CMD):</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(printerService.getWindowsSpoolCommand());
                  alert('تم نسخ أمر الطباعة المباشر لـ Windows CMD:\n' + printerService.getWindowsSpoolCommand());
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-amber-300 px-2 py-0.5 rounded text-[10px]"
              >
                نسخ الأمر
              </button>
            </div>
            <code className="block bg-black px-2 py-1 rounded text-cyan-300 font-mono text-[9px] select-all">
              {printerService.getWindowsSpoolCommand()}
            </code>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHYSICAL RECEIPT CONTAINER                                      */}
        {/* Uses exact CSS mm width variables, no fixed pixels, zero-margin */}
        {/* ============================================================== */}
        <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex justify-center max-h-[60vh] overflow-y-auto no-scrollbar">
          <div
            id="printable-receipt"
            className="bg-white text-black p-2 font-mono text-[11px] leading-tight select-text"
            style={{
              width: `${profile.printableWidth}mm`,
              maxWidth: `${profile.printableWidth}mm`,
              margin: '0 auto',
              boxSizing: 'border-box',
              direction: 'rtl',
              textAlign: 'right',
            }}
          >
            {isDiagnostic ? (
              /* ========================================================= */
              /* DIAGNOSTIC TEST RECEIPT (Precision Calibration & Audit)   */
              /* ========================================================= */
              <div className="border-2 border-black p-1 space-y-1.5 text-center text-black">
                {/* Header */}
                <div className="border-b border-dashed border-black pb-1 space-y-0.5">
                  <h1 className="text-base font-black">القصر الذهبي</h1>
                  <h2 className="text-xs font-bold">عند الجيجلي • حسين داي</h2>
                  <p className="text-[10px] font-bold bg-black text-white py-0.5 mt-0.5">
                    تذكرة فحص ومعايرة العرض الفعلي 80mm
                  </p>
                </div>

                {/* Left - Center - Right Alignment Verification Bar */}
                <div className="border border-black p-1 bg-gray-50 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className="bg-black text-white px-1">[يمين RIGHT]</span>
                    <span className="font-bold">[وسط CENTER]</span>
                    <span className="bg-black text-white px-1">[يسار LEFT]</span>
                  </div>
                  <div className="text-[8px] text-gray-700">
                    إذا كان [يسار LEFT] مقصوصاً، اضبط العرض على 70mm في النظام
                  </div>
                </div>

                {/* Calibrated Physical Width Ruler */}
                <div className="border-t border-b border-black py-1 font-mono text-[9px] space-y-0.5">
                  <div className="font-bold text-[10px] text-center">
                    مسطرة قياس رأس الطباعة ({profile.printableWidth}mm)
                  </div>
                  <div className="tracking-tight text-center font-bold overflow-hidden whitespace-nowrap">
                    |00---10---20---30---40---50---60---70mm|
                  </div>
                  <div className="tracking-widest text-center text-[8px] text-gray-700 overflow-hidden whitespace-nowrap">
                    |...|...|...|...|...|...|...|
                  </div>
                </div>

                {/* Characters Line Stress Wrap Test */}
                <div className="border-b border-dashed border-black py-1 space-y-1 text-right text-[9px]">
                  <div>
                    <span className="font-bold block text-[10px]">اختبار 48 حرفاً (Font A):</span>
                    <div className="font-mono text-[8px] tracking-tight bg-gray-100 p-0.5 border border-gray-300 break-all text-center">
                      123456789012345678901234567890123456789012345678
                    </div>
                  </div>
                  <div>
                    <span className="font-bold block text-[10px]">اختبار 42 حرفاً (Font B):</span>
                    <div className="font-mono text-[8.5px] tracking-tight bg-gray-100 p-0.5 border border-gray-300 break-all text-center">
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^
                    </div>
                  </div>
                  <div>
                    <span className="font-bold block text-[10px]">اختبار النص العربي ثنائي الاتجاه:</span>
                    <div className="font-sans text-[9px] font-bold text-center border-t border-gray-300 pt-0.5">
                      القصر الذهبي • مشاوي وأسماك طازجة يومياً
                    </div>
                  </div>
                </div>

                {/* Diagnostics Meta Info */}
                <div className="text-right text-[9px] space-y-0.5 border-b border-black pb-1">
                  <div className="flex justify-between">
                    <span>اسم الطابعة:</span>
                    <span className="font-bold font-mono">{profile.printerName} (CAFETERIA)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver المعرّف:</span>
                    <span className="font-bold font-mono">{profile.driver} (80Normal)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>عرض الورق الفيزيائي:</span>
                    <span className="font-bold font-mono">80 mm (Roll Paper)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>عرض الطباعة الفعّال:</span>
                    <span className="font-black font-mono bg-yellow-200 px-1">{profile.printableWidth} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>وضع الهوامش:</span>
                    <span className="font-bold font-mono">0 mm (Zero-Margin)</span>
                  </div>
                </div>

                {/* Sample items test */}
                <div className="text-right text-[10px] py-1 border-b border-dashed border-black space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>حساء حوت ملكي (Soupe)</span>
                    <span className="font-mono">400 DA</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>شواء مشكل فاخر على الجمر</span>
                    <span className="font-mono">1400 DA</span>
                  </div>
                  <div className="flex justify-between font-black border-t border-black pt-0.5 text-xs">
                    <span>المجموع الاختباري:</span>
                    <span className="font-mono">1800 DA</span>
                  </div>
                </div>

                {/* End & Feed */}
                <div className="pt-1 text-center font-black text-[10px] tracking-wider">
                  *** نهاية تذكرة الفحص والمعايرة ***
                </div>
                <div className="text-[8px] text-gray-600 font-mono">
                  [ --- خط القطع التلقائي للورقة / PAPER CUT --- ]
                </div>

                {/* Feed blank lines */}
                {Array.from({ length: profile.feedAfter || 3 }).map((_, idx) => (
                  <div key={idx} className="h-3"></div>
                ))}
              </div>
            ) : isKitchen ? (
              /* ========================================================= */
              /* KITCHEN TICKET (Bon Cuisine)                              */
              /* ========================================================= */
              <div className="space-y-2 text-center text-black">
                <div className="border-b-2 border-black pb-2">
                  <h1 className="text-lg font-black uppercase tracking-wider">BON CUISINE</h1>
                  <div className="text-base font-black mt-0.5">
                    {data.tableNumber ? `TABLE: ${data.tableNumber}` : data.orderType}
                  </div>
                  <div className="text-xs font-bold font-mono">{data.orderNumber}</div>
                  <div className="text-[10px]">{data.time}</div>
                </div>

                <div className="text-right space-y-2 py-2 border-b-2 border-black">
                  {data.items?.map((it: any, i: number) => (
                    <div key={i} className="border-b border-dashed border-gray-400 pb-1">
                      <div className="flex justify-between items-baseline font-black text-sm">
                        <span className="text-base font-black ml-1">{it.quantity}×</span>
                        <span className="flex-1 break-words">{it.nameAr}</span>
                      </div>
                      {it.notes && (
                        <div className="text-xs font-bold text-red-700 mt-0.5">
                          ⚠️ {it.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {data.notes && (
                  <div className="text-right text-xs font-bold py-1">
                    ملاحظة عامة: {data.notes}
                  </div>
                )}

                {/* Feed blank lines */}
                {Array.from({ length: profile.feedAfter || 3 }).map((_, idx) => (
                  <div key={idx} className="h-3"></div>
                ))}
              </div>
            ) : (
              /* ========================================================= */
              /* STANDARD CUSTOMER RECEIPT (Ticket de Caisse)             */
              /* ========================================================= */
              <div className="space-y-1.5 text-center text-black text-xs">
                {/* Header */}
                <div className="border-b border-dashed border-black pb-1.5 space-y-0.5">
                  <h1 className="text-base font-black tracking-wider">GRINE RESTAURANT</h1>
                  <h2 className="text-xs font-bold">مطعم قرين للمأكولات الراقية</h2>
                  <p className="text-[10px] font-semibold">طاكوس • مأكولات بحرية • أطباق رئيسية • بيتزا</p>
                  <p className="text-[9px] leading-tight text-gray-700">الجزائر • خدمة الطاولات والطلبات السريعة</p>
                  <p className="text-[10px] font-bold mt-0.5 font-mono">الهاتف: 0550123456</p>
                </div>

                {/* Order Meta */}
                <div className="text-right text-[10px] space-y-0.5 py-1 border-b border-dashed border-black">
                  <div className="flex justify-between">
                    <span>N° DU BON:</span>
                    <span className="font-bold font-mono">{data.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE: {data.date || new Date().toLocaleDateString('fr-FR')}</span>
                    <span>HEURE: {data.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAISSIER:</span>
                    <span className="font-bold">{data.cashierName || 'Admin'}</span>
                  </div>
                  {data.tableNumber && (
                    <div className="flex justify-between">
                      <span>TABLE:</span>
                      <span className="font-bold">{data.tableNumber}</span>
                    </div>
                  )}
                  {data.customerName && (
                    <div className="flex justify-between">
                      <span>CLIENT:</span>
                      <span className="font-bold">{data.customerName}</span>
                    </div>
                  )}
                </div>

                {/* Items Table - Strict Fixed Layout */}
                <div className="py-1 border-b border-dashed border-black">
                  <table className="w-full text-right text-[10px] table-fixed">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="pb-1 text-right w-[55%]">الطبق</th>
                        <th className="pb-1 text-center w-[15%]">الكمية</th>
                        <th className="pb-1 text-left w-[30%]">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.items?.map((it: any, i: number) => (
                        <tr key={i} className="py-0.5">
                          <td className="py-1 leading-tight font-bold break-words">
                            {it.nameAr}
                            {it.selectedVariant && (
                              <span className="text-[9px] block font-normal text-gray-700">
                                ({it.selectedVariant.nameAr})
                              </span>
                            )}
                          </td>
                          <td className="py-1 text-center font-bold font-mono">{it.quantity}</td>
                          <td className="py-1 text-left font-mono font-bold whitespace-nowrap">
                            {Number(it.total || it.unitPrice * it.quantity).toLocaleString()} DA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="text-right space-y-0.5 py-1 border-b-2 border-black text-[10px]">
                  <div className="flex justify-between">
                    <span>Sous-total:</span>
                    <span className="font-bold font-mono">
                      {Number(data.subtotal).toLocaleString()} DA
                    </span>
                  </div>

                  {data.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Remise (الخصم):</span>
                      <span className="font-bold font-mono">
                        -{Number(data.discount).toLocaleString()} DA
                      </span>
                    </div>
                  )}

                  {data.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Livraison (التوصيل):</span>
                      <span className="font-bold font-mono">
                        +{Number(data.deliveryFee).toLocaleString()} DA
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
                    <span>TOTAL À PAYER:</span>
                    <span className="text-sm font-mono font-black">
                      {Number(data.total).toLocaleString()} DA
                    </span>
                  </div>

                  {data.tenderAmount > 0 && (
                    <>
                      <div className="flex justify-between text-[9px] pt-0.5">
                        <span>Versé:</span>
                        <span className="font-bold font-mono">
                          {Number(data.tenderAmount).toLocaleString()} DA
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span>Rendu:</span>
                        <span className="font-bold font-mono">
                          {Number(data.changeAmount || 0).toLocaleString()} DA
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-1.5 text-center text-[9px] space-y-1">
                  <p className="font-bold">شكراً لزيارتكم • مرحباً بكم دائماً</p>
                  <p className="font-bold tracking-wider">GRINE RESTAURANT • MERCI DE VOTRE VISITE</p>
                  <div className="border border-black px-2 py-0.5 font-mono text-[8px] tracking-widest inline-block">
                    * {data.orderNumber} *
                  </div>
                  {profile.cutPaper && (
                    <div className="text-[8px] text-gray-500 font-mono pt-1">
                      [ --- سكين القطع التلقائي للورقة / AUTO CUT --- ]
                    </div>
                  )}
                </div>

                {/* Feed blank lines */}
                {Array.from({ length: profile.feedAfter || 3 }).map((_, idx) => (
                  <div key={idx} className="h-3"></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
