import React, { useMemo } from 'react';
import { RosterAssignment, PostRequirement, Staff, ShiftChangeRecord, LeaveRecord, OTRecord } from '../types';
import { calculateRelieverSchedule, dayNameToBn } from '../utils/relieverAssignments';
import { CheckCircle2, AlertTriangle, Users } from 'lucide-react';

interface Props {
  roster: RosterAssignment[];
  startDate: string;
  posts: PostRequirement[];
  staff: Staff[];
  shiftChanges?: ShiftChangeRecord[];
  weekNumber?: number;
  leaves?: LeaveRecord[];
  ots?: OTRecord[];
}

export const DailyManpowerStatus: React.FC<Props> = ({ 
  roster, 
  startDate, 
  posts, 
  staff,
  shiftChanges = [],
  weekNumber = 1,
  leaves = [],
  ots = []
}) => {
  const targets = useMemo(() => {
    let A = 0, B = 0, C = 0;
    posts.forEach(p => {
      A += p.shiftCounts.A || 0;
      B += p.shiftCounts.B || 0;
      C += p.shiftCounts.C || 0;
    });
    return { A, B, C };
  }, [posts]);

  const relieverData = useMemo(() => {
    return calculateRelieverSchedule(staff, posts, shiftChanges, weekNumber, startDate, leaves, ots);
  }, [staff, posts, shiftChanges, weekNumber, startDate, leaves, ots]);

  const getStatusBadge = (shiftStats: { total: number; regular: number; relievers: number }, target: number) => {
    const diff = shiftStats.total - target;
    const isCorrect = diff === 0;
    const isExcess = diff > 0;

    return (
      <div className="flex flex-col items-center justify-center py-1">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-xs ${
          isCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
          isExcess ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
          'bg-rose-100 text-rose-900 border border-rose-300'
        }`}>
          {isCorrect && '✓ সঠিক'}
          {isExcess && `+${diff} বেশি`}
          {!isCorrect && !isExcess && `${diff} শর্ট`}
          <span className="opacity-90">({shiftStats.total})</span>
        </span>
        <span className="text-[11px] text-slate-500 font-medium mt-1">
          রেগুলার: {shiftStats.regular} + রিলেভার: {shiftStats.relievers}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            প্রতিদিনের ম্যানপাওয়ার স্ট্যাটাস (প্রকৃত উপস্থিতি ও রিলেভার বদলি)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            অফ-ডের দিন কর্মী বাদ পড়া এবং রিলেভার যুক্ত হওয়ার পর প্রতিটি শিফটের দৈনিক অন-ডিউটি সংখ্যা
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
            ✓ সঠিক = টার্গেট পূর্ণ
          </span>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md">
            শর্ট = ঘাটতি
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-left font-semibold">তারিখ ও বার</th>
              <th className="px-6 py-3.5 font-semibold">
                Morning / A Shift <span className="text-xs font-normal text-slate-500">(টার্গেট: {targets.A})</span>
              </th>
              <th className="px-6 py-3.5 font-semibold">
                Evening / B Shift <span className="text-xs font-normal text-slate-500">(টার্গেট: {targets.B})</span>
              </th>
              <th className="px-6 py-3.5 font-semibold">
                Night / C Shift <span className="text-xs font-normal text-slate-500">(টার্গেট: {targets.C})</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {relieverData.dailyManpower.map(day => (
              <tr key={day.iso} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 text-left font-medium text-slate-800">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{day.nameBn}</span>
                    <span className="text-xs text-slate-500">{day.iso}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5">{getStatusBadge(day.A, targets.A)}</td>
                <td className="px-6 py-3.5">{getStatusBadge(day.B, targets.B)}</td>
                <td className="px-6 py-3.5">{getStatusBadge(day.C, targets.C)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

