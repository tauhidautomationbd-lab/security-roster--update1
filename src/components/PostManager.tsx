import React, { useState } from 'react';
import { PostRequirement, ShiftType, Staff } from '../types';
import { Save, Plus } from 'lucide-react';

interface Props {
  posts: PostRequirement[];
  setPosts: React.Dispatch<React.SetStateAction<PostRequirement[]>>;
  staff: Staff[];
}

export const PostManager: React.FC<Props> = ({ posts, setPosts, staff }) => {
  
  const handleCountChange = (postId: string, shift: ShiftType, value: number) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          shiftCounts: {
            ...p.shiftCounts,
            [shift]: value
          }
        };
      }
      return p;
    }));
  };

  const handleNameChange = (postId: string, name: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, name } : p));
  };

  const handleOffDayChange = (postId: string, offDay: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, offDay } : p));
  };

  const handleSupportPersonChange = (postId: string, index: number, staffId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const support = [...(p.supportPersons || [])];
        support[index] = staffId;
        return { ...p, supportPersons: support.filter(id => id) };
      }
      return p;
    }));
  };

  const [newPost, setNewPost] = useState({ name: '' });

  const addPost = () => {
    if (!newPost.name) return;
    const id = 'custom_' + Date.now();
    setPosts([...posts, {
      id,
      name: newPost.name,
      shiftCounts: { A: 0, B: 0, C: 0, General: 0, Leave: 0, OT: 0 },
      supportPersons: []
    }]);
    setNewPost({ name: '' });
  };

  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const grandTotals = {
    A: posts.reduce((sum, p) => sum + (p.shiftCounts.A || 0), 0),
    B: posts.reduce((sum, p) => sum + (p.shiftCounts.B || 0), 0),
    C: posts.reduce((sum, p) => sum + (p.shiftCounts.C || 0), 0),
    General: posts.reduce((sum, p) => sum + (p.shiftCounts.General || 0), 0),
  };
  const grandTotalAll = grandTotals.A + grandTotals.B + grandTotals.C + grandTotals.General;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">পোস্ট ও শিফট রিকোয়ারমেন্ট</h2>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <input 
          type="text" 
          placeholder="নতুন পোস্টের নাম" 
          className="border border-slate-300 rounded-md p-2 text-sm flex-1"
          value={newPost.name}
          onChange={e => setNewPost({ name: e.target.value })}
        />
        <button 
          onClick={addPost}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> যোগ করুন
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 min-w-[200px]">পোস্টের নাম</th>
                <th className="px-4 py-3 text-center">A Shift</th>
                <th className="px-4 py-3 text-center">B Shift</th>
                <th className="px-4 py-3 text-center">C Shift</th>
                <th className="px-4 py-3 text-center">General</th>
                <th className="px-4 py-3 text-center font-bold text-indigo-700">Total</th>
                <th className="px-4 py-3 text-center min-w-[300px]">Leave Support Persons (২ জন)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map(post => {
                const total = (post.shiftCounts.A || 0) + (post.shiftCounts.B || 0) + (post.shiftCounts.C || 0) + (post.shiftCounts.General || 0);
                return (
                  <tr key={post.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <input 
                        value={post.name}
                        onChange={e => handleNameChange(post.id, e.target.value)}
                        className="border-none bg-transparent w-full font-medium text-slate-700 focus:ring-0 p-0"
                      />
                    </td>
                    {(['A', 'B', 'C', 'General'] as ShiftType[]).map(shift => (
                      <td key={shift} className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          min="0"
                          className="w-16 text-center rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1 border"
                          value={post.shiftCounts[shift] || 0}
                          onChange={e => handleCountChange(post.id, shift, parseInt(e.target.value) || 0)}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-indigo-700 text-lg">
                      {total}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-col">
                        {[0, 1].map(index => (
                          <select
                            key={index}
                            value={(post.supportPersons || [])[index] || ''}
                            onChange={e => handleSupportPersonChange(post.id, index, e.target.value)}
                            className="border border-slate-300 rounded-md p-1 text-sm bg-white w-full"
                          >
                            <option value="">নির্বাচন করুন</option>
                            {staff.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-800">
              <tr>
                <td className="px-6 py-4 text-right">Grand Total:</td>
                <td className="px-4 py-4 text-center">{grandTotals.A}</td>
                <td className="px-4 py-4 text-center">{grandTotals.B}</td>
                <td className="px-4 py-4 text-center">{grandTotals.C}</td>
                <td className="px-4 py-4 text-center">{grandTotals.General}</td>
                <td className="px-4 py-4 text-center text-indigo-700 text-lg">{grandTotalAll}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
