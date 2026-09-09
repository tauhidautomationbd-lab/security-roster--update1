import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  changePassword: (newPass: string) => Promise<{ success: boolean; message?: string }>;
}

export const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose, changePassword }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPass.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (newPass !== confirmPass) {
      setError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    setLoading(true);
    const res = await changePassword(newPass);
    setLoading(false);

    if (res.success) {
      setSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      setTimeout(() => {
        onClose();
        setNewPass('');
        setConfirmPass('');
        setSuccess('');
      }, 1500);
    } else {
      setError(res.message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <KeyRound className="w-5 h-5 text-indigo-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">পাসওয়ার্ড পরিবর্তন</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">নতুন পাসওয়ার্ড</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                placeholder="নতুন পাসওয়ার্ড দিন"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">পুনরায় পাসওয়ার্ড দিন</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                placeholder="পাসওয়ার্ডটি নিশ্চিত করুন"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-sm text-rose-600 font-medium">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-600 font-medium text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200 hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
