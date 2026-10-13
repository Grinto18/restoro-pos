import { PrinterProfile, PrintJobResult } from '../types.ts';

const PRINTER_PROFILE_KEY = 'grine_restaurant_printer_profile';
const LAST_RECEIPT_KEY = 'grine_restaurant_last_receipt';

export const DEFAULT_PRINTER_PROFILE: PrinterProfile = {
  name: 'CAFETERIA 80mm',
  printerName: 'CAFETERIA',
  driver: '80Normal',
  paperType: '80mm',
  paperWidth: 80,
  printableWidth: 70, // 70mm safe margin to prevent left-side clipping on Windows 80Normal driver
  margins: 0,
  scale: 100,
  orientation: 'PORTRAIT',
  feedBefore: 0,
  feedAfter: 4,
  copies: 1,
  cutPaper: true,
  cashDrawer: true,
  printMethod: 'BROWSER',
  bridgeUrl: 'ws://localhost:8182',
};

// Safe printable width choices for 80mm and 58mm thermal printers
export const PRINTABLE_WIDTH_OPTIONS = [
  { value: 48, label: '48mm (قياسي لطابعات 58mm الصغيرة)' },
  { value: 50, label: '50mm (موسع لطابعات 58mm)' },
  { value: 68, label: '68mm (أقصى حماية لطابعات 80mm)' },
  { value: 70, label: '70mm (★ الوضع الموصى به لمنع قص اليسار في 80Normal)' },
  { value: 72, label: '72mm (القياسي لرأس الطباعة 576 dots)' },
  { value: 74, label: '74mm (عرض واسع)' },
  { value: 80, label: '80mm (كامل عرض الورقة 80mm)' },
];

export const printerService = {
  // Load current printer profile
  getProfile(): PrinterProfile {
    try {
      const stored = localStorage.getItem(PRINTER_PROFILE_KEY);
      if (stored) {
        return { ...DEFAULT_PRINTER_PROFILE, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PRINTER_PROFILE;
  },

  // Save printer profile
  saveProfile(profile: PrinterProfile): void {
    localStorage.setItem(PRINTER_PROFILE_KEY, JSON.stringify(profile));
    this.applyPrintStyles(profile);
  },

  // Apply print styles and @page size dynamically to DOM
  applyPrintStyles(profile: PrinterProfile): void {
    document.documentElement.style.setProperty(
      '--receipt-printable-width',
      `${profile.printableWidth}mm`
    );
    document.documentElement.style.setProperty(
      '--receipt-margins',
      `${profile.margins}mm`
    );

    // Dynamic @page style tag injection to force Chromium/Edge to exact roll width
    let styleTag = document.getElementById('thermal-page-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'thermal-page-style';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `
      @page {
        size: ${profile.printableWidth}mm auto !important;
        margin: 0mm !important;
      }
    `;
  },

  // Generate direct Windows CMD spooling command
  getWindowsSpoolCommand(filename = 'ticket.prn', printerName = 'CAFETERIA'): string {
    return `copy /b "${filename}" "\\\\localhost\\${printerName}"`;
  },

  // Generate PowerShell raw direct print command
  getPowerShellSpoolCommand(filename = 'ticket.prn', printerName = 'CAFETERIA'): string {
    return `Get-Content -Path ".\\${filename}" -Encoding Byte -Raw | Out-Printer -Name "${printerName}"`;
  },

  // Reset to default
  resetProfile(): PrinterProfile {
    localStorage.removeItem(PRINTER_PROFILE_KEY);
    this.saveProfile(DEFAULT_PRINTER_PROFILE);
    return DEFAULT_PRINTER_PROFILE;
  },

  // Save last printed receipt for reprint feature
  setLastReceipt(data: any): void {
    try {
      localStorage.setItem(LAST_RECEIPT_KEY, JSON.stringify(data));
    } catch {
      // Ignore
    }
  },

  // Retrieve last printed receipt
  getLastReceipt(): any | null {
    try {
      const stored = localStorage.getItem(LAST_RECEIPT_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return null;
  },

  // Generate ESC/POS raw byte sequence
  generateEscPosCommands(receiptData: any, profile: PrinterProfile): Uint8Array {
    const bytes: number[] = [];

    // Helper: append string ASCII/CP437 bytes
    const appendText = (text: string) => {
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        bytes.push(code < 256 ? code : 63); // Fallback to ? for unsupported chars
      }
    };

    // 1. Initialize printer: ESC @ (0x1B, 0x40)
    bytes.push(0x1b, 0x40);

    // 2. Open Cash Drawer if enabled: ESC p m t1 t2 (0x1B, 0x70, 0x00, 0x19, 0xFA)
    if (profile.cashDrawer) {
      bytes.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    }

    // 3. Pre-feed lines
    if (profile.feedBefore > 0) {
      bytes.push(0x1b, 0x64, profile.feedBefore);
    }

    // 4. Center align: ESC a 1 (0x1B, 0x61, 0x01)
    bytes.push(0x1b, 0x61, 0x01);

    // Header
    appendText("GRINE RESTAURANT\n");
    appendText("Grine Restaurant - مطعم قرين\n");
    appendText("Service Caisse & Impression Directe\n");
    appendText("--------------------------------\n");

    // Order info
    bytes.push(0x1b, 0x61, 0x00); // Left align
    appendText(`FACTURE: ${receiptData.orderNumber || 'BON-0000'}\n`);
    appendText(`DATE: ${receiptData.date || ''}  HEURE: ${receiptData.time || ''}\n`);
    appendText(`CAISSIER: ${receiptData.cashierName || 'Admin'}\n`);
    if (receiptData.tableNumber) {
      appendText(`TABLE: ${receiptData.tableNumber}\n`);
    }
    if (receiptData.customerName) {
      appendText(`CLIENT: ${receiptData.customerName}\n`);
    }
    appendText("--------------------------------\n");

    // Items
    if (receiptData.items && Array.isArray(receiptData.items)) {
      for (const item of receiptData.items) {
        const qty = `${item.quantity}x `;
        const name = item.nameAr || item.nameFr || 'Article';
        const price = `${Number(item.total || item.unitPrice * item.quantity)} DA`;
        appendText(`${qty}${name}\n    ${price}\n`);
        if (item.selectedVariant) {
          appendText(`    (${item.selectedVariant.nameAr})\n`);
        }
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          for (const add of item.selectedAddons) {
            appendText(`    + ${add.nameAr} (${add.price} DA)\n`);
          }
        }
      }
    }
    appendText("--------------------------------\n");

    // Totals: Bold ON: ESC E 1
    bytes.push(0x1b, 0x45, 0x01);
    appendText(`TOTAL: ${Number(receiptData.total || 0)} DZD\n`);
    bytes.push(0x1b, 0x45, 0x00); // Bold OFF

    if (receiptData.tenderAmount > 0) {
      appendText(`VERSE: ${Number(receiptData.tenderAmount)} DZD\n`);
      appendText(`RENDU: ${Number(receiptData.changeAmount || 0)} DZD\n`);
    }
    if (receiptData.paymentMethod) {
      appendText(`PAIEMENT: ${receiptData.paymentMethod}\n`);
    }

    // Footer
    bytes.push(0x1b, 0x61, 0x01); // Center align
    appendText("--------------------------------\n");
    appendText("شكراً لزيارتكم - مرحباً بكم دائماً\n");
    appendText("Merci de votre visite - A bientot!\n");
    appendText("GRINE RESTAURANT\n");

    // 5. Post-feed lines: ESC d n
    const postFeed = profile.feedAfter > 0 ? profile.feedAfter : 3;
    bytes.push(0x1b, 0x64, postFeed);

    // 6. Paper cut: GS V 66 0 (0x1D, 0x56, 0x42, 0x00) - Partial cut
    if (profile.cutPaper) {
      bytes.push(0x1d, 0x56, 0x42, 0x00);
    }

    return new Uint8Array(bytes);
  },

  // Download raw ESC/POS file (.prn/.bin) for direct spooling
  downloadEscPosFile(receiptData: any, profile: PrinterProfile, filename = 'receipt.prn'): void {
    const rawData = this.generateEscPosCommands(receiptData, profile);
    const blob = new Blob([rawData as unknown as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Test Local Bridge connectivity (e.g. QZ Tray or local thermal bridge)
  async probeLocalBridge(url = 'ws://localhost:8182'): Promise<{
    connected: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url);
        const timer = setTimeout(() => {
          ws.close();
          resolve({
            connected: false,
            error: 'انتهت مهلة الاتصال بجسر الطباعة المحلي (QZ Tray / Local Bridge)',
          });
        }, 1500);

        ws.onopen = () => {
          clearTimeout(timer);
          ws.close();
          resolve({ connected: true });
        };

        ws.onerror = () => {
          clearTimeout(timer);
          resolve({
            connected: false,
            error:
              'لم يتم العثور على جسر الطباعة المحلي (Local Print Bridge) يعمل على هذا المنفذ.',
          });
        };
      } catch (err: any) {
        resolve({ connected: false, error: err.message || 'فشل الاتصال بالجسر' });
      }
    });
  },

  // Cache to prevent duplicate printing of the same order/ticket within cooldown window
  _recentPrintJobs: new Map<string, number>(),

  // Send Direct Real Print Job to Windows Spooler & Thermal Driver
  async sendDirectPrintJob(
    receiptData: any,
    profile: PrinterProfile,
    options: { isReprint?: boolean } = {}
  ): Promise<{
    success: boolean;
    method: 'SPOOLER' | 'WEB_SERIAL' | 'BROWSER' | 'DEDUP';
    message: string;
  }> {
    // 1. Prepare styles for thermal width & store for re-print
    this.applyPrintStyles(profile);
    this.setLastReceipt(receiptData);

    // 2. Deduplication check: prevent multiple triggers for the exact same order unless explicit reprint
    const orderKey = String(receiptData.orderNumber || receiptData.dailySequence || 'unknown');
    const jobKey = `${orderKey}_${receiptData.isKitchenTicket ? 'kitchen' : receiptData.isAddition ? 'addition' : 'invoice'}`;
    const now = Date.now();

    if (!options.isReprint && this._recentPrintJobs.has(jobKey)) {
      const prevTime = this._recentPrintJobs.get(jobKey)!;
      if (now - prevTime < 6000) {
        console.warn(`[PrinterService] Ignored duplicate print call for ${jobKey} (${now - prevTime}ms ago)`);
        return {
          success: true,
          method: 'DEDUP',
          message: 'تم إرسال هذا الوصل للطباعة بالفعل (تم منع التكرار تلقائياً).',
        };
      }
    }

    this._recentPrintJobs.set(jobKey, now);

    // Clean up older records
    for (const [k, time] of this._recentPrintJobs.entries()) {
      if (now - time > 60000) this._recentPrintJobs.delete(k);
    }

    const numCopies = Math.max(1, Math.min(5, Number(profile.copies) || 1));

    // 3. Generate raw ESC/POS bytes
    const rawBytes = this.generateEscPosCommands(receiptData, profile);
    let rawBase64 = '';
    for (let i = 0; i < rawBytes.length; i++) {
      rawBase64 += String.fromCharCode(rawBytes[i]);
    }
    rawBase64 = btoa(rawBase64);

    // 4. Try Server Windows Print Spooler (Single Unified Route)
    try {
      const { api } = await import('./api.ts');
      const spoolRes = await api.spoolPrintJob({
        printerName: profile.printerName,
        rawBase64,
        orderNumber: receiptData.orderNumber,
        copies: numCopies,
      });

      // If natively spooled to Windows printer, RETURN IMMEDIATELY (Do NOT call window.print)
      if (spoolRes.mode === 'spooled_to_windows') {
        return {
          success: true,
          method: 'SPOOLER',
          message: `تم إرسال الفاتورة بنجاح إلى طابعة Windows (${profile.printerName}) [${numCopies} نسخة].`,
        };
      } else if (spoolRes.mode === 'container_ready') {
        // In browser / web preview mode: trigger browser print dialog ONCE
        window.print();
        return {
          success: true,
          method: 'BROWSER',
          message: 'تم فتح نافذة الطباعة الحرارية بنجاح مع ضبط مقاس الرول التلقائي.',
        };
      }
    } catch (spoolErr) {
      console.warn('Backend spool failed, attempting browser print fallback:', spoolErr);
      try {
        window.print();
        return {
          success: true,
          method: 'BROWSER',
          message: 'تم فتح نافذة الطباعة الحرارية كمسار بديل.',
        };
      } catch (err: any) {
        return {
          success: false,
          method: 'BROWSER',
          message: err.message || 'فشلت الطباعة',
        };
      }
    }

    return {
      success: true,
      method: 'BROWSER',
      message: 'تمت معالجة أمر الطباعة بنجاح.',
    };
  },

  // Direct USB / Serial POS printer via Web Serial API
  async printViaWebSerial(receiptData: any, profile: PrinterProfile): Promise<boolean> {
    if (!('serial' in navigator)) {
      throw new Error('متصفحك لا يدعم Web Serial API للطباعة المباشرة عبر USB.');
    }
    const navSerial = (navigator as any).serial;
    const port = await navSerial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    const rawData = this.generateEscPosCommands(receiptData, profile);
    await writer.write(rawData);
    writer.releaseLock();
    await port.close();
    return true;
  },

  // System Test Receipt Data
  generateTestReceiptData(profile: PrinterProfile): any {
    return {
      isDiagnosticTest: true,
      orderNumber: 'TEST-GRINE-001',
      date: new Date().toLocaleDateString('fr-FR'),
      time: new Date().toLocaleTimeString('fr-FR'),
      cashierName: 'Admin (Grine Restaurant)',
      tableNumber: 'TEST',
      orderType: `اختبار طابعة حرارية ${profile.paperType}`,
      items: [
        {
          nameAr: 'طاكوس بولي',
          nameFr: 'Tacos Poulet',
          quantity: 1,
          unitPrice: 400,
          total: 400,
        },
        {
          nameAr: 'بيتزا مارغوريت (حجم L)',
          nameFr: 'Pizza Margherita',
          quantity: 1,
          unitPrice: 350,
          total: 350,
        },
        {
          nameAr: 'عصير كوكتال',
          nameFr: 'Jus Cocktail',
          quantity: 1,
          unitPrice: 250,
          total: 250,
        },
      ],
      subtotal: 1000,
      discount: 0,
      deliveryFee: 0,
      total: 1000,
      tenderAmount: 1000,
      changeAmount: 0,
      printableWidth: profile.printableWidth,
      printerName: profile.printerName,
      driver: profile.driver,
    };
  },
};
