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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-5 select-none text-slate-900">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl text-black flex items-center gap-2 pl-3 border-l-2 border-slate-200">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>لوحة التقارير والإحصائيات (Statistiques)</span>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
            />
            <span className="text-slate-400">إلى</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-black transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>تصدير Excel / CSV</span>
          </button>

          <button
            onClick={loadReports}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid (24-30px metrics) */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 shrink-0">
          <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-black block">مبيعات اليوم (Ventes)</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              {Number(dashboard.salesToday || 0).toLocaleString()}{' '}
              <span className="text-sm font-bold text-slate-600">DA</span>
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-black block">عدد الطلبات (Bons)</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {dashboard.orderCount || 0}
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-black block">متوسط الفاتورة</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              {Number(dashboard.averageOrderValue || 0).toLocaleString()}{' '}
              <span className="text-sm font-bold text-slate-600">DA</span>
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-red-600 font-black block">المصاريف اليومية</span>
            <span className="text-2xl font-black text-red-600 mt-1 block">
              -{Number(dashboard.expensesToday || 0).toLocaleString()}{' '}
              <span className="text-sm font-bold text-slate-600">DA</span>
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-emerald-700 font-black block">صافي المبيعات</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {Number(dashboard.netSales || 0).toLocaleString()}{' '}
              <span className="text-sm font-bold text-slate-600">DA</span>
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs text-blue-600 font-black block">مواد قاربت النفاذ</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {dashboard.lowStockCount || 0}
            </span>
          </div>
        </div>
      )}

      {/* Middle row: Top Products & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 shrink-0">
        {/* Top Selling Products */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 space-y-3 shadow-sm">
          <h4 className="text-base font-black text-black flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>الأطباق الأكثر طلباً (Plats Populaires)</span>
          </h4>
          <div className="space-y-2">
            {dashboard?.topProducts?.map((p: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-black text-slate-900">{p.nameAr}</span>
                </div>
                <div className="font-black text-blue-700">
                  {p.qty} طلب ({Number(p.total).toLocaleString()} DA)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Payment Method */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 space-y-3 shadow-sm">
          <h4 className="text-base font-black text-black flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>توزيع المبيعات حسب طريقة الدفع</span>
          </h4>
          <div className="space-y-2">
            {dashboard?.paymentMethods?.map((m: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm"
              >
                <span className="font-black text-slate-900">{m.method}</span>
                <div className="font-black text-blue-700">
                  {Number(m.total).toLocaleString()} DA ({m.count} عملية)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 overflow-hidden flex flex-col mt-4 shadow-sm">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-200 font-black">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">التاريخ والوقت</th>
                <th className="p-4">نوع الطلب</th>
                <th className="p-4">المبلغ الإجمالي (DA)</th>
                <th className="p-4">حالة الدفع</th>
                <th className="p-4">الكاشير</th>
                <th className="p-4 text-center">إعادة طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold">
              {salesList.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/40 transition">
                  <td className="p-4 font-black text-black">{s.orderNumber}</td>
                  <td className="p-4 text-slate-600 font-medium">
                    {new Date(s.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="p-4 text-slate-800">{s.type}</td>
                  <td className="p-4 font-black text-blue-700 text-lg">
                    {Number(s.total).toLocaleString()} DA
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black ${
                        s.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {s.paymentStatus === 'PAID' ? 'تم الدفع' : s.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700">{s.cashier || 'Admin'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleReprintOrder(s.id)}
                      disabled={reprintingId === s.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs inline-flex items-center gap-1.5 active:scale-95 transition shadow cursor-pointer"
                      title="إعادة طباعة هذه الفاتورة"
                    >
                      <Printer className="w-4 h-4" />
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
