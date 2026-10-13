import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types.ts';
import { api } from '../services/api.ts';
import { ShieldCheck, Search, RefreshCw, Clock, User } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.userName && l.userName.toLowerCase().includes(search.toLowerCase())) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-extrabold text-xl text-slate-900 flex items-center gap-2.5 pl-4 border-l-2 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span>سجل أمان العمليات والرقابة (Audit Trail)</span>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في سجل العمليات..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pr-11 pl-4 py-2.5 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="p-3 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-700 font-bold transition flex items-center gap-2"
          title="تحديث السجل"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span className="text-sm">تحديث</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col mt-4">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-base">
            <thead className="bg-slate-900 text-white border-b-2 border-slate-800 font-bold text-lg">
              <tr>
                <th className="p-4">نوع العملية</th>
                <th className="p-4">الموظف المسؤول</th>
                <th className="p-4">التفاصيل والبيان</th>
                <th className="p-4">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold text-lg">
                    لا توجد سجلات مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-blue-50/50 transition">
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-sm font-black font-mono">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{l.userName || 'System'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{l.details}</td>
                    <td className="p-4 font-mono text-slate-500 font-bold dir-ltr text-left">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{new Date(l.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
