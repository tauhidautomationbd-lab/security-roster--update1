import { Staff, ShiftType, PostRequirement, RosterAssignment, PermanentGroup, LeaveRecord, OTRecord, ShiftChangeRecord } from '../types';

export const generateWeeklyRoster = (
  weekNumber: number,
  startDate: string,
  allStaff: Staff[],
  postRequirements: PostRequirement[],
  leaves: LeaveRecord[],
  ots: OTRecord[],
  shiftChanges: ShiftChangeRecord[] = []
): RosterAssignment[] => {
  const roster: RosterAssignment[] = [];
  const weekLeaves = leaves.filter(l => l.weekNumber === weekNumber);
  const weekOts = ots.filter(o => o.weekNumber === weekNumber);
  const weekShiftChanges = shiftChanges.filter(sc => sc.weekNumber === weekNumber);
  
  const rotationCycle = weekNumber % 3;
  
  const getAssignedShift = (permanentGroup: PermanentGroup): ShiftType => {
    if (permanentGroup === 'General') return 'General';
    if (permanentGroup === 'Reliever') return 'Reliever' as any;
    
    if (rotationCycle === 0) {
      if (permanentGroup === 'A') return 'C';
      if (permanentGroup === 'B') return 'A';
      if (permanentGroup === 'C') return 'B';
    } else if (rotationCycle === 1) {
      if (permanentGroup === 'A') return 'B';
      if (permanentGroup === 'B') return 'C';
      if (permanentGroup === 'C') return 'A';
    } else { // 2
      if (permanentGroup === 'A') return 'A';
      if (permanentGroup === 'B') return 'B';
      if (permanentGroup === 'C') return 'C';
    }
    return 'General';
  };

  const shiftPools: Record<ShiftType, Staff[]> = {
    A: [],
    B: [],
    C: [],
    General: [],
    Reliever: [],
    Leave: [],
    OT: []
  };
  
  const relievers: Staff[] = [];
  const fullWeekLeaveIds = new Set(weekLeaves.filter(l => !l.endDate).map(l => l.staffId));
  const partialLeaves = weekLeaves.filter(l => !!l.endDate);
  const onLeaveIds = new Set(weekLeaves.map(l => l.staffId)); // keep for some fallback checks
  const changedShiftMap = new Map<string, ShiftType>();
  const partialShiftChangeMap = new Map<string, ShiftChangeRecord>();
  
  weekShiftChanges.forEach(sc => {
    if (sc.endDate) {
      partialShiftChangeMap.set(sc.staffId, sc);
      if (sc.swappedWithStaffId && sc.swappedFromShift) {
        partialShiftChangeMap.set(sc.swappedWithStaffId, {
          ...sc,
          staffId: sc.swappedWithStaffId,
          targetShift: sc.swappedFromShift
        });
      }
    } else {
      changedShiftMap.set(sc.staffId, sc.targetShift);
      if (sc.swappedWithStaffId && sc.swappedFromShift) {
        changedShiftMap.set(sc.swappedWithStaffId, sc.swappedFromShift);
      }
    }
  });

  allStaff.forEach(staff => {
    if (fullWeekLeaveIds.has(staff.id)) {
      shiftPools.Leave.push(staff);
      roster.push({
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        permanentGroup: staff.permanentGroup,
        assignedShift: 'Leave',
        assignedPost: 'সাপ্তাহিক ছুটি / অনুপস্থিত',
        leaveStartDate: weekLeaves.find(l => l.staffId === staff.id)?.startDate,
        leaveEndDate: weekLeaves.find(l => l.staffId === staff.id)?.endDate,
        originalPost: staff.subSection
      });
    } else if (changedShiftMap.has(staff.id)) {
      const targetShift = changedShiftMap.get(staff.id)!;
      if (['A', 'B', 'C', 'General', 'Reliever'].includes(targetShift)) {
        if (targetShift === 'Reliever') {
          relievers.push(staff);
        } else {
          shiftPools[targetShift].push(staff);
        }
      } else {
        shiftPools.General.push(staff);
      }
    } else if (staff.permanentGroup === 'Reliever') {
      relievers.push(staff);
    } else if (staff.permanentGroup === 'General') {
      shiftPools.General.push(staff);
    } else {
      const assignedShift = getAssignedShift(staff.permanentGroup);
      shiftPools[assignedShift].push(staff);
    }
  });

  const guardRelievers = relievers.filter(r => r.role === 'Guard');
  const lgRelievers = relievers.filter(r => r.role === 'LadyGuard');
  const supRelievers = relievers.filter(r => r.role === 'Supervisor');

  // First, place relievers with explicit shifts in subSection
  const unassignedRelievers: Staff[] = [];
  
  [...guardRelievers, ...lgRelievers, ...supRelievers].forEach(r => {
    let baseGroup: 'A' | 'B' | 'C' | null = null;
    if (r.subSection?.includes('Shift- A') || r.subSection?.includes('Shift-A')) {
      baseGroup = 'A';
    } else if (r.subSection?.includes('Shift- B') || r.subSection?.includes('Shift-B')) {
      baseGroup = 'B';
    } else if (r.subSection?.includes('Shift- C') || r.subSection?.includes('Shift-C')) {
      baseGroup = 'C';
    }

    if (baseGroup) {
      const assignedShift = getAssignedShift(baseGroup);
      shiftPools[assignedShift].push(r);
    } else {
      unassignedRelievers.push(r);
    }
  });

  // Distribute remaining relievers to hit exact targets based on post requirements
  let TARGET_A = 0, TARGET_B = 0, TARGET_C = 0;
  postRequirements.forEach(p => {
    TARGET_A += p.shiftCounts.A || 0;
    TARGET_B += p.shiftCounts.B || 0;
    TARGET_C += p.shiftCounts.C || 0;
  });

  // Keep unassigned relievers in the Reliever pool so they can dynamically cover off-days
  unassignedRelievers.forEach(r => {
      shiftPools.Reliever.push(r);
  });

  // Process explicit leave replacements or automatic fallback
  weekLeaves.forEach(leave => {
    let replacementId = leave.replacementStaffId;
    
    // Automatic fallback if no explicit replacement is provided
    if (!replacementId && leave.postName) {
      const postReq = postRequirements.find(p => p.name === leave.postName || p.id === leave.postName);
      if (postReq && postReq.supportPersons && postReq.supportPersons.length > 0) {
        // Find an available support person
        const availableSupport = postReq.supportPersons.find(id => {
          const staff = allStaff.find(s => s.id === id);
          return staff && !onLeaveIds.has(staff.id) && !roster.some(r => r.staffId === staff.id && r.isReplacement);
        });
        if (availableSupport) {
          replacementId = availableSupport;
        }
      }
    }

    if (replacementId && leave.shiftType && leave.postName) {
      const replacementStaff = allStaff.find(s => s.id === replacementId);
      if (replacementStaff && !onLeaveIds.has(replacementStaff.id)) {
        // Find actual running shift for the leave
        const targetGroup = leave.shiftType;
        const actualRunningShift = targetGroup === 'General' ? 'General' : getAssignedShift(targetGroup as PermanentGroup);

        // Remove from normal pool ONLY if the leave is full week
        if (!leave.endDate) {
          (['A', 'B', 'C', 'General'] as ShiftType[]).forEach(shift => {
            const idx = shiftPools[shift].findIndex(s => s.id === replacementStaff.id);
            if (idx !== -1) shiftPools[shift].splice(idx, 1);
          });
        }
        
        roster.push({
          staffId: replacementStaff.id,
          staffName: replacementStaff.name,
          role: replacementStaff.role,
          permanentGroup: replacementStaff.permanentGroup,
          assignedShift: actualRunningShift,
          assignedPost: leave.postName,
          isReplacement: true
        });
      }
    }
  });

  // Add partial shift change extra assignments to roster before finalizing
  partialShiftChangeMap.forEach((sc, staffId) => {
      const staff = allStaff.find(s => s.id === staffId);
      if (staff && !fullWeekLeaveIds.has(staff.id)) {
         const targetGroup = sc.targetShift as PermanentGroup;
         const actualRunningShift = targetGroup === 'General' ? 'General' : 
           (targetGroup === 'Reliever' ? 'Reliever' : getAssignedShift(targetGroup));
           
         if (['A', 'B', 'C', 'General'].includes(actualRunningShift)) {
           roster.push({
              staffId: staff.id,
              staffName: staff.name,
              role: staff.role,
              permanentGroup: staff.permanentGroup,
              assignedShift: actualRunningShift as ShiftType,
              assignedPost: sc.targetPost || 'অস্থায়ী ডিউটি',
              offDay: staff.offDay,
              isShiftChange: true,
              shiftChangeDates: `${sc.startDate} হতে ${sc.endDate}`
           });
         }
      }
  });

  const assignPostsForShift = (shift: ShiftType, pool: Staff[]) => {
    const availableStaff = [...pool];
    
    postRequirements.forEach(req => {
      // Find how many are already assigned to this post in this shift (like replacements)
      const alreadyAssigned = roster.filter(r => r.assignedShift === shift && r.assignedPost === req.name).length;
      let needed = (req.shiftCounts[shift] || 0) - alreadyAssigned;
      
      while (needed > 0 && availableStaff.length > 0) {
        let staffIndex = -1;
        
        let expectedRole = 'Guard';
        const reqNameLower = req.name.toLowerCase();
        if (req.id === 'lg' || reqNameLower.includes('লেডি') || reqNameLower.includes('lady') || reqNameLower.includes('female')) {
            expectedRole = 'LadyGuard';
        } else if (req.id === '16' || req.id === 'sup' || req.id === 'dev' || reqNameLower.includes('সুপারভাইজর') || reqNameLower.includes('supervisor') || reqNameLower.includes('device') || reqNameLower.includes('checker')) {
            expectedRole = 'Supervisor';
        } else if (req.id === 'officer' || reqNameLower.includes('officer')) {
            expectedRole = 'Officer';
        }

        // Priority 1: Exact match by subSection for this staff, BUT MUST MATCH ROLE
        staffIndex = availableStaff.findIndex(s => 
            s.role === expectedRole && 
            (s.subSection === req.name || s.subSection?.includes(req.name) || req.name.includes(s.subSection || '----'))
        );
        
        // Priority 2: Match by role if subSection match fails
        if (staffIndex === -1) {
            staffIndex = availableStaff.findIndex(s => s.role === expectedRole);
        }
        
        if (staffIndex === -1) {
          // No suitable staff found for this post (e.g., needed Guard but only Supervisor left)
          break; 
        }
        
        const staff = availableStaff.splice(staffIndex, 1)[0];
        
        const pLeave = partialLeaves.find(l => l.staffId === staff.id);
        const pShiftChange = partialShiftChangeMap.get(staff.id);

        roster.push({
          staffId: staff.id,
          staffName: staff.name,
          role: staff.role,
          permanentGroup: staff.permanentGroup,
          assignedShift: shift,
          assignedPost: req.name,
          offDay: staff.offDay,
          leaveStartDate: pLeave?.startDate,
          leaveEndDate: pLeave?.endDate,
          isShiftChange: !!pShiftChange,
          shiftChangeDates: pShiftChange ? `${pShiftChange.startDate} হতে ${pShiftChange.endDate} (${pShiftChange.targetShift} শিফট)` : undefined
        });
        needed--;
      }
    });
    
    availableStaff.forEach(staff => {
      const pLeave = partialLeaves.find(l => l.staffId === staff.id);
      const pShiftChange = partialShiftChangeMap.get(staff.id);
      // For remaining staff, if they have a subSection, let's try to assign them to it, otherwise 'অতিরিক্ত / রিজার্ভ'
      roster.push({
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        permanentGroup: staff.permanentGroup,
        assignedShift: shift,
        assignedPost: staff.subSection || 'অতিরিক্ত / রিজার্ভ',
        offDay: staff.offDay,
        leaveStartDate: pLeave?.startDate,
        leaveEndDate: pLeave?.endDate,
        isShiftChange: !!pShiftChange,
        shiftChangeDates: pShiftChange ? `${pShiftChange.startDate} হতে ${pShiftChange.endDate} (${pShiftChange.targetShift} শিফট)` : undefined
      });
    });
  };

  assignPostsForShift('A', shiftPools.A);
  assignPostsForShift('B', shiftPools.B);
  assignPostsForShift('C', shiftPools.C);
  assignPostsForShift('General', shiftPools.General);
  assignPostsForShift('Reliever', shiftPools.Reliever);

  // Process OTs
  weekOts.forEach(ot => {
    if (ot.staffId) {
      const otStaff = allStaff.find(s => s.id === ot.staffId);
      if (otStaff) {
        roster.push({
          staffId: otStaff.id,
          staffName: otStaff.name,
          role: otStaff.role,
          permanentGroup: otStaff.permanentGroup,
          assignedShift: ot.shift,
          assignedPost: ot.postName,
          isOT: true
        });
      }
    } else {
      // Unassigned OT
      roster.push({
        staffId: 'Unassigned',
        staffName: '--- নির্ধারিত হয়নি ---',
        role: 'Guard',
        permanentGroup: 'General',
        assignedShift: ot.shift,
        assignedPost: ot.postName,
        isOT: true
      });
    }
  });


  const dailyShiftsMap = new Map<string, Record<string, ShiftType>>();
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const relieverLastShift = new Map<string, ShiftType>();

  days.forEach(day => {
    let unassignedOffStaff = allStaff.filter(s => {
       const shiftChange = weekShiftChanges.find(sc => sc.staffId === s.id);
       const isSReliever = shiftChange ? shiftChange.targetShift === 'Reliever' : s.permanentGroup === 'Reliever';
       if (isSReliever) return false;
       if (String(s.offDay || '').trim().toLowerCase() !== day.toLowerCase()) return false;
       return true;
    });

    const assignedThisDay = new Set<string>();

    shiftPools.Reliever.forEach(r => {
        if (!dailyShiftsMap.has(r.id)) dailyShiftsMap.set(r.id, {});

        if (String(r.offDay || '').trim().toLowerCase() === day.toLowerCase()) {
            relieverLastShift.delete(r.id);
            return;
        }

        const lastShift = relieverLastShift.get(r.id);

        unassignedOffStaff.sort((a, b) => {
            const shiftA = getAssignedShift(a.permanentGroup);
            const shiftB = getAssignedShift(b.permanentGroup);
            if (lastShift === 'C') {
                if (shiftA === 'B' && shiftB !== 'B') return -1;
                if (shiftB === 'B' && shiftA !== 'B') return 1;
            }
            return 0;
        });

        for (let i = 0; i < unassignedOffStaff.length; i++) {
            const s = unassignedOffStaff[i];
            if (assignedThisDay.has(s.id)) continue;
            
            const supportedPosts = postRequirements.filter(p => p.supportPersons?.includes(r.id));
            const sSub = (s.subSection || '').toLowerCase();
            const rSub = (r.subSection || '').toLowerCase();
            
            let matches = false;
            if (r.role === s.role) {
                const extractNumbers = (str) => {
                    const nums = [];
                    const regex = /(?:post|rg)[-\s]*([\d\s,&and]+)/gi;
                    let match;
                    while ((match = regex.exec(str)) !== null) {
                        const extracted = match[1].match(/\d+/g);
                        if (extracted) nums.push(...extracted);
                    }
                    if (nums.length === 0) {
                        const allNums = str.match(/\d+/g);
                        if (allNums && str.toLowerCase().includes('post')) nums.push(...allNums);
                    }
                    return nums;
                };
                const sTags = extractNumbers(sSub);
                const rTags = extractNumbers(rSub);
                
                if (sTags.length > 0 && rTags.length > 0) {
                    if (sTags.some(tag => rTags.includes(tag))) matches = true;
                }
                
                if (!matches && sTags.length === 0 && rTags.length === 0) {
                    if (rSub && sSub && (rSub.includes(sSub) || sSub.includes(rSub)) && sSub.length > 3) matches = true;
                }
                
                if (!matches) {
                  matches = supportedPosts.some(p => {
                    const pTags = extractNumbers(p.name);
                    if (sTags.length > 0 && pTags.length > 0 && sTags.some(tag => pTags.includes(tag))) return true;
                    const pName = p.name.toLowerCase();
                    if (sSub.includes(pName) || pName.includes(sSub)) return true;
                    return false;
                  });
                }
            }

            if (matches) {
               assignedThisDay.add(s.id);
               unassignedOffStaff.splice(i, 1);
               const targetShift = getAssignedShift(s.permanentGroup);
               relieverLastShift.set(r.id, targetShift);
               dailyShiftsMap.get(r.id)![day] = targetShift;
               break;
            }
        }
    });
  });

  // Enrich roster with shift change markers

  const enrichedRoster = roster.map(r => {
    const shiftChange = weekShiftChanges.find(sc => sc.staffId === r.staffId || sc.swappedWithStaffId === r.staffId);
    let finalR = { ...r };
    
    if (shiftChange && r.assignedShift !== 'Leave' && !r.isOT && !r.isReplacement) {
      let dates = '';
      if (shiftChange.startDate) {
        dates += `শুরু: ${shiftChange.startDate}`;
      }
      if (shiftChange.endDate) {
        dates += dates ? ` | শেষ: ${shiftChange.endDate}` : `শেষ: ${shiftChange.endDate}`;
      }
      finalR.isShiftChange = true;
      finalR.shiftChangeDates = dates || undefined;
    }
    
    if (dailyShiftsMap.has(r.staffId)) {
        finalR.dailyShifts = dailyShiftsMap.get(r.staffId);
    }
    
    return finalR;
  });

  return enrichedRoster;
};
