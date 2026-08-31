import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Users, ClipboardList, Download, LayoutDashboard, Settings, Clock4, Save, Lock, LogOut, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import { generateWeeklyRoster } from './utils/rosterAlgorithm';
import { RosterTable } from './components/RosterTable';
import { useAppState } from './hooks/useAppState';
import { Dashboard } from './components/Dashboard';
import { StaffManager } from './components/StaffManager';
import { PostManager } from './components/PostManager';
import { LeaveOTManager } from './components/LeaveOTManager';
import { RelieverManager } from './components/RelieverManager';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { parseLocalDate, formatDate, getEndDate, formatDisplayDate } from './utils/dateUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'staff' | 'posts' | 'leave_ot'>('dashboard');
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('security_roster_is_admin') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 6) ? 0 : (day + 1);
    d.setDate(d.getDate() - diff);
    return formatDate(d);
  });
  
  const prevWeekRef = useRef(weekNumber);
  useEffect(() => {
    if (weekNumber !== prevWeekRef.current) {
      const diffWeeks = weekNumber - prevWeekRef.current;
      const d = parseLocalDate(startDate);
      d.setDate(d.getDate() + diffWeeks * 7);
      setStartDate(formatDate(d));
      prevWeekRef.current = weekNumber;
    }
  }, [weekNumber, startDate]);
  
  const { staff, setStaff, posts, setPosts, leaves, setLeaves, ots, setOts, shiftChanges, setShiftChanges, isLoaded, saveData, isSaving, saveMessage } = useAppState();

  const roster = useMemo(() => {
    return generateWeeklyRoster(weekNumber, startDate, staff, posts, leaves, ots, shiftChanges);
  }, [weekNumber, startDate, staff, posts, leaves, ots, shiftChanges]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('security_roster_is_admin');
    setIsAdmin(false);
    if (['staff', 'posts', 'leave_ot'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  };

  // Filter navigation items based on admin status
  const navItems = useMemo(() => {
    const publicItems = [
      { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
      { id: 'roster', label: 'সাপ্তাহিক রোস্টার', icon: ClipboardList },
    ] as const;

    const adminOnlyItems = [
      { id: 'staff', label: 'স্টাফ ম্যানেজমেন্ট', icon: Users },
      { id: 'posts', label: 'পোস্ট ম্যানেজমেন্ট', icon: Settings },
      { id: 'leave_ot', label: 'ছুটি ও ওভারটাইম', icon: Clock4 },
    ] as const;

    if (isAdmin) {
      return [...publicItems, ...adminOnlyItems];
    }
    return publicItems;
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">
      {saveMessage === 'success' && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg font-medium z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Save className="w-5 h-5" />
          সকল পরিবর্তন সফলভাবে সেভ হয়েছে!
        </div>
      )}
      {saveMessage === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg font-medium z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xl">⚠️</span>
          সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-3 md:py-0 md:h-16 gap-3">
            {/* Logo and Status Badge */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg text-white ${isAdmin ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-800 leading-tight">সিকিউরিটি রোস্টার প্রো</h1>
                    {isAdmin ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full border border-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-600" /> অ্যাডমিন মোড
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-full border border-slate-200">
                        সাধারণ ভিউ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Save Button if Admin */}
              {isAdmin && (
                <button 
                  onClick={saveData}
                  disabled={isSaving || !isLoaded}
                  className="md:hidden bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'সেভ হচ্ছে...' : 'সেভ'}
                </button>
              )}

              {/* Mobile Admin Login Button if Not Logged In */}
              {!isAdmin && (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="md:hidden flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  লগইন
                </button>
              )}
            </div>

            {/* Navigation and Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <nav className="flex space-x-1 overflow-x-auto w-full md:w-auto flex-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === item.id
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Admin vs Public Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {isAdmin ? (
                  <>
                    <button 
                      onClick={saveData}
                      disabled={isSaving || !isLoaded}
                      className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 items-center gap-1.5 whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'সেভ হচ্ছে...' : 'সকল পরিবর্তন সেভ করুন'}
                    </button>

                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="অ্যাডমিন ক্রেডেনশিয়াল সেটিংস"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:border-rose-200 whitespace-nowrap"
                      title="অ্যাডমিন প্যানেল থেকে লগআউট করুন"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>লগআউট</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="hidden md:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Lock className="w-4 h-4" />
                    <span>অ্যাডমিন লগইন</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => setIsAdmin(true)}
      />

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <Dashboard 
            staff={staff} 
            posts={posts} 
            leaves={leaves} 
            ots={ots} 
            roster={roster} 
            startDate={startDate} 
          />
        )}
        
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">অ্যালগরিদম রোস্টার জেনারেটর</h2>
                <p className="text-sm text-slate-500 mt-1">
                  অটোমেটিক রোটেশন এবং ছুটি/ওভারটাইম হিসাব করে রোস্টার তৈরি করা হয়েছে।
                </p>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                  <label htmlFor="weekSelect" className="text-sm font-medium text-slate-700">সপ্তাহ:</label>
                  <select 
                    id="weekSelect"
                    className="bg-transparent border-none text-sm font-bold text-indigo-700 focus:ring-0 cursor-pointer p-0 pr-6"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                  <label htmlFor="startDate" className="text-sm font-medium text-slate-700">শুরুর তারিখ (শনিবার):</label>
                  <div className="relative flex items-center">
                    <span className="text-sm font-bold text-indigo-700 pointer-events-none">
                      {formatDisplayDate(startDate)}
                    </span>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <span className="text-sm text-slate-500">হতে</span>
                  <span className="text-sm font-bold text-indigo-700">
                    {formatDisplayDate(getEndDate(startDate))}
                  </span>
                </div>
                
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  প্রিন্ট / PDF
                </button>
              </div>
            </div>

            <RosterTable roster={roster} weekNumber={weekNumber} startDate={startDate} posts={posts} staff={staff} />
            <RelieverManager staff={staff} posts={posts} shiftChanges={shiftChanges} weekNumber={weekNumber} />
          </div>
        )}

        {/* Admin Guarded Tabs */}
        {isAdmin && activeTab === 'staff' && (
          <StaffManager staff={staff} setStaff={setStaff} posts={posts} />
        )}
        
        {isAdmin && activeTab === 'posts' && (
          <PostManager posts={posts} setPosts={setPosts} staff={staff} />
        )}
        
        {isAdmin && activeTab === 'leave_ot' && (
          <LeaveOTManager 
            staff={staff} 
            posts={posts} 
            leaves={leaves} 
            setLeaves={setLeaves} 
            ots={ots} 
            setOts={setOts} 
            shiftChanges={shiftChanges} 
            setShiftChanges={setShiftChanges} 
          />
        )}
      </main>
    </div>
  );
}
