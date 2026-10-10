import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  setDoc,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isOfflineError } from '../firebase';
import { JourneyModule, VideoArchive, LibraryBook, UserProfile, ShopProduct, CommunityPost, VipSectionGates } from '../types';
import { RAW_JOURNEY_MODULES, getCategoryForDay } from '../journeyData';
import { DEFAULT_T2S_ARCHIVES, DEFAULT_SHOP_PRODUCTS } from '../t2sData';
import { FOUR_FOUNDATIONAL_EBOOKS } from '../blueprintData';
import { 
  Plus, Edit2, Trash2, X, Save, Film, Book, Map as MapIcon, Zap, 
  ShoppingCart, ArrowLeft, Check, Upload, Search, Crown, 
  ShieldAlert, ShieldCheck, RefreshCw, RotateCcw, AlertTriangle, Eye,
  Activity, Users, Radio, Download, ExternalLink, MessageSquare, 
  Copy, Sliders, Calendar, Sparkles, Filter, ChevronRight, Info,
  Lock, Unlock, Shield, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  currentAdmin?: UserProfile | null;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  hindiTitle?: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'live';
  active: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function AdminPanel({ currentAdmin }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'gates' | 'users' | 'journey' | 'archives' | 'library' | 'shop' | 'forum' | 'broadcast'>('overview');
  
  // Real-time counter metrics for sub-tab pills
  const [userCount, setUserCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [forumCount, setForumCount] = useState<number>(0);
  const [vipGates, setVipGates] = useState<VipSectionGates>({});

  useEffect(() => {
    // Listen to users for counts
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUserCount(snap.docs.length);
      const pending = snap.docs.filter(d => d.data().premiumRequestStatus === 'pending').length;
      setPendingCount(pending);
    }, () => {});

    // Listen to posts for count
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
      setForumCount(snap.docs.length);
    }, () => {});

    // Listen to global VIP section gates
    const unsubGates = onSnapshot(doc(db, 'settings', 'vip_gates'), (snap) => {
      if (snap.exists()) {
        setVipGates(snap.data() as VipSectionGates);
      }
    }, () => {});

    return () => {
      unsubUsers();
      unsubPosts();
      unsubGates();
    };
  }, []);

  const activeVipGatesCount = useMemo(() => {
    const coreKeys: (keyof VipSectionGates)[] = ['journey', 'archives', 'library', 'forum', 'crucible', 'shop', 'leaderboard', 'affiliate'];
    return coreKeys.filter(k => vipGates[k] === true).length;
  }, [vipGates]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Central Admin Header */}
      <div className="bg-[#0c0e14] border border-[#1d222e] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-500 font-mono text-[10px] font-black uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>CENTRAL COMMAND & ACCESS CONTROL // व्यवस्थापक नियंत्रण</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">
              T2S Master Administrator
            </h2>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase">
              Clearance Level 5
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Logged in as: <span className="text-amber-400 font-bold">{currentAdmin?.email || currentAdmin?.displayName || 'Master Sovereign'}</span>
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 relative z-10">
          <SubTabBtn 
            active={activeSubTab === 'overview'} 
            onClick={() => setActiveSubTab('overview')} 
            icon={<Activity className="w-3.5 h-3.5" />} 
            label="Command Hub" 
          />
          <SubTabBtn 
            active={activeSubTab === 'gates'} 
            onClick={() => setActiveSubTab('gates')} 
            icon={<Lock className="w-3.5 h-3.5" />} 
            label="VIP Section Gates" 
            badge={activeVipGatesCount > 0 ? `${activeVipGatesCount} VIP` : 'ALL FREE'}
            badgeColor={activeVipGatesCount > 0 ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-zinc-400'}
          />
          <SubTabBtn 
            active={activeSubTab === 'users'} 
            onClick={() => setActiveSubTab('users')} 
            icon={<Users className="w-3.5 h-3.5" />} 
            label="Users & Ledger" 
            badge={pendingCount > 0 ? `${pendingCount} PENDING` : userCount > 0 ? userCount : undefined}
            badgeColor={pendingCount > 0 ? 'bg-amber-500 text-black' : undefined}
          />
          <SubTabBtn 
            active={activeSubTab === 'journey'} 
            onClick={() => setActiveSubTab('journey')} 
            icon={<MapIcon className="w-3.5 h-3.5" />} 
            label="100-Day Course" 
            count={100} 
          />
          <SubTabBtn 
            active={activeSubTab === 'archives'} 
            onClick={() => setActiveSubTab('archives')} 
            icon={<Film className="w-3.5 h-3.5" />} 
            label="Archives" 
          />
          <SubTabBtn 
            active={activeSubTab === 'library'} 
            onClick={() => setActiveSubTab('library')} 
            icon={<Book className="w-3.5 h-3.5" />} 
            label="Library" 
          />
          <SubTabBtn 
            active={activeSubTab === 'shop'} 
            onClick={() => setActiveSubTab('shop')} 
            icon={<ShoppingCart className="w-3.5 h-3.5" />} 
            label="Shop" 
          />
          <SubTabBtn 
            active={activeSubTab === 'forum'} 
            onClick={() => setActiveSubTab('forum')} 
            icon={<MessageSquare className="w-3.5 h-3.5" />} 
            label="Forum Moderation" 
            count={forumCount}
          />
          <SubTabBtn 
            active={activeSubTab === 'broadcast'} 
            onClick={() => setActiveSubTab('broadcast')} 
            icon={<Radio className="w-3.5 h-3.5" />} 
            label="Broadcasts" 
          />
        </div>
      </div>

      {/* Main Tab View Canvas */}
      <div className="bg-[#0c0e14] rounded-3xl p-4 sm:p-6 md:p-8 border border-[#1d222e] shadow-2xl min-h-[500px]">
        {activeSubTab === 'overview' && (
          <OverviewManager 
            onNavigateTab={setActiveSubTab} 
            userCount={userCount} 
            pendingCount={pendingCount} 
            forumCount={forumCount} 
            vipGates={vipGates}
          />
        )}
        {activeSubTab === 'gates' && <VipGatesManager onNavigateTab={setActiveSubTab} />}
        {activeSubTab === 'users' && <UserManager currentAdmin={currentAdmin} />}
        {activeSubTab === 'journey' && <JourneyManager />}
        {activeSubTab === 'archives' && <ArchiveManager />}
        {activeSubTab === 'library' && <LibraryManager />}
        {activeSubTab === 'shop' && <ShopManager />}
        {activeSubTab === 'forum' && <ForumModeratorManager currentAdmin={currentAdmin} />}
        {activeSubTab === 'broadcast' && <BroadcastManager />}
      </div>
    </div>
  );
}

function SubTabBtn({ active, onClick, icon, label, count, badge, badgeColor }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  badge?: string | number;
  badgeColor?: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
        active 
          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black' 
          : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
      }`}
    >
      {icon} 
      <span>{label}</span>
      {badge !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black ${badgeColor || (active ? 'bg-black/20 text-black' : 'bg-white/10 text-amber-300')}`}>
          {badge}
        </span>
      )}
      {count !== undefined && badge === undefined && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ==========================================
// CUSTOM SOVEREIGN CONFIRMATION MODAL
// (Replaces all window.confirm / window.alert)
// ==========================================

interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ config }: { config: ConfirmModalConfig }) {
  if (!config.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.92, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-[#12141d] border border-[#232938] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-left"
        >
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              config.isDanger ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              {config.isDanger ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {config.title}
              </h3>
              <p className="text-xs text-zinc-300 font-mono mt-1 leading-relaxed">
                {config.message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={config.onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {config.cancelLabel || 'Cancel / रद्द करें'}
            </button>
            <button
              type="button"
              onClick={config.onConfirm}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                config.isDanger 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
              }`}
            >
              {config.confirmLabel || 'Confirm Action'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ==========================================
// 0. COMMAND OVERVIEW & SYSTEM HEALTH
// ==========================================

function OverviewManager({ onNavigateTab, userCount, pendingCount, forumCount, vipGates }: {
  onNavigateTab: (tab: any) => void;
  userCount: number;
  pendingCount: number;
  forumCount: number;
  vipGates?: VipSectionGates;
}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [archivesCount, setArchivesCount] = useState<number>(DEFAULT_T2S_ARCHIVES.length);
  const [booksCount, setBooksCount] = useState<number>(FOUR_FOUNDATIONAL_EBOOKS.length);
  const [productsCount, setProductsCount] = useState<number>(DEFAULT_SHOP_PRODUCTS.length);
  const [courseOverrideCount, setCourseOverrideCount] = useState<number>(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      setUsers(data);
    }, () => {});

    const unsubArchives = onSnapshot(collection(db, 'archives'), (snap) => {
      if (snap.docs.length > 0) setArchivesCount(snap.docs.length);
    }, () => {});

    const unsubBooks = onSnapshot(collection(db, 'library'), (snap) => {
      if (snap.docs.length > 0) setBooksCount(snap.docs.length);
    }, () => {});

    const unsubShop = onSnapshot(collection(db, 'shop'), (snap) => {
      if (snap.docs.length > 0) setProductsCount(snap.docs.length);
    }, () => {});

    const unsubJourney = onSnapshot(collection(db, 'journey'), (snap) => {
      setCourseOverrideCount(snap.docs.length);
    }, () => {});

    return () => {
      unsubUsers();
      unsubArchives();
      unsubBooks();
      unsubShop();
      unsubJourney();
    };
  }, []);

  const totalXP = useMemo(() => {
    return users.reduce((acc, u) => acc + (u.xp || 0), 0);
  }, [users]);

  const strategistCount = useMemo(() => {
    return users.filter(u => u.isStrategist).length;
  }, [users]);

  // Export full user database snapshot as JSON
  const exportUsersLedger = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalUsers: users.length,
        strategistCount,
        users: users.map(u => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          level: u.level || 1,
          xp: u.xp || 0,
          completedDaysCount: (u.completedDays || []).length,
          completedDays: u.completedDays || [],
          streak: u.streak || 0,
          isStrategist: !!u.isStrategist,
          isAdmin: !!u.isAdmin,
          premiumRequestStatus: u.premiumRequestStatus || 'none',
          premiumRequestTransactionId: u.premiumRequestTransactionId || '',
          lastCompletedAt: u.lastCompletedAt ? new Date(u.lastCompletedAt?.seconds ? u.lastCompletedAt.seconds * 1000 : u.lastCompletedAt).toISOString() : null
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `t2s-nexus-users-ledger-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionNotice("Users Ledger JSON Exported Successfully");
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setActionNotice("Failed to export ledger");
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Toast */}
      {actionNotice && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-xl flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{actionNotice}</span>
        </motion.div>
      )}

      {/* Urgent Pending Notice Banner */}
      {pendingCount > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/20 via-amber-950/30 to-zinc-900 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shrink-0">
              <Crown className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="text-amber-300 font-bold text-sm flex items-center gap-2">
                <span>{pendingCount} Pending Strategist Verification{pendingCount > 1 ? 's' : ''} Require Approval</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Users submitted UPI / Card transactions waiting for sovereign clearance in the ledger.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('users')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-lg"
          >
            <span>Review Verifications</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIP Section Gates Summary Banner */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-black border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-white font-bold text-sm flex items-center gap-2">
              <span>VIP Section Gating Control</span>
              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded text-[9px] font-mono font-bold uppercase">
                {Object.values(vipGates || {}).filter(Boolean).length} / 8 Sections VIP Locked
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Instantly toggle which platform sections require VIP membership vs free open access.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('gates')}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-lg"
        >
          <span>Manage VIP Gates</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider">Practitioners</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{userCount}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Registered Users</span>
        </div>

        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">Strategists</span>
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{strategistCount}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Premium Members</span>
        </div>

        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider">Community XP</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalXP.toLocaleString()}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Total Accumulated XP</span>
        </div>

        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider">Forum Discussions</span>
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{forumCount}</div>
          <span className="text-[10px] text-zinc-500 font-mono block">Community Posts</span>
        </div>
      </div>

      {/* Content Pillar Inventory & System Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Course & Content Status */}
        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4 md:col-span-2">
          <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>CONTENT PILLARS ARCHITECTURE</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div 
              onClick={() => onNavigateTab('journey')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">100-Day Consciousness Course</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  100 Days Standard • {courseOverrideCount} Custom Overrides
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            <div 
              onClick={() => onNavigateTab('archives')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Documentary Archives</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {archivesCount} Decoded Video Archives
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            <div 
              onClick={() => onNavigateTab('library')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Foundational Manuscripts</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {booksCount} Strategic Field Manuals & Ebooks
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            <div 
              onClick={() => onNavigateTab('shop')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Shop & Recommended Gear</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {productsCount} Curated Physical & Digital Tools
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* System Safeguards & Ledger Tools */}
        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>DATA ARCHIVE & BACKUP</span>
            </h4>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Export user ledger snapshots containing completion matrices, XP balances, and verification transaction IDs for sovereign records.
            </p>
          </div>

          <div className="space-y-2.5 pt-3">
            <button
              onClick={exportUsersLedger}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Ledger (JSON)</span>
            </button>
            <button
              onClick={() => onNavigateTab('broadcast')}
              className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Radio className="w-4 h-4" />
              <span>Publish Broadcast Notice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. VIP SECTION ACCESS GATES MANAGER
// ==========================================

interface SectionGateItem {
  key: keyof VipSectionGates;
  title: string;
  hindiTitle: string;
  description: string;
  tabTarget: string;
  icon: React.ReactNode;
}

const SECTION_GATES_LIST: SectionGateItem[] = [
  {
    key: 'journey',
    title: '100-Day Consciousness Course',
    hindiTitle: '१००-दिवसीय चेतना पाठ्यक्रम',
    description: 'When locked to VIP, non-paying practitioners cannot enter the 100-day journey modules or audio narrations.',
    tabTarget: 'journey',
    icon: <MapIcon className="w-5 h-5 text-amber-400" />
  },
  {
    key: 'archives',
    title: 'Documentaries & Video Archives',
    hindiTitle: 'सामाजिक वृत्तचित्र संग्रह',
    description: 'When locked to VIP, all investigative social reality video breakdowns require special membership.',
    tabTarget: 'archives',
    icon: <Film className="w-5 h-5 text-amber-400" />
  },
  {
    key: 'library',
    title: 'Sovereign Library & Manuscripts',
    hindiTitle: 'संप्रभु पुस्तकालय व ग्रंथ',
    description: 'When locked to VIP, the 4 foundational books, built-in digital reader, and PDFs require special membership.',
    tabTarget: 'library',
    icon: <Book className="w-5 h-5 text-amber-400" />
  },
  {
    key: 'forum',
    title: 'Community Discussion Forum',
    hindiTitle: 'समुदाय चर्चा मंच',
    description: 'When locked to VIP, reading reflections and participating in the practitioner forum requires special membership.',
    tabTarget: 'forum',
    icon: <MessageSquare className="w-5 h-5 text-amber-400" />
  },
  {
    key: 'crucible',
    title: 'Mental Models Crucible & Framework',
    hindiTitle: 'मानसिक मॉडल शोध व ब्लूप्रिंट',
    description: 'When locked to VIP, cognitive diagrams and reality deconstruction frameworks require special membership.',
    tabTarget: 'crucible',
    icon: <Sliders className="w-5 h-5 text-amber-400" />
  },
  {
    key: 'shop',
    title: 'Strategic Store & Resources',
    hindiTitle: 'रणनीतिक संसाधन दुकान',
    description: 'When locked to VIP, access to the physical and digital recommendations catalog requires special membership.',
    tabTarget: 'shop',
    icon: <ShoppingCart className="w-5 h-5 text-amber-400" />
  },
  {
    key: 'leaderboard',
    title: 'Discipline Leaderboard & Hall of Fame',
    hindiTitle: 'अनुशासन लीडरबोर्ड व साधक सम्मान',
    description: 'When locked to VIP, platform rankings, member streaks, and practitioner standings require special membership.',
    tabTarget: 'leaderboard',
    icon: <Trophy className="w-5 h-5 text-amber-400" />
  },
  {
    key: 'affiliate',
    title: 'Sovereign Partner & Affiliate Program',
    hindiTitle: 'सहयोगी पोर्टल व संप्रभु पार्टनर',
    description: 'When locked to VIP, referral commissions, partner earnings, and affiliate links require special membership.',
    tabTarget: 'affiliate',
    icon: <Zap className="w-5 h-5 text-amber-400" />
  }
];

function VipGatesManager({ onNavigateTab }: { onNavigateTab: (tab: any) => void }) {
  const [gates, setGates] = useState<VipSectionGates>({});
  const [status, setStatus] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'vip_gates'), (snap) => {
      if (snap.exists()) {
        setGates(snap.data() as VipSectionGates);
      }
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.GET, 'settings/vip_gates');
      }
    });
  }, []);

  const toggleSection = async (key: keyof VipSectionGates, currentVal: boolean | undefined) => {
    setSavingKey(key);
    const targetVal = !currentVal;
    try {
      await setDoc(doc(db, 'settings', 'vip_gates'), {
        [key]: targetVal,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus(`${key.toUpperCase()} section is now ${targetVal ? 'VIP Only' : 'Free / Public'}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/vip_gates');
    } finally {
      setSavingKey(null);
    }
  };

  const setAllSections = (vipOnly: boolean) => {
    setConfirmConfig({
      isOpen: true,
      title: vipOnly ? "Lock All 8 Sections to VIP?" : "Make All 8 Sections Free?",
      message: vipOnly
        ? "This will require VIP / Special Strategist clearance for all 8 sections of the platform. Free users will encounter the ascension gate."
        : "This will make all 8 sections accessible to standard free practitioners without paywall restrictions.",
      confirmLabel: vipOnly ? "Lock All Sections" : "Unlock All Sections",
      isDanger: vipOnly,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const payload: Record<string, any> = { updatedAt: serverTimestamp() };
          SECTION_GATES_LIST.forEach(item => {
            payload[item.key] = vipOnly;
          });
          await setDoc(doc(db, 'settings', 'vip_gates'), payload, { merge: true });
          setStatus(`All 8 sections updated: ${vipOnly ? 'VIP Only' : 'Free for All'}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'settings/vip_gates');
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const activeCount = Object.values(gates).filter(Boolean).length;

  return (
    <div className="space-y-6 text-left">
      <ConfirmDialog config={confirmConfig} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400">
              PLATFORM FEATURE GATING // अनुभाग सुरक्षा गेट
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">
            VIP Section Access Control
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Toggle platform sections between Free for all users and VIP Exclusive (Special Strategists only).
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <button
            onClick={() => setAllSections(true)}
            className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lock All VIP</span>
          </button>
          <button
            onClick={() => setAllSections(false)}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Unlock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Make All Free</span>
          </button>
        </div>
      </div>

      {status && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-xl flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{status}</span>
        </motion.div>
      )}

      {/* Overview Stat Strip */}
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">Current Gating Status:</span>
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg font-bold">
            {activeCount} of {SECTION_GATES_LIST.length} Sections VIP Gated
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">Changes apply immediately across all user sessions</span>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTION_GATES_LIST.map((item) => {
          const isGated = !!gates[item.key];
          const isSaving = savingKey === item.key;

          return (
            <div
              key={item.key}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isGated
                  ? 'bg-gradient-to-br from-amber-500/10 via-[#0e1017] to-black border-amber-500/40 shadow-xl'
                  : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isGated ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <span className="text-[11px] text-zinc-400 font-mono block">{item.hindiTitle}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {isGated ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>VIP ONLY</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-white/5 text-zinc-400 border border-white/10 rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>FREE</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                {item.description}
              </p>

              {/* Action row with prominent toggle switch */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onNavigateTab(item.tabTarget)}
                  className="text-[11px] text-zinc-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Manage Content</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => toggleSection(item.key, gates[item.key])}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    isGated
                      ? 'bg-amber-500 text-black border-amber-400 hover:bg-amber-400 shadow-md font-black'
                      : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                  }`}
                >
                  {isGated ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>VIP Locked (Click to Free)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Free Access (Click to Gate)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. JOURNEY MANAGER (ALL 100 DAYS)
// ==========================================

function JourneyManager() {
  const [dbOverrides, setDbOverrides] = useState<Map<number, JourneyModule>>(new Map());
  const [editing, setEditing] = useState<Partial<JourneyModule> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'phase1' | 'phase2' | 'phase3' | 'phase4'>('all');
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const q = query(collection(db, 'journey'), orderBy('day', 'asc'));
    return onSnapshot(q, (snap) => {
      const map = new Map<number, JourneyModule>();
      snap.docs.forEach(d => {
        const data = d.data() as JourneyModule;
        if (data.day) {
          map.set(data.day, { ...data, id: d.id });
        }
      });
      setDbOverrides(map);
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'journey');
      }
    });
  }, []);

  // Merge RAW 100 modules with any Firestore overrides without losing deep fields
  const allModules = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const dayNum = i + 1;
      const raw = RAW_JOURNEY_MODULES.find(m => m.day === dayNum);
      const override = dbOverrides.get(dayNum);
      if (override) {
        return {
          id: `day_${dayNum}`,
          day: dayNum,
          title: override.title || raw?.title || `Day ${dayNum}`,
          hindiTitle: override.hindiTitle || raw?.hindiTitle || '',
          description: override.description || raw?.description || '',
          command: override.command || raw?.command || override.description || '',
          logic: override.logic || raw?.logic || '',
          phase: override.phase || raw?.phase || `Phase ${Math.ceil(dayNum / 25)}`,
          category: override.category || raw?.category || getCategoryForDay(dayNum),
          isPremium: override.isPremium !== undefined ? override.isPremium : (raw?.isPremium || false)
        } as JourneyModule;
      }
      return {
        id: `day_${dayNum}`,
        day: dayNum,
        title: raw?.title || `Day ${dayNum}`,
        hindiTitle: raw?.hindiTitle || '',
        description: raw?.description || '',
        command: raw?.command || raw?.description || '',
        logic: raw?.logic || '',
        phase: raw?.phase || `Phase ${Math.ceil(dayNum / 25)}`,
        category: raw?.category || getCategoryForDay(dayNum),
        isPremium: raw?.isPremium || false
      } as JourneyModule;
    });
  }, [dbOverrides]);

  const filteredModules = useMemo(() => {
    return allModules.filter(m => {
      // Phase filter
      if (phaseFilter === 'phase1' && (m.day < 1 || m.day > 25)) return false;
      if (phaseFilter === 'phase2' && (m.day < 26 || m.day > 50)) return false;
      if (phaseFilter === 'phase3' && (m.day < 51 || m.day > 75)) return false;
      if (phaseFilter === 'phase4' && (m.day < 76 || m.day > 100)) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const dayMatch = m.day.toString() === q || `day ${m.day}` === q || `day${m.day}` === q;
      const titleMatch = m.title.toLowerCase().includes(q) || (m.hindiTitle || '').toLowerCase().includes(q);
      const categoryMatch = (m.category || '').toLowerCase().includes(q);
      const descMatch = (m.description || '').toLowerCase().includes(q);
      return dayMatch || titleMatch || categoryMatch || descMatch;
    });
  }, [allModules, phaseFilter, searchQuery]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const day = parseInt((form.elements.namedItem('day') as HTMLInputElement).value);
    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
    const hindiTitle = (form.elements.namedItem('hindiTitle') as HTMLInputElement).value.trim();
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
    const phase = (form.elements.namedItem('phase') as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim();
    const command = (form.elements.namedItem('command') as HTMLTextAreaElement).value.trim();
    const logic = (form.elements.namedItem('logic') as HTMLTextAreaElement).value.trim();
    const isPremium = (form.elements.namedItem('isPremium') as HTMLInputElement).checked;

    if (isNaN(day) || day < 1 || day > 100) {
      setStatus("Error: Day number must be between 1 and 100.");
      return;
    }

    const docId = `day_${day}`;
    const payload = {
      day,
      title,
      hindiTitle,
      category,
      phase,
      description,
      command,
      logic,
      isPremium,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'journey', docId), payload, { merge: true });
      setEditing(null);
      setStatus(`Day ${day} Saved Successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `journey/${docId}`);
      if (isOfflineError(error)) {
        setEditing(null);
        setStatus(`Day ${day} Saved (Offline)`);
      }
    }
  };

  const togglePremium = async (m: JourneyModule) => {
    const docId = `day_${m.day}`;
    const targetPremium = !m.isPremium;
    try {
      await setDoc(doc(db, 'journey', docId), {
        day: m.day,
        title: m.title,
        hindiTitle: m.hindiTitle || '',
        description: m.description,
        command: m.command || m.description,
        logic: m.logic || '',
        phase: m.phase || `Phase ${Math.ceil(m.day / 25)}`,
        category: m.category || getCategoryForDay(m.day),
        isPremium: targetPremium,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus(`Day ${m.day} is now ${targetPremium ? 'Strategist Tier' : 'Free'}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `journey/${docId}`);
    }
  };

  const bulkSetJourneyVip = (mode: 'all_vip' | 'all_free' | 'phase1_free') => {
    const title = mode === 'all_vip' ? "Lock All 100 Days to VIP?" : mode === 'all_free' ? "Make All 100 Days Free?" : "Make Phase 1 Free, Phases 2-4 VIP?";
    const message = mode === 'all_vip'
      ? "This will set all 100 days of the journey to VIP Strategist Tier."
      : mode === 'all_free'
      ? "This will make all 100 days accessible to standard free practitioners."
      : "Days 1-25 will be Free, and Days 26-100 will be locked to VIP Strategist Tier.";

    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmLabel: "Apply Curriculum VIP Tiers",
      isDanger: mode === 'all_vip',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          for (let dayNum = 1; dayNum <= 100; dayNum++) {
            const raw = RAW_JOURNEY_MODULES.find(m => m.day === dayNum);
            const override = dbOverrides.get(dayNum);
            const isPremium = mode === 'all_vip' ? true : mode === 'all_free' ? false : (dayNum > 25);
            const docId = `day_${dayNum}`;
            await setDoc(doc(db, 'journey', docId), {
              day: dayNum,
              title: override?.title || raw?.title || `Day ${dayNum}`,
              hindiTitle: override?.hindiTitle || raw?.hindiTitle || '',
              description: override?.description || raw?.description || '',
              command: override?.command || raw?.command || '',
              logic: override?.logic || raw?.logic || '',
              phase: override?.phase || raw?.phase || `Phase ${Math.ceil(dayNum / 25)}`,
              category: override?.category || raw?.category || getCategoryForDay(dayNum),
              isPremium,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          setStatus(`All 100 Days updated successfully`);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'journey');
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const resetToDefault = (m: JourneyModule) => {
    setConfirmConfig({
      isOpen: true,
      title: `Reset Day ${m.day} to Canon?`,
      message: `This will remove the custom database override for Day ${m.day} and restore original canonical curriculum.`,
      confirmLabel: 'Restore Canonical Module',
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const docId = `day_${m.day}`;
        try {
          await deleteDoc(doc(db, 'journey', docId));
          setStatus(`Day ${m.day} Restored to Default`);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `journey/${docId}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div className="space-y-6 text-left">
      <ConfirmDialog config={confirmConfig} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white italic tracking-tight">100-Day Consciousness Course</h3>
          {status && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 bg-green-500/20 text-green-400 text-[9px] font-mono font-black uppercase tracking-widest rounded-full border border-green-500/20">
              {status}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => bulkSetJourneyVip('all_vip')}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Lock all 100 days to VIP Strategist tier"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lock All VIP</span>
          </button>
          <button
            onClick={() => bulkSetJourneyVip('phase1_free')}
            className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make Days 1-25 Free, and Days 26-100 VIP"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Phase 1 Free, 2-4 VIP</span>
          </button>
          <button
            onClick={() => bulkSetJourneyVip('all_free')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make all 100 days free for all users"
          >
            <Unlock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Make All Free</span>
          </button>
          <button 
            onClick={() => setEditing({ 
              day: 1, 
              title: '', 
              hindiTitle: '', 
              description: '', 
              command: '', 
              logic: '', 
              phase: 'Phase 1: THE PURGE (Days 1 - 25)', 
              isPremium: false, 
              category: 'Mindset' 
            })} 
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> <span>Edit / Create Module</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-mono">
          {[
            { id: 'all', label: 'All (100 Days)' },
            { id: 'phase1', label: 'Phase 1 (1-25)' },
            { id: 'phase2', label: 'Phase 2 (26-50)' },
            { id: 'phase3', label: 'Phase 3 (51-75)' },
            { id: 'phase4', label: 'Phase 4 (76-100)' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPhaseFilter(p.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                phaseFilter === p.id 
                  ? 'bg-white text-black font-black' 
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Day # or topic..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modules List */}
      <div className="grid grid-cols-1 gap-2.5 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
        {filteredModules.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs bg-white/[0.01] border border-white/5 rounded-2xl">
            No modules match search "{searchQuery}".
          </div>
        ) : (
          filteredModules.map(m => {
            const hasCustomOverride = dbOverrides.has(m.day);
            return (
              <div key={`mod-${m.day}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white/5 hover:bg-white/[0.07] rounded-2xl border border-white/5 gap-3 transition-colors">
                <div className="flex items-center gap-3 md:gap-4 flex-wrap sm:flex-nowrap min-w-0">
                  <span className="text-amber-400 font-mono font-bold text-xs shrink-0 px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    DAY {m.day < 10 ? `0${m.day}` : m.day}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">{m.title}</span>
                      {m.hindiTitle && (
                        <span className="text-xs text-zinc-400 truncate">({m.hindiTitle})</span>
                      )}
                      {m.isPremium && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-amber-400" /> Strategist
                        </span>
                      )}
                      {hasCustomOverride && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-mono font-bold uppercase rounded">
                          Customized
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono block truncate">
                      {m.category || 'Mindset'} • {m.command || m.description.slice(0, 75)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {hasCustomOverride && (
                    <button
                      onClick={() => resetToDefault(m)}
                      className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Reset module back to default canonical text"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => togglePremium(m)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      m.isPremium 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                        : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                    }`}
                    title={m.isPremium ? "Active Strategist Tier" : "Set as Strategist Tier"}
                  >
                    <Zap size={14} fill={m.isPremium ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => setEditing(m)} 
                    className="p-2 hover:bg-white/10 rounded-xl text-blue-400 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                    title="Edit Module Details"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Module Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.form 
              key={editing.id || editing.day || 'new'}
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={save} 
              className="bg-[#11131a] p-6 sm:p-8 rounded-3xl border border-[#1e222d] w-full max-w-xl space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <button type="button" onClick={() => setEditing(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <ArrowLeft size={16} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Close</span>
                </button>
                <h4 className="text-base font-black uppercase tracking-wider text-white">
                  Edit Day {editing.day || ''} Module
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Day (1-100)</label>
                  <input 
                    name="day" 
                    defaultValue={editing.day} 
                    min={1} 
                    max={100}
                    className="w-full bg-white/5 p-3 rounded-xl text-sm font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" 
                    type="number" 
                    required 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Category</label>
                  <select 
                    name="category" 
                    defaultValue={editing.category || getCategoryForDay(editing.day || 1)}
                    className="w-full bg-[#181a24] p-3 rounded-xl text-xs font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none"
                  >
                    <option value="Mindset">Mindset (सोच व नजरिया)</option>
                    <option value="Body Language">Body Language (शारीरिक भाषा)</option>
                    <option value="Social Systems & Reality">Social Systems & Reality (समाज की हकीकत)</option>
                    <option value="Discipline">Discipline (अनुशासन व नियम)</option>
                    <option value="Mystery & Presence">Mystery & Presence (मूक प्रभाव)</option>
                    <option value="Strategic Thinking">Strategic Thinking (रणनीतिक सोच)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Title (English)</label>
                  <input 
                    name="title" 
                    defaultValue={editing.title} 
                    placeholder="e.g. Notification Death" 
                    className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Hindi Title (हिंदी शीर्षक)</label>
                  <input 
                    name="hindiTitle" 
                    defaultValue={editing.hindiTitle || ''} 
                    placeholder="उदा. नोटिफिकेशन का विसर्जन" 
                    className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Curriculum Phase</label>
                <input 
                  name="phase" 
                  defaultValue={editing.phase || `Phase ${Math.ceil((editing.day || 1) / 25)}`} 
                  placeholder="Phase 1: THE PURGE (Days 1 - 25)" 
                  className="w-full bg-white/5 p-3 rounded-xl text-xs font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Daily Directive / Command (दैनिक आदेश)</label>
                <textarea 
                  name="command" 
                  defaultValue={editing.command || editing.description || ''} 
                  placeholder="The concrete daily protocol action..." 
                  rows={2}
                  className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none leading-relaxed" 
                  required 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Strategic Logic / The Why (रणनीतिक कारण)</label>
                <textarea 
                  name="logic" 
                  defaultValue={editing.logic || ''} 
                  placeholder="The psychological or social mechanism why this protocol works..." 
                  rows={2}
                  className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none leading-relaxed" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Module Full Summary / Principles</label>
                <textarea 
                  name="description" 
                  defaultValue={editing.description || ''} 
                  placeholder="Detailed breakdown..." 
                  rows={3}
                  className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none leading-relaxed" 
                  required 
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/5">
                <input type="checkbox" name="isPremium" defaultChecked={editing.isPremium} className="w-4 h-4 accent-amber-500" />
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-2 font-mono">
                  Strategist Tier Only <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
              </label>

              <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg">
                Save Day Module
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 2. ARCHIVE MANAGER (DOCUMENTARIES)
// ==========================================

function ArchiveManager() {
  const [items, setItems] = useState<VideoArchive[]>([]);
  const [editing, setEditing] = useState<Partial<VideoArchive> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [thumbnailBase64, setThumbnailBase64] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (editing) {
      setThumbnailBase64(editing.thumbnail || '');
    } else {
      setThumbnailBase64('');
    }
  }, [editing]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'archives'), orderBy('title', 'asc')), (snap) => {
      const dbDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoArchive));
      if (dbDocs.length > 0) {
        setItems(dbDocs);
      } else {
        setItems(DEFAULT_T2S_ARCHIVES);
      }
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'archives');
      }
      setItems(DEFAULT_T2S_ARCHIVES);
    });
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(v => 
      v.title.toLowerCase().includes(q) || 
      (v.family && v.family.toLowerCase().includes(q)) ||
      (v.question && v.question.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const inputUrl = (form.elements.namedItem('thumbnailUrl') as HTMLInputElement)?.value?.trim() || '';
    const finalThumbnail = thumbnailBase64 || inputUrl || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop';

    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
    const duration = (form.elements.namedItem('duration') as HTMLInputElement).value.trim();
    const views = (form.elements.namedItem('views') as HTMLInputElement).value.trim();
    const videoUrl = (form.elements.namedItem('videoUrl') as HTMLInputElement).value.trim();
    const isPremium = (form.elements.namedItem('isPremium') as HTMLInputElement).checked;
    const family = (form.elements.namedItem('family') as HTMLSelectElement).value;
    const question = (form.elements.namedItem('question') as HTMLInputElement)?.value?.trim() || '';
    const hiddenSystemSummary = (form.elements.namedItem('hiddenSystemSummary') as HTMLTextAreaElement)?.value?.trim() || '';
    const consequence = (form.elements.namedItem('consequence') as HTMLTextAreaElement)?.value?.trim() || '';
    const chandradiptiReflection = (form.elements.namedItem('chandradiptiReflection') as HTMLTextAreaElement)?.value?.trim() || '';

    const data: any = {
      ...(editing || {}),
      title,
      duration,
      views,
      thumbnail: finalThumbnail,
      videoUrl,
      family,
      question,
      hiddenSystemSummary,
      consequence,
      chandradiptiReflection,
      isPremium,
      updatedAt: serverTimestamp()
    };

    const docId = editing?.id || `arch_${Date.now()}`;

    try {
      await setDoc(doc(db, 'archives', docId), data, { merge: true });
      setEditing(null);
      setStatus("Video Archive Saved Successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `archives/${docId}`);
      if (isOfflineError(error)) {
        setEditing(null);
        setStatus("Video Saved (Offline)");
      }
    }
  };

  const togglePremium = async (v: VideoArchive) => {
    const targetPremium = !v.isPremium;
    try {
      await setDoc(doc(db, 'archives', v.id), {
        ...v,
        isPremium: targetPremium,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus(`Video "${v.title.slice(0, 20)}..." is now ${targetPremium ? 'VIP Only' : 'Free'}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `archives/${v.id}`);
    }
  };

  const setAllVideosVip = (vipOnly: boolean) => {
    setConfirmConfig({
      isOpen: true,
      title: vipOnly ? "Lock All Videos to VIP?" : "Make All Videos Free?",
      message: vipOnly
        ? "This will set all documentaries and video archives to VIP Only (Special Strategists only)."
        : "This will make all documentaries and video archives accessible to all free users.",
      confirmLabel: vipOnly ? "Lock All Videos" : "Make All Free",
      isDanger: vipOnly,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          for (const item of items) {
            await setDoc(doc(db, 'archives', item.id), {
              ...item,
              isPremium: vipOnly,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          setStatus(`All videos updated to ${vipOnly ? 'VIP Only' : 'Free'}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'archives');
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const deleteItem = (id: string, title?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove Video Archive?",
      message: `Are you sure you want to delete "${title || 'this video'}" from the documentary library?`,
      confirmLabel: "Delete Archive",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'archives', id));
          setStatus("Video Removed");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `archives/${id}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div className="space-y-6 text-left">
      <ConfirmDialog config={confirmConfig} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white italic tracking-tight">Talk2Society Documentaries</h3>
          {status && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 bg-green-500/20 text-green-400 text-[9px] font-mono font-black uppercase tracking-widest rounded-full border border-green-500/20">
              {status}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAllVideosVip(true)}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make all documentaries VIP only"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lock All VIP</span>
          </button>
          <button
            onClick={() => setAllVideosVip(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make all documentaries free for all users"
          >
            <Unlock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Make All Free</span>
          </button>
          <button 
            onClick={() => setEditing({ 
              title: '', 
              duration: '18:00', 
              views: '150K', 
              videoUrl: '', 
              isPremium: false, 
              family: 'Why India?',
              question: '',
              hiddenSystemSummary: '',
              consequence: '',
              chandradiptiReflection: ''
            })} 
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> <span>Add Video Archive</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search archives by title or family..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-3 max-h-[550px] overflow-y-auto pr-2 scrollbar-hide">
        {filteredItems.map(m => (
          <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white/5 hover:bg-white/[0.07] rounded-2xl border border-white/5 gap-3 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <img src={m.thumbnail} className="w-16 h-11 object-cover rounded-xl border border-white/10 shrink-0" alt="" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm truncate">{m.title}</span>
                  {m.isPremium && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-amber-400" /> Premium
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {m.family || 'Documentary'} • {m.duration} • {m.views} Views
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button 
                onClick={() => togglePremium(m)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  m.isPremium 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                }`}
                title={m.isPremium ? "VIP Only (Click to make Free)" : "Free (Click to set VIP Only)"}
              >
                <Crown size={14} className={m.isPremium ? "text-amber-400 fill-amber-400" : "text-zinc-500"} />
              </button>
              <button onClick={() => setEditing(m)} className="p-2 hover:bg-white/10 rounded-xl text-blue-400 border border-transparent hover:border-white/10 cursor-pointer">
                <Edit2 size={14} />
              </button>
              <button onClick={() => deleteItem(m.id, m.title)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-400 border border-transparent hover:border-red-500/20 cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.form 
              key={editing.id || 'new'}
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={save} 
              className="bg-[#11131a] p-6 sm:p-8 rounded-3xl border border-[#1e222d] w-full max-w-xl space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <button type="button" onClick={() => setEditing(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <ArrowLeft size={16} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Close</span>
                </button>
                <h4 className="text-base font-black uppercase tracking-wider text-white">Edit Video Archive</h4>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Video Title</label>
                <input name="title" defaultValue={editing.title} placeholder="Enter title" className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Family</label>
                  <select name="family" defaultValue={editing.family || 'Why India?'} className="w-full bg-[#181a24] p-3 rounded-xl text-xs font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none">
                    <option value="Why India?">Why India?</option>
                    <option value="How India Works">How India Works</option>
                    <option value="The Hidden System">The Hidden System</option>
                    <option value="The Path">The Path</option>
                    <option value="The Uncomfortable Truth">The Uncomfortable Truth</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Duration</label>
                  <input name="duration" defaultValue={editing.duration} placeholder="18:30" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Views</label>
                  <input name="views" defaultValue={editing.views} placeholder="240K" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" required />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Central Investigative Question</label>
                <input name="question" defaultValue={editing.question || ''} placeholder="e.g. Why does India respect power over honesty?" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">YouTube URL or Video Embed ID</label>
                <input name="videoUrl" defaultValue={editing.videoUrl} placeholder="https://www.youtube.com/watch?v=... or YouTube ID" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" />
              </div>

              {/* Thumbnail selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-mono">Thumbnail Image</label>
                <div 
                  onClick={() => document.getElementById('archive-file-picker')?.click()}
                  className="border border-dashed border-white/15 rounded-2xl p-4 bg-white/5 hover:bg-white/10 transition-all text-center cursor-pointer flex flex-col items-center justify-center min-h-[100px]"
                >
                  {thumbnailBase64 ? (
                    <img src={thumbnailBase64} alt="Preview" className="h-20 aspect-video object-cover rounded-xl border border-white/10" />
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-zinc-400 mx-auto" />
                      <p className="text-xs font-bold text-zinc-300">Upload Image File (JPG, PNG)</p>
                    </div>
                  )}
                  <input 
                    id="archive-file-picker" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setThumbnailBase64(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <input name="thumbnailUrl" defaultValue={editing.thumbnail} placeholder="OR direct image URL: https://..." className="w-full bg-white/5 p-2.5 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Hidden System Breakdown (अदृश्य व्यवस्था विश्लेषण)</label>
                <textarea name="hiddenSystemSummary" defaultValue={editing.hiddenSystemSummary || ''} placeholder="Structural breakdown of the system..." rows={2} className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none leading-relaxed" />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">The Uncomfortable Consequence</label>
                <textarea name="consequence" defaultValue={editing.consequence || ''} placeholder="Real consequences for practitioners..." rows={2} className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none leading-relaxed" />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">A. K. Chandradipti Sovereign Reflection</label>
                <textarea name="chandradiptiReflection" defaultValue={editing.chandradiptiReflection || ''} placeholder="Core reflection & guidance..." rows={2} className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none leading-relaxed" />
              </div>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/5">
                <input type="checkbox" name="isPremium" defaultChecked={editing.isPremium} className="w-4 h-4 accent-amber-500" />
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-2 font-mono">
                  Strategist Tier Only <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
              </label>

              <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg">
                Save Video Archive
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 3. LIBRARY MANAGER (BOOKS & MANUALS)
// ==========================================

function LibraryManager() {
  const [items, setItems] = useState<LibraryBook[]>([]);
  const [editing, setEditing] = useState<Partial<LibraryBook> | null>(null);
  const [coverBase64, setCoverBase64] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (editing) {
      setCoverBase64(editing.coverUrl || '');
    } else {
      setCoverBase64('');
    }
  }, [editing]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    return onSnapshot(query(collection(db, 'library'), orderBy('title', 'asc')), (snap) => {
      const dbDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryBook));
      if (dbDocs.length > 0) {
        setItems(dbDocs);
      } else {
        setItems(FOUR_FOUNDATIONAL_EBOOKS);
      }
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'library');
      }
      setItems(FOUR_FOUNDATIONAL_EBOOKS);
    });
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.author.toLowerCase().includes(q) || 
      b.category.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const inputCoverUrl = (form.elements.namedItem('coverUrl') as HTMLInputElement)?.value?.trim() || '';
    const finalCover = coverBase64 || inputCoverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400';

    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
    const hindiTitle = (form.elements.namedItem('hindiTitle') as HTMLInputElement)?.value?.trim() || '';
    const author = (form.elements.namedItem('author') as HTMLInputElement).value.trim();
    const category = (form.elements.namedItem('category') as HTMLInputElement).value.trim();
    const excerpt = (form.elements.namedItem('excerpt') as HTMLTextAreaElement).value.trim();
    const fileUrl = (form.elements.namedItem('fileUrl') as HTMLInputElement).value.trim();
    const badge = (form.elements.namedItem('badge') as HTMLInputElement)?.value?.trim() || '';
    const groundRule = (form.elements.namedItem('groundRule') as HTMLTextAreaElement)?.value?.trim() || '';
    const targetAudience = (form.elements.namedItem('targetAudience') as HTMLInputElement)?.value?.trim() || '';
    const isPremium = (form.elements.namedItem('isPremium') as HTMLInputElement).checked;

    // Preserve chapters and table of contents if this book already has them
    const data: any = {
      ...(editing || {}),
      title,
      hindiTitle,
      author,
      category,
      excerpt,
      fileUrl,
      badge,
      groundRule,
      targetAudience,
      coverUrl: finalCover,
      isPremium,
      updatedAt: serverTimestamp()
    };

    const docId = editing?.id || `book_${Date.now()}`;

    try {
      await setDoc(doc(db, 'library', docId), data, { merge: true });
      setEditing(null);
      setStatus("Book Saved Successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `library/${docId}`);
      if (isOfflineError(error)) {
        setEditing(null);
        setStatus("Book Saved (Offline)");
      }
    }
  };

  const togglePremium = async (b: LibraryBook) => {
    const targetPremium = !b.isPremium;
    try {
      await setDoc(doc(db, 'library', b.id), {
        ...b,
        isPremium: targetPremium,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus(`Manuscript "${b.title.slice(0, 20)}..." is now ${targetPremium ? 'VIP Only' : 'Free'}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `library/${b.id}`);
    }
  };

  const setAllBooksVip = (vipOnly: boolean) => {
    setConfirmConfig({
      isOpen: true,
      title: vipOnly ? "Lock All Books to VIP?" : "Make All Books Free?",
      message: vipOnly
        ? "This will set all foundational manuscripts and books to VIP Only (Special Strategists only)."
        : "This will make all books accessible to standard free users without restrictions.",
      confirmLabel: vipOnly ? "Lock All Books" : "Make All Free",
      isDanger: vipOnly,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          for (const item of items) {
            await setDoc(doc(db, 'library', item.id), {
              ...item,
              isPremium: vipOnly,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          setStatus(`All manuscripts updated to ${vipOnly ? 'VIP Only' : 'Free'}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'library');
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const deleteItem = (id: string, title?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove Manuscript?",
      message: `Are you sure you want to remove "${title || 'this book'}" from the sovereign library?`,
      confirmLabel: "Delete Manuscript",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'library', id));
          setStatus("Book Removed");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `library/${id}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div className="space-y-6 text-left">
      <ConfirmDialog config={confirmConfig} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white italic tracking-tight">Library Manuscripts</h3>
          {status && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 bg-green-500/20 text-green-400 text-[9px] font-mono font-black uppercase tracking-widest rounded-full border border-green-500/20">
              {status}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAllBooksVip(true)}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make all manuscripts VIP only"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lock All VIP</span>
          </button>
          <button
            onClick={() => setAllBooksVip(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make all manuscripts free for all users"
          >
            <Unlock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Make All Free</span>
          </button>
          <button 
            onClick={() => setEditing({ 
              title: '', 
              hindiTitle: '', 
              author: 'A. K. Chandradipti', 
              category: 'Consciousness', 
              excerpt: '', 
              fileUrl: '', 
              badge: 'Crucible Foundation', 
              groundRule: '', 
              targetAudience: '', 
              isPremium: true 
            })} 
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search books by title, author, category..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Books List */}
      <div className="grid grid-cols-1 gap-3 max-h-[550px] overflow-y-auto pr-2 scrollbar-hide">
        {filteredItems.map(m => (
          <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white/5 hover:bg-white/[0.07] rounded-2xl border border-white/5 gap-3 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <img src={m.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'} className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0" alt="" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm truncate">{m.title}</span>
                  {m.badge && (
                    <span className="px-1.5 py-0.5 bg-white/10 text-zinc-300 border border-white/10 text-[9px] font-mono font-bold uppercase rounded">
                      {m.badge}
                    </span>
                  )}
                  {m.isPremium && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-amber-400" /> Premium
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {m.author} • {m.category}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono block truncate">
                  {m.fileUrl ? `PDF Linked` : `${(m.chapters || []).length > 0 ? `${m.chapters?.length} Built-in Chapters` : 'Digital Chapters Reader'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button 
                onClick={() => togglePremium(m)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  m.isPremium 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                }`}
                title={m.isPremium ? "VIP Only (Click to make Free)" : "Free (Click to set VIP Only)"}
              >
                <Crown size={14} className={m.isPremium ? "text-amber-400 fill-amber-400" : "text-zinc-500"} />
              </button>
              <button onClick={() => setEditing(m)} className="p-2 hover:bg-white/10 rounded-xl text-blue-400 border border-transparent hover:border-white/10 cursor-pointer">
                <Edit2 size={14} />
              </button>
              <button onClick={() => deleteItem(m.id, m.title)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-400 border border-transparent hover:border-red-500/20 cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Book Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.form 
              key={editing.id || 'new'}
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={save} 
              className="bg-[#11131a] p-6 sm:p-8 rounded-3xl border border-[#1e222d] w-full max-w-xl space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <button type="button" onClick={() => setEditing(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <ArrowLeft size={16} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Close</span>
                </button>
                <h4 className="text-base font-black uppercase tracking-wider text-white">Edit Manuscript</h4>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Book Title</label>
                <input name="title" defaultValue={editing.title} placeholder="Book title" className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Hindi Title (हिंदी नाम)</label>
                <input name="hindiTitle" defaultValue={editing.hindiTitle || ''} placeholder="हिंदी शीर्षक" className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Author</label>
                  <input name="author" defaultValue={editing.author} placeholder="Author name" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Category</label>
                  <input name="category" defaultValue={editing.category} placeholder="e.g. Mastery, Power" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Badge Label</label>
                  <input name="badge" defaultValue={editing.badge || ''} placeholder="e.g. Crucible Foundation 1" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Target Audience</label>
                  <input name="targetAudience" defaultValue={editing.targetAudience || ''} placeholder="e.g. 18-26 वर्ष के युवा..." className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Google Drive Sharing URL (PDF / External Reader)</label>
                <input name="fileUrl" defaultValue={editing.fileUrl} placeholder="https://drive.google.com/file/d/..." className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" />
                <span className="text-[9px] text-zinc-500 font-mono block mt-1">Leave empty to use built-in digital chapters reader.</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Ground Rule / Core Principle</label>
                <input name="groundRule" defaultValue={editing.groundRule || ''} placeholder="e.g. 30-दिवसीय प्रोटोकॉल..." className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Excerpt / Synopsis</label>
                <textarea name="excerpt" defaultValue={editing.excerpt} placeholder="Brief synopsis or core lesson..." rows={3} className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
              </div>

              {/* Cover selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-mono">Book Cover Image</label>
                <div 
                  onClick={() => document.getElementById('book-cover-picker')?.click()}
                  className="border border-dashed border-white/15 rounded-2xl p-4 bg-white/5 hover:bg-white/10 transition-all text-center cursor-pointer flex flex-col items-center justify-center min-h-[90px]"
                >
                  {coverBase64 ? (
                    <img src={coverBase64} alt="Preview" className="h-16 aspect-[3/4] object-cover rounded-lg border border-white/10" />
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-zinc-400 mx-auto" />
                      <p className="text-xs font-bold text-zinc-300">Upload Cover Image</p>
                    </div>
                  )}
                  <input 
                    id="book-cover-picker" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setCoverBase64(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <input name="coverUrl" defaultValue={editing.coverUrl} placeholder="OR direct image URL: https://..." className="w-full bg-white/5 p-2.5 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" />
              </div>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/5">
                <input type="checkbox" name="isPremium" defaultChecked={editing.isPremium} className="w-4 h-4 accent-amber-500" />
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-2 font-mono">
                  Strategist Tier Only <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
              </label>

              <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg">
                Save Book
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 4. SHOP MANAGER
// ==========================================

function ShopManager() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [editing, setEditing] = useState<Partial<ShopProduct> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (editing) {
      setImageBase64(editing.imageUrl || '');
    } else {
      setImageBase64('');
    }
  }, [editing]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const q = query(collection(db, 'shop'), orderBy('category', 'asc'));
    return onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopProduct)));
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'shop');
      }
    });
  }, []);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const inputUrl = (form.elements.namedItem('imageUrl') as HTMLInputElement)?.value?.trim() || '';
    const finalImage = imageBase64 || inputUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';

    const isPremium = (form.elements.namedItem('isPremium') as HTMLInputElement)?.checked || false;

    const data: any = {
      ...(editing || {}),
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim(),
      price: (form.elements.namedItem('price') as HTMLInputElement).value.trim(),
      imageUrl: finalImage,
      affiliateUrl: (form.elements.namedItem('affiliateUrl') as HTMLInputElement).value.trim(),
      category: (form.elements.namedItem('category') as HTMLInputElement).value.trim(),
      platform: (form.elements.namedItem('platform') as HTMLSelectElement)?.value || 'Direct Store',
      isPremium,
      updatedAt: serverTimestamp()
    };

    try {
      if (editing?.id) {
        await setDoc(doc(db, 'shop', editing.id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'shop'), data);
      }
      setEditing(null);
      setStatus("Product Saved Successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'shop');
      if (isOfflineError(error)) {
        setEditing(null);
        setStatus("Product Saved (Offline)");
      }
    }
  };

  const togglePremium = async (p: ShopProduct) => {
    const targetPremium = !p.isPremium;
    try {
      await setDoc(doc(db, 'shop', p.id), {
        ...p,
        isPremium: targetPremium,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus(`Product "${p.name.slice(0, 20)}..." is now ${targetPremium ? 'VIP Only' : 'Free'}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shop/${p.id}`);
    }
  };

  const setAllProductsVip = (vipOnly: boolean) => {
    setConfirmConfig({
      isOpen: true,
      title: vipOnly ? "Lock All Products to VIP?" : "Make All Products Free?",
      message: vipOnly
        ? "This will set all products in the shop catalog to VIP Only (Special Strategists only)."
        : "This will make all shop products accessible to standard free users.",
      confirmLabel: vipOnly ? "Lock All Products" : "Make All Free",
      isDanger: vipOnly,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          for (const item of products) {
            await setDoc(doc(db, 'shop', item.id), {
              ...item,
              isPremium: vipOnly,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          setStatus(`All products updated to ${vipOnly ? 'VIP Only' : 'Free'}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'shop');
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const deleteProduct = (id: string, name?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove Shop Item?",
      message: `Are you sure you want to remove "${name || 'this item'}" from the shop inventory?`,
      confirmLabel: "Delete Product",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'shop', id));
          setStatus("Product Removed");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `shop/${id}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const seedDefaultProducts = async () => {
    try {
      for (const prod of DEFAULT_SHOP_PRODUCTS) {
        await setDoc(doc(db, 'shop', prod.id), {
          ...prod,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      setStatus("Initialized Recommended Shop Products");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'shop');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <ConfirmDialog config={confirmConfig} />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white italic tracking-tight">Shop Inventory Manager</h3>
          {status && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 bg-green-500/20 text-green-400 text-[9px] font-mono font-black uppercase tracking-widest rounded-full border border-green-500/20">
              {status}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAllProductsVip(true)}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make all shop items VIP exclusive"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lock All VIP</span>
          </button>
          <button
            onClick={() => setAllProductsVip(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Make all shop items free / accessible to all users"
          >
            <Unlock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Make All Free</span>
          </button>
          {products.length === 0 && (
            <button
              onClick={seedDefaultProducts}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Seed Recommended
            </button>
          )}
          <button 
            onClick={() => setEditing({ name: '', description: '', price: '₹499', category: 'Manual', affiliateUrl: '', imageUrl: '', platform: 'Direct Store', isPremium: false })} 
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full p-8 text-center text-zinc-500 font-mono text-xs bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
            <p>No products in custom shop inventory yet.</p>
            <button
              onClick={seedDefaultProducts}
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer inline-block"
            >
              Initialize Recommended Catalog / अनुशंसित उत्पाद लोड करें
            </button>
          </div>
        ) : (
          products.map(p => (
            <div key={p.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <img src={p.imageUrl} className="w-full aspect-video object-cover rounded-xl border border-white/10" alt="" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">{p.category} • {p.price}</span>
                    <div className="flex items-center gap-1.5">
                      {p.isPremium && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-amber-400" /> VIP
                        </span>
                      )}
                      {p.platform && (
                        <span className="text-[9px] font-mono uppercase text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">{p.platform}</span>
                      )}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-tight mt-0.5">{p.name}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{p.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-zinc-500">{p.clicks || 0} clicks</span>
                <div className="flex gap-1.5 items-center">
                  <button 
                    onClick={() => togglePremium(p)} 
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      p.isPremium 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                        : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                    }`}
                    title={p.isPremium ? "VIP Exclusive (Click to make Free)" : "Free (Click to set VIP Exclusive)"}
                  >
                    <Crown size={14} className={p.isPremium ? "text-amber-400 fill-amber-400" : "text-zinc-500"} />
                  </button>
                  <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400 cursor-pointer">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteProduct(p.id, p.name)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.form 
              key={editing.id || 'new'}
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={save} 
              className="bg-[#11131a] p-6 sm:p-8 rounded-3xl border border-[#1e222d] w-full max-w-lg space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <button type="button" onClick={() => setEditing(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <ArrowLeft size={16} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Close</span>
                </button>
                <h4 className="text-base font-black uppercase tracking-wider text-white">Edit Product</h4>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Product Name</label>
                <input name="name" defaultValue={editing.name} placeholder="Product Name" className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Category</label>
                  <input name="category" defaultValue={editing.category} placeholder="e.g. Books, Tools" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Price</label>
                  <input name="price" defaultValue={editing.price} placeholder="₹499" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Platform</label>
                  <select name="platform" defaultValue={editing.platform || 'Direct Store'} className="w-full bg-[#181a24] p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono">
                    <option value="Direct Store">Direct Store</option>
                    <option value="Amazon India">Amazon India</option>
                    <option value="Gumroad">Gumroad</option>
                    <option value="Notion">Notion</option>
                    <option value="Razorpay">Razorpay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Affiliate / Purchase Link URL</label>
                <input name="affiliateUrl" defaultValue={editing.affiliateUrl} placeholder="https://..." className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" required />
              </div>

              {/* Image selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-mono">Product Image</label>
                <div 
                  onClick={() => document.getElementById('product-image-picker')?.click()}
                  className="border border-dashed border-white/15 rounded-2xl p-4 bg-white/5 hover:bg-white/10 transition-all text-center cursor-pointer flex flex-col items-center justify-center min-h-[90px]"
                >
                  {imageBase64 ? (
                    <img src={imageBase64} alt="Preview" className="h-16 aspect-video object-cover rounded-lg border border-white/10" />
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-zinc-400 mx-auto" />
                      <p className="text-xs font-bold text-zinc-300">Upload Product Image</p>
                    </div>
                  )}
                  <input 
                    id="product-image-picker" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setImageBase64(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <input name="imageUrl" defaultValue={editing.imageUrl} placeholder="OR direct image URL: https://..." className="w-full bg-white/5 p-2.5 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Description</label>
                <textarea name="description" defaultValue={editing.description} placeholder="Product description..." rows={3} className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
              </div>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/5">
                <input type="checkbox" name="isPremium" defaultChecked={editing.isPremium} className="w-4 h-4 accent-amber-500" />
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-2 font-mono">
                  VIP / Strategist Exclusive Product <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </span>
              </label>

              <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg">
                Save Product
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 5. USER MANAGER (USERS & LEDGER)
// ==========================================

function UserManager({ currentAdmin }: { currentAdmin?: UserProfile | null }) {
  const [items, setItems] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'premium' | 'standard' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'xp' | 'level' | 'name'>('recent');
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  
  // Modals
  const [inspectUser, setInspectUser] = useState<UserProfile | null>(null);
  const [adjustingUser, setAdjustingUser] = useState<UserProfile | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (actionStatus) {
      const timer = setTimeout(() => setActionStatus(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionStatus]);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setItems(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    });
  }, []);

  const handleApprove = (u: UserProfile) => {
    setConfirmConfig({
      isOpen: true,
      title: "Approve Sovereign Payment?",
      message: `Grant Sovereign Strategist access to ${u.displayName || u.email}? Verified TXN ID / UTR: ${u.premiumRequestTransactionId || 'Manual confirmation'}.`,
      confirmLabel: "Approve & Grant Strategist Tier",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await updateDoc(doc(db, 'users', u.uid), {
            isStrategist: true,
            premiumRequestStatus: 'approved',
            updatedAt: serverTimestamp()
          });
          setActionStatus(`Granted Premium Access to ${u.displayName || u.email || 'User'}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${u.uid}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleDecline = (u: UserProfile) => {
    setConfirmConfig({
      isOpen: true,
      title: "Decline Verification Request?",
      message: `Decline payment verification for ${u.displayName || u.email}? This will mark their request as denied.`,
      confirmLabel: "Decline Request",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await updateDoc(doc(db, 'users', u.uid), {
            isStrategist: false,
            premiumRequestStatus: 'denied',
            updatedAt: serverTimestamp()
          });
          setActionStatus(`Denied request for ${u.displayName || u.email || 'User'}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${u.uid}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const setPremiumAccess = async (user: UserProfile, targetState: boolean) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isStrategist: targetState,
        premiumRequestStatus: targetState ? 'approved' : 'revoked',
        updatedAt: serverTimestamp()
      });
      setActionStatus(`${targetState ? 'Activated' : 'Revoked'} Premium Access for ${user.displayName || user.email || 'User'}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const toggleAdminRole = (user: UserProfile) => {
    // Prevent self-lockout
    if (currentAdmin && (user.uid === currentAdmin.uid || user.email === currentAdmin.email)) {
      setActionStatus("Security Safeguard: You cannot modify your own administrator clearance.");
      return;
    }

    const targetAdmin = !user.isAdmin;
    setConfirmConfig({
      isOpen: true,
      title: `${targetAdmin ? 'Grant' : 'Revoke'} Administrator Rights?`,
      message: `Are you sure you want to ${targetAdmin ? 'grant Master Administrator access to' : 'revoke Master Administrator clearance from'} ${user.displayName || user.email}?`,
      confirmLabel: targetAdmin ? "Make Administrator" : "Revoke Admin",
      isDanger: !targetAdmin,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            isAdmin: targetAdmin,
            updatedAt: serverTimestamp()
          });
          setActionStatus(`${targetAdmin ? 'Promoted to Admin' : 'Revoked Admin role'}: ${user.displayName || user.email}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const resetUserProgress = (user: UserProfile) => {
    setConfirmConfig({
      isOpen: true,
      title: `Reset Course Progress for ${user.displayName || user.email}?`,
      message: "This will clear all 100-Day Course completions, reset streak to 0, and clear daily reflection submissions. This action cannot be undone.",
      confirmLabel: "Reset Progress & Streak",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            completedDays: [],
            streak: 0,
            xp: 0,
            level: 1,
            lastCompletedAt: null,
            dailyReflections: {},
            updatedAt: serverTimestamp()
          });
          setActionStatus(`Reset progress for ${user.displayName || user.email}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const deleteUserRecord = (user: UserProfile) => {
    // Prevent self-deletion
    if (currentAdmin && (user.uid === currentAdmin.uid || user.email === currentAdmin.email)) {
      setActionStatus("Security Safeguard: You cannot delete your own account record.");
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: "Permanently Delete Practitioner Document?",
      message: `CRITICAL: Permanently erase database document for ${user.displayName || user.email} (${user.uid})? All user progress and reflections will be deleted.`,
      confirmLabel: "Permanently Delete",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'users', user.uid));
          setActionStatus(`Deleted user ${user.displayName || user.email}`);
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const saveAdjustedUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const form = e.currentTarget;
    const xp = parseInt((form.elements.namedItem('xp') as HTMLInputElement).value) || 0;
    const level = parseInt((form.elements.namedItem('level') as HTMLInputElement).value) || 1;
    const streak = parseInt((form.elements.namedItem('streak') as HTMLInputElement).value) || 0;

    try {
      await updateDoc(doc(db, 'users', adjustingUser.uid), {
        xp,
        level,
        streak,
        updatedAt: serverTimestamp()
      });
      setAdjustingUser(null);
      setActionStatus(`Updated parameters for ${adjustingUser.displayName || adjustingUser.email}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${adjustingUser.uid}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setActionStatus(`Copied to clipboard: ${text}`);
  };

  const pendingUsers = items.filter(u => u.premiumRequestStatus === 'pending');
  const premiumCount = items.filter(u => u.isStrategist).length;
  const standardCount = items.filter(u => !u.isStrategist).length;
  const adminCount = items.filter(u => u.isAdmin).length;

  const filteredUsers = useMemo(() => {
    return items.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.uid && u.uid.toLowerCase().includes(q)) ||
        (u.premiumRequestTransactionId && u.premiumRequestTransactionId.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filter === 'pending') return u.premiumRequestStatus === 'pending';
      if (filter === 'premium') return u.isStrategist;
      if (filter === 'standard') return !u.isStrategist;
      if (filter === 'admin') return u.isAdmin;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'xp') return (b.xp || 0) - (a.xp || 0);
      if (sortBy === 'level') return (b.level || 1) - (a.level || 1);
      if (sortBy === 'name') return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
      return 0; // default recent
    });
  }, [items, searchTerm, filter, sortBy]);

  return (
    <div className="space-y-8 text-left">
      <ConfirmDialog config={confirmConfig} />

      {/* Toast notification */}
      {actionStatus && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-xl flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{actionStatus}</span>
        </motion.div>
      )}

      {/* Pending Approvals Queue */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <span>👑 PENDING PAYMENT CONFIRMATIONS // भुगतान सत्यापन सूची</span>
          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-sans font-bold text-xs rounded-full">
            {pendingUsers.length} Pending
          </span>
        </h3>
        
        {pendingUsers.length === 0 ? (
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center text-xs text-zinc-500 font-mono italic">
            There are no pending payment confirmation requests in the ledger.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingUsers.map(u => (
              <div key={u.uid} className="p-5 bg-gradient-to-r from-amber-500/[0.04] via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0 overflow-hidden">
                    {u.photoURL ? (
                      <img src={u.photoURL} className="w-full h-full object-cover" alt="" />
                    ) : (
                      u.displayName?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="font-bold text-white text-sm">{u.displayName || 'Practitioner'}</div>
                    <div className="text-[10px] text-zinc-400 font-mono tracking-wide">{u.email}</div>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px] font-black uppercase tracking-wider">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                        Plan: {u.premiumRequestPlan === 'elite' ? 'Elite Consult 1-on-1' : 'Sovereign Pass'}
                      </span>
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md border border-white/5">
                        Details: {u.premiumRequestDetails || 'Standard UPI/Card'}
                      </span>
                      {u.premiumRequestTransactionId && (
                        <span 
                          onClick={() => copyToClipboard(u.premiumRequestTransactionId || '')}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-yellow-400 rounded-md border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Click to copy Transaction ID"
                        >
                          <span>TXN / UTR: <strong className="select-all font-bold text-white tracking-widest">{u.premiumRequestTransactionId}</strong></span>
                          <Copy className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2.5 w-full md:w-auto pt-2 md:pt-0 self-end md:self-center">
                  <button 
                    onClick={() => handleApprove(u)}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Payment / स्वीकृत करें
                  </button>
                  <button 
                    onClick={() => handleDecline(u)}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl border border-red-500/25 hover:border-red-500/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Decline / खारिज करें
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General User Registry */}
      <div className="space-y-4 pt-6 border-t border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-sm font-mono font-black text-white/70 uppercase tracking-widest">
            REGISTERED PRACTITIONERS DIRECTORY ({items.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Sort by dropdown */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-zinc-300">
              <span className="text-[10px] text-zinc-500 uppercase">Sort:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="recent" className="bg-[#12141d]">Recent</option>
                <option value="xp" className="bg-[#12141d]">Highest XP</option>
                <option value="level" className="bg-[#12141d]">Highest Level</option>
                <option value="name" className="bg-[#12141d]">Alphabetical</option>
              </select>
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, UTR..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-mono font-bold">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filter === 'all' ? 'bg-white text-black font-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
          >
            All Users ({items.length})
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${filter === 'pending' ? 'bg-amber-500 text-black font-black' : 'bg-white/5 text-amber-400 hover:bg-amber-500/10'}`}
          >
            Pending ({pendingUsers.length})
          </button>
          <button 
            onClick={() => setFilter('premium')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${filter === 'premium' ? 'bg-green-500 text-black font-black' : 'bg-white/5 text-green-400 hover:bg-green-500/10'}`}
          >
            Premium ({premiumCount})
          </button>
          <button 
            onClick={() => setFilter('standard')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filter === 'standard' ? 'bg-zinc-700 text-white font-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
          >
            Standard ({standardCount})
          </button>
          <button 
            onClick={() => setFilter('admin')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${filter === 'admin' ? 'bg-red-500 text-white font-black' : 'bg-white/5 text-red-400 hover:bg-red-500/10'}`}
          >
            Admins ({adminCount})
          </button>
        </div>

        {/* User cards list */}
        <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 font-mono text-xs bg-white/[0.01] border border-white/5 rounded-2xl italic">
              No matching practitioners found.
            </div>
          ) : (
            filteredUsers.map(u => (
              <div 
                key={u.uid} 
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left ${
                  u.isStrategist 
                    ? 'bg-gradient-to-r from-amber-500/[0.03] via-zinc-900/80 to-zinc-900 border-amber-500/30' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-zinc-400">
                      {u.photoURL ? (
                        <img src={u.photoURL} className="w-full h-full object-cover" alt="" />
                      ) : (
                        u.displayName?.[0]?.toUpperCase() || 'P'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white leading-tight text-sm flex items-center gap-2 flex-wrap">
                        <span className="truncate">{u.displayName || 'Practitioner'}</span>
                        {u.isAdmin && (
                          <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono uppercase font-black tracking-widest">
                            Admin
                          </span>
                        )}
                        {u.isStrategist ? (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono uppercase font-black tracking-wider flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> Premium
                          </span>
                        ) : (
                          <span className="text-[8px] bg-zinc-800 text-zinc-400 border border-white/5 px-1.5 py-0.5 rounded font-mono uppercase font-black tracking-widest">
                            Free
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono pt-0.5 truncate">{u.email}</div>
                      <div className="text-[9px] text-zinc-500 font-mono pt-0.5">
                        XP: <strong className="text-amber-400">{(u.xp || 0).toLocaleString()}</strong> • Level: {u.level || 1} • Completed: {(u.completedDays || []).length}/100 • Streak: {u.streak || 0}d
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administrative Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                  {/* Inspect Details */}
                  <button
                    onClick={() => setInspectUser(u)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Inspect Practitioner Details & Daily Reflections"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Adjust XP & Level */}
                  <button
                    onClick={() => setAdjustingUser(u)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-400 border border-white/10 transition-all cursor-pointer"
                    title="Adjust User XP, Level, & Streak Parameters"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {/* Premium Access Toggle */}
                  <div className="flex items-center bg-zinc-950/80 border border-white/10 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPremiumAccess(u, true)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                        u.isStrategist
                          ? 'bg-amber-500 text-black font-extrabold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Grant Premium Access"
                    >
                      <Zap className="w-2.5 h-2.5" />
                      <span>Prem ON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumAccess(u, false)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                        !u.isStrategist
                          ? 'bg-zinc-800 text-zinc-300'
                          : 'text-zinc-500 hover:text-red-400'
                      }`}
                      title="Revoke Premium Access"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>Prem OFF</span>
                    </button>
                  </div>

                  {/* Toggle Admin */}
                  <button
                    onClick={() => toggleAdminRole(u)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                      u.isAdmin 
                        ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30' 
                        : 'bg-white/5 text-zinc-400 hover:text-white border-white/10'
                    }`}
                    title="Toggle Administrator Privileges"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>{u.isAdmin ? 'Admin' : 'Make Admin'}</span>
                  </button>

                  {/* Reset Progress */}
                  <button
                    onClick={() => resetUserProgress(u)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-amber-500/10 text-zinc-500 hover:text-amber-400 border border-white/5 transition-all cursor-pointer"
                    title="Reset Course Progress"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete User */}
                  <button
                    onClick={() => deleteUserRecord(u)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-white/5 transition-all cursor-pointer"
                    title="Delete User Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inspect Practitioner Modal */}
      <AnimatePresence>
        {inspectUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#11131a] p-6 sm:p-8 rounded-3xl border border-[#232938] w-full max-w-2xl space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex justify-between items-start pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 overflow-hidden flex items-center justify-center font-bold text-amber-400">
                    {inspectUser.photoURL ? (
                      <img src={inspectUser.photoURL} className="w-full h-full object-cover" alt="" />
                    ) : (
                      inspectUser.displayName?.[0]?.toUpperCase() || 'P'
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{inspectUser.displayName || 'Practitioner'}</h3>
                    <p className="text-xs text-zinc-400 font-mono">{inspectUser.email}</p>
                    <p className="text-[10px] text-zinc-500 font-mono select-all">UID: {inspectUser.uid}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInspectUser(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] font-mono uppercase text-zinc-400 block">Course Progress</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{(inspectUser.completedDays || []).length} / 100</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] font-mono uppercase text-zinc-400 block">Level</span>
                  <span className="text-lg font-black text-white font-mono">{inspectUser.level || 1}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] font-mono uppercase text-zinc-400 block">Experience XP</span>
                  <span className="text-lg font-black text-purple-400 font-mono">{(inspectUser.xp || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] font-mono uppercase text-zinc-400 block">Active Streak</span>
                  <span className="text-lg font-black text-white font-mono">{inspectUser.streak || 0}d</span>
                </div>
              </div>

              {/* Completed Days Matrix */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                  Completed Days Grid (1 to 100)
                </h4>
                <div className="grid grid-cols-10 gap-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                  {Array.from({ length: 100 }, (_, i) => i + 1).map(dayNum => {
                    const isDone = (inspectUser.completedDays || []).includes(dayNum);
                    return (
                      <div
                        key={`day-cell-${dayNum}`}
                        className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                          isDone 
                            ? 'bg-amber-500 text-black shadow-sm font-black' 
                            : 'bg-white/5 text-zinc-600'
                        }`}
                        title={`Day ${dayNum}: ${isDone ? 'Completed' : 'Not completed'}`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Reflections Submissions */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                  Submitted Daily Reflections & Epiphanies
                </h4>
                {inspectUser.dailyReflections && Object.keys(inspectUser.dailyReflections).length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {Object.entries(inspectUser.dailyReflections).map(([key, reflection]) => (
                      <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">{key}</span>
                        <p className="text-xs text-zinc-300 font-sans italic leading-relaxed">{reflection}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 font-mono italic">No written daily reflections logged yet.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Parameters Modal */}
      <AnimatePresence>
        {adjustingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={saveAdjustedUser}
              className="bg-[#11131a] p-6 sm:p-7 rounded-3xl border border-[#232938] w-full max-w-md space-y-4 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Adjust Parameters: {adjustingUser.displayName || adjustingUser.email}
                </h4>
                <button type="button" onClick={() => setAdjustingUser(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Total XP</label>
                <input name="xp" defaultValue={adjustingUser.xp || 0} type="number" min={0} className="w-full bg-white/5 p-3 rounded-xl text-sm font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Level</label>
                  <input name="level" defaultValue={adjustingUser.level || 1} type="number" min={1} className="w-full bg-white/5 p-3 rounded-xl text-sm font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Streak (Days)</label>
                  <input name="streak" defaultValue={adjustingUser.streak || 0} type="number" min={0} className="w-full bg-white/5 p-3 rounded-xl text-sm font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg">
                Update Parameters
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 6. FORUM MODERATION MANAGER
// ==========================================

function ForumModeratorManager({ currentAdmin }: { currentAdmin?: UserProfile | null }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost)));
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      }
    });
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase().trim();
    return posts.filter(p => 
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      (p.topic && p.topic.toLowerCase().includes(q))
    );
  }, [posts, searchQuery]);

  const deletePost = (post: CommunityPost) => {
    setConfirmConfig({
      isOpen: true,
      title: "Moderate / Delete Community Post?",
      message: `Permanently remove post by ${post.authorName}: "${post.content.slice(0, 60)}..."?`,
      confirmLabel: "Delete Post",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'posts', post.id));
          setStatus("Post Deleted");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `posts/${post.id}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div className="space-y-6 text-left">
      <ConfirmDialog config={confirmConfig} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white italic tracking-tight">Community Forum Moderation</h3>
          {status && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 bg-green-500/20 text-green-400 text-[9px] font-mono font-black uppercase tracking-widest rounded-full border border-green-500/20">
              {status}
            </motion.span>
          )}
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Showing {filteredPosts.length} of {posts.length} discussions
        </span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by author or keywords..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs bg-white/[0.01] border border-white/5 rounded-2xl italic">
            No community posts match search criteria.
          </div>
        ) : (
          filteredPosts.map(p => (
            <div key={p.id} className="p-4 bg-white/5 hover:bg-white/[0.07] rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-bold text-white">{p.authorName}</span>
                  {p.topic && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-mono">
                      {p.topic}
                    </span>
                  )}
                  {p.dayNumber && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 text-[9px] font-mono">
                      Day {p.dayNumber}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ❤️ {p.likes || 0} Likes
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{p.content}</p>
              </div>

              <button
                onClick={() => deletePost(p)}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
                title="Moderate & Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// 7. SYSTEM BROADCASTS & ANNOUNCEMENTS
// ==========================================

function BroadcastManager() {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [editing, setEditing] = useState<Partial<SystemAnnouncement> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemAnnouncement)));
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'announcements');
      }
    });
  }, []);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
    const hindiTitle = (form.elements.namedItem('hindiTitle') as HTMLInputElement)?.value?.trim() || '';
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim();
    const type = (form.elements.namedItem('type') as HTMLSelectElement).value as any;
    const active = (form.elements.namedItem('active') as HTMLInputElement).checked;
    const actionUrl = (form.elements.namedItem('actionUrl') as HTMLInputElement)?.value?.trim() || '';
    const actionLabel = (form.elements.namedItem('actionLabel') as HTMLInputElement)?.value?.trim() || '';

    const payload = {
      title,
      hindiTitle,
      message,
      type,
      active,
      actionUrl,
      actionLabel,
      updatedAt: serverTimestamp(),
      createdAt: editing?.createdAt || serverTimestamp()
    };

    const docId = editing?.id || `broadcast_${Date.now()}`;

    try {
      await setDoc(doc(db, 'announcements', docId), payload, { merge: true });
      setEditing(null);
      setStatus("Broadcast Notice Published");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `announcements/${docId}`);
      if (isOfflineError(error)) {
        setEditing(null);
        setStatus("Notice Saved (Offline)");
      }
    }
  };

  const deleteNotice = (id: string, title?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Broadcast Notice?",
      message: `Permanently delete broadcast "${title || 'Notice'}"?`,
      confirmLabel: "Delete Notice",
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'announcements', id));
          setStatus("Notice Deleted");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const toggleActive = async (item: SystemAnnouncement) => {
    try {
      await updateDoc(doc(db, 'announcements', item.id), {
        active: !item.active,
        updatedAt: serverTimestamp()
      });
      setStatus(`Notice is now ${!item.active ? 'Active' : 'Inactive'}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `announcements/${item.id}`);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <ConfirmDialog config={confirmConfig} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white italic tracking-tight">Nexus System Broadcasts</h3>
          {status && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 bg-green-500/20 text-green-400 text-[9px] font-mono font-black uppercase tracking-widest rounded-full border border-green-500/20">
              {status}
            </motion.span>
          )}
        </div>
        <button 
          onClick={() => setEditing({ 
            title: '', 
            hindiTitle: '', 
            message: '', 
            type: 'info', 
            active: true, 
            actionUrl: '', 
            actionLabel: '' 
          })} 
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> <span>Create Broadcast</span>
        </button>
      </div>

      <p className="text-xs text-zinc-400 font-mono">
        Active broadcasts appear as platform-wide sovereign notices for all practitioners upon login.
      </p>

      {/* List */}
      <div className="grid grid-cols-1 gap-3 max-h-[550px] overflow-y-auto pr-2 scrollbar-hide">
        {announcements.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs bg-white/[0.01] border border-white/5 rounded-2xl italic">
            No system broadcasts currently registered.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="p-4 bg-white/5 hover:bg-white/[0.07] rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{a.title}</span>
                  {a.hindiTitle && <span className="text-xs text-zinc-400">({a.hindiTitle})</span>}
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    a.type === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    a.type === 'live' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    a.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {a.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    a.active ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{a.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => toggleActive(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    a.active ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {a.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => setEditing(a)} className="p-2 hover:bg-white/10 rounded-xl text-blue-400 border border-transparent hover:border-white/10 cursor-pointer">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteNotice(a.id, a.title)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-400 border border-transparent hover:border-red-500/20 cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Broadcast Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.form 
              key={editing.id || 'new'}
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={save} 
              className="bg-[#11131a] p-6 sm:p-8 rounded-3xl border border-[#1e222d] w-full max-w-lg space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <button type="button" onClick={() => setEditing(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <ArrowLeft size={16} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Close</span>
                </button>
                <h4 className="text-base font-black uppercase tracking-wider text-white">Create Broadcast</h4>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Title</label>
                <input name="title" defaultValue={editing.title} placeholder="e.g. Sunday Live War Room Kickoff" className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" required />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Hindi Title</label>
                <input name="hindiTitle" defaultValue={editing.hindiTitle || ''} placeholder="हिंदी शीर्षक" className="w-full bg-white/5 p-3 rounded-xl text-sm text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Notice Type</label>
                  <select name="type" defaultValue={editing.type || 'info'} className="w-full bg-[#181a24] p-3 rounded-xl text-xs font-mono text-white border border-white/10 focus:border-amber-500/50 focus:outline-none">
                    <option value="info">Information (सामान्य सूचना)</option>
                    <option value="live">Live War Room (लाइव सभा)</option>
                    <option value="warning">Warning / Protocol (नियम अलर्ट)</option>
                    <option value="urgent">Urgent Announcement (अत्यावश्यक)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Action Button Label</label>
                  <input name="actionLabel" defaultValue={editing.actionLabel || ''} placeholder="e.g. Join Session" className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Action Target URL</label>
                <input name="actionUrl" defaultValue={editing.actionUrl || ''} placeholder="https://..." className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono" />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Broadcast Message Content</label>
                <textarea name="message" defaultValue={editing.message} placeholder="Enter message to all practitioners..." rows={4} className="w-full bg-white/5 p-3 rounded-xl text-xs text-white border border-white/10 focus:border-amber-500/50 focus:outline-none leading-relaxed" required />
              </div>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/5">
                <input type="checkbox" name="active" defaultChecked={editing.active !== false} className="w-4 h-4 accent-amber-500" />
                <span className="text-xs font-bold text-zinc-300 font-mono">Active Broadcast (Visible on Platform)</span>
              </label>

              <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg">
                Publish Broadcast Notice
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
