export type ShiftType = 'A' | 'B' | 'C' | 'General' | 'Reliever' | 'Leave' | 'OT';
export type StaffRole = 'Guard' | 'LadyGuard' | 'Supervisor' | 'Officer';
export type PermanentGroup = 'A' | 'B' | 'C' | 'Reliever' | 'General';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  permanentGroup: PermanentGroup;
  offDay?: string;
  subSection?: string;
}

export interface PostRequirement {
  id: string;
  name: string;
  shiftCounts: Record<ShiftType, number>;
  offDay?: string;
  supportPersons?: string[];
}

export interface RosterAssignment {
  staffId: string;
  staffName: string;
  role: StaffRole;
  permanentGroup: PermanentGroup;
  assignedShift: ShiftType;
  assignedPost: string;
  offDay?: string;
  isReplacement?: boolean;
  isOT?: boolean;
  isShiftChange?: boolean;
  leaveStartDate?: string;
  leaveEndDate?: string;
  originalPost?: string;
  shiftChangeDates?: string;
  dailyShifts?: Record<string, ShiftType>;
}

export interface LeaveRecord {
  id: string;
  weekNumber: number;
  staffId: string;
  replacementStaffId?: string;
  postName?: string;
  shiftType?: ShiftType;
  startDate?: string;
  endDate?: string;
}

export interface ShiftChangeRecord {
  id: string;
  weekNumber: number;
  staffId: string;
  targetShift: ShiftType;
  targetPost?: string;
  swappedWithStaffId?: string;
  swappedFromShift?: ShiftType;
  startDate?: string;
  endDate?: string;
}

export interface OTRecord {
  id: string;
  weekNumber: number;
  shift: ShiftType;
  postName: string;
  staffId?: string;
}

