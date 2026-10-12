import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { usePos } from '../context/PosContext.tsx';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Banknote,
  DollarSign,
  Calendar,
  Download,
  Printer,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { setReceiptToPrint } = usePos();
  const [dashboard, setDashboard] = useState<any>(null);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reprintingId, setReprintingId] = useState<number | null>(null);

  const handleReprintOrder = async (orderId: number) => {
    try {
      setReprintingId(orderId);
      const fullOrder = await api.getOrder(orderId);
      const receiptData = {
        orderNumber: fullOrder.orderNumber,
        dailySequence: fullOrder.dailySequence,
        tableNumber: fullOrder.table?.tableNumber,
        customerName: fullOrder.customer?.name,
        orderType: fullOrder.type,
        items: fullOrder.items || [],
        subtotal: Number(fullOrder.subtotal),
        discount: Number(fullOrder.discount || 0),
        deliveryFee: Number(fullOrder.deliveryFee || 0),
        total: Number(fullOrder.total),
        tenderAmount: Number(fullOrder.paidAmount || fullOrder.total),
        changeAmount: Number(fullOrder.changeAmount || 0),
        cashierName: fullOrder.cashier?.fullName || 'Admin',
        time: new Date(fullOrder.createdAt).toLocaleTimeString('fr-FR'),
        date: new Date(fullOrder.createdAt).toLocaleDateString('fr-FR'),
      };
      setReceiptToPrint(receiptData);
    } catch (err) {
      console.error('Failed to reprint invoice:', err);
      alert('فشل استرجاع بيانات الفاتورة للطباعة');
    } finally {
      setReprintingId(null);
    }
  };

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [dash, sales] = await Promise.all([
        api.getDashboardReport(),
        api.getSalesReport(startDate, endDate),
      ]);
      setDashboard(dash);
      setSalesList(sales);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (salesList.length === 0) return;
    const headers = ['Order Number', 'Date', 'Type', 'Total (DA)', 'Discount', 'Status', 'Cashier'];
    const rows = salesList.map((s) => [
      s.orderNumber,
      new Date(s.createdAt).toLocaleDateString('fr-FR'),
      s.type,
      s.total,
      s.discount,
      s.paymentStatus,
      s.cashier || 'Admin',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-green-400 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <span>لوحة التقارير والإحصائيات (Statistiques)</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded-lg p-1.5 text-neutral-100 font-mono"
            />
            <span className="text-neutral-500">إلى</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded-lg p-1.5 text-neutral-100 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV / Excel</span>
          </button>

          <button
            onClick={loadReports}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-3 shrink-0">
          <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-bold block">مبيعات اليوم (Ventes)</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {Number(dashboard.salesToday || 0).toLocaleString()}{' '}
              <span className="text-xs font-normal">DA</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-bold block">عدد الطلبات (Bons)</span>
            <span className="text-xl font-black text-cyan-400 font-mono">
              {dashboard.orderCount || 0}
            </span>
          </div>

          <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-bold block">متوسط الفاتورة</span>
            <span className="text-xl font-black text-blue-400 font-mono">
              {Number(dashboard.averageOrderValue || 0).toLocaleString()}{' '}
              <span className="text-xs font-normal">DA</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
            <span className="text-[11px] text-red-400 font-bold block">المصاريف اليومية</span>
            <span className="text-xl font-black text-red-400 font-mono">
              -{Number(dashboard.expensesToday || 0).toLocaleString()}{' '}
              <span className="text-xs font-normal">DA</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
            <span className="text-[11px] text-emerald-400 font-bold block">صافي المبيعات</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {Number(dashboard.netSales || 0).toLocaleString()}{' '}
              <span className="text-xs font-normal">DA</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
            <span className="text-[11px] text-yellow-400 font-bold block">مواد قاربت النفاذ</span>
            <span className="text-xl font-black text-yellow-400 font-mono">
              {dashboard.lowStockCount || 0}
            </span>
          </div>
        </div>
      )}

      {/* Middle row: Top Products & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 shrink-0">
        {/* Top Selling Products */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3 space-y-2">
          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>الأطباق الأكثر طلباً (Plats Populaires)</span>
          </h4>
          <div className="space-y-1.5">
            {dashboard?.topProducts?.map((p: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 font-mono text-[10px] font-bold flex items-center justify-center text-amber-400">
                    {i + 1}
                  </span>
                  <span className="font-bold text-neutral-200">{p.nameAr}</span>
                </div>
                <div className="font-mono text-cyan-400 font-bold">
                  {p.qty} طلب ({Number(p.total).toLocaleString()} DA)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Payment Method */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3 space-y-2">
          <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            <span>توزيع المبيعات حسب طريقة الدفع</span>
          </h4>
          <div className="space-y-1.5">
            {dashboard?.paymentMethods?.map((m: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl text-xs"
              >
                <span className="font-bold text-neutral-300">{m.method}</span>
                <div className="font-mono font-bold text-amber-400">
                  {Number(m.total).toLocaleString()} DA ({m.count} عملية)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col mt-3">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">نوع الطلب</th>
                <th className="p-3">المبلغ الإجمالي (DA)</th>
                <th className="p-3">حالة الدفع</th>
                <th className="p-3">الكاشير</th>
                <th className="p-3 text-center">إعادة طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium">
              {salesList.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-800/50 transition">
                  <td className="p-3 font-mono font-bold text-amber-400">{s.orderNumber}</td>
                  <td className="p-3 font-mono text-neutral-400">
                    {new Date(s.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="p-3 text-neutral-300">{s.type}</td>
                  <td className="p-3 font-mono font-bold text-neutral-100 text-sm">
                    {Number(s.total).toLocaleString()} DA
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-300">{s.cashier || 'Admin'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleReprintOrder(s.id)}
                      disabled={reprintingId === s.id}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg border border-neutral-700 font-bold text-xs inline-flex items-center gap-1 active:scale-95 transition"
                      title="إعادة طباعة هذه الفاتورة"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{reprintingId === s.id ? 'جاري التحميل...' : 'طباعة'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
