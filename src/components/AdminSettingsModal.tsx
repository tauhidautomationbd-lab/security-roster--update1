import React, { useState, useEffect } from 'react';
import { KeyRound, Phone, User, Check, X, ShieldAlert } from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [adminId, setAdminId] = useState('admin');
  const [mobile, setMobile] = useState('01700000000');
  const [password, setPassword] = useState('admin123');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const storedCreds = localStorage.getItem('security_roster_admin_creds');
    if (storedCreds) {
      try {
        const parsed = JSON.parse(storedCreds);
        if (parsed.id) setAdminId(parsed.id);
        if (parsed.mobile) setMobile(parsed.mobile);
        if (parsed.password) setPassword(parsed.password);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newCreds = {
      id: adminId.trim() || 'admin',
      mobile: mobile.trim() || '01700000000',
      password: password.trim() || 'admin123'
    };
    localStorage.setItem('security_roster_admin_creds', JSON.stringify(newCreds));
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">অ্যাডমিন সিকিউরিটি সেটিংস</h3>
            <p className="text-xs text-slate-500">আইডি, মোবাইল নম্বর ও পাসওয়ার্ড পরিবর্তন করুন</p>
          </div>
        </div>

        {isSaved && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <Check className="w-4 h-4" /> অ্যাডমিন তথ্য সফলভাবে আপডেট হয়েছে!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              অ্যাডমিন আইডি
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              নতুন পাসওয়ার্ড
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
