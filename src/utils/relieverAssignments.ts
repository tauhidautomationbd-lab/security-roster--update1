import { Staff, ShiftType, PostRequirement, ShiftChangeRecord, PermanentGroup, LeaveRecord, OTRecord } from '../types';
import { postRequirements as initialPosts } from '../data';

export const dayNamesEn = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export const dayNameToBn: Record<string, string> = {
  Saturday: 'শনিবার',
  Sunday: 'রবিবার',
  Monday: 'সোমবার',
  Tuesday: 'মঙ্গলবার',
  Wednesday: 'বুধবার',
  Thursday: 'বৃহস্পতিবার',
  Friday: 'শুক্রবার',
  sat: 'শনিবার',
  sun: 'রবিবার',
  mon: 'সোমবার',
  tue: 'মঙ্গলবার',
  wed: 'বুধবার',
  thu: 'বৃহস্পতিবার',
  fri: 'শুক্রবার'
};

export const getRunningShiftForGroup = (permanentGroup: PermanentGroup | string, startDate: string): ShiftType => {
  if (permanentGroup === 'General') return 'General';
  if (permanentGroup === 'Reliever') return 'Reliever';
  
  const [y, m, d] = startDate.split('-').map(Number);
  const currentStartDate = new Date(y, m - 1, d);
  const anchorDate = new Date(2026, 7, 29); // 2026-08-29 (Saturday)
  currentStartDate.setHours(0, 0, 0, 0);
  anchorDate.setHours(0, 0, 0, 0);
  
  const timeDiff = currentStartDate.getTime() - anchorDate.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
  const weeksDiff = Math.floor(daysDiff / 7);
  const rotationCycle = ((weeksDiff % 3) + 3) % 3;

  if (rotationCycle === 0) {
    if (permanentGroup === 'A') return 'B';
    if (permanentGroup === 'B') return 'C';
    if (permanentGroup === 'C') return 'A';
  } else if (rotationCycle === 1) {
    if (permanentGroup === 'A') return 'A';
    if (permanentGroup === 'B') return 'B';
    if (permanentGroup === 'C') return 'C';
  } else { // 2
    if (permanentGroup === 'A') return 'C';
    if (permanentGroup === 'B') return 'A';
    if (permanentGroup === 'C') return 'B';
  }
  return 'General';
};

export const getPermanentGroupForRunningShift = (runningShift: ShiftType, startDate: string): PermanentGroup => {
  if (runningShift === 'General') return 'General';
  if (runningShift === 'Reliever') return 'Reliever';
  
  const [y, m, d] = startDate.split('-').map(Number);
  const currentStartDate = new Date(y, m - 1, d);
  const anchorDate = new Date(2026, 7, 29);
  currentStartDate.setHours(0, 0, 0, 0);
  anchorDate.setHours(0, 0, 0, 0);
  
  const timeDiff = currentStartDate.getTime() - anchorDate.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
  const weeksDiff = Math.floor(daysDiff / 7);
  const rotationCycle = ((weeksDiff % 3) + 3) % 3;

  if (rotationCycle === 0) {
    if (runningShift === 'B') return 'A';
    if (runningShift === 'C') return 'B';
    if (runningShift === 'A') return 'C';
  } else if (rotationCycle === 1) {
    if (runningShift === 'A') return 'A';
    if (runningShift === 'B') return 'B';
    if (runningShift === 'C') return 'C';
  } else { // 2
    if (runningShift === 'C') return 'A';
    if (runningShift === 'A') return 'B';
    if (runningShift === 'B') return 'C';
  }
  return runningShift as PermanentGroup;
};

export const extractPostNumbers = (str: string): number[] => {
  const nums: number[] = [];
  const regex = /(?:post|rg)[-\s]*([\d\s,&and]+)/gi;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const extracted = match[1].match(/\d+/g);
    if (extracted) {
      extracted.forEach(n => nums.push(parseInt(n, 10)));
    }
  }
  if (nums.length === 0) {
    const allNums = str.match(/\d+/g);
    if (allNums && str.toLowerCase().includes('post')) {
      allNums.forEach(n => nums.push(parseInt(n, 10)));
    }
  }
  return nums;
};

export interface RelieverCoverage {
  reliever: Staff;
  coveredStaff: Staff;
  day: string; // 'Wednesday'
  dayBn: string; // 'বুধবার'
  runningShift: ShiftType; // 'A' | 'B' | 'C' | 'General'
  postName: string;
  coverLabel: string; // '[অফ-ডে বদলি: আংগুরা খাতুন (বুধবার)]'
}

export interface DayShiftManpower {
  date: Date;
  iso: string;
  nameBn: string;
  dayStr: string;
  A: { total: number; regular: number; relievers: number; offCount: number; leaveCount: number; details: string[] };
  B: { total: number; regular: number; relievers: number; offCount: number; leaveCount: number; details: string[] };
  C: { total: number; regular: number; relievers: number; offCount: number; leaveCount: number; details: string[] };
}

export interface RelieverScheduleResult {
  assignmentsByDay: Map<string, Map<string, Staff[]>>;
  unassignedByDay: Map<string, Staff[]>;
  coverages: RelieverCoverage[];
  coveragesByShift: Record<ShiftType, RelieverCoverage[]>;
  dailyManpower: DayShiftManpower[];
  relievers: Staff[];
}

export const calculateRelieverSchedule = (
  staff: Staff[],
  posts: PostRequirement[],
  shiftChanges: ShiftChangeRecord[] = [],
  weekNumber: number,
  startDate: string,
  leaves: LeaveRecord[] = [],
  ots: OTRecord[] = []
): RelieverScheduleResult => {
  const activeStaff = staff.filter(s => s.status !== 'resigned');
  const weekShiftChanges = shiftChanges.filter(sc => sc.weekNumber === weekNumber);
  const weekLeaves = leaves.filter(l => l.weekNumber === weekNumber);
  const weekOts = ots.filter(o => o.weekNumber === weekNumber);

  const changedShiftMap = new Map<string, string>();
  weekShiftChanges.forEach(sc => {
    changedShiftMap.set(sc.staffId, sc.targetShift);
    if (sc.swappedWithStaffId && sc.swappedFromShift) {
      changedShiftMap.set(sc.swappedWithStaffId, sc.swappedFromShift);
    }
  });

  const relievers = activeStaff.filter(s => {
    if (changedShiftMap.has(s.id)) {
      return changedShiftMap.get(s.id) === 'Reliever';
    }
    return s.permanentGroup === 'Reliever';
  });

  const assignmentsByDay = new Map<string, Map<string, Staff[]>>();
  const unassignedByDay = new Map<string, Staff[]>();
  const coverages: RelieverCoverage[] = [];
  const coveragesByShift: Record<ShiftType, RelieverCoverage[]> = {
    A: [],
    B: [],
    C: [],
    General: [],
    Reliever: [],
    Leave: [],
    OT: []
  };

  const relieverLastShift = new Map<string, string>();

  // Map each day
  dayNamesEn.forEach(day => {
    const dayAssignments = new Map<string, Staff[]>();
    const assignedThisDay = new Set<string>();

    let unassignedOffStaff = activeStaff.filter(s => {
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

      // Prioritize avoiding C -> B shift violations or respecting preferences
      unassignedOffStaff.sort((a, b) => {
        const shiftA = getRunningShiftForGroup(a.permanentGroup, startDate);
        const shiftB = getRunningShiftForGroup(b.permanentGroup, startDate);
        if (lastShift === 'C') {
          if (shiftA === 'B' && shiftB !== 'B') return -1;
          if (shiftB === 'B' && shiftA !== 'B') return 1;
        }
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

          if (!matches) {
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

          const runningShift = getRunningShiftForGroup(s.permanentGroup, startDate);
          relieverLastShift.set(r.id, runningShift);

          const dayBn = dayNameToBn[day] || day;
          const cov: RelieverCoverage = {
            reliever: r,
            coveredStaff: s,
            day,
            dayBn,
            runningShift,
            postName: s.subSection || r.subSection || 'সাধারণ ডিউটি',
            coverLabel: `[অফ-ডে বদলি: ${s.name} (${dayBn})]`
          };
          coverages.push(cov);
          if (coveragesByShift[runningShift]) {
            coveragesByShift[runningShift].push(cov);
          }
          break;
        }
      }
      dayAssignments.set(r.id, covered);
    });

    unassignedByDay.set(day, [...unassignedOffStaff]);
    assignmentsByDay.set(day, dayAssignments);
  });

  // Calculate 7-day daily manpower
  const [startY, startM, startD] = startDate.split('-').map(Number);
  const startObj = new Date(startY, startM - 1, startD);

  const dailyManpower: DayShiftManpower[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startObj);
    d.setDate(startObj.getDate() + i);
    const dayStr = dayNamesEn[d.getDay() === 6 ? 0 : d.getDay() + 1]; // matching week start Saturday
    const actualDayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const nameBn = dayNameToBn[actualDayName] || d.toLocaleDateString('bn-BD', { weekday: 'short' });
    const iso = d.toISOString().split('T')[0];
    const dayTime = d.getTime();

    const shiftsSummary: Record<'A' | 'B' | 'C', { total: number; regular: number; relievers: number; offCount: number; leaveCount: number; details: string[] }> = {
      A: { total: 0, regular: 0, relievers: 0, offCount: 0, leaveCount: 0, details: [] },
      B: { total: 0, regular: 0, relievers: 0, offCount: 0, leaveCount: 0, details: [] },
      C: { total: 0, regular: 0, relievers: 0, offCount: 0, leaveCount: 0, details: [] }
    };

    // 1. Regular staff on duty
    activeStaff.forEach(s => {
      if (s.permanentGroup === 'Reliever' || s.permanentGroup === 'General') return;
      const targetGroup = changedShiftMap.get(s.id) || s.permanentGroup;
      if (targetGroup === 'Reliever' || targetGroup === 'General') return;

      const runningShift = getRunningShiftForGroup(targetGroup, startDate);
      if (!['A', 'B', 'C'].includes(runningShift)) return;
      const shiftKey = runningShift as 'A' | 'B' | 'C';

      // Check leave
      const staffLeave = weekLeaves.find(l => l.staffId === s.id);
      let isOnLeave = false;
      if (staffLeave) {
        if (!staffLeave.endDate) {
          isOnLeave = true;
        } else if (staffLeave.startDate) {
          const lStart = new Date(staffLeave.startDate).getTime();
          const lEnd = new Date(staffLeave.endDate).getTime();
          if (dayTime >= lStart && dayTime <= lEnd) {
            isOnLeave = true;
          }
        }
      }

      if (isOnLeave) {
        shiftsSummary[shiftKey].leaveCount++;
        return;
      }

      // Check off-day
      const sOffDay = String(s.offDay || '').trim().toLowerCase();
      if (sOffDay === actualDayName.toLowerCase()) {
        shiftsSummary[shiftKey].offCount++;
        return; // off today
      }

      // Otherwise, working today
      shiftsSummary[shiftKey].regular++;
      shiftsSummary[shiftKey].total++;
    });

    // 2. Relievers covering this shift on this day
    const dayRelieverAssignments = assignmentsByDay.get(actualDayName);
    if (dayRelieverAssignments) {
      dayRelieverAssignments.forEach((coveredList, relieverId) => {
        const relieverStaff = relievers.find(r => r.id === relieverId);
        if (!relieverStaff) return;
        if (String(relieverStaff.offDay || '').trim().toLowerCase() === actualDayName.toLowerCase()) return;

        coveredList.forEach(covered => {
          const targetGroup = changedShiftMap.get(covered.id) || covered.permanentGroup;
          const coveredRunningShift = getRunningShiftForGroup(targetGroup, startDate);
          if (['A', 'B', 'C'].includes(coveredRunningShift)) {
            const shiftKey = coveredRunningShift as 'A' | 'B' | 'C';
            shiftsSummary[shiftKey].relievers++;
            shiftsSummary[shiftKey].total++;
            shiftsSummary[shiftKey].details.push(`${relieverStaff.name} (বদলি: ${covered.name})`);
          }
        });
      });
    }

    // 3. Any active replacements for leaves
    weekLeaves.forEach(leave => {
      if (leave.replacementStaffId && leave.shiftType && ['A', 'B', 'C'].includes(leave.shiftType)) {
        let isLeaveActiveToday = false;
        if (!leave.endDate) {
          isLeaveActiveToday = true;
        } else if (leave.startDate) {
          const lStart = new Date(leave.startDate).getTime();
          const lEnd = new Date(leave.endDate).getTime();
          if (dayTime >= lStart && dayTime <= lEnd) isLeaveActiveToday = true;
        }
        if (isLeaveActiveToday) {
          const shiftKey = leave.shiftType as 'A' | 'B' | 'C';
          shiftsSummary[shiftKey].total++;
        }
      }
    });

    // 4. Overtime (OT)
    weekOts.forEach(ot => {
      if (['A', 'B', 'C'].includes(ot.shift)) {
        // If OT is assigned
        shiftsSummary[ot.shift as 'A' | 'B' | 'C'].total++;
      }
    });

    return {
      date: d,
      iso,
      nameBn,
      dayStr: actualDayName,
      A: shiftsSummary.A,
      B: shiftsSummary.B,
      C: shiftsSummary.C
    };
  });

  return {
    assignmentsByDay,
    unassignedByDay,
    coverages,
    coveragesByShift,
    dailyManpower,
    relievers
  };
};
