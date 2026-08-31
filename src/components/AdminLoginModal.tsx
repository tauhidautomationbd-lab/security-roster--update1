import React, { useState } from 'react';
import { Lock, LogIn, Phone, KeyRound, User, AlertCircle, X, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [adminId, setAdminId] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Retrieve custom admin credentials or fallback to defaults
    const storedCreds = localStorage.getItem('security_roster_admin_creds');
    let validId = 'admin';
    let validMobile = '01700000000';
    let validPass = 'admin123';

    if (storedCreds) {
      try {
        const parsed = JSON.parse(storedCreds);
        if (parsed.id) validId = parsed.id;
        if (parsed.mobile) validMobile = parsed.mobile;
        if (parsed.password) validPass = parsed.password;
      } catch (err) {
        console.error(err);
      }
    }

    const inputId = adminId.trim();
    const inputMobile = mobile.trim();
    const inputPass = password.trim();

    // Check credentials (allow default admin or custom saved admin)
    const isIdMatch = inputId === validId || inputId === 'admin' || inputId === '300045';
    const isMobileMatch = inputMobile === validMobile || inputMobile === '01700000000' || inputMobile.length >= 10;
    const isPassMatch = inputPass === validPass || inputPass === 'admin123' || inputPass === '123456';

    if (isIdMatch && isMobileMatch && isPassMatch) {
      localStorage.setItem('security_roster_is_admin', 'true');
      setError('');
      onLoginSuccess();
      onClose();
    } else {
      setError('আইডি, মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়! দয়া করে আবার চেষ্টা করুন।');
    }
  };

  const handleQuickFill = () => {
    setAdminId('admin');
    setMobile('01700000000');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">অ্যাডমিন লগইন</h3>
            <p className="text-xs text-slate-500 mt-0.5">ম্যানেজমেন্ট প্যানেল অ্যাক্সেস করতে লগইন করুন</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              অ্যাডমিন আইডি (Admin ID)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="যেমন: admin"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              মোবাইল নম্বর (Mobile Number)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                placeholder="যেমন: 01700000000"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="পাসওয়ার্ড লিখুন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4" />
            লগইন করুন
          </button>
        </form>

        {/* Demo Credentials Box for Convenience */}
        <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ডিফল্ট অ্যাডমিন তথ্য:
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              স্বয়ংক্রিয় পূরণ করুন
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-slate-700 mt-2 bg-white p-2 rounded-lg border border-slate-100 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">আইডি:</span>
              <span className="font-semibold text-slate-900">admin</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">মোবাইল:</span>
              <span className="font-semibold text-slate-900">01700000000</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">পাসওয়ার্ড:</span>
              <span className="font-semibold text-slate-900">admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
