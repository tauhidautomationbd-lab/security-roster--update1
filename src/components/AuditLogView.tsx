import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { subscribeToAuditLogs } from '../services/auditService';
import { History, Search, User, Clock, Shield, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((newLogs) => {
      setLogs(newLogs);
      setIsLoading(false);
    }, 100);

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('bn-BD', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoStr;
    }
  };

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600" />
            ইউজার অ্যাক্টিভিটি ও পরিবর্তনের লগ
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            কোন ব্যবহারকারী কোন তারিখে কী পরিবর্তন বা সেভ করেছেন তার পূর্ণাঙ্গ হিস্ট্রি
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ইউজার বা পরিবর্তন খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>লগ লোড হচ্ছে...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">কোনো পরিবর্তনের লগ পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">নতুন পরিবর্তন সেভ বা কাজ করলে এখানে সরাসরি তালিকা প্রদর্শিত হবে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3.5 w-14 text-center">#</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">সময় ও তারিখ</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">ব্যবহারকারী</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">পদবী / ভূমিকা</th>
                  <th className="px-5 py-3.5">অ্যাকশন / পরিবর্তন</th>
                  <th className="px-5 py-3.5">বিস্তারিত তথ্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, index) => {
                  const isSave = log.action.includes('সেভ');
                  const isResign = log.action.includes('পদত্যাগ') || log.action.includes('রিজাইন');
                  const isReg = log.action.includes('রেজিস্ট্রেশন');

                  return (
                    <tr key={log.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-center text-slate-400 text-xs font-mono">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap font-medium flex items-center gap-1.5 pt-4">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                            {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          log.userRole === 'Admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : log.userRole === 'Supervisor'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {log.userRole}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isSave
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isResign
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isReg
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {isSave && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-md">
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
