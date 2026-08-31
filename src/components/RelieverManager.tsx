import React, { useMemo } from 'react';
import { Staff, PostRequirement, ShiftChangeRecord } from '../types';
import { postRequirements as initialPosts } from '../data';

interface Props {
  staff: Staff[];
  posts: PostRequirement[];
  shiftChanges: ShiftChangeRecord[];
  weekNumber: number;
}

export const RelieverManager: React.FC<Props> = ({ staff, posts, shiftChanges, weekNumber }) => {
  const weekShiftChanges = shiftChanges.filter(sc => sc.weekNumber === weekNumber);
  
  const changedShiftMap = new Map<string, string>();
  weekShiftChanges.forEach(sc => {
    changedShiftMap.set(sc.staffId, sc.targetShift);
    if (sc.swappedWithStaffId && sc.swappedFromShift) {
      changedShiftMap.set(sc.swappedWithStaffId, sc.swappedFromShift);
    }
  });

  const relievers = staff.filter(s => {
    if (changedShiftMap.has(s.id)) {
      return changedShiftMap.get(s.id) === 'Reliever';
    }
    return s.permanentGroup === 'Reliever';
  });

  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const uniqueSupportPersonIds = Array.from(new Set(posts.flatMap(p => {
    const initialPost = initialPosts.find(ip => ip.id === p.id);
    return p.supportPersons || (initialPost ? initialPost.supportPersons : []) || [];
  })));
  
  const supportPersons = uniqueSupportPersonIds.map(id => staff.find(s => s.id === id)).filter(Boolean) as Staff[];

  
  const rotationCycle = weekNumber % 3;
  const getAssignedShift = (permanentGroup: string): string => {
    if (permanentGroup === 'General') return 'General';
    if (permanentGroup === 'Reliever') return 'Reliever';
    if (rotationCycle === 0) {
      if (permanentGroup === 'A') return 'C';
      if (permanentGroup === 'B') return 'A';
      if (permanentGroup === 'C') return 'B';
    } else if (rotationCycle === 1) {
      if (permanentGroup === 'A') return 'B';
      if (permanentGroup === 'B') return 'C';
      if (permanentGroup === 'C') return 'A';
    } else {
      if (permanentGroup === 'A') return 'A';
      if (permanentGroup === 'B') return 'B';
      if (permanentGroup === 'C') return 'C';
    }
    return 'General';
  };
const assignmentsByDay = useMemo(() => {
    const assignments = new Map<string, Map<string, Staff[]>>();

    const extractPostNumbers = (str: string): string[] => {
       const nums: string[] = [];
       const regex = /(?:post|rg)[-\s]*([\d\s,&and]+)/gi;
       let match;
       while ((match = regex.exec(str)) !== null) {
           const extracted = match[1].match(/\d+/g);
           if (extracted) {
               const prefix = match[0].toLowerCase().includes('rg') ? 'rg' : 'post';
               nums.push(...extracted.map(n => prefix + '-' + parseInt(n, 10).toString()));
           }
       }
       if (nums.length === 0) {
           const allNums = str.match(/\d+/g);
           if (allNums && str.toLowerCase().includes('post')) {
               nums.push(...allNums.map(n => 'post-' + parseInt(n, 10).toString()));
           }
       }
       return nums;
    };

    
    const relieverLastShift = new Map<string, string>();

    days.forEach(day => {
      const dayAssignments = new Map<string, Staff[]>();
      const assignedThisDay = new Set<string>();
      
      let unassignedOffStaff = staff.filter(s => {
         const isSReliever = changedShiftMap.has(s.id) ? changedShiftMap.get(s.id) === 'Reliever' : s.permanentGroup === 'Reliever';
         if (isSReliever) return false;
         if (String(s.offDay || '').trim().toLowerCase() !== day.toLowerCase()) return false;
         return true;
      });

      relievers.forEach(r => {
          if (String(r.offDay || '').trim().toLowerCase() === day.toLowerCase()) {
              relieverLastShift.delete(r.id);
              return;
          }
          
          const covered: Staff[] = [];
          const lastShift = relieverLastShift.get(r.id);

          // Sort unassignedOffStaff to prioritize the C -> B rule
          unassignedOffStaff.sort((a, b) => {
              const shiftA = getAssignedShift(a.permanentGroup);
              const shiftB = getAssignedShift(b.permanentGroup);
              if (lastShift === 'C') {
                  if (shiftA === 'B' && shiftB !== 'B') return -1;
                  if (shiftB === 'B' && shiftA !== 'B') return 1;
              }
              // Add a generic progression if wanted, e.g. A -> C -> B -> A
              // But user only strictly requested Night -> Evening (C -> B).
              return 0;
          });

          for (let i = 0; i < unassignedOffStaff.length; i++) {
              const s = unassignedOffStaff[i];
              if (assignedThisDay.has(s.id)) continue;
              
              const supportedPosts = posts.filter(p => {
                const initialPost = initialPosts.find(ip => ip.id === p.id);
                const supports = p.supportPersons || (initialPost ? initialPost.supportPersons : []) || [];
                return supports.includes(r.id);
              });
              
              const sSub = (s.subSection || '').toLowerCase();
              const rSub = (r.subSection || '').toLowerCase();
              
              let matches = false;
              if (r.role !== s.role) {
                  matches = false;
              } else {
                  const sTags = extractPostNumbers(sSub);
                  const rTags = extractPostNumbers(rSub);
                  
                  if (sTags.length > 0 && rTags.length > 0) {
                      if (sTags.some(tag => rTags.includes(tag))) matches = true;
                  }
                  
                  if (!matches && sTags.length === 0 && rTags.length === 0) {
                      if (rSub && sSub && (rSub.includes(sSub) || sSub.includes(rSub)) && sSub.length > 3) matches = true;
                  }
                  
                  if (!matches) {
                    matches = supportedPosts.some(p => {
                      const pTags = extractPostNumbers(p.name);
                      if (sTags.length > 0 && pTags.length > 0) {
                          if (sTags.some(tag => pTags.includes(tag))) return true;
                      }
                      const pName = p.name.toLowerCase();
                      if (sSub.includes(pName) || pName.includes(sSub)) return true;
                      return false;
                    });
                  }
              }

              if (matches) {
                 covered.push(s);
                 assignedThisDay.add(s.id);
                 unassignedOffStaff.splice(i, 1);
                 relieverLastShift.set(r.id, getAssignedShift(s.permanentGroup));
                 break;
              }
          }
          dayAssignments.set(r.id, covered);
      });
      assignments.set(day, dayAssignments);
    });
return assignments;
  }, [staff, relievers, days, changedShiftMap, posts]);

  return (
    <div className="space-y-8">
      {/* Reliever Routine Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">রিলিভার (Reliever) রুটিন</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">রিলিভারের নাম ও আইডি</th>
                  <th className="px-4 py-3">নির্ধারিত পোস্ট (SubSection)</th>
                  {days.map(day => (
                    <th key={day} className="px-4 py-3 text-center">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relievers.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.name} ({r.id})</td>
                    <td className="px-4 py-3 text-slate-600">{r.subSection}</td>
                    {days.map(day => {
                      const offStaff = assignmentsByDay.get(day)?.get(r.id) || [];
                      
                      let elements: React.ReactNode = <span className="text-slate-400">-</span>;
                      if (String(r.offDay || '').trim().toLowerCase() === day.toLowerCase()) {
                        elements = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">অফ ডে</span>;
                      } else if (offStaff.length > 0) {
                        elements = (
                          <div className="flex flex-col gap-1">
                            {offStaff.map(s => (
                              <span key={s.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 text-left">
                                {s.name} ({s.id}) - {s.subSection || 'Unknown'}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      
                      return (
                        <td key={day} className="px-4 py-3 text-center align-top">
                          {elements}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Support Persons Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Leave / Absent Support (Available Backup)</h2>
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-4">
          <p className="text-sm text-amber-800">
            <strong>সতর্কতা (Reminder):</strong> Support Person-দের যদি Night (C Shift) এর পরদিন Morning (A) বা General (G) শিফটে ডিউটি পড়ে, তবে তা ম্যানুয়ালি চেক করে পরিবর্তন করুন।
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">সাপোর্ট ব্যক্তির নাম ও আইডি</th>
                  <th className="px-4 py-3">যেসব পোস্টের সাপোর্ট হিসেবে নির্ধারিত</th>
                  <th className="px-4 py-3">বর্তমান স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supportPersons.map(sp => {
                  const assignedPostsForSupport = posts.filter(p => {
                    const initialPost = initialPosts.find(ip => ip.id === p.id);
                    const supports = p.supportPersons || (initialPost ? initialPost.supportPersons : []) || [];
                    return supports.includes(sp.id);
                  });
                  return (
                    <tr key={sp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{sp.name} ({sp.id})</td>
                      <td className="px-4 py-3 text-slate-600">
                        {assignedPostsForSupport.map(p => p.name).join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          Available Backup
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
