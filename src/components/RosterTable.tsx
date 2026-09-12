import React, { useMemo } from 'react';
import { RosterAssignment, ShiftType, PostRequirement, Staff, ShiftChangeRecord, LeaveRecord, OTRecord } from '../types';
import { Clock, RefreshCcw, UserCheck, Shield } from 'lucide-react';
import { getWeekDateRange, formatDisplayDate } from '../utils/dateUtils';
import { calculateRelieverSchedule, getPermanentGroupForRunningShift } from '../utils/relieverAssignments';

interface Props {
  roster: RosterAssignment[];
  weekNumber: number;
  startDate: string;
  posts: PostRequirement[];
  staff: Staff[];
  shiftChanges?: ShiftChangeRecord[];
  leaves?: LeaveRecord[];
  ots?: OTRecord[];
}

export const RosterTable: React.FC<Props> = ({ 
  roster, 
  weekNumber, 
  startDate, 
  posts, 
  staff,
  shiftChanges = [],
  leaves = [],
  ots = []
}) => {
  const endDate = getWeekDateRange(weekNumber).end;

  // Calculate Reliever Schedule and coverage mapping
  const relieverData = useMemo(() => {
    return calculateRelieverSchedule(staff, posts, shiftChanges, weekNumber, startDate, leaves, ots);
  }, [staff, posts, shiftChanges, weekNumber, startDate, leaves, ots]);

  // Group by Shift and integrate relievers into shifts they cover
  const { grouped, shiftCounts } = useMemo(() => {
    const map: Record<ShiftType | 'OT', RosterAssignment[]> = {
      A: [],
      B: [],
      C: [],
      General: [],
      Reliever: [],
      Leave: [],
      OT: []
    };

    const counts: Record<string, { regular: number; relievers: number; total: number }> = {
      A: { regular: 0, relievers: 0, total: 0 },
      B: { regular: 0, relievers: 0, total: 0 },
      C: { regular: 0, relievers: 0, total: 0 },
      General: { regular: 0, relievers: 0, total: 0 }
    };

    // 1. Regular staff assignments from weekly roster
    roster.forEach(r => {
      // Exclude relievers from regular shift pool so we can add them cleanly with their coverage info
      if (r.permanentGroup === 'Reliever') {
        if (r.assignedShift === 'Reliever' || !['A', 'B', 'C', 'General'].includes(r.assignedShift)) {
          map.Reliever.push(r);
        }
        return;
      }

      if (map[r.assignedShift]) {
        map[r.assignedShift].push(r);
        if (counts[r.assignedShift]) {
          counts[r.assignedShift].regular++;
          counts[r.assignedShift].total++;
        }
      }
    });

    // 2. Add Relievers who cover off-days for each shift ('A', 'B', 'C', 'General')
    (['A', 'B', 'C', 'General'] as ShiftType[]).forEach(shift => {
      const shiftCoverages = relieverData.coveragesByShift[shift] || [];
      
      // Group coverages by reliever ID to avoid redundant duplicate rows for the same reliever
      const relieverMap = new Map<string, { reliever: Staff; postName: string; coverLabels: string[] }>();
      
      shiftCoverages.forEach(cov => {
        if (!relieverMap.has(cov.reliever.id)) {
          relieverMap.set(cov.reliever.id, {
            reliever: cov.reliever,
            postName: cov.postName,
            coverLabels: [cov.coverLabel]
          });
        } else {
          const entry = relieverMap.get(cov.reliever.id)!;
          if (!entry.coverLabels.includes(cov.coverLabel)) {
            entry.coverLabels.push(cov.coverLabel);
          }
        }
      });

      relieverMap.forEach(({ reliever, postName, coverLabels }) => {
        map[shift].push({
          staffId: reliever.id,
          staffName: reliever.name,
          role: reliever.role,
          permanentGroup: 'Reliever',
          assignedShift: shift,
          assignedPost: postName,
          offDay: reliever.offDay || '-',
          isRelieverDuty: true,
          relieverCoverInfo: coverLabels.join(' | ')
        });

        if (counts[shift]) {
          counts[shift].relievers++;
          counts[shift].total++;
        }
      });
    });

    // Sort each shift group by post name
    Object.values(map).forEach(group => {
      group.sort((a, b) => (a.assignedPost || '').localeCompare(b.assignedPost || ''));
    });

    return { grouped: map, shiftCounts: counts };
  }, [roster, relieverData]);

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
    Reliever: { title: 'Reliever Shift', time: 'যেকোনো শিফট (রিজার্ভ / সাপোর্ট)', color: 'bg-purple-100 text-purple-800' },
    Leave: { title: 'Leave / Off', time: 'ছুটি/অফ', color: 'bg-gray-100 text-gray-800' }
  };

  const shiftsToRender: ShiftType[] = ['A', 'B', 'C', 'General', 'Reliever', 'Leave'];

  return (
    <div className="space-y-8">
      {/* Printable Header */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">সাপ্তাহিক ডিউটি রোস্টার</h1>
        <p className="text-lg text-slate-700">
          সপ্তাহ: <span className="font-bold">{weekNumber}</span> | 
          তারিখ: <span className="font-bold">{formatDisplayDate(startDate)}</span> হতে <span className="font-bold">{formatDisplayDate(endDate)}</span>
        </p>
      </div>

      {shiftsToRender.map(shift => {
        const assignments = grouped[shift];
        if (assignments.length === 0) return null;

        const countInfo = shiftCounts[shift];
        const targetCount = shift === 'A' ? targets.A : shift === 'B' ? targets.B : shift === 'C' ? targets.C : 0;
        const totalEffective = countInfo ? countInfo.total : assignments.length;
        const isShiftTargetApplicable = ['A', 'B', 'C'].includes(shift);
        
        return (
          <div key={shift} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${shiftDetails[shift].color}`}>
              <div className="flex items-center gap-3">
                {['A', 'B', 'C'].includes(shift) ? (
                  <h2 className="text-lg font-bold">
                    Permanent Shift: {getPermanentGroupForRunningShift(shift, startDate)} / Running Shift: {shiftDetails[shift].title} ({shiftDetails[shift].time})
                  </h2>
                ) : (
                  <h2 className="text-lg font-bold">
                    {shiftDetails[shift].title} ({shiftDetails[shift].time})
                  </h2>
                )}
              </div>
              
              {/* Detailed Breakdown Header (Method 2) */}
              <div className="flex items-center gap-2 flex-wrap">
                {isShiftTargetApplicable && countInfo ? (
                  <>
                    <span className="text-xs md:text-sm font-semibold px-3 py-1 bg-white/70 text-slate-800 rounded-full border border-slate-200/50 shadow-xs">
                      রেগুলার: {countInfo.regular} জন + রিলেভার: {countInfo.relievers} জন = মোট: {countInfo.total} জন
                    </span>
                    <span className={`text-xs md:text-sm font-bold px-3 py-1 rounded-full shadow-xs ${
                      totalEffective === targetCount ? 'bg-emerald-200/80 text-emerald-950 border border-emerald-300' :
                      totalEffective > targetCount ? 'bg-indigo-200/80 text-indigo-950 border border-indigo-300' :
                      'bg-rose-200/80 text-rose-950 border border-rose-300'
                    }`}>
                      {totalEffective === targetCount ? '✓ সঠিক' : 
                       totalEffective > targetCount ? `+${totalEffective - targetCount} জন বেশি` : 
                       `${targetCount - totalEffective} জন শর্ট`}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-semibold px-3 py-1 bg-white/60 text-slate-800 rounded-full border border-slate-200/50">
                    Total: {assignments.length} জন
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
                    <tr 
                      key={`${row.staffId}-${idx}`} 
                      className={`hover:bg-slate-50 transition-colors ${
                        row.isRelieverDuty ? 'bg-purple-50/40 hover:bg-purple-50/70' : 
                        row.isOT ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-6 py-3 font-medium text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {row.staffName} {row.staffId !== 'Unassigned' ? `(${row.staffId})` : ''}
                          </span>
                          {/* Prominent Method 2 Reliever Cover Note */}
                          {row.relieverCoverInfo && (
                            <span className="inline-block mt-1 text-xs font-semibold text-purple-800 bg-purple-100/90 border border-purple-300 px-2 py-0.5 rounded w-fit">
                              {row.relieverCoverInfo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {row.role === 'Guard' ? 'সিকিউরিটি গার্ড' : row.role === 'LadyGuard' ? 'লেডি গার্ড' : row.role === 'Supervisor' ? 'সুপারভাইজর' : 'অফিসার'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-700">
                        <div className="flex flex-col">
                          <span className={shift === 'Leave' ? "text-rose-600" : ""}>
                            {row.assignedPost}
                          </span>
                          {row.isRelieverDuty && (
                            <span className="text-[11px] text-purple-600 font-normal mt-0.5">
                              (অফ-ডে বদলি ডিউটি)
                            </span>
                          )}
                          {shift === 'Leave' && row.originalPost && (
                            <span className="text-xs text-slate-500 font-normal mt-0.5">
                              মূল পোস্ট: {row.originalPost}
                            </span>
                          )}
                          
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
                      <td className="px-6 py-3 text-slate-600">
                        {row.offDay || '-'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            row.permanentGroup === 'Reliever' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            Gr: {row.permanentGroup === 'Reliever' ? 'রিলেভার' : shift === 'General' ? 'General' : row.permanentGroup === 'General' ? 'General' : row.permanentGroup}
                          </span>
                          
                          {row.isRelieverDuty && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <RefreshCcw className="w-3 h-3" /> অফ-ডে বদলি
                            </span>
                          )}

                          {row.isOT && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> OT
                            </span>
                          )}
                          {row.isReplacement && !row.isRelieverDuty && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <RefreshCcw className="w-3 h-3" /> ছুটি বদলি
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

