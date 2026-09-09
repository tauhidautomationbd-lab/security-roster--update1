import { useState, useMemo } from 'react';
import { 
  Calendar, Users, ClipboardList, Download, LayoutDashboard, Settings, 
  Clock4, Save, Lock, LogOut, ShieldCheck, History, Wifi, WifiOff, User, UserPlus
} from 'lucide-react';
import { generateWeeklyRoster } from './utils/rosterAlgorithm';
import { RosterTable } from './components/RosterTable';
import { useAppState } from './hooks/useAppState';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { StaffManager } from './components/StaffManager';
import { PostManager } from './components/PostManager';
import { LeaveOTManager } from './components/LeaveOTManager';
import { RelieverManager } from './components/RelieverManager';
import { AuthModal } from './components/AuthModal';
import { AuditLogView } from './components/AuditLogView';
import { UserManagement } from './components/UserManagement';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { parseLocalDate, formatDisplayDate, getWeekDateRange } from './utils/dateUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'staff' | 'posts' | 'leave_ot' | 'audit_logs' | 'user_management'>('dashboard');
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);

  const auth = useAuth();
  const { currentUser, isAuthenticated, isAdmin, isSuperAdmin, logout } = auth;

  // Derive start and end date purely from weekNumber
  const currentWeekRange = useMemo(() => {
    return getWeekDateRange(weekNumber);
  }, [weekNumber]);
  
  const startDate = currentWeekRange.start;
  const endDate = currentWeekRange.end;
  
  const { 
    staff, setStaff, 
    posts, setPosts, 
    leaves, setLeaves, 
    ots, setOts, 
    shiftChanges, setShiftChanges, 
    isLoaded, 
    saveData, 
    isSaving, 
    saveMessage,
    lastSavedAt,
    lastSavedBy,
    isCloudSynced 
  } = useAppState();

  const roster = useMemo(() => {
    return generateWeeklyRoster(weekNumber, startDate, staff, posts, leaves, ots, shiftChanges);
  }, [weekNumber, startDate, staff, posts, leaves, ots, shiftChanges]);

  // Handle logout
  const handleLogout = () => {
    logout();
    if (['staff', 'posts', 'leave_ot', 'audit_logs'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  };

  // Filter navigation items based on auth status
  const navItems = useMemo(() => {
    const publicItems = [
      { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
      { id: 'roster', label: 'সাপ্তাহিক রোস্টার', icon: ClipboardList },
    ] as const;

    const authorizedItems = [
      { id: 'staff', label: 'স্টাফ ম্যানেজমেন্ট', icon: Users },
      { id: 'posts', label: 'পোস্ট ম্যানেজমেন্ট', icon: Settings },
      { id: 'leave_ot', label: 'ছুটি ও ওভারটাইম', icon: Clock4 },
    ] as const;

    let items: any[] = [...publicItems];

    if (isAuthenticated) {
      items = [...items, ...authorizedItems];
      
      if (isAdmin) {
        items.push({ id: 'audit_logs', label: 'অ্যাক্টিভিটি লগ', icon: History });
      }
      if (isSuperAdmin) {
        items.push({ id: 'user_management', label: 'ইউজার ম্যানেজমেন্ট', icon: ShieldCheck });
      }
    }
    
    return items;
  }, [isAuthenticated, isAdmin, isSuperAdmin]);

  const handleSave = () => {
    saveData(currentUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">
      {/* Toast Save Notifications */}
      {saveMessage === 'success' && (
        <div className="fixed bottom-5 right-5 bg-emerald-700 text-white px-5 py-3.5 rounded-xl shadow-2xl font-medium z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-emerald-500">
          <Save className="w-5 h-5 text-emerald-200" />
          <div>
            <p className="font-bold text-sm">সকল পরিবর্তন সফলভাবে ক্লাউডে সেভ হয়েছে!</p>
            <p className="text-[11px] text-emerald-100">রিলোড করলেও তথ্য অপরিবর্তিত থাকবে ও অন্য কম্পিউটারেও আপডেট হবে।</p>
          </div>
        </div>
      )}
      {saveMessage === 'error' && (
        <div className="fixed bottom-5 right-5 bg-rose-700 text-white px-5 py-3.5 rounded-xl shadow-2xl font-medium z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-rose-500">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-sm">সেভ করতে সমস্যা হয়েছে</p>
            <p className="text-[11px] text-rose-100">দয়া করে ইন্টারনেট সংযোগ চেক করে পুনরায় সেভ করুন।</p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-3 md:py-0 md:h-16 gap-3">
            
            {/* Logo and Cloud Status Badge */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-white ${isAuthenticated ? 'bg-indigo-600' : 'bg-slate-700'} shadow-xs`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                      সিকিউরিটি রোস্টার প্রো
                    </h1>
                    {isCloudSynced ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1" title="ক্লাউডের সাথে রিয়েল-টাইমে সংযুক্ত">
                        <Wifi className="w-3 h-3 text-emerald-600" /> লাইভ সিঙ্কড
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full border border-slate-200 flex items-center gap-1">
                        <WifiOff className="w-3 h-3 text-slate-400" /> অফলাইন ক্যাশ
                      </span>
                    )}
                  </div>
                  {lastSavedAt && (
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                      সর্বশেষ সেভ: {new Date(lastSavedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      {lastSavedBy ? ` (${lastSavedBy})` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center gap-2 md:hidden">
                {isAuthenticated ? (
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || !isLoaded}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'সেভ হচ্ছে...' : 'সেভ'}
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    লগইন
                  </button>
                )}
              </div>
            </div>

            {/* Navigation and Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
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

              {/* User Account and Save Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {isAuthenticated ? (
                  <>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving || !isLoaded}
                      className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 items-center gap-1.5 whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'সেভ হচ্ছে...' : 'সকল পরিবর্তন সেভ করুন'}
                    </button>

                    {/* Current User Pill */}
                    <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                          {currentUser?.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium leading-none">
                          {currentUser?.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-indigo-200 whitespace-nowrap"
                      title="পাসওয়ার্ড পরিবর্তন করুন"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">পাসওয়ার্ড</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-rose-200 whitespace-nowrap"
                      title="লগআউট করুন"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">লগআউট</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="hidden md:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Lock className="w-4 h-4" />
                    <span>লগইন / সাইনআপ</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        auth={auth}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        changePassword={auth.changePassword}
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
                  <label htmlFor="weekSelect" className="text-sm font-medium text-slate-700">সপ্তাহ নির্বাচন:</label>
                  <select 
                    id="weekSelect"
                    className="bg-transparent border-none text-sm font-bold text-indigo-700 focus:ring-0 cursor-pointer p-0 pr-6"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                  >
                    {Array.from({length: 30}).map((_, i) => {
                      const w = i + 1;
                      const { start } = getWeekDateRange(w);
                      const d = parseLocalDate(start);
                      const monthName = d.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
                      return <option key={w} value={w}>সপ্তাহ {w} ({monthName})</option>
                    })}
                  </select>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">তারিখ:</span>
                  <span className="text-sm font-bold text-indigo-700">
                    {formatDisplayDate(startDate)}
                  </span>
                  <span className="text-sm text-slate-500">হতে</span>
                  <span className="text-sm font-bold text-indigo-700">
                    {formatDisplayDate(endDate)}
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

        {/* Authenticated Tabs */}
        {isAuthenticated && activeTab === 'staff' && (
          <StaffManager 
            staff={staff} 
            setStaff={setStaff} 
            posts={posts} 
            currentUser={currentUser} 
          />
        )}
        
        {isAuthenticated && activeTab === 'posts' && (
          <PostManager 
            posts={posts} 
            setPosts={setPosts} 
            staff={staff} 
          />
        )}
        
        {isAuthenticated && activeTab === 'leave_ot' && (
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

        {isAuthenticated && isAdmin && activeTab === 'audit_logs' && (
          <AuditLogView />
        )}
        
        {isAuthenticated && isSuperAdmin && activeTab === 'user_management' && (
          <UserManagement 
            users={auth.registeredUsers} 
            updateUserStatus={auth.updateUserStatus} 
            deleteUser={auth.deleteUser}
            adminResetPassword={auth.adminResetPassword}
          />
        )}
      </main>
    </div>
  );
}
