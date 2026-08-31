import React, { useState } from 'react';
import { Staff, StaffRole, PermanentGroup, PostRequirement } from '../types';
import { UserPlus, Trash2, Edit2, Save, X } from 'lucide-react';

interface Props {
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  posts: PostRequirement[];
}

export const StaffManager: React.FC<Props> = ({ staff, setStaff, posts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    role: 'Guard',
    permanentGroup: 'A'
  });

  const [editForm, setEditForm] = useState<Partial<Staff>>({});

  const handleAdd = () => {
    if (!newStaff.id || !newStaff.name) {
      alert("আইডি এবং নাম প্রদান করুন");
      return;
    }
    if (staff.some(s => s.id === newStaff.id)) {
      alert("এই আইডি ইতিমধ্যে বিদ্যমান!");
      return;
    }
    setStaff([...staff, newStaff as Staff]);
    setIsAdding(false);
    setNewStaff({ role: 'Guard', permanentGroup: 'A' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই স্টাফকে মুছে ফেলতে চান?")) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  const startEdit = (s: Staff) => {
    setEditingId(s.id);
    setEditForm(s);
  };

  const saveEdit = () => {
    if (!editForm.name) return;
    setStaff(staff.map(s => s.id === editingId ? { ...s, ...editForm } as Staff : s));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">স্টাফ ম্যানেজমেন্ট</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {isAdding ? 'বাতিল করুন' : 'নতুন স্টাফ যোগ করুন'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">স্টাফ আইডি</label>
            <input 
              type="text" 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="e.g. G-123"
              value={newStaff.id || ''}
              onChange={e => setNewStaff({...newStaff, id: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">নাম</label>
            <input 
              type="text" 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="স্টাফের নাম"
              value={newStaff.name || ''}
              onChange={e => setNewStaff({...newStaff, name: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
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
          <div className="flex-1 min-w-[150px]">
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
          <div className="flex-1 min-w-[150px]">
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
          <div className="flex-1 min-w-[150px]">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors h-[38px]"
          >
            সেভ করুন
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 w-16 text-center">ক্রমিক</th>
                <th className="px-6 py-3">স্টাফ আইডি</th>
                <th className="px-6 py-3">নাম</th>
                <th className="px-6 py-3">পদবী</th>
                <th className="px-6 py-3">পার্মানেন্ট গ্রুপ</th>
                <th className="px-6 py-3">ডিউটি পোস্ট</th>
                <th className="px-6 py-3">অফ ডে</th>
                <th className="px-6 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{s.id}</td>
                  
                  {editingId === s.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input 
                          className="w-full rounded-md border-slate-300 shadow-sm p-1 border text-sm"
                          value={editForm.name || ''}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <select 
                          className="w-full rounded-md border-slate-300 shadow-sm p-1 border text-sm bg-white"
                          value={editForm.role}
                          onChange={e => setEditForm({...editForm, role: e.target.value as StaffRole})}
                        >
                          <option value="Guard">গার্ড</option>
                          <option value="LadyGuard">লেডি গার্ড</option>
                          <option value="Supervisor">সুপারভাইজর</option>
                          <option value="Officer">অফিসার</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <select 
                          className="w-full rounded-md border-slate-300 shadow-sm p-1 border text-sm bg-white"
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
                      <td className="px-6 py-3">
                        <input 
                          type="text"
                          list="post-options-edit"
                          className="w-full rounded-md border-slate-300 shadow-sm p-1 border text-sm bg-white"
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
                      <td className="px-6 py-3">
                        <select 
                          className="w-full rounded-md border-slate-300 shadow-sm p-1 border text-sm bg-white"
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
                      <td className="px-6 py-3 text-right flex justify-end gap-2">
                        <button onClick={saveEdit} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Save className="w-4 h-4"/></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-4 h-4"/></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 text-slate-700">{s.name}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {s.role === 'Guard' ? 'সিকিউরিটি গার্ড' : s.role === 'LadyGuard' ? 'লেডি গার্ড' : s.role === 'Supervisor' ? 'সুপারভাইজর' : 'অফিসার'}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {s.permanentGroup}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-700">{s.subSection || '-'}</td>
                      <td className="px-6 py-3 text-slate-700">{s.offDay || '-'}</td>
                      <td className="px-6 py-3 text-right flex justify-end gap-2">
                        <button onClick={() => startEdit(s)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(s.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
