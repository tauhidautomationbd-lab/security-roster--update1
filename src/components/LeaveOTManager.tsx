import React, { useState } from 'react';
import { Staff, LeaveRecord, OTRecord, PostRequirement, ShiftType, ShiftChangeRecord } from '../types';
import { Trash2 } from 'lucide-react';

interface Props {
  staff: Staff[];
  posts: PostRequirement[];
  leaves: LeaveRecord[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
  ots: OTRecord[];
  setOts: React.Dispatch<React.SetStateAction<OTRecord[]>>;
  shiftChanges: ShiftChangeRecord[];
  setShiftChanges: React.Dispatch<React.SetStateAction<ShiftChangeRecord[]>>;
}

export const LeaveOTManager: React.FC<Props> = ({ staff, posts, leaves, setLeaves, ots, setOts, shiftChanges, setShiftChanges }) => {
  const [week, setWeek] = useState(1);

  // Leave Form
  const [leaveStaffId, setLeaveStaffId] = useState('');
  const [replacementStaffId, setReplacementStaffId] = useState('');
  const [leavePost, setLeavePost] = useState('');
  const [leaveShift, setLeaveShift] = useState<ShiftType>('A');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');

  // OT Form
  const [otShift, setOtShift] = useState<ShiftType>('A');
  const [otPost, setOtPost] = useState('');
  const [otStaffId, setOtStaffId] = useState('');

  // Shift Change Form
  const [changeStaffId, setChangeStaffId] = useState('');
  const [changeTargetShift, setChangeTargetShift] = useState<ShiftType>('A');
  const [changeTargetStaffId, setChangeTargetStaffId] = useState('');
  const [changeStartDate, setChangeStartDate] = useState('');
  const [changeEndDate, setChangeEndDate] = useState('');

  const addLeave = () => {
    if (!leaveStaffId) return;
    const newLeave: LeaveRecord = {
      id: Date.now().toString(),
      weekNumber: week,
      staffId: leaveStaffId,
      replacementStaffId: replacementStaffId || undefined,
      postName: leavePost || undefined,
      shiftType: leaveShift,
      startDate: leaveStartDate || undefined,
      endDate: leaveEndDate || undefined,
    };
    setLeaves([...leaves, newLeave]);
    setLeaveStaffId('');
    setReplacementStaffId('');
    setLeaveStartDate('');
    setLeaveEndDate('');
  };

  const addOT = () => {
    if (!otPost) return;
    const newOT: OTRecord = {
      id: Date.now().toString(),
      weekNumber: week,
      shift: otShift,
      postName: otPost,
      staffId: otStaffId || undefined
    };
    setOts([...ots, newOT]);
    setOtPost('');
    setOtStaffId('');
  };

  const addShiftChange = () => {
    if (!changeStaffId) return;
    
    // Find staff 2's permanent group if swapping
    const staff1 = staff.find(s => s.id === changeStaffId);
    const staff2 = changeTargetStaffId ? staff.find(s => s.id === changeTargetStaffId) : null;
    
    const getShift = (s: Staff | undefined | null) => {
      if (!s) return 'General';
      
      const name = (s.name || '').toLowerCase();
      if (name.includes('junaid')) return 'C';
      if (name.includes('shamananda')) return 'B';
      
      const g = String(s.permanentGroup || '').trim().toUpperCase();
      if (g.includes('RELIEVER') || g.includes('রিলেভার')) return 'General';
      if (g === 'A' || g.includes('GROUP A') || g.includes(' A') || g.includes('এ')) return 'A';
      if (g === 'B' || g.includes('GROUP B') || g.includes(' B') || g.includes('বি')) return 'B';
      if (g === 'C' || g.includes('GROUP C') || g.includes(' C') || g.includes('সি')) return 'C';
      if (g.includes('GENERAL') || g.includes('জেনারেল')) return 'General';
      
      if (/\bA\b/.test(g)) return 'A';
      if (/\bB\b/.test(g)) return 'B';
      if (/\bC\b/.test(g)) return 'C';
      
      return g as ShiftType || 'General';
    };

    const targetShiftFor1 = staff2 ? getShift(staff2) : changeTargetShift;
    const targetShiftFor2 = staff1 ? getShift(staff1) : 'General';
    
    const newChange: ShiftChangeRecord = {
      id: Date.now().toString(),
      weekNumber: week,
      staffId: changeStaffId,
      targetShift: targetShiftFor1,
      swappedWithStaffId: changeTargetStaffId || undefined,
      swappedFromShift: staff2 ? targetShiftFor2 : undefined,
      startDate: changeStartDate || undefined,
      endDate: changeEndDate || undefined,
    };
    setShiftChanges([...shiftChanges, newChange]);
    setChangeStaffId('');
    setChangeTargetStaffId('');
    setChangeStartDate('');
    setChangeEndDate('');
  };

  const weekLeaves = leaves.filter(l => l.weekNumber === week);
  const weekOts = ots.filter(o => o.weekNumber === week);
  const weekShiftChanges = shiftChanges.filter(sc => sc.weekNumber === week);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">ছুটি এবং ওভারটাইম ম্যানেজমেন্ট</h2>
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
          <label className="text-sm font-medium text-slate-700">সপ্তাহ নির্বাচন:</label>
          <select 
            className="bg-transparent border-none text-sm font-bold text-indigo-700 focus:ring-0 cursor-pointer"
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map(w => (
              <option key={w} value={w}>সপ্তাহ {w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEAVE SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">সাপ্তাহিক ছুটি ইনপুট</h3>
          
          <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">যিনি ছুটিতে থাকবেন</label>
              <select className="w-full p-2 border rounded-md text-sm bg-white" value={leaveStaffId} onChange={e => {
                const id = e.target.value;
                setLeaveStaffId(id);
                const s = staff.find(x => x.id === id);
                if (s) {
                  setLeaveShift(s.permanentGroup === 'Reliever' ? 'General' : s.permanentGroup as ShiftType);
                  setLeavePost(s.subSection || '');
                }
              }}>
                <option value="">নির্বাচন করুন...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">পার্মানেন্ট শিফট/গ্রুপ</label>
                <select className="w-full p-2 border rounded-md text-sm bg-white" value={leaveShift} onChange={e => setLeaveShift(e.target.value as ShiftType)}>
                  <option value="A">A Shift</option>
                  <option value="B">B Shift</option>
                  <option value="C">C Shift</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">পোস্ট (ঐচ্ছিক)</label>
                <select className="w-full p-2 border rounded-md text-sm bg-white" value={leavePost} onChange={e => setLeavePost(e.target.value)}>
                  <option value="">যেকোন পোস্ট</option>
                  {posts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">বদলি ডিউটি করবেন (ঐচ্ছিক)</label>
              <select className="w-full p-2 border rounded-md text-sm bg-white" value={replacementStaffId} onChange={e => setReplacementStaffId(e.target.value)}>
                <option value="">অটোমেটিক অ্যাসাইন হবে</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">বদলি শুরু তারিখ (ঐচ্ছিক)</label>
                <input type="date" className="w-full p-2 border rounded-md text-sm bg-white" value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">বদলি শেষ তারিখ (ঐচ্ছিক)</label>
                <input type="date" className="w-full p-2 border rounded-md text-sm bg-white" value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} />
              </div>
            </div>

            <button onClick={addLeave} className="w-full bg-indigo-600 text-white p-2 rounded-md font-medium text-sm hover:bg-indigo-700">
              ছুটি অ্যাড করুন
            </button>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">এই সপ্তাহের ছুটিসমূহ ({weekLeaves.length})</h4>
            <ul className="space-y-2">
              {weekLeaves.map(l => {
                const s = staff.find(x => x.id === l.staffId);
                const r = staff.find(x => x.id === l.replacementStaffId);
                return (
                  <li key={l.id} className="p-3 border rounded-lg flex justify-between items-center text-sm bg-slate-50">
                    <div>
                      <p className="font-bold text-rose-600">{s?.name || l.staffId} (ছুটি)</p>
                      <p className="text-slate-500 text-xs">শিফট: {l.shiftType} {l.postName ? `| পোস্ট: ${l.postName}` : ''}</p>
                      {r && <p className="text-emerald-600 font-medium text-xs mt-1">বদলি: {r.name} {l.startDate && l.endDate ? `(${l.startDate} থেকে ${l.endDate})` : l.startDate ? `(শুরু: ${l.startDate})` : l.endDate ? `(শেষ: ${l.endDate})` : ''}</p>}
                    </div>
                    <button onClick={() => setLeaves(leaves.filter(x => x.id !== l.id))} className="text-rose-500 p-1 hover:bg-rose-100 rounded">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </li>
                );
              })}
              {weekLeaves.length === 0 && <p className="text-sm text-slate-500">কোন ছুটি নেই</p>}
            </ul>
          </div>
        </div>

        {/* OT SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">ওভারটাইম (OT) ইনপুট</h3>
          
          <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">শিফট</label>
                <select className="w-full p-2 border rounded-md text-sm bg-white" value={otShift} onChange={e => setOtShift(e.target.value as ShiftType)}>
                  <option value="A">A Shift</option>
                  <option value="B">B Shift</option>
                  <option value="C">C Shift</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">পোস্ট</label>
                <select className="w-full p-2 border rounded-md text-sm bg-white" value={otPost} onChange={e => setOtPost(e.target.value)}>
                  <option value="">নির্বাচন করুন...</option>
                  {posts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">যিনি ডিউটি করবেন (ঐচ্ছিক)</label>
              <select className="w-full p-2 border rounded-md text-sm bg-white" value={otStaffId} onChange={e => setOtStaffId(e.target.value)}>
                <option value="">যেকোন স্টাফ</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
            </div>

            <button onClick={addOT} className="w-full bg-amber-500 text-white p-2 rounded-md font-medium text-sm hover:bg-amber-600">
              ওভারটাইম অ্যাড করুন
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 mb-2">এই সপ্তাহের ওভারটাইম ({weekOts.length})</h4>
            <ul className="space-y-2">
              {weekOts.map(o => {
                const s = staff.find(x => x.id === o.staffId);
                return (
                  <li key={o.id} className="p-3 border rounded-lg flex justify-between items-center text-sm bg-slate-50">
                    <div>
                      <p className="font-bold text-amber-600">শিফট: {o.shift} | পোস্ট: {o.postName}</p>
                      {s ? <p className="text-emerald-600 font-medium text-xs mt-1">ডিউটি: {s.name}</p> : <p className="text-slate-500 text-xs mt-1">স্টাফ: নির্ধারিত হয়নি</p>}
                    </div>
                    <button onClick={() => setOts(ots.filter(x => x.id !== o.id))} className="text-rose-500 p-1 hover:bg-rose-100 rounded">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </li>
                );
              })}
              {weekOts.length === 0 && <p className="text-sm text-slate-500">কোন ওভারটাইম নেই</p>}
            </ul>
          </div>
        </div>

        {/* SHIFT CHANGE SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">অস্থায়ী শিফট পরিবর্তন</h3>
          
          <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">স্টাফ-১ (যিনি বদলি হবেন)</label>
              <select className="w-full p-2 border rounded-md text-sm bg-white" value={changeStaffId} onChange={e => setChangeStaffId(e.target.value)}>
                <option value="">নির্বাচন করুন...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">স্টাফ-২ (যার সাথে বদলি হবেন - ঐচ্ছিক)</label>
              <select className="w-full p-2 border rounded-md text-sm bg-white" value={changeTargetStaffId} onChange={e => setChangeTargetStaffId(e.target.value)}>
                <option value="">নিজেই অন্য শিফটে যাবেন</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
            </div>
            
            {!changeTargetStaffId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">নতুন শিফট</label>
                <select className="w-full p-2 border rounded-md text-sm bg-white" value={changeTargetShift} onChange={e => setChangeTargetShift(e.target.value as ShiftType)}>
                  <option value="A">A Shift</option>
                  <option value="B">B Shift</option>
                  <option value="C">C Shift</option>
                  <option value="General">General</option>
                  <option value="Reliever">Reliever</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">শুরু তারিখ</label>
                <input type="date" className="w-full p-2 border rounded-md text-sm bg-white" value={changeStartDate} onChange={e => setChangeStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">শেষ তারিখ (ঐচ্ছিক)</label>
                <input type="date" className="w-full p-2 border rounded-md text-sm bg-white" value={changeEndDate} onChange={e => setChangeEndDate(e.target.value)} />
              </div>
            </div>

            <button onClick={addShiftChange} className="w-full bg-blue-600 text-white p-2 rounded-md font-medium text-sm hover:bg-blue-700">
              শিফট পরিবর্তন অ্যাড করুন
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 mb-2">এই সপ্তাহের শিফট পরিবর্তন ({weekShiftChanges.length})</h4>
            <ul className="space-y-2">
              {weekShiftChanges.map(sc => {
                const s1 = staff.find(x => x.id === sc.staffId);
                const s2 = sc.swappedWithStaffId ? staff.find(x => x.id === sc.swappedWithStaffId) : null;
                return (
                  <li key={sc.id} className="p-3 border rounded-lg flex justify-between items-center text-sm bg-slate-50">
                    <div>
                      {s2 ? (
                        <>
                          <p className="font-bold text-blue-600">পারস্পরিক পরিবর্তন</p>
                          <p className="text-slate-600 text-sm mt-1">
                            <span className="font-medium">{s1?.name} ({s1?.permanentGroup})</span> যাবে <span className="font-bold text-indigo-600">{sc.targetShift}</span> শিফটে
                          </p>
                          <p className="text-slate-600 text-sm">
                            <span className="font-medium">{s2.name} ({s2.permanentGroup})</span> যাবে <span className="font-bold text-indigo-600">{sc.swappedFromShift}</span> শিফটে
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-blue-600">{s1?.name || sc.staffId}</p>
                          <p className="text-slate-500 text-xs mt-1">নতুন শিফট: <span className="font-bold">{sc.targetShift}</span> (পূর্বের: {s1?.permanentGroup})</p>
                        </>
                      )}
                      {(sc.startDate || sc.endDate) && (
                        <p className="text-slate-500 text-xs mt-1">
                          তারিখ: {sc.startDate ? `শুরু: ${sc.startDate}` : ''} {sc.endDate ? `| শেষ: ${sc.endDate}` : ''}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setShiftChanges(shiftChanges.filter(x => x.id !== sc.id))} className="text-rose-500 p-1 hover:bg-rose-100 rounded">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </li>
                );
              })}
              {weekShiftChanges.length === 0 && <p className="text-sm text-slate-500">কোন শিফট পরিবর্তন নেই</p>}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
