import React, { useMemo } from 'react';
import { RosterAssignment, ShiftType, PostRequirement, Staff } from '../types';
import { Clock, RefreshCcw } from 'lucide-react';

interface Props {
  roster: RosterAssignment[];
  weekNumber: number;
  startDate: string;
  posts: PostRequirement[];
  staff: Staff[];
}

import { getEndDate, formatDisplayDate } from '../utils/dateUtils';

export const RosterTable: React.FC<Props> = ({ roster, weekNumber, startDate, posts, staff }) => {
  // Group by Shift
  const grouped = useMemo(() => {
    const map: Record<ShiftType | 'OT', RosterAssignment[]> = {
      A: [],
      B: [],
      C: [],
      General: [],
      Reliever: [],
      Leave: [],
      OT: []
    };
    roster.forEach(r => {
      // Assuming OT is just mixed into shifts for display or grouped separately?
      // Let's mix them but we can identify by isOT
      if (map[r.assignedShift]) {
        map[r.assignedShift].push(r);
      }
    });
    
    // Sort each group by Post name
    Object.values(map).forEach(group => {
      group.sort((a, b) => a.assignedPost.localeCompare(b.assignedPost));
    });
    
    return map;
  }, [roster]);

  const targets = useMemo(() => {
    let A = 0, B = 0, C = 0;
    posts.forEach(p => {
      A += p.shiftCounts.A || 0;
      B += p.shiftCounts.B || 0;
      C += p.shiftCounts.C || 0;
    });
    return { A, B, C };
  }, [posts]);

  const shiftDetails = {
    A: { title: 'A (Morning)', time: 'সকাল ৭টা - বিকাল ৩টা', color: 'bg-emerald-100 text-emerald-800' },
    B: { title: 'B (Evening)', time: 'বিকাল ৩টা - রাত ১১টা', color: 'bg-amber-100 text-amber-800' },
    C: { title: 'C (Night)', time: 'রাত ১১টা - সকাল ৬টা', color: 'bg-indigo-100 text-indigo-800' },
    General: { title: 'General Shift', time: 'সকাল ৮টা - রাত ৮টা', color: 'bg-blue-100 text-blue-800' },
    Reliever: { title: 'Reliever Shift', time: 'যেকোনো শিফট', color: 'bg-purple-100 text-purple-800' },
    Leave: { title: 'Leave / Off', time: 'ছুটি/অফ', color: 'bg-gray-100 text-gray-800' }
  };

  const getPermanentGroupForRunningShift = (runningShift: ShiftType, week: number) => {
    const rotationCycle = week % 3;
    if (rotationCycle === 0) {
      if (runningShift === 'C') return 'A';
      if (runningShift === 'A') return 'B';
      if (runningShift === 'B') return 'C';
    } else if (rotationCycle === 1) {
      if (runningShift === 'B') return 'A';
      if (runningShift === 'C') return 'B';
      if (runningShift === 'A') return 'C';
    } else { // 2
      return runningShift;
    }
  };

  const shiftsToRender: ShiftType[] = ['A', 'B', 'C', 'General', 'Leave'];

  return (
    <div className="space-y-8">
            {/* Printable Header */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">সাপ্তাহিক ডিউটি রোস্টার</h1>
        <p className="text-lg text-slate-700">
          সপ্তাহ: <span className="font-bold">{weekNumber}</span> | 
          তারিখ: <span className="font-bold">{formatDisplayDate(startDate)}</span> হতে <span className="font-bold">{formatDisplayDate(getEndDate(startDate))}</span>
        </p>
      </div>

      {shiftsToRender.map(shift => {
        const assignments = grouped[shift];
        if (assignments.length === 0) return null;
        
        return (
          <div key={shift} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 border-b border-slate-200 flex justify-between items-center ${shiftDetails[shift].color}`}>
              <div className="flex items-center gap-3">
                {['A', 'B', 'C'].includes(shift) ? (
                  <h2 className="text-lg font-bold">
                    Permanent Shift: {getPermanentGroupForRunningShift(shift, weekNumber)} / Running Shift: {shiftDetails[shift].title} ({shiftDetails[shift].time})
                  </h2>
                ) : (
                  <h2 className="text-lg font-bold">
                    {shiftDetails[shift].title} ({shiftDetails[shift].time})
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold px-3 py-1 bg-white/40 rounded-full">
                  Total: {assignments.length} জন
                </span>
                {['A', 'B', 'C'].includes(shift) && (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    assignments.length === (shift === 'A' ? targets.A : shift === 'B' ? targets.B : targets.C) ? 'bg-emerald-200/50 text-emerald-900' :
                    assignments.length > (shift === 'A' ? targets.A : shift === 'B' ? targets.B : targets.C) ? 'bg-indigo-200/50 text-indigo-900' :
                    'bg-rose-200/60 text-rose-900'
                  }`}>
                    {assignments.length === (shift === 'A' ? targets.A : shift === 'B' ? targets.B : targets.C) ? '✓ সঠিক' : 
                     assignments.length > (shift === 'A' ? targets.A : shift === 'B' ? targets.B : targets.C) ? 
                     `+${assignments.length - (shift === 'A' ? targets.A : shift === 'B' ? targets.B : targets.C)} জন বেশি` : 
                     `${(shift === 'A' ? targets.A : shift === 'B' ? targets.B : targets.C) - assignments.length} জন শর্ট`}
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-16 text-center">ক্রমিক</th>
                    <th className="px-6 py-3">নাম ও আইডি</th>
                    <th className="px-6 py-3">পদবী</th>
                    <th className="px-6 py-3">ডিউটি পোস্ট</th>
                    <th className="px-6 py-3">অফ ডে</th>
                    <th className="px-6 py-3 text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((row, idx) => (
                    <tr key={`${row.staffId}-${idx}`} className={`hover:bg-slate-50 transition-colors ${row.isOT ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-6 py-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-3 font-medium text-slate-800">{row.staffName} {row.staffId !== 'Unassigned' ? `(${row.staffId})` : ''}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {row.role === 'Guard' ? 'সিকিউরিটি গার্ড' : row.role === 'LadyGuard' ? 'লেডি গার্ড' : row.role === 'Supervisor' ? 'সুপারভাইজর' : 'অফিসার'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-700">
                        <div className="flex flex-col">
                          <span className={shift === 'Leave' ? "text-rose-600" : ""}>{row.assignedPost}</span>
                          {shift === 'Leave' && row.originalPost && <span className="text-xs text-slate-500 font-normal mt-0.5">মূল পোস্ট: {row.originalPost}</span>}
                          
                          {/* If partial leave in normal shift, or full leave */}
                          {(row.leaveStartDate || row.leaveEndDate) && (
                            <span className="text-xs text-rose-500 font-medium mt-0.5">
                              {shift !== 'Leave' ? 'ছুটি: ' : 'তারিখ: '} 
                              {row.leaveStartDate ? formatDisplayDate(row.leaveStartDate) : '?'} হতে {row.leaveEndDate ? formatDisplayDate(row.leaveEndDate) : '?'}
                              {row.leaveStartDate && row.leaveEndDate && (
                                <span className="ml-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px]">
                                  ({Math.ceil((new Date(row.leaveEndDate).getTime() - new Date(row.leaveStartDate).getTime()) / (1000 * 3600 * 24)) + 1} দিন)
                                </span>
                              )}
                            </span>
                          )}
                          
                          {/* If partial shift change */}
                          {row.isShiftChange && row.shiftChangeDates && (
                            <span className="text-xs text-purple-600 font-medium mt-0.5">
                              অস্থায়ী শিফট: {row.shiftChangeDates}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{row.offDay || '-'}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            Gr: {row.permanentGroup === 'Reliever' ? 'রিলেভার' : shift === 'General' ? 'General' : row.permanentGroup === 'General' ? 'General' : row.permanentGroup}
                          </span>
                          {row.isOT && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> OT
                            </span>
                          )}
                          {row.isReplacement && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <RefreshCcw className="w-3 h-3" /> বদলি
                            </span>
                          )}
                          {row.isShiftChange && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800" title={row.shiftChangeDates}>
                              <RefreshCcw className="w-3 h-3" /> বদলি ডিউটি
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
