import React, { useMemo } from 'react';
import { RosterAssignment, PostRequirement, Staff } from '../types';
import { postRequirements as initialPosts } from '../data';

interface Props {
  roster: RosterAssignment[];
  startDate: string;
  posts: PostRequirement[];
  staff: Staff[];
}

export const DailyManpowerStatus: React.FC<Props> = ({ roster, startDate, posts, staff }) => {
  const days = useMemo(() => {
    const start = new Date(startDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        iso: d.toISOString().split('T')[0],
        date: d,
        nameBn: d.toLocaleDateString('bn-BD', { weekday: 'short' }),
        dayStr: d.toLocaleDateString('en-US', { weekday: 'long' })
      };
    });
  }, [startDate]);

  const targets = useMemo(() => {
    let A = 0, B = 0, C = 0;
    posts.forEach(p => {
      A += p.shiftCounts.A || 0;
      B += p.shiftCounts.B || 0;
      C += p.shiftCounts.C || 0;
    });
    return { A, B, C };
  }, [posts]);

  const dailyManpower = useMemo(() => {
    const result = days.map(day => ({
        iso: day.iso,
        nameBn: day.nameBn,
        A: 0, B: 0, C: 0
    }));

    staff.forEach(s => {
      const rEntries = roster.filter(r => r.staffId === s.id);
      if (rEntries.length === 0) return;

      days.forEach((day, idx) => {
         const dayTime = day.date.getTime();
         const dayStr = day.dayStr.toLowerCase();
         
         // 1. Find active entry for this day
         let activeEntry = rEntries.find(r => r.isReplacement) || rEntries[0];
         let currentShift = activeEntry.assignedShift;
         if (activeEntry.dailyShifts && activeEntry.dailyShifts[day.dayStr]) {
             currentShift = activeEntry.dailyShifts[day.dayStr];
         }
         
         // If there's a shift change, check if it's active today
         if (activeEntry.isShiftChange && activeEntry.shiftChangeDates) {
            const sMatch = activeEntry.shiftChangeDates.match(/\d{4}-\d{2}-\d{2}/g);
            if (sMatch && sMatch.length >= 1) {
               const sTime = new Date(sMatch[0]).getTime();
               const eTime = sMatch.length > 1 ? new Date(sMatch[1]).getTime() : sTime;
               const isActive = (dayTime >= sTime && dayTime <= eTime);
               if (!isActive) {
                  // Fallback to permanent group shift if shift change is NOT active today
                  currentShift = s.permanentGroup === 'A' || s.permanentGroup === 'Morning' ? 'A' :
                                 s.permanentGroup === 'B' || s.permanentGroup === 'Evening' ? 'B' :
                                 s.permanentGroup === 'C' || s.permanentGroup === 'Night' ? 'C' :
                                 s.permanentGroup === 'General' ? 'General' :
                                 s.permanentGroup === 'Reliever' ? 'Reliever' : currentShift;
               }
            }
         }
         
         // 2. Check if off day or on leave today
         let isOff = false;
         if (currentShift === 'Leave') isOff = true;
         if (String(activeEntry.offDay || '').trim().toLowerCase() === dayStr) isOff = true;
         if (activeEntry.leaveStartDate) {
            const lStart = new Date(activeEntry.leaveStartDate).getTime();
            const lEnd = activeEntry.leaveEndDate ? new Date(activeEntry.leaveEndDate).getTime() : Infinity;
            if (dayTime >= lStart && dayTime <= lEnd) isOff = true;
         }
         
         // 3. Count if not off and belongs to A, B, or C
         if (!isOff) {
             // For Relievers, if they are assigned a post in A, B, C, their assignedShift will be A, B, C.
             // If for some reason they are still 'Reliever', we don't count them in A, B, C target counts.
             if (['A', 'B', 'C'].includes(currentShift)) {
                 result[idx][currentShift as 'A' | 'B' | 'C']++;
             }
         }
      });
    });

    return result;
  }, [roster, days, staff, posts]);

  const getStatusBadge = (count: number, target: number) => {
    const diff = count - target;
    if (diff === 0) return <span className="text-emerald-600 font-medium">✓ সঠিক ({count})</span>;
    if (diff > 0) return <span className="text-indigo-600 font-medium">+{diff} বেশি ({count})</span>;
    return <span className="text-rose-600 font-medium">{diff} শর্ট ({count})</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">প্রতিদিনের ম্যানপাওয়ার স্ট্যাটাস</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left">তারিখ</th>
              <th className="px-6 py-3">Morning / A Shift (Target: {targets.A})</th>
              <th className="px-6 py-3">Evening / B Shift (Target: {targets.B})</th>
              <th className="px-6 py-3">Night / C Shift (Target: {targets.C})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dailyManpower.map(day => (
              <tr key={day.iso} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-left font-medium text-slate-800">
                  {day.iso} ({day.nameBn})
                </td>
                <td className="px-6 py-3">{getStatusBadge(day.A, targets.A)}</td>
                <td className="px-6 py-3">{getStatusBadge(day.B, targets.B)}</td>
                <td className="px-6 py-3">{getStatusBadge(day.C, targets.C)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
