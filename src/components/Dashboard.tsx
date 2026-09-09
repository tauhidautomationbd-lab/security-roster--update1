import React from 'react';
import { Staff, PostRequirement, LeaveRecord, OTRecord, RosterAssignment } from '../types';
import { Users, Clock, ShieldAlert, CheckCircle, AlertTriangle, UserX, Calendar, FileText } from 'lucide-react';
import { DailyManpowerStatus } from './DailyManpowerStatus';
import { formatDisplayDate } from '../utils/dateUtils';

interface Props {
  staff: Staff[];
  posts: PostRequirement[];
  leaves: LeaveRecord[];
  ots: OTRecord[];
  roster: RosterAssignment[];
  startDate: string;
}

export const Dashboard: React.FC<Props> = ({ staff, posts, leaves, ots, roster, startDate }) => {
  const activeStaff = staff.filter(s => s.status !== 'resigned');
  const resignedStaff = staff.filter(s => s.status === 'resigned');

  const totalActiveStaff = activeStaff.length;
  const totalResignedStaff = resignedStaff.length;
  const activeLeaves = leaves.length;
  const activeOTs = ots.length;
  
  const guards = activeStaff.filter(s => s.role === 'Guard').length;
  const ladyGuards = activeStaff.filter(s => s.role === 'LadyGuard').length;
  const supervisors = activeStaff.filter(s => s.role === 'Supervisor').length;
  const officers = activeStaff.filter(s => s.role === 'Officer').length;
  
  // Calculate requirements per shift based on posts
  const reqA = posts.reduce((sum, p) => sum + (p.shiftCounts.A || 0), 0);
  const reqB = posts.reduce((sum, p) => sum + (p.shiftCounts.B || 0), 0);
  const reqC = posts.reduce((sum, p) => sum + (p.shiftCounts.C || 0), 0);
  const reqGeneral = posts.reduce((sum, p) => sum + (p.shiftCounts.General || 0), 0);
  const reqReliever = posts.reduce((sum, p) => sum + (p.shiftCounts.Reliever || 0), 0);

  // Total Manpower Calculation
  const totalRequiredManpower = reqA + reqB + reqC + reqGeneral + reqReliever;
  const manpowerGap = totalActiveStaff - totalRequiredManpower;
  const isShortage = manpowerGap < 0;
  const isExcess = manpowerGap > 0;
  const isBalanced = manpowerGap === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ড্যাশবোর্ড ওভারভিউ</h2>
          <p className="text-xs text-slate-500 mt-0.5">সিকিউরিটি টিম, পোস্টের চাহিদা এবং পদত্যাগকারী স্টাফের রিয়েল-টাইম সারসংক্ষেপ</p>
        </div>
      </div>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Staff */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">মোট সক্রিয় লোকবল</p>
            <p className="text-2xl font-bold text-slate-800">{totalActiveStaff} জন</p>
            <span className="text-[11px] text-slate-400">কাজে নিয়োজিত</span>
          </div>
        </div>
        
        {/* Manpower Gap / Shortage */}
        <div className={`bg-white p-5 rounded-xl shadow-sm border flex items-center gap-4 ${isShortage ? 'border-rose-300' : isExcess ? 'border-emerald-300' : 'border-slate-200'}`}>
          <div className={`p-3 rounded-xl ${isShortage ? 'bg-rose-100 text-rose-600' : isExcess ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">লোকবল পরিস্থিতি</p>
            <p className={`text-xl font-bold ${isShortage ? 'text-rose-700' : isExcess ? 'text-emerald-700' : 'text-slate-800'}`}>
              {isShortage ? `${Math.abs(manpowerGap)} জন শর্ট` : isExcess ? `${manpowerGap} জন বেশি` : 'পর্যাপ্ত'}
            </p>
            <span className={`text-[10px] font-medium ${isShortage ? 'text-rose-500' : isExcess ? 'text-emerald-500' : 'text-slate-400'}`}>
              চাহিদা: {totalRequiredManpower} জন
            </span>
          </div>
        </div>
        
        {/* Leaves */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">ছুটিতে আছে</p>
            <p className="text-2xl font-bold text-slate-800">{activeLeaves} জন</p>
            <span className="text-[11px] text-slate-400">অনুমোদিত ছুটি</span>
          </div>
        </div>
        
        {/* Overtime */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">ওভারটাইম</p>
            <p className="text-2xl font-bold text-slate-800">{activeOTs} টি</p>
            <span className="text-[11px] text-slate-400">চলতি সপ্তাহে</span>
          </div>
        </div>

        {/* Resigned Staff Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">চাকরি ছেড়েছেন</p>
            <p className="text-2xl font-bold text-rose-700">{totalResignedStaff} জন</p>
            <span className="text-[11px] text-rose-500 font-medium">পদত্যাগকারী স্টাফ</span>
          </div>
        </div>
      </div>

      {/* Breakdown by Role & Shift Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            পদবী ভিত্তিক সক্রিয় লোকবল
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">সিকিউরিটি অফিসার</span>
              <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-200">{officers} জন</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">সিকিউরিটি সুপারভাইজর</span>
              <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-200">{supervisors} জন</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">সিকিউরিটি গার্ড (পুরুষ)</span>
              <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-200">{guards} জন</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">লেডি সিকিউরিটি গার্ড</span>
              <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-200">{ladyGuards} জন</span>
            </div>
          </div>
        </div>

        {/* Shift Requirements */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-4">শিফট অনুযায়ী প্রয়োজন (পোস্ট ভিত্তিক)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">A Shift (সকাল ৭টা - বিকাল ৩টা)</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">{reqA} জন</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">B Shift (বিকাল ৩টা - রাত ১১টা)</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">{reqB} জন</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">C Shift (রাত ১১টা - সকাল ৬টা)</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">{reqC} জন</span>
            </div>
          </div>
        </div>
      </div>

      {/* RESIGNED PERSONNEL DETAILS SECTION IN DASHBOARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                চাকরি ছাড়া / পদত্যাগকারী স্টাফের বিবরণ (Resignation Details)
              </h3>
              <p className="text-xs text-slate-500">
                কোন কোন কর্মী চাকরি ছেড়ে দিয়েছেন এবং পদত্যাগের কারণের তালিকা
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            মোট পদত্যাগকারী: {totalResignedStaff} জন
          </span>
        </div>

        {resignedStaff.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">বর্তমানে কোনো পদত্যাগকারী বা চাকরি ছাড়া স্টাফের রেকর্ড নেই।</p>
            <p className="text-xs text-slate-400 mt-0.5">স্টাফ ম্যানেজমেন্ট ট্যাব থেকে কোনো কর্মী চাকরি ছাড়লে তার বিবরণ এখানে প্রদর্শিত হবে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">#</th>
                  <th className="px-4 py-2.5">স্টাফ আইডি</th>
                  <th className="px-4 py-2.5">নাম</th>
                  <th className="px-4 py-2.5">পদবী</th>
                  <th className="px-4 py-2.5">পোস্ট ও শিফট</th>
                  <th className="px-4 py-2.5">পদত্যাগের তারিখ</th>
                  <th className="px-4 py-2.5">পদত্যাগের কারণ</th>
                  <th className="px-4 py-2.5">মন্তব্য / বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resignedStaff.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-rose-50/20">
                    <td className="px-4 py-2.5 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{s.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {s.role === 'Guard' ? 'সিকিউরিটি গার্ড' : s.role === 'LadyGuard' ? 'লেডি গার্ড' : s.role === 'Supervisor' ? 'সুপারভাইজর' : 'অফিসার'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-medium text-xs">{s.subSection || 'পোস্ট নির্ধারিত নেই'}</span>
                        <span className="text-slate-500 text-[11px]">শিফট: {s.permanentGroup || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 font-medium whitespace-nowrap">
                      {s.resignationDate ? formatDisplayDate(s.resignationDate) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-rose-700 font-semibold">
                      {s.resignationReason || 'ব্যক্তিগত কারণ'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">
                      {s.resignationRemarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Manpower Status Table */}
      <div className="mt-2">
        <DailyManpowerStatus roster={roster} startDate={startDate} posts={posts} staff={activeStaff} />
      </div>
    </div>
  );
};
