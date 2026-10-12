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
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-neutral-950 p-4 select-none">
      <div className="flex items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-neutral-300 flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>سجل أمان العمليات والرقابة (Audit Trail)</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في السجل..."
              className="bg-neutral-950 border border-neutral-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex flex-col mt-3">
        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-bold">
              <tr>
                <th className="p-3">العملية</th>
                <th className="p-3">الموظف</th>
                <th className="p-3">التفاصيل والبيان</th>
                <th className="p-3">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-neutral-800/50 transition">
                  <td className="p-3">
                    <span className="bg-neutral-800 text-amber-400 border border-neutral-700 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-neutral-200">{l.userName || 'System'}</td>
                  <td className="p-3 text-neutral-300">{l.details}</td>
                  <td className="p-3 font-mono text-neutral-400">
                    {new Date(l.createdAt).toLocaleString('fr-FR')}
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
