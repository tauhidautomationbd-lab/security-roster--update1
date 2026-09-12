import { useState, useMemo } from 'react';
import { 
  Calendar, Users, ClipboardList, Download, LayoutDashboard, Settings, 
  Clock4, Save, Lock, LogOut, ShieldCheck, History, Wifi, WifiOff, Menu, X, Search, ExternalLink
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const getPageTitle = () => {
    const item = navItems.find(n => n.id === activeTab);
    return item ? item.label : 'ড্যাশবোর্ড';
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'আপনার সকল সিকিউরিটি অপারেশনাল ডেটা একনজরে';
      case 'roster': return 'সাপ্তাহিক ডিউটি রোস্টার ও রোটেশন পরিচালনা';
      case 'staff': return 'সকল সিকিউরিটি স্টাফের তথ্য ও প্রোফাইল';
      case 'posts': return 'ডিউটি পোস্ট এবং প্রয়োজনীয় স্টাফ সেটিংস';
      case 'leave_ot': return 'ছুটি, বদলি এবং ওভারটাইম ম্যানেজমেন্ট';
      case 'audit_logs': return 'সিস্টেমের সকল পরিবর্তনের লগ';
      case 'user_management': return 'অ্যাডমিন এবং ইউজার কন্ট্রোল প্যানেল';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans relative">
      {/* Toast Save Notifications */}
      {saveMessage === 'success' && (
        <div className="fixed bottom-5 right-5 bg-emerald-700 text-white px-5 py-3.5 rounded-xl shadow-2xl font-medium z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-emerald-500">
          <Save className="w-5 h-5 text-emerald-200" />
          <div>
            <p className="font-bold text-sm">সকল পরিবর্তন সফলভাবে সেভ হয়েছে!</p>
            <p className="text-[11px] text-emerald-100">ক্লাউডে আপডেট সম্পন্ন হয়েছে।</p>
          </div>
        </div>
      )}
      {saveMessage === 'error' && (
        <div className="fixed bottom-5 right-5 bg-rose-700 text-white px-5 py-3.5 rounded-xl shadow-2xl font-medium z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-rose-500">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-sm">সেভ করতে সমস্যা হয়েছে</p>
            <p className="text-[11px] text-rose-100">ইন্টারনেট সংযোগ চেক করে পুনরায় সেভ করুন।</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0F172A] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:w-72 md:flex-shrink-0 shadow-xl`}>
        <div className="p-6">
          {/* Logo Area */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Security Force</h1>
              <p className="text-xs text-indigo-300">Pro Plan</p>
            </div>
          </div>
        </div>

        {/* Sync Status - Sidebar */}
        <div className="px-6 pb-4">
           {isCloudSynced ? (
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[11px] font-medium rounded-full border border-emerald-500/20">
               <Wifi className="w-3.5 h-3.5" /> লাইভ সিঙ্কড
             </span>
           ) : (
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-400 text-[11px] font-medium rounded-full border border-slate-500/20">
               <WifiOff className="w-3.5 h-3.5" /> অফলাইন ক্যাশ
             </span>
           )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60">
          {isAuthenticated ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 py-2 rounded-md transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  পাসওয়ার্ড
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 py-2 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  লগআউট
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Lock className="w-4 h-4" />
              লগইন / সাইনআপ
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Simulated Search Bar */}
            <div className="hidden sm:flex items-center bg-slate-100 px-3 py-2 rounded-lg text-slate-500 w-full max-w-sm border border-slate-200/60 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
              <Search className="w-4 h-4 mr-2 text-slate-400" />
              <input 
                type="text" 
                placeholder="স্টাফ বা পোস্ট সার্চ করুন..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400 text-slate-700"
              />
              <div className="ml-2 flex items-center gap-1">
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 bg-white border border-slate-200 rounded">⌘</kbd>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 bg-white border border-slate-200 rounded">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              <ExternalLink className="w-4 h-4" />
              পাবলিক ডিউটি পোর্টাল
            </a>
            
            {isAuthenticated && (
              <button 
                onClick={handleSave}
                disabled={isSaving || !isLoaded}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">{isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</span>
                <span className="sm:hidden">{isSaving ? '...' : 'সেভ'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
            
            {/* Page Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h2>
                <p className="text-slate-500 mt-1 text-sm">{getPageSubtitle()}</p>
              </div>
              
              {activeTab === 'roster' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <label htmlFor="weekSelect" className="text-xs font-medium text-slate-500 mr-2">সপ্তাহ:</label>
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
                </div>
              )}
            </div>

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

            {/* Content Modules */}
            {activeTab === 'dashboard' && (
              <Dashboard 
                staff={staff} 
                posts={posts} 
                leaves={leaves} 
                ots={ots} 
                roster={roster} 
                startDate={startDate} 
                shiftChanges={shiftChanges}
                weekNumber={weekNumber}
              />
            )}
            
            {activeTab === 'roster' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-600">রোস্টার পিরিয়ড:</span>
                    <span className="font-bold text-indigo-700">{formatDisplayDate(startDate)}</span>
                    <span className="text-slate-400">হতে</span>
                    <span className="font-bold text-indigo-700">{formatDisplayDate(endDate)}</span>
                  </div>
                  
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    প্রিন্ট রোস্টার
                  </button>
                </div>

                {/* Shift Roster Table with Relievers integrated */}
                <RosterTable 
                  roster={roster} 
                  weekNumber={weekNumber} 
                  startDate={startDate} 
                  posts={posts} 
                  staff={staff}
                  shiftChanges={shiftChanges}
                  leaves={leaves}
                  ots={ots}
                />

                {/* Reliever Routine Table */}
                <RelieverManager 
                  staff={staff} 
                  posts={posts} 
                  shiftChanges={shiftChanges} 
                  weekNumber={weekNumber} 
                  startDate={startDate} 
                />
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
          </div>
        </main>
      </div>
    </div>
  );
}
