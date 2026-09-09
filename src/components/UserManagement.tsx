import React, { useState } from 'react';
import { ShieldCheck, UserX, CheckCircle, Clock, Trash2, KeyRound } from 'lucide-react';
import { AppUser } from '../types';

interface Props {
  users: AppUser[];
  updateUserStatus: (userId: string, status: 'approved' | 'rejected' | 'pending') => Promise<{ success: boolean }>;
  deleteUser: (userId: string) => Promise<{ success: boolean }>;
  adminResetPassword: (userId: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
}

export const UserManagement: React.FC<Props> = ({ users, updateUserStatus, deleteUser, adminResetPassword }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (userId: string, status: 'approved' | 'rejected' | 'pending') => {
    if (window.confirm(`আপনি কি নিশ্চিত যে ইউজারকে ${status === 'approved' ? 'অনুমোদন' : status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'} করতে চান?`)) {
      setLoadingId(userId);
      await updateUserStatus(userId, status);
      setLoadingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ইউজারকে মুছে ফেলতে চান? এই অ্যাকশনটি আর পরিবর্তন করা যাবে না।')) {
      setLoadingId(userId);
      await deleteUser(userId);
      setLoadingId(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPass = window.prompt(`ইউজার ${userId} এর জন্য নতুন পাসওয়ার্ড দিন:`);
    if (newPass !== null && newPass.trim() !== '') {
      if (newPass.trim().length < 4) {
        alert('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
        return;
      }
      setLoadingId(userId);
      const res = await adminResetPassword(userId, newPass.trim());
      if (res.success) {
        alert(`ইউজার ${userId} এর পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।`);
      } else {
        alert(res.message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।');
      }
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><UserX className="w-3 h-3" /> Rejected</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">ইউজার ম্যানেজমেন্ট (Super Admin)</h2>
            <p className="text-sm text-slate-500">নিবন্ধিত ইউজারদের অনুমোদন, বাতিল বা মুছে ফেলার কন্ট্রোল প্যানেল</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">নাম ও আইডি</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">মোবাইল</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">পদবী</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">স্ট্যাটাস</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                      <span className="text-xs text-slate-500">ID: {user.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{user.mobile || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {user.role !== 'Super Admin' && (user.status === 'pending' || user.status === 'rejected') && (
                        <button
                          onClick={() => handleStatusChange(user.id, 'approved')}
                          disabled={loadingId === user.id}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          অনুমোদন
                        </button>
                      )}
                      {user.role !== 'Super Admin' && (user.status === 'pending' || user.status === 'approved') && (
                        <button
                          onClick={() => handleStatusChange(user.id, 'rejected')}
                          disabled={loadingId === user.id}
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          বাতিল
                        </button>
                      )}
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        disabled={loadingId === user.id}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Reset Password"
                      >
                        <KeyRound className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={loadingId === user.id || user.role === 'Super Admin'}
                        className={`p-1.5 rounded-lg transition-colors ${user.role === 'Super Admin' ? 'text-slate-300 cursor-not-allowed' : 'text-rose-600 hover:bg-rose-50 disabled:opacity-50'}`}
                        title={user.role === 'Super Admin' ? "Super Admin cannot be deleted" : "Delete User"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    কোনো রেজিস্টার্ড ইউজার পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
