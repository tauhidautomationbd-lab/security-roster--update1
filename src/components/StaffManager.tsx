import React, { useState } from 'react';
import { Staff, StaffRole, PermanentGroup, PostRequirement, AppUser } from '../types';
import { UserPlus, Trash2, Edit2, Save, X, UserX, UserCheck, Calendar, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { logActivity } from '../services/auditService';

interface Props {
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  posts: PostRequirement[];
  currentUser?: AppUser | null;
}

export const StaffManager: React.FC<Props> = ({ staff, setStaff, posts, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'resigned'>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Resignation modal state
  const [resigningStaff, setResigningStaff] = useState<Staff | null>(null);
  const [resignationDate, setResignationDate] = useState<string>(() => formatDate(new Date()));
  const [resignationReason, setResignationReason] = useState<string>('ব্যক্তিগত কারণ');
  const [customReason, setCustomReason] = useState<string>('');
  const [resignationRemarks, setResignationRemarks] = useState<string>('');

  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    role: 'Guard',
    permanentGroup: 'A',
    status: 'active'
  });

  const [editForm, setEditForm] = useState<Partial<Staff>>({});

  const activeStaffList = staff.filter(s => s.status !== 'resigned');
  const resignedStaffList = staff.filter(s => s.status === 'resigned');

  const handleAdd = () => {
    if (!newStaff.id || !newStaff.name) {
      alert("আইডি এবং নাম প্রদান করুন");
      return;
    }
    if (staff.some(s => s.id === newStaff.id)) {
      alert("এই আইডি ইতিমধ্যে বিদ্যমান!");
      return;
    }
    const staffToAdd: Staff = {
      ...(newStaff as Staff),
      status: 'active'
    };
    setStaff([...staff, staffToAdd]);
    setIsAdding(false);
    setNewStaff({ role: 'Guard', permanentGroup: 'A', status: 'active' });

    if (currentUser) {
      logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'নতুন স্টাফ যোগ করেছেন',
        `আইডি: ${staffToAdd.id}, নাম: ${staffToAdd.name}, পদবী: ${staffToAdd.role}, গ্রুপ: ${staffToAdd.permanentGroup}`
      );
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${name}" (${id}) কে সম্পূর্ণ মুছে ফেলতে চান?`)) {
      setStaff(staff.filter(s => s.id !== id));
      if (currentUser) {
        logActivity(
          currentUser.id,
          currentUser.name,
          currentUser.role,
          'স্টাফ মুছে ফেলেছেন',
          `আইডি: ${id}, নাম: ${name}`
        );
      }
    }
  };

  const openResignModal = (s: Staff) => {
    setResigningStaff(s);
    setResignationDate(formatDate(new Date()));
    setResignationReason('ব্যক্তিগত কারণ');
    setCustomReason('');
    setResignationRemarks('');
  };

  const handleConfirmResignation = () => {
    if (!resigningStaff) return;
    const finalReason = resignationReason === 'অন্যান্য' && customReason.trim()
      ? customReason.trim()
      : resignationReason;

    setStaff(staff.map(s => {
      if (s.id === resigningStaff.id) {
        return {
          ...s,
          status: 'resigned',
          resignationDate: resignationDate || formatDate(new Date()),
          resignationReason: finalReason,
          resignationRemarks: resignationRemarks.trim()
        };
      }
      return s;
    }));

    if (currentUser) {
      logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'স্টাফের পদত্যাগ / রিজাইন রেকর্ড করেছেন',
        `স্টাফ: ${resigningStaff.name} (${resigningStaff.id}), তারিখ: ${resignationDate}, কারণ: ${finalReason}`
      );
    }

    setResigningStaff(null);
  };

  const handleReactivate = (s: Staff) => {
    if (window.confirm(`আপনি কি "${s.name}" কে পুনরায় সক্রিয় করতে চান?`)) {
      setStaff(staff.map(item => {
        if (item.id === s.id) {
          const { resignationDate, resignationReason, resignationRemarks, ...rest } = item;
          return {
            ...rest,
            status: 'active'
          };
        }
        return item;
      }));

      if (currentUser) {
        logActivity(
          currentUser.id,
          currentUser.name,
          currentUser.role,
          'পদত্যাগকারী স্টাফকে পুনরায় সক্রিয় করেছেন',
          `স্টাফ: ${s.name} (${s.id})`
        );
      }
    }
  };

  const startEdit = (s: Staff) => {
    setEditingId(s.id);
    setEditForm(s);
  };

  const saveEdit = () => {
    if (!editForm.name) return;
    setStaff(staff.map(s => s.id === editingId ? { ...s, ...editForm } as Staff : s));
    if (currentUser && editForm.name) {
      logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'স্টাফ তথ্য সম্পাদনা করেছেন',
        `আইডি: ${editingId}, নাম: ${editForm.name}`
      );
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">স্টাফ ম্যানেজমেন্ট</h2>
          <p className="text-xs text-slate-500 mt-0.5">নিরাপত্তা কর্মী, অফিসার, সুপারভাইজর ও পদত্যাগকারী স্টাফের তালিকা</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isAdding ? 'বাতিল করুন' : 'নতুন স্টাফ যোগ করুন'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>সক্রিয় স্টাফ তালিকা</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {activeStaffList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('resigned')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'resigned'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserX className="w-4 h-4 text-rose-600" />
          <span>চাকরি ছেড়েছেন / পদত্যাগকারী</span>
          <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {resignedStaffList.length}
          </span>
        </button>
      </div>

      {/* Add Staff Form */}
      {isAdding && (
        <div className="bg-indigo-50/80 p-6 rounded-xl border border-indigo-100 flex flex-wrap gap-4 items-end shadow-sm">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">স্টাফ আইডি *</label>
            <input 
              type="text" 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              placeholder="e.g. 300123"
              value={newStaff.id || ''}
              onChange={e => setNewStaff({...newStaff, id: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">নাম *</label>
            <input 
              type="text" 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              placeholder="স্টাফের পূর্ণ নাম"
              value={newStaff.name || ''}
              onChange={e => setNewStaff({...newStaff, name: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">পদবী</label>
            <select 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              value={newStaff.role}
              onChange={e => setNewStaff({...newStaff, role: e.target.value as StaffRole})}
            >
              <option value="Guard">গার্ড</option>
              <option value="LadyGuard">লেডি গার্ড</option>
              <option value="Supervisor">সুপারভাইজর</option>
              <option value="Officer">অফিসার</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">পার্মানেন্ট শিফট/গ্রুপ</label>
            <select 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              value={newStaff.permanentGroup}
              onChange={e => setNewStaff({...newStaff, permanentGroup: e.target.value as PermanentGroup})}
            >
              <option value="A">Group A</option>
              <option value="B">Group B</option>
              <option value="C">Group C</option>
              <option value="Reliever">Reliever (রিলেভার)</option>
              <option value="General">General (জেনারেল)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">ফিক্সড পোস্ট (ঐচ্ছিক)</label>
            <input 
              type="text"
              list="post-options"
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              placeholder="পোস্টের নাম লিখুন"
              value={newStaff.subSection || ''}
              onChange={e => setNewStaff({...newStaff, subSection: e.target.value})}
            />
            <datalist id="post-options">
              {posts.map(post => (
                <option key={post.id} value={post.name}>{post.name}</option>
              ))}
            </datalist>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">সাপ্তাহিক ছুটি (ঐচ্ছিক)</label>
            <select 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              value={newStaff.offDay || ''}
              onChange={e => setNewStaff({...newStaff, offDay: e.target.value})}
            >
              <option value="">-- নির্বাচন করুন --</option>
              <option value="Friday">শুক্রবার (Friday)</option>
              <option value="Saturday">শনিবার (Saturday)</option>
              <option value="Sunday">রবিবার (Sunday)</option>
              <option value="Monday">সোমবার (Monday)</option>
              <option value="Tuesday">মঙ্গলবার (Tuesday)</option>
              <option value="Wednesday">বুধবার (Wednesday)</option>
              <option value="Thursday">বৃহস্পতিবার (Thursday)</option>
            </select>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors h-[38px] shadow-sm"
          >
            সেভ করুন
          </button>
        </div>
      )}

      {/* ACTIVE STAFF TABLE */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3 w-14 text-center">ক্রমিক</th>
                  <th className="px-5 py-3">স্টাফ আইডি</th>
                  <th className="px-5 py-3">নাম</th>
                  <th className="px-5 py-3">পদবী</th>
                  <th className="px-5 py-3">পার্মানেন্ট গ্রুপ</th>
                  <th className="px-5 py-3">ডিউটি পোস্ট</th>
                  <th className="px-5 py-3">অফ ডে</th>
                  <th className="px-5 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeStaffList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{s.id}</td>
                    
                    {editingId === s.id ? (
                      <>
                        <td className="px-5 py-3">
                          <input 
                            className="w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                            value={editForm.name || ''}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <select 
                            className="w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm bg-white"
                            value={editForm.role}
                            onChange={e => setEditForm({...editForm, role: e.target.value as StaffRole})}
                          >
                            <option value="Guard">গার্ড</option>
                            <option value="LadyGuard">লেডি গার্ড</option>
                            <option value="Supervisor">সুপারভাইজর</option>
                            <option value="Officer">অফিসার</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <select 
                            className="w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm bg-white"
                            value={editForm.permanentGroup}
                            onChange={e => setEditForm({...editForm, permanentGroup: e.target.value as PermanentGroup})}
                          >
                            <option value="A">Group A</option>
                            <option value="B">Group B</option>
                            <option value="C">Group C</option>
                            <option value="Reliever">Reliever</option>
                            <option value="General">General</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <input 
                            type="text"
                            list="post-options-edit"
                            className="w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm bg-white"
                            placeholder="পোস্টের নাম লিখুন"
                            value={editForm.subSection || ''}
                            onChange={e => setEditForm({...editForm, subSection: e.target.value})}
                          />
                          <datalist id="post-options-edit">
                            {posts.map(post => (
                              <option key={post.id} value={post.name}>{post.name}</option>
                            ))}
                          </datalist>
                        </td>
                        <td className="px-5 py-3">
                          <select 
                            className="w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm bg-white"
                            value={editForm.offDay || ''}
                            onChange={e => setEditForm({...editForm, offDay: e.target.value})}
                          >
                            <option value="">--</option>
                            <option value="Friday">শুক্রবার</option>
                            <option value="Saturday">শনিবার</option>
                            <option value="Sunday">রবিবার</option>
                            <option value="Monday">সোমবার</option>
                            <option value="Tuesday">মঙ্গলবার</option>
                            <option value="Wednesday">বুধবার</option>
                            <option value="Thursday">বৃহস্পতিবার</option>
                          </select>
                        </td>
                        <td className="px-5 py-3 text-right flex justify-end gap-1.5">
                          <button onClick={saveEdit} title="সংরক্ষণ" className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"><Save className="w-4 h-4"/></button>
                          <button onClick={() => setEditingId(null)} title="বাতিল" className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg"><X className="w-4 h-4"/></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 text-slate-800 font-medium">{s.name}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {s.role === 'Guard' ? 'সিকিউরিটি গার্ড' : s.role === 'LadyGuard' ? 'লেডি গার্ড' : s.role === 'Supervisor' ? 'সুপারভাইজর' : 'অফিসার'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                            {s.permanentGroup}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700">{s.subSection || '-'}</td>
                        <td className="px-5 py-3 text-slate-700">{s.offDay || '-'}</td>
                        <td className="px-5 py-3 text-right flex justify-end items-center gap-1.5">
                          <button 
                            onClick={() => startEdit(s)} 
                            title="সম্পাদনা করুন"
                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4"/>
                          </button>
                          
                          {/* Resign / Leave Job Button */}
                          <button 
                            onClick={() => openResignModal(s)} 
                            title="চাকরি ত্যাগ / পদত্যাগ চিহ্নিত করুন"
                            className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          >
                            <UserX className="w-4 h-4"/>
                            <span className="hidden md:inline">রিজাইন</span>
                          </button>

                          <button 
                            onClick={() => handleDelete(s.id, s.name)} 
                            title="মুছে ফেলুন"
                            className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESIGNED STAFF TABLE */}
      {activeTab === 'resigned' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {resignedStaffList.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <UserX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">বর্তমানে কোনো পদত্যাগকারী স্টাফের তালিকা নেই</p>
              <p className="text-xs text-slate-400 mt-1">কেউ চাকরি ছেড়ে দিলে সক্রিয় তালিকা থেকে "রিজাইন" বাটনে ক্লিক করে তথ্য সংরক্ষণ করতে পারেন।</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-rose-50/50 text-slate-600 font-semibold border-b border-rose-100 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 w-14 text-center">ক্রমিক</th>
                    <th className="px-5 py-3">স্টাফ আইডি</th>
                    <th className="px-5 py-3">নাম</th>
                    <th className="px-5 py-3">পদবী</th>
                    <th className="px-5 py-3">পদত্যাগের তারিখ</th>
                    <th className="px-5 py-3">কারণ</th>
                    <th className="px-5 py-3">মন্তব্য</th>
                    <th className="px-5 py-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resignedStaffList.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-5 py-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{s.id}</td>
                      <td className="px-5 py-3 text-slate-800 font-medium">
                        <div>
                          <span>{s.name}</span>
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            রিজাইনড
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {s.role === 'Guard' ? 'সিকিউরিটি গার্ড' : s.role === 'LadyGuard' ? 'লেডি গার্ড' : s.role === 'Supervisor' ? 'সুপারভাইজর' : 'অফিসার'}
                      </td>
                      <td className="px-5 py-3 text-slate-700 font-medium">
                        {s.resignationDate || '-'}
                      </td>
                      <td className="px-5 py-3 text-rose-700 font-medium">
                        {s.resignationReason || 'ব্যক্তিগত কারণ'}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {s.resignationRemarks || '-'}
                      </td>
                      <td className="px-5 py-3 text-right flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleReactivate(s)}
                          title="পুনরায় সক্রিয় করুন"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>সক্রিয় করুন</span>
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          title="রেকর্ড স্থায়ীভাবে মুছুন"
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RESIGNATION CONFIRMATION MODAL */}
      {resigningStaff && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button 
              onClick={() => setResigningStaff(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">চাকরি ত্যাগ / পদত্যাগ রেকর্ড</h3>
                <p className="text-xs text-slate-500">স্টাফকে পদত্যাগকারী হিসেবে সংরক্ষণ করুন</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700">
              <div>স্টাফের নাম: <strong className="text-slate-900">{resigningStaff.name}</strong></div>
              <div>আইডি: <strong className="text-slate-900">{resigningStaff.id}</strong> | পদবী: <strong className="text-slate-900">{resigningStaff.role}</strong></div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  পদত্যাগের তারিখ *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={resignationDate}
                    onChange={(e) => setResignationDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  পদত্যাগের কারণ *
                </label>
                <select
                  value={resignationReason}
                  onChange={(e) => setResignationReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="ব্যক্তিগত কারণ">ব্যক্তিগত কারণ</option>
                  <option value="উন্নত চাকরির সুযোগ">উন্নত চাকরির সুযোগ</option>
                  <option value="অসুস্থতা / চিকিৎসা">অসুস্থতা / চিকিৎসা</option>
                  <option value="গ্রামের বাড়ি স্থায়ী গমন">গ্রামের বাড়ি স্থায়ী গমন</option>
                  <option value="শৃঙ্খলাভঙ্গ / চাকরিচ্যুতি">শৃঙ্খলাভঙ্গ / চাকরিচ্যুতি</option>
                  <option value="অন্যান্য">অন্যান্য (নিচে লিখুন)</option>
                </select>
              </div>

              {resignationReason === 'অন্যান্য' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    সুনির্দিষ্ট কারণ লিখুন
                  </label>
                  <input
                    type="text"
                    placeholder="পদত্যাগের কারণ লিখুন"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  মন্তব্য / বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="অতিরিক্ত কোনো মন্তব্য বা হ্যান্ডওভার তথ্য থাকলে লিখুন..."
                  value={resignationRemarks}
                  onChange={(e) => setResignationRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResigningStaff(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResignation}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  পদত্যাগ নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
