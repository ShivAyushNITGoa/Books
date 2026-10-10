import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Shield, Flame, PlayCircle, BookOpen, Users, 
  Trophy, Lock, CheckCircle2, ChevronRight, ChevronDown, ChevronUp,
  LogOut, Send, Heart, Menu, X, User,
  TrendingUp, Zap, Target, Settings, Edit2, Save,
  ShoppingCart, ArrowLeft, BarChart3, ExternalLink,
  DollarSign, Share2, Copy, Upload, Image as ImageIcon,
  CreditCard, Check, Smartphone, Download, Youtube, Volume2, Search,
  Layers, Compass, MessageSquare, Award, FileText, RefreshCw, AlertTriangle, Info,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './components/Logo';
import GatewayView from './components/GatewayView';
import { LanguageSwitcher, useLanguage } from './context/LanguageContext';
import { DEFAULT_T2S_ARCHIVES, T2S_VIDEO_FAMILIES, DEFAULT_SHOP_PRODUCTS } from './t2sData';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  limit,
  getCountFromServer,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, isOfflineError } from './firebase';
import { UserProfile, TabType, JourneyModule, VideoArchive, LibraryBook, ShopProduct, VipSectionGates } from './types';
import { RAW_JOURNEY_MODULES, getCategoryForDay } from './journeyData';
import { RANKS, getRankFromXP, getNextRank } from './constants';
import JourneyView from './components/JourneyView';
import DayCountdownTimer from './components/DayCountdownTimer';
import { navHistory } from './utils/navigationHistory';
import { FOUR_FOUNDATIONAL_EBOOKS } from './blueprintData';

// Lazy-loaded components for optimal initial bundle size and rapid initial page load
const ChannelFrameworkView = lazy(() => import('./components/ChannelFrameworkView'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const LeaderboardTab = lazy(() => import('./components/LeaderboardTab'));
const BuiltInBookReader = lazy(() => import('./components/BuiltInBookReader'));
const CommunityForumView = lazy(() => 
  import('./components/CommunityForumView').then(m => ({ default: m.CommunityForumView }))
);
const ReflectionsJournalModal = lazy(() => 
  import('./components/ReflectionsJournalModal').then(m => ({ default: m.ReflectionsJournalModal }))
);
const SovereignCertificateModal = lazy(() => 
  import('./components/SovereignCertificateModal').then(m => ({ default: m.SovereignCertificateModal }))
);

const ViewLoader = ({ label = 'लोड हो रहा है (Loading)...' }: { label?: string }) => (
  <div className="w-full min-h-[35vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
    <div className="w-10 h-10 rounded-2xl border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
    <div className="space-y-1">
      <p className="text-white text-xs font-mono font-bold uppercase tracking-widest">{label}</p>
      <p className="text-zinc-500 text-[10px] font-mono">Talk2Society Sovereign Platform</p>
    </div>
  </div>
);
import { 
  getLocalDateString, 
  getIstHourAndDateStr, 
  getIstDateStrOfDate, 
  isCompletedOnDate,
  parseDateTime
} from './utils/dateUtils';

interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

// --- Components ---

const ProgressBar = ({ progress, label }: { progress: number, label?: string }) => (
  <div className="w-full">
    {label && <div className="flex justify-between text-xs font-medium text-gray-400 mb-2">
      <span>{label}</span>
      <span>{Math.round(progress)}%</span>
    </div>}
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.2)]"
      />
    </div>
  </div>
);

const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={`bg-[#0c0e14] border border-[#1d222e] rounded-[20px] sm:rounded-[24px] md:rounded-[32px] p-4 sm:p-6 md:p-10 hover:border-amber-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-500 group ${className}`}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const { language, t } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const activeCached = localStorage.getItem('t2s_active_profile');
      if (activeCached) return JSON.parse(activeCached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('t2s_active_profile');
    } catch {
      return false;
    }
  });
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const showToast = (t: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, ...t });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const [showGateway, setShowGateway] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPWAInstallPrompt, setShowPWAInstallPrompt] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('t2s_active_tab');
    if (saved) {
      const validTabs: TabType[] = ['journey', 'framework', 'archives', 'library', 'admin', 'profile', 'shop', 'affiliate', 'leaderboard', 'forum'];
      if (validTabs.includes(saved as TabType)) {
        return saved as TabType;
      }
    }
    return 'journey';
  });

  const [activeAnnouncement, setActiveAnnouncement] = useState<any>(null);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('t2s_dismissed_broadcast_id');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const item = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        if (item.active) {
          setActiveAnnouncement(item);
        } else {
          setActiveAnnouncement(null);
        }
      } else {
        setActiveAnnouncement(null);
      }
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('t2s_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleQuota = (e: any) => {
      setQuotaError(e.detail || true);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
    };
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAInstallPrompt(true);
    };

    window.addEventListener('firestore-quota', handleQuota);
    window.addEventListener('firestore-offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('firestore-quota', handleQuota);
      window.removeEventListener('firestore-offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect login successful:", result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect login failed:", error);
        if (error.code === 'auth/popup-closed-by-user') {
          setAuthError('auth/popup-closed-by-user');
        } else {
          setAuthError(error.code || error.message);
        }
      });
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) {
      setShowPWAInstallPrompt(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("User install choice response:", outcome);
    setDeferredPrompt(null);
    setShowPWAInstallPrompt(false);
  };

  const [isSidebarOpen, setSidebarOpen] = useState(false); // Default to closed on mobile
  
  // Dynamic Content with instant cache hydration for ultra-fast startup
  const [journeyModules, setJourneyModules] = useState<JourneyModule[]>(() => {
    try {
      const cached = localStorage.getItem('t2s_journey_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return RAW_JOURNEY_MODULES;
  });
  const [selectedJourneyCategory, setSelectedJourneyCategory] = useState<string>('All');
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string>('All');
  const [archives, setArchives] = useState<VideoArchive[]>(() => {
    try {
      const cached = localStorage.getItem('t2s_archives_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_T2S_ARCHIVES;
  });
  const [selectedArchiveFamily, setSelectedArchiveFamily] = useState<string>('All');
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [library, setLibrary] = useState<LibraryBook[]>(() => {
    try {
      const cached = localStorage.getItem('t2s_library_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FOUR_FOUNDATIONAL_EBOOKS;
  });
  const [stats, setStats] = useState({ users: 0, totalXp: 0 });
  const [rank, setRank] = useState<number | null>(null);

  const [selectedVideo, setSelectedVideo] = useState<VideoArchive | null>(null);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [selectedJourneyModule, setSelectedJourneyModule] = useState<JourneyModule | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAscensionOpen, setIsAscensionOpen] = useState(false);

  const [reflectionText, setReflectionText] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isReflectionSubmitting, setIsReflectionSubmitting] = useState(false);

  // Navigation & Modals managed with navHistory
  const openVideoModal = (v: VideoArchive) => {
    setSelectedVideo(v);
    navHistory.pushModal('video', () => setSelectedVideo(null));
  };
  const closeVideoModal = () => {
    navHistory.closeModal('video');
    setSelectedVideo(null);
  };

  const openBookModal = (b: LibraryBook) => {
    setSelectedBook(b);
    navHistory.pushModal('book', () => setSelectedBook(null));
  };
  const closeBookModal = () => {
    navHistory.closeModal('book');
    setSelectedBook(null);
  };

  const openSearchModal = () => {
    setIsSearchOpen(true);
    navHistory.pushModal('search', () => setIsSearchOpen(false));
  };
  const closeSearchModal = () => {
    navHistory.closeModal('search');
    setIsSearchOpen(false);
  };

  const openAscensionModal = () => {
    setIsAscensionOpen(true);
    navHistory.pushModal('ascension', () => setIsAscensionOpen(false));
  };
  const closeAscensionModal = () => {
    navHistory.closeModal('ascension');
    setIsAscensionOpen(false);
  };

  const openJourneyModuleModal = (m: JourneyModule) => {
    setSelectedJourneyModule(m);
    navHistory.pushModal('journey_module', () => setSelectedJourneyModule(null));
  };
  const closeJourneyModuleModal = () => {
    navHistory.closeModal('journey_module');
    setSelectedJourneyModule(null);
  };

  const openSidebarDrawer = () => {
    setSidebarOpen(true);
    navHistory.pushModal('sidebar', () => setSidebarOpen(false));
  };
  const closeSidebarDrawer = () => {
    navHistory.closeModal('sidebar');
    setSidebarOpen(false);
  };

  const handleTabClick = (tab: TabType) => {
    if (showGateway) setShowGateway(false);
    setActiveTab(tab);
    navHistory.pushTab(tab);
    if (isSidebarOpen) {
      closeSidebarDrawer();
    }
  };

  const handleEnterGateway = () => {
    setShowGateway(true);
    navHistory.pushGateway();
    if (isSidebarOpen) {
      closeSidebarDrawer();
    }
  };

  const handleDesktopBack = () => {
    navHistory.goBack(() => {
      if (!showGateway) {
        setShowGateway(true);
      }
    });
  };

  // Sync navHistory on initial mount and listen to popstate (device back / browser back)
  useEffect(() => {
    navHistory.init({
      view: showGateway ? 'gateway' : 'platform',
      tab: activeTab
    });

    const handlePopState = (e: PopStateEvent) => {
      navHistory.handlePopstate(e, {
        onCloseModal: () => {},
        onNavigateTab: (tab) => {
          setActiveTab(tab as TabType);
          setShowGateway(false);
        },
        onShowGateway: () => {
          setShowGateway(true);
        },
        onHideGateway: () => {
          setShowGateway(false);
        }
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Trigger reset modal if needed
  useEffect(() => {
    if (user && localStorage.getItem('t2s_reset_notice') === 'true') {
      setIsResetModalOpen(true);
      navHistory.pushModal('reset_notice', () => setIsResetModalOpen(false));
    }
  }, [user]);

  const closeResetModal = () => {
    localStorage.removeItem('t2s_reset_notice');
    navHistory.closeModal('reset_notice');
    setIsResetModalOpen(false);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const getDrivePreviewUrl = (url: string) => {
    if (!url) return null;
    // Regex for both /file/d/ID and ?id=ID formats
    const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|file\/u\/\d+\/d\/)|docs\.google\.com\/(?:file\/d\/|open\?id=|file\/u\/\d+\/d\/))([a-zA-Z0-9_-]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  // Auth & Profile Sync
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        localStorage.setItem('t2s_referral', refCode);
      }

      setUser(firebaseUser);
      if (firebaseUser) {
        // Automatically dismiss gateway on login and direct to journey to show user data
        setShowGateway(false);
        setActiveTab('journey');

        // Immediately isolate and load data specifically for THIS unique user
        const userCacheKey = 't2s_profile_cache_' + firebaseUser.uid;
        let immediateProfile: UserProfile | null = null;
        try {
          const cachedStr = localStorage.getItem(userCacheKey);
          if (cachedStr) {
            const parsed = JSON.parse(cachedStr);
            if (parsed && parsed.uid === firebaseUser.uid) {
              immediateProfile = parsed;
              setProfile(parsed);
            }
          }
        } catch {}
        if (!immediateProfile) {
          // If the in-memory profile was from a previous user, clear it immediately
          setProfile(prev => (prev && prev.uid === firebaseUser.uid ? prev : null));
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        const adminRef = doc(db, 'admins', firebaseUser.uid);
        
        try {
          // Parallelize admin status and user profile fetch to cut startup network latency
          const adminEmails = ['shivshivamxyz@gmail.com', 'ashivamone@gmail.com'];
          let isAdminUser = firebaseUser.emailVerified && adminEmails.includes(firebaseUser.email || '');

          const [adminRes, userRes] = await Promise.allSettled([
            getDoc(adminRef),
            getDoc(userRef)
          ]);

          if (adminRes.status === 'fulfilled' && adminRes.value.exists()) {
            isAdminUser = true;
          }

          let userSnap: any = null;
          let isOfflineLocal = false;
          if (userRes.status === 'fulfilled') {
            userSnap = userRes.value;
          } else {
            const err = userRes.reason;
            console.warn("Could not fetch user profile directly from Firestore:", err);
            isOfflineLocal = isOfflineError(err);
            if (isOfflineLocal) {
              setIsOffline(true);
            } else {
              handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
            }
          }
          
          let profileData: any = null;

          if (userSnap && userSnap.exists()) {
            const rawData = userSnap.data();
            const normalizedDays = Array.from(new Set((rawData.completedDays || []).map(Number).filter((n: number) => !isNaN(n) && n > 0))).sort((a: number, b: number) => a - b);
            profileData = { 
              uid: firebaseUser.uid, 
              ...rawData,
              completedDays: normalizedDays,
              displayName: rawData.displayName || firebaseUser.displayName || 'Sovereign Practitioner'
            };

            // Check if user had any progress in guest mode prior to logging in - merge to prevent data loss!
            const guestCache = localStorage.getItem('t2s_guest_profile');
            if (guestCache) {
              try {
                const guestProfile = JSON.parse(guestCache);
                if (guestProfile && guestProfile.completedDays && guestProfile.completedDays.length > 0) {
                  const mergedCompleted = Array.from(new Set([...(profileData.completedDays || []), ...guestProfile.completedDays.map(Number)])).sort((a: number, b: number) => a - b);
                  const additionalDays = mergedCompleted.length - (profileData.completedDays?.length || 0);
                  const mergedXp = (profileData.xp || 0) + (additionalDays * 100);
                  const mergedLevel = Math.floor(mergedXp / 1000) + 1;
                  const mergedReflections = { ...(profileData.dailyReflections || {}), ...(guestProfile.dailyReflections || {}) };
                  const mergedPresence = Array.from(new Set([...(profileData.presenceDays || []), ...(guestProfile.presenceDays || [])]));
                  const lastCompletedAt = guestProfile.lastCompletedAt || profileData.lastCompletedAt;
                  
                  profileData = {
                    ...profileData,
                    completedDays: mergedCompleted,
                    xp: mergedXp,
                    level: mergedLevel,
                    dailyReflections: mergedReflections,
                    presenceDays: mergedPresence,
                    lastCompletedAt: lastCompletedAt || profileData.lastCompletedAt,
                  };
                  updateDoc(userRef, {
                    completedDays: mergedCompleted,
                    xp: mergedXp,
                    level: mergedLevel,
                    dailyReflections: mergedReflections,
                    presenceDays: mergedPresence,
                    updatedAt: serverTimestamp()
                  }).catch(e => console.warn("Failed to merge guest progress to firestore:", e));
                }
              } catch (e) {
                console.warn("Failed to merge guest profile:", e);
              } finally {
                localStorage.removeItem('t2s_guest_profile');
              }
            }

            // Execute daily login / streak checks in background
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const userData = userSnap.data();
            const lastLogin = userData.lastLoginAt?.toDate?.() || new Date(0);
            const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()).getTime();
            
            const diffDays = Math.floor((today - lastLoginDate) / (1000 * 60 * 60 * 24));
            
            let updates: any = { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() };
            const todayStr = getLocalDateString();
            if (!userData.presenceDays?.includes(todayStr)) {
              updates.presenceDays = arrayUnion(todayStr);
            }

            if (diffDays === 1) {
              updates.streak = (userData.streak || 0) + 1;
            } else if (diffDays > 1) {
              updates.streak = 1;
            }

            // Streak check (PROTECTS COMPLETED DAYS - ONLY RESETS STREAK COUNTER)
            if (userData.completedDays && userData.completedDays.length > 0) {
              const lastCompleted = parseDateTime(userData.lastCompletedAt);
              if (lastCompleted) {
                const lastCompletedDateOnly = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
                const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const daysSinceLastSuccess = Math.floor((todayDateOnly.getTime() - lastCompletedDateOnly.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceLastSuccess >= 3) {
                  // Reset streak counter only, NEVER wipe earned completedDays!
                  updates.streak = 0;
                }
              }
            }
            
            const finalProfile = {
              ...profileData,
              ...(updates.streak !== undefined ? { streak: updates.streak } : {}),
              isAdmin: isAdminUser
            };

            // Cache the profile locally for instant future loads
            localStorage.setItem('t2s_profile_cache_' + firebaseUser.uid, JSON.stringify(finalProfile));
            localStorage.setItem('t2s_active_profile', JSON.stringify(finalProfile));
            
            // Immediately unblock UI - render all profile data for corresponding user
            setProfile(finalProfile as UserProfile);
            setLoading(false);

            if (updates.presenceDays || diffDays >= 1 || updates.streak !== undefined) {
              updateDoc(userRef, updates).catch(err => {
                if (!isOfflineError(err)) {
                  handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
                }
              });
            }
          } else if (userRes.status === 'fulfilled') {
            // First time login - document does not exist yet: create in Firestore
            const todayStr = getLocalDateString();
            const guestCache = localStorage.getItem('t2s_guest_profile');
            let guestProfile: any = null;
            if (guestCache) {
              try { guestProfile = JSON.parse(guestCache); } catch {}
              localStorage.removeItem('t2s_guest_profile');
            }

            const initialProfile: any = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Sovereign Practitioner',
              photoURL: firebaseUser.photoURL || '',
              xp: guestProfile?.xp || 0,
              level: guestProfile?.level || 1,
              completedDays: guestProfile?.completedDays || [],
              presenceDays: guestProfile?.presenceDays || [todayStr],
              updatedAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              streak: 1,
              isAdmin: isAdminUser,
              isStrategist: false,
              bio: '',
              referredBy: localStorage.getItem('t2s_referral') || '',
              dailyReflections: guestProfile?.dailyReflections || {},
              lastCompletedAt: guestProfile?.lastCompletedAt ? new Date(guestProfile.lastCompletedAt) : null
            };

            if (!isOfflineLocal) {
              try {
                await setDoc(userRef, initialProfile, { merge: true });
                profileData = initialProfile;
                localStorage.setItem('t2s_profile_cache_' + firebaseUser.uid, JSON.stringify(profileData));
                localStorage.setItem('t2s_active_profile', JSON.stringify({ ...profileData, isAdmin: isAdminUser }));
              } catch (setErr) {
                console.warn("Could not create initial user doc in Firestore:", setErr);
              }
            }

            // Fallback: load from cache since we are offline or document is not fetched
            if (!profileData) {
              const cached = localStorage.getItem('t2s_profile_cache_' + firebaseUser.uid);
              if (cached) {
                try {
                  profileData = JSON.parse(cached);
                  console.log("Successfully loaded profile from local cache for offline usage:", profileData);
                } catch (parseErr) {
                  console.error("Failed to parse cached profile data:", parseErr);
                }
              }
            }
            
            // If they are a first-time user but offline with no cache, construct a resilient default
            if (!profileData) {
              profileData = {
                ...initialProfile,
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              };
            }
            setProfile({ ...profileData, isAdmin: isAdminUser } as UserProfile);
          } else {
            // userRes was rejected (network error / offline).
            // CRITICAL: NEVER call setDoc here! Load from cache!
            const cached = localStorage.getItem('t2s_profile_cache_' + firebaseUser.uid);
            if (cached) {
              try {
                profileData = JSON.parse(cached);
                setProfile({ ...profileData, isAdmin: isAdminUser } as UserProfile);
              } catch (parseErr) {
                console.error("Failed to parse cached profile data:", parseErr);
              }
            }
          }

          // Listener for profile updates (works background-synced, handles offline reconnect automatically)
          unsubProfile = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const safeLastCompletedAt = data.lastCompletedAt || profileData?.lastCompletedAt;
              const normalizedDays = Array.from(new Set((data.completedDays || []).map(Number).filter((n: number) => !isNaN(n) && n > 0))).sort((a: number, b: number) => a - b);
              const updatedProfile = { 
                uid: firebaseUser.uid, 
                ...data, 
                completedDays: normalizedDays,
                lastCompletedAt: safeLastCompletedAt,
                isAdmin: isAdminUser 
              } as UserProfile;
              profileData = updatedProfile;
              setProfile(updatedProfile);
              localStorage.setItem('t2s_profile_cache_' + firebaseUser.uid, JSON.stringify(updatedProfile));
              localStorage.setItem('t2s_active_profile', JSON.stringify(updatedProfile));
            }
          }, (error) => {
            if (!isOfflineError(error)) {
              handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/snapshot`);
            } else {
              console.warn("Snapshot listener is currently waiting for internet connection...");
            }
          });

        } catch (error) {
          console.error("Profile Sync Error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        localStorage.removeItem('t2s_active_profile');
        setProfile(null);
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Content Subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubJourney = onSnapshot(query(collection(db, 'journey'), orderBy('day', 'asc')), (snap) => {
      const dbModules = snap.docs.map(d => ({ id: d.id, ...d.data() } as JourneyModule));
      localStorage.setItem('t2s_journey_cache', JSON.stringify(dbModules));
      const merged = Array.from({ length: 100 }, (_, i) => {
        const d = i + 1;
        const exists = dbModules.find(m => m.day === d);
        if (exists) {
          return {
            ...exists,
            category: exists.category || getCategoryForDay(d)
          } as JourneyModule;
        }
        const raw = RAW_JOURNEY_MODULES.find(m => m.day === d)!;
        return {
          id: `raw-${d}`,
          ...raw,
          category: raw.category || getCategoryForDay(d)
        } as JourneyModule;
      });
      setJourneyModules(merged);
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'journey');
      } else {
        console.warn("Waiting for internet connection to sync journey data...");
      }
      const cached = localStorage.getItem('t2s_journey_cache');
      let dbModules: JourneyModule[] = [];
      if (cached) {
        try {
          dbModules = JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse cached journey:", e);
        }
      }
      const merged = Array.from({ length: 100 }, (_, i) => {
        const d = i + 1;
        const exists = dbModules.find(m => m.day === d);
        if (exists) {
          return {
            ...exists,
            category: exists.category || getCategoryForDay(d)
          } as JourneyModule;
        }
        const raw = RAW_JOURNEY_MODULES.find(m => m.day === d)!;
        return {
          id: `raw-${d}`,
          ...raw,
          category: raw.category || getCategoryForDay(d)
        } as JourneyModule;
      });
      setJourneyModules(merged);
    });

    const unsubArchives = onSnapshot(query(collection(db, 'archives'), orderBy('createdAt', 'desc')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoArchive));
      if (data.length > 0) {
        setArchives(data);
        localStorage.setItem('t2s_archives_cache', JSON.stringify(data));
      } else {
        setArchives(DEFAULT_T2S_ARCHIVES);
      }
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'archives');
      } else {
        console.warn("Waiting for internet connection to sync video archives...");
      }
      const cached = localStorage.getItem('t2s_archives_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setArchives(parsed);
          } else {
            setArchives(DEFAULT_T2S_ARCHIVES);
          }
        } catch (e) {
          console.error("Failed to parse cached archives:", e);
          setArchives(DEFAULT_T2S_ARCHIVES);
        }
      } else {
        // Fallback default rich T2S archives across all 5 video families
        setArchives(DEFAULT_T2S_ARCHIVES);
      }
    });

    const unsubLibrary = onSnapshot(query(collection(db, 'library'), orderBy('title', 'asc')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryBook));
      // Ensure the 4 foundational blueprint books are always integrated in the library
      const existingIds = new Set(data.map(b => b.id));
      const mergedBooks = [...data];
      FOUR_FOUNDATIONAL_EBOOKS.forEach(b => {
        if (!existingIds.has(b.id)) {
          mergedBooks.push(b);
        }
      });
      setLibrary(mergedBooks);
      localStorage.setItem('t2s_library_cache', JSON.stringify(mergedBooks));
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'library');
      } else {
        console.warn("Waiting for internet connection to sync library books...");
      }
      const cached = localStorage.getItem('t2s_library_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const existingIds = new Set((parsed as LibraryBook[]).map(b => b.id));
          const merged = [...parsed];
          FOUR_FOUNDATIONAL_EBOOKS.forEach(b => {
            if (!existingIds.has(b.id)) merged.push(b);
          });
          setLibrary(merged);
        } catch (e) {
          console.error("Failed to parse cached library:", e);
          setLibrary(FOUR_FOUNDATIONAL_EBOOKS);
        }
      } else {
        // Fallback default library with 4 foundational master books
        setLibrary(FOUR_FOUNDATIONAL_EBOOKS);
      }
    });

    return () => {
      unsubJourney();
      unsubArchives();
      unsubLibrary();
    };
  }, [user]);

  // Dynamic Metrics & Rank
  useEffect(() => {
    if (!user || !profile) return;

    const fetchMetrics = async () => {
      try {
        const usersCount = await getCountFromServer(collection(db, 'users')).catch(() => null);

        if (!usersCount) {
          setStats({
            users: 1,
            totalXp: (profile.xp || 0)
          });
          setRank(1);
          return;
        }
        
        // Fetch users for rank calculation
        const qRank = query(collection(db, 'users'), where('xp', '>', profile.xp));
        const rankSnap = await getCountFromServer(qRank).catch(() => null);
        
        setStats({
          users: Math.max(1, usersCount.data().count),
          totalXp: (profile.xp || 0)
        });
        if (rankSnap) {
          setRank(rankSnap.data().count + 1);
        } else {
          setRank(1);
        }
      } catch {
        setStats({
          users: 1,
          totalXp: (profile.xp || 0)
        });
        setRank(1);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [user, profile?.xp]);

  const handleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user')) {
        setAuthError('auth/popup-closed-by-user');
      } else {
        setAuthError(error.code || error.message || "Unknown login error");
      }
    }
  };

  const handleLoginWithRedirect = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Redirect login initiate failed:", error);
      setAuthError(error.code || error.message || "Failed to start redirect login");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Signout error:", e);
    }
    localStorage.removeItem('t2s_active_profile');
    setUser(null);
    setProfile(null);
    setShowGateway(true);
  };

  const completeDay = async (day: number) => {
    // 1. Guest Mode Support (if not signed in yet)
    if (!profile) {
      const guestCache = localStorage.getItem('t2s_guest_profile');
      let guestProfile: UserProfile = guestCache ? JSON.parse(guestCache) : {
        uid: 'guest',
        email: '',
        displayName: 'Sovereign Practitioner',
        photoURL: '',
        xp: 0,
        level: 1,
        completedDays: [],
        presenceDays: [getLocalDateString()],
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        streak: 1,
        isAdmin: false,
        isStrategist: false,
        bio: '',
        referredBy: '',
        dailyReflections: {}
      };

      if (guestProfile.completedDays?.includes(day)) {
        showToast({
          title: "पहले से पूर्ण (Already Completed)",
          message: `दिन ${day} पहले ही पूरा किया जा चुका है।`,
          type: "info"
        });
        return;
      }

      // Prerequisite check for guest: Day N-1 must be completed (unless Day 1)
      if (day > 1 && !guestProfile.completedDays?.includes(day - 1)) {
        showToast({
          title: "पूर्वापेक्षा क्रम (Prerequisite Locked)",
          message: `दिन ${day} पूरा करने से पहले दिन ${day - 1} का प्रोटोकॉल पूरा करना आवश्यक है।`,
          type: "warning"
        });
        return;
      }

      // Single day per calendar day check for guest (IST midnight schedule)
      const isGuestAlreadyCompletedToday = isCompletedOnDate(guestProfile.lastCompletedAt);
      if (isGuestAlreadyCompletedToday) {
        showToast({
          title: "प्रतिदिन केवल एक कार्य (One Task Per Day)",
          message: "आप प्रतिदिन केवल एक ही दिन का कार्य पूरा कर सकते हैं। अगला दिन मध्यरात्रि 12:00 AM IST पर अनलॉक होगा!",
          type: "warning"
        });
        return;
      }

      const updatedCompleted = Array.from(new Set([...(guestProfile.completedDays || []), day])).sort((a, b) => a - b);
      const newXp = (guestProfile.xp || 0) + 100;
      guestProfile = {
        ...guestProfile,
        completedDays: updatedCompleted,
        xp: newXp,
        level: Math.floor(newXp / 1000) + 1,
        lastCompletedAt: new Date().toISOString() as any
      };
      localStorage.setItem('t2s_guest_profile', JSON.stringify(guestProfile));
      localStorage.setItem('t2s_active_profile', JSON.stringify(guestProfile));
      setProfile(guestProfile);
      showToast({
        title: `दिन ${day} पूर्ण हुआ (Day ${day} Completed)`,
        message: "आज का कार्य पूरा हुआ! अगला दिन मध्यरात्रि 12:00 AM IST पर अनलॉक होगा।",
        type: "success"
      });
      return;
    }

    if (profile.completedDays?.includes(day)) {
      showToast({
        title: "पहले से पूर्ण (Already Completed)",
        message: `दिन ${day} पहले ही पूरा किया जा चुका है।`,
        type: "info"
      });
      return;
    }

    // Prerequisite check: Day N-1 must be completed (unless Day 1)
    if (day > 1 && !profile.completedDays?.includes(day - 1)) {
      showToast({
        title: "पूर्वापेक्षा क्रम (Prerequisite Locked)",
        message: `दिन ${day} पूरा करने से पहले दिन ${day - 1} का प्रोटोकॉल पूरा करना आवश्यक है।`,
        type: "warning"
      });
      return;
    }

    // Limit to one day task per calendar day (Admins can test multi-day unlocking)
    const isAlreadyCompletedToday = isCompletedOnDate(profile.lastCompletedAt);
    if (!profile.isAdmin && isAlreadyCompletedToday) {
      showToast({
        title: "प्रतिदिन केवल एक कार्य (One Task Per Day)",
        message: "आप प्रतिदिन केवल एक ही दिन का कार्य पूरा कर सकते हैं। अगला दिन मध्यरात्रि 12:00 AM IST पर अनलॉक होगा!",
        type: "warning"
      });
      return;
    }

    const todayLocalStr = getLocalDateString();
    const xpGain = 100;
    const bonusXp = profile.streak ? Math.min(profile.streak * 5, 50) : 0;
    const totalGain = xpGain + bonusXp;
    const newXp = (profile.xp || 0) + totalGain;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const updatedCompleted = Array.from(new Set([...(profile.completedDays || []), day])).sort((a, b) => a - b);
    const updatedPresence = profile.presenceDays?.includes(todayLocalStr) ? profile.presenceDays : [...(profile.presenceDays || []), todayLocalStr];

    // 1. Instant Optimistic Local Update (0ms delay for checkmarks and XP counters)
    const optimisticProfile: UserProfile = {
      ...profile,
      completedDays: updatedCompleted,
      presenceDays: updatedPresence,
      lastCompletedAt: new Date() as any,
      xp: newXp,
      level: newLevel,
      updatedAt: new Date() as any
    };

    setProfile(optimisticProfile);
    if (user) {
      localStorage.setItem('t2s_profile_cache_' + user.uid, JSON.stringify(optimisticProfile));
    }
    localStorage.setItem('t2s_active_profile', JSON.stringify(optimisticProfile));

    showToast({
      title: `दिन ${day} पूरा हुआ (Day ${day} Completed)`,
      message: `शानदार अनुशासन! दिन ${day} का प्रोटोकॉल संकलित कर लिया गया है।`,
      type: "success"
    });

    // 2. Background Firestore Sync
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          completedDays: arrayUnion(day),
          presenceDays: arrayUnion(todayLocalStr),
          lastCompletedAt: serverTimestamp(),
          xp: increment(totalGain),
          level: newLevel,
          updatedAt: serverTimestamp()
        });
      } catch (error: any) {
        if (error?.code === 'not-found' || error?.message?.includes('No document to update')) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || profile.displayName || 'Sovereign Practitioner',
            photoURL: user.photoURL || profile.photoURL || '',
            completedDays: updatedCompleted,
            presenceDays: updatedPresence,
            lastCompletedAt: serverTimestamp(),
            xp: newXp,
            level: newLevel,
            streak: profile.streak || 1,
            isAdmin: profile.isAdmin || false,
            isStrategist: profile.isStrategist || false,
            bio: profile.bio || '',
            referredBy: profile.referredBy || '',
            dailyReflections: profile.dailyReflections || {},
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else if (!isOfflineError(error)) {
          console.warn("Background updateDoc sync pending:", error);
        }
      }
    }
  };

  const submitDailyReflection = async (content: string) => {
    if (!profile || !content.trim()) return;
    const { dateStr } = getIstHourAndDateStr();
    
    // Instant Optimistic Update
    const updatedReflections = {
      ...(profile.dailyReflections || {}),
      [dateStr]: content.trim()
    };
    const newXp = (profile.xp || 0) + 25;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const optimisticProfile: UserProfile = {
      ...profile,
      dailyReflections: updatedReflections,
      xp: newXp,
      level: newLevel
    };
    setProfile(optimisticProfile);
    if (user) {
      localStorage.setItem('t2s_profile_cache_' + user.uid, JSON.stringify(optimisticProfile));
    }
    localStorage.setItem('t2s_active_profile', JSON.stringify(optimisticProfile));

    showToast({
      title: "दैनिक चिंतन दर्ज (Reflection Saved)",
      message: "आपका आत्म-अवलोकन सुरक्षित कर लिया गया है।",
      type: "success"
    });

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          [`dailyReflections.${dateStr}`]: content.trim(),
          xp: increment(25),
          updatedAt: serverTimestamp()
        });
      } catch (error: any) {
        if (error?.code === 'not-found') {
          await setDoc(userRef, {
            dailyReflections: updatedReflections,
            xp: newXp,
            level: newLevel,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else if (!isOfflineError(error)) {
          console.warn("Reflection sync pending:", error);
        }
      }
    }
  };

  const claimSovereignXp = async (amount: number, reason: string) => {
    if (!user || !profile) return;
    const userRef = doc(db, 'users', user.uid);
    const newXp = (profile.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;
    
    try {
      await updateDoc(userRef, {
        xp: increment(amount),
        level: newLevel,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      if (error?.code === 'not-found') {
        await setDoc(userRef, {
          xp: newXp,
          level: newLevel,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/xp`);
      }
    }
  };

  if (loading) return <LoadingScreen />;

  if (showGateway) {
    return (
      <>
        <GatewayView 
          onLogin={handleLogin} 
          onLoginRedirect={handleLoginWithRedirect}
          onEnter={() => {
            if (user) {
              handleTabClick('journey');
            } else {
              handleLogin();
            }
          }} 
          onEnterWithTab={(tab) => {
            if (user) {
              handleTabClick(tab);
            } else {
              handleLogin();
            }
          }}
          isAuthenticated={!!user} 
          userEmail={user?.email} 
          authError={authError}
          setAuthError={setAuthError}
          quotaError={quotaError}
          onLogout={handleLogout}
          profile={profile}
          onOpenAscension={openAscensionModal}
          canGoBack={navHistory.getDepth() > 0}
          onDesktopBack={handleDesktopBack}
        />
        {isAscensionOpen && profile && (
          <AscensionModal onClose={closeAscensionModal} profile={profile} />
        )}
      </>
    );
  }

  if (!user) {
    setShowGateway(true);
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07080a] text-gray-200 flex font-sans selection:bg-amber-500/20">
      <div className="fixed inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 z-0" />
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={closeSidebarDrawer}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
      
      <aside id="navigation-drawer" aria-label={t('nav.moreServices')} className={`fixed lg:sticky top-0 h-screen ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0'} bg-[#0a0b10] border-r border-[#1a1d24] transition-all duration-500 ease-in-out flex flex-col z-50 overflow-hidden`}>
        <div className={`h-24 flex items-center border-b border-[#1a1d24] overflow-hidden ${isSidebarOpen ? 'px-8 justify-start' : 'px-0 justify-center'}`}>
          <Logo className="min-w-[40px] w-10 h-10" src={import.meta.env.VITE_APP_LOGO_URL || "/Logo-real.png"} />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="ml-3 font-black text-xl tracking-tighter text-white whitespace-nowrap"
              >
                Talk2Society
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide ${isSidebarOpen ? 'px-3 sm:px-4' : 'px-2'}`}>
          <NavItem icon={<BookOpen className="w-5 h-5" />} label={t('nav.library')} secondaryLabel={language === 'hi' ? 'Library' : 'किताबें'} active={activeTab === 'library'} onClick={() => { handleTabClick('library'); }} collapsed={!isSidebarOpen} />
          <NavItem icon={<Flame className="w-5 h-5" />} label={t('nav.journey')} secondaryLabel={language === 'hi' ? 'Journey' : '100-day path'} active={activeTab === 'journey'} onClick={() => { handleTabClick('journey'); }} collapsed={!isSidebarOpen} />
          <NavItem icon={<PlayCircle className="w-5 h-5" />} label={t('nav.archives')} secondaryLabel={language === 'hi' ? 'Videos' : 'वीडियो'} active={activeTab === 'archives'} onClick={() => { handleTabClick('archives'); }} collapsed={!isSidebarOpen} />
          <NavItem icon={<Layers className="w-5 h-5" />} label={t('nav.framework')} secondaryLabel={language === 'hi' ? 'Guide' : 'गाइड'} active={activeTab === 'framework'} onClick={() => { handleTabClick('framework'); }} collapsed={!isSidebarOpen} />
          <NavItem icon={<User className="w-5 h-5" />} label={t('nav.profile')} secondaryLabel={language === 'hi' ? 'Profile' : 'प्रोफ़ाइल'} active={activeTab === 'profile'} onClick={() => { handleTabClick('profile'); }} collapsed={!isSidebarOpen} />
          
          <div className={`pt-2 pb-1 border-t border-white/5 my-2 ${isSidebarOpen ? 'w-full' : 'w-8 mx-auto'}`}>
            {isSidebarOpen && (
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-3 block">
                {t('nav.moreServices')}
              </span>
            )}
          </div>

          <NavItem icon={<MessageSquare className="w-5 h-5 text-amber-400" />} label={t('nav.forum')} secondaryLabel={language === 'hi' ? 'Community' : 'चर्चा मंच'} active={activeTab === 'forum'} onClick={() => { handleTabClick('forum'); }} collapsed={!isSidebarOpen} />
          <NavItem icon={<ShoppingCart className="w-5 h-5" />} label={t('nav.shop')} secondaryLabel={language === 'hi' ? 'Store' : 'स्टोर'} active={activeTab === 'shop'} onClick={() => { handleTabClick('shop'); }} collapsed={!isSidebarOpen} />
          <NavItem icon={<Trophy className="w-5 h-5" />} label={t('nav.leaderboard')} secondaryLabel={language === 'hi' ? 'Leaderboard' : 'लीडरबोर्ड'} active={activeTab === 'leaderboard'} onClick={() => { handleTabClick('leaderboard'); }} collapsed={!isSidebarOpen} />
          <NavItem icon={<Shield className="w-5 h-5" />} label={t('nav.home')} secondaryLabel={language === 'hi' ? 'Overview' : 'होम'} active={false} onClick={() => { handleEnterGateway(); }} collapsed={!isSidebarOpen} />
          
          <a
            href="https://www.youtube.com/@Talk2Society"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center transition-all duration-200 relative group text-zinc-400 hover:text-red-500 hover:bg-red-500/5 ${
              isSidebarOpen 
                ? 'w-full gap-3 px-3 py-2.5 rounded-2xl' 
                : 'w-12 h-12 justify-center mx-auto rounded-2xl'
            }`}
            title="YouTube Channel"
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Youtube className="w-5 h-5 text-red-500" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col text-left overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider leading-none">YouTube Channel</span>
                <span className="text-[9px] font-medium tracking-wide leading-none mt-1 uppercase text-zinc-500 group-hover:text-red-400/80">यूट्यूब चैनल</span>
              </div>
            )}
          </a>

          <a
            href="https://t.me/Talk2Society"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center transition-all duration-200 relative group text-zinc-400 hover:text-blue-400 hover:bg-blue-500/5 ${
              isSidebarOpen 
                ? 'w-full gap-3 px-3 py-2.5 rounded-2xl' 
                : 'w-12 h-12 justify-center mx-auto rounded-2xl'
            }`}
            title="Telegram Channel"
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Send className="w-5 h-5 text-blue-400 fill-blue-500/10" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col text-left overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider leading-none">Telegram Channel</span>
                <span className="text-[9px] font-medium tracking-wide leading-none mt-1 uppercase text-zinc-500 group-hover:text-blue-300">टेलीग्राम चैनल</span>
              </div>
            )}
          </a>

          <a
            href="https://t.me/+DlpQ9XstJ2VjYzU1"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center transition-all duration-200 relative group text-zinc-400 hover:text-blue-400 hover:bg-blue-500/5 ${
              isSidebarOpen 
                ? 'w-full gap-3 px-3 py-2.5 rounded-2xl' 
                : 'w-12 h-12 justify-center mx-auto rounded-2xl'
            }`}
            title="Telegram Group"
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col text-left overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider leading-none">Telegram Group</span>
                <span className="text-[9px] font-medium tracking-wide leading-none mt-1 uppercase text-zinc-500 group-hover:text-blue-300">टेलीग्राम ग्रुप</span>
              </div>
            )}
          </a>
          
          {profile?.isAdmin && (
            <NavItem icon={<Settings className="w-5 h-5" />} label={t('nav.admin')} secondaryLabel={language === 'hi' ? 'Admin panel' : 'एडमिन पैनल'} active={activeTab === 'admin'} onClick={() => { handleTabClick('admin'); }} collapsed={!isSidebarOpen} />
          )}
        </nav>

        <div className={`border-t border-white/5 space-y-4 shrink-0 pb-8 lg:pb-4 ${isSidebarOpen ? 'p-4' : 'p-2'}`}>
          <AnimatePresence>
            {isSidebarOpen && profile && (() => {
              const currentRank = getRankFromXP(profile.xp || 0);

              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <div className={`text-[9px] px-2 py-0.5 rounded-full w-fit mb-1 font-black uppercase tracking-widest text-white ${currentRank.color}`}>
                        {profile.isAdmin ? 'Admin' : profile.isStrategist ? 'Special Member' : currentRank.name}
                      </div>
                      <div className="text-sm font-bold text-white capitalize truncate">
                        {(profile.displayName || 'Sovereign Practitioner').split(' ')[0]}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
          <button onClick={handleLogout} className={`flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all group ${isSidebarOpen ? 'w-full gap-3 p-3' : 'w-12 h-12 mx-auto'}`} title="Logout">
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
            {isSidebarOpen && (
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-bold uppercase tracking-widest leading-tight">Logout</span>
                <span className="text-[8px] text-gray-600 font-bold leading-tight">लॉगआउट करें</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden relative z-10">
        <header className="h-14 sm:h-16 md:h-20 border-b border-[#1a1d24] bg-[#0c0e14]/95 backdrop-blur-md flex items-center justify-between px-2.5 sm:px-4 md:px-8 sticky top-0 z-30 shrink-0 select-none">
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 min-w-0">
            {/* Desktop Back button: visible only on desktop (hidden on mobile per user spec) */}
            <button
              onClick={handleDesktopBack}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 hover:text-white text-zinc-300 rounded-xl border border-zinc-700/70 transition-all text-xs font-semibold cursor-pointer shrink-0 shadow-sm"
              title={t('action.back')}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('action.back')}</span>
            </button>

            <button 
              onClick={() => isSidebarOpen ? closeSidebarDrawer() : openSidebarDrawer()} 
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400" 
              aria-label={isSidebarOpen ? (language === 'hi' ? 'मेन्यू बंद करें' : 'Close menu') : t('nav.more')}
            >
              {isSidebarOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-200" />}
            </button>

            {(() => {
              const tabLabels: Record<string, string> = {
                journey: t('nav.journey'),
                framework: t('nav.framework'),
                archives: t('nav.archives'),
                library: t('nav.library'),
                forum: t('nav.forum'),
                shop: t('nav.shop'),
                leaderboard: t('nav.leaderboard'),
                profile: t('nav.profile'),
                admin: t('nav.admin'),
              };
              return (
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate" aria-live="polite">
                    {tabLabels[activeTab] || activeTab.replace('-', ' ')}
                  </h2>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
            <LanguageSwitcher className="px-2" />
            <button
              onClick={openSearchModal}
              className="w-11 h-11 md:w-auto md:px-3 md:py-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={t('action.search')}
              title={t('action.search')}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="hidden md:inline text-xs font-medium">{t('action.search')}</span>
            </button>

            {profile && (profile.isStrategist || profile.isAdmin) ? (
              <div className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider shrink-0 shadow-sm" title="संप्रभु VIP सदस्य">
                <Zap className="w-3 h-3 text-green-400 fill-green-400 shrink-0" />
                <span className="font-bold">VIP</span>
                <span className="hidden md:inline"> / संप्रभु</span>
              </div>
            ) : (
              <button
                onClick={openAscensionModal}
                className="min-h-11 flex items-center justify-center gap-1 px-2.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-black rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-white"
                title="VIP अनलॉक करें"
              >
                <Zap className="w-3 h-3 fill-black text-black shrink-0" />
                <span>VIP</span>
                <span className="hidden sm:inline"> अनलॉक</span>
              </button>
            )}

            {/* User Profile Avatar */}
            <button
              type="button"
              className="w-11 h-11 rounded-xl border border-white/10 bg-zinc-900 flex items-center justify-center p-0.5 overflow-hidden ring-1 ring-white/10 hover:ring-amber-500/50 active:scale-95 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400"
              onClick={() => handleTabClick('profile')}
              title={t('nav.profile')}
              aria-label={t('nav.profile')}
            >
              <img src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" className="w-full h-full object-cover rounded-lg" />
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6 md:p-12 lg:p-16 pb-24 lg:pb-16 max-w-7xl w-full mx-auto">
          {quotaError && profile?.isAdmin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-red-500/10 border-2 border-red-500/30 rounded-[24px] p-6 flex flex-col md:flex-row items-center gap-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden mb-8"
            >
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-500" />
              <div className="w-12 h-12 bg-red-500/15 rounded-full flex items-center justify-center border border-red-500/20 text-2xl shrink-0">
                🚨
              </div>
              <div className="flex-1 space-y-1 text-center md:text-left">
                <h4 className="text-red-500 font-display font-black text-xs uppercase tracking-widest font-mono">
                  DATABASE READ LIMIT EXCEEDED / डेटाबेस कोटा समाप्त
                </h4>
                <p className="text-white font-bold text-base leading-snug">
                  The application has hit its Google Firestore free-tier read limits.
                </p>
                <p className="text-gray-400 text-xs md:text-sm">
                  We have automatically activated the **Sovereign offline caching system** so you can continue exploring your content without failure! Admins can resolve this by enabling billing/upgrade in their Firebase project.
                </p>
              </div>
              <a
                href="https://console.firebase.google.com/project/nifty-cursor-gjlsj/firestore/databases/ai-studio-bc478ce7-54b3-4e54-92a2-5896ef7f9940/data?openUpgradeDialog=true"
                target="_blank"
                rel="noreferrer"
                className="bg-red-600 hover:bg-red-700 font-black text-[10px] text-white px-5 py-2.5 rounded-xl uppercase tracking-widest border border-red-500 transition-all shrink-0 font-mono text-center cursor-pointer shadow-md inline-block"
              >
                Upgrade Plan / अपग्रेड करें
              </a>
            </motion.div>
          )}

          {/* Global Sovereign Broadcast Banner */}
          {activeAnnouncement && activeAnnouncement.id !== dismissedAnnouncementId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 sm:p-5 mb-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative ${
                activeAnnouncement.type === 'urgent' 
                  ? 'bg-red-500/10 border-red-500/30 text-white' 
                  : activeAnnouncement.type === 'live'
                  ? 'bg-amber-500/10 border-amber-500/30 text-white'
                  : activeAnnouncement.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-white'
                  : 'bg-blue-500/10 border-blue-500/30 text-white'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  activeAnnouncement.type === 'urgent' ? 'bg-red-500 text-white' :
                  activeAnnouncement.type === 'live' ? 'bg-amber-500 text-black' :
                  'bg-white/10 text-amber-400'
                }`}>
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400">
                      SOVEREIGN BROADCAST // उद्घोषणा
                    </span>
                    <span className="font-bold text-sm text-white">{activeAnnouncement.title}</span>
                    {activeAnnouncement.hindiTitle && (
                      <span className="text-xs text-zinc-300">({activeAnnouncement.hindiTitle})</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">{activeAnnouncement.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                {activeAnnouncement.actionUrl && (
                  <a
                    href={activeAnnouncement.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-md inline-block"
                  >
                    {activeAnnouncement.actionLabel || 'View Details'}
                  </a>
                )}
                <button
                  onClick={() => {
                    setDismissedAnnouncementId(activeAnnouncement.id);
                    try {
                      localStorage.setItem('t2s_dismissed_broadcast_id', activeAnnouncement.id);
                    } catch {}
                  }}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss Announcement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'journey' && (
              <motion.div key="journey" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <JourneyView
                  journeyModules={journeyModules}
                  profile={profile}
                  onCompleteDay={completeDay}
                  onSubmitReflection={submitDailyReflection}
                />
              </motion.div>
            )}

            {activeTab === 'framework' && (
              <motion.div key="framework" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Suspense fallback={<ViewLoader label="Opening Blueprint Framework (ब्लूप्रिंट)..." />}>
                  <ChannelFrameworkView 
                    onNavigateTab={(tab) => handleTabClick(tab)} 
                    onOpenBook={openBookModal}
                    onAwardXP={claimSovereignXp}
                  />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'archives' && (() => {
              const filteredArchives = archives.filter(v => {
                const matchesFamily = selectedArchiveFamily === 'All' || 
                  (v.family && v.family.toLowerCase() === selectedArchiveFamily.toLowerCase());
                const q = archiveSearch.toLowerCase().trim();
                const matchesSearch = !q || 
                  v.title.toLowerCase().includes(q) || 
                  (v.question && v.question.toLowerCase().includes(q)) ||
                  (v.family && v.family.toLowerCase().includes(q));
                return matchesFamily && matchesSearch;
              });

              return (
                <motion.div key="archives" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 w-full">
                  {/* Video Archives Header Banner */}
                  <div className="bg-[#0c0e14] border border-[#1d222e] rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 font-mono">
                            Documentary Archives · सामाजिक वृत्तचित्र संग्रह
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                          Talk2Society <span className="text-amber-400 font-bold">डॉक्यूमेंट्री वीडियो</span>
                        </h2>
                        <p className="text-xs text-zinc-300 mt-1 max-w-xl font-normal leading-relaxed">
                          भारतीय समाज, पारिवारिक दबावों, शादी के खर्च, कोचिंग माफिया और करियर की ज़मीनी हकीकत पर आधारित गहन वीडियो।
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start md:self-auto">
                        <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-medium text-zinc-300">
                          {filteredArchives.length} / {archives.length} वृत्तचित्र (Videos)
                        </span>
                      </div>
                    </div>

                    {/* Search & Family Filter Bar */}
                    <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={archiveSearch}
                          onChange={(e) => setArchiveSearch(e.target.value)}
                          placeholder="डॉक्यूमेंट्री का नाम, सवाल या विषय खोजें..."
                          className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                        />
                      </div>

                      {/* Video Family Segmented Controls */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-hide">
                        {[
                          { id: 'All', label: 'सभी (All)' },
                          { id: 'Why India?', label: 'भारत क्यों? (Why India?)' },
                          { id: 'How India Works', label: 'व्यवस्था कैसे काम करती है?' },
                          { id: 'The Hidden System', label: 'अदृश्य सामाजिक तंत्र' },
                          { id: 'The Path', label: 'सही रास्ता (The Path)' },
                          { id: 'The Uncomfortable Truth', label: 'कड़वा सच (Truth)' }
                        ].map((fam) => {
                          const isSelected = selectedArchiveFamily.toLowerCase() === fam.id.toLowerCase();
                          return (
                            <button
                              key={fam.id}
                              onClick={() => setSelectedArchiveFamily(fam.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                              }`}
                            >
                              {fam.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {filteredArchives.length === 0 ? (
                    <NoContent label="Matching Documentaries" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {filteredArchives.map(v => (
                        <VideoCard 
                          key={v.id} 
                          video={v} 
                          isLocked={v.isPremium && !profile?.isStrategist && !profile?.isAdmin}
                          onClick={() => openVideoModal(v)} 
                          onUnlockClick={openAscensionModal}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {activeTab === 'library' && (() => {
              const libraryCategories = ['All', ...Array.from(new Set(library.map(b => b.category).filter(Boolean)))];
              const filteredLibrary = library.filter(b => {
                const matchesCat = selectedLibraryCategory === 'All' || b.category?.toLowerCase() === selectedLibraryCategory.toLowerCase();
                const q = librarySearch.toLowerCase().trim();
                const matchesSearch = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.excerpt?.toLowerCase().includes(q);
                return matchesCat && matchesSearch;
              });

              return (
                <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 w-full">
                  {/* Great Library Header Banner */}
                  <div className="bg-[#0c0e14] border border-[#1d222e] rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 font-mono">
                            CLASSIFIED MANUSCRIPTS / महान पुस्तकालय
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tight">
                          The Great <span className="text-amber-500">Library</span> (पुस्तकालय)
                        </h2>
                        <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                          A. K. Chandradipti के 5 जीवन ग्रंथ, 4 क्रूसिबल ई-बुक्स और दर्शन, पैसे की समझ व स्वतंत्र सोच पर आधारित पुस्तकें।
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start md:self-auto">
                        <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-gray-300">
                          {filteredLibrary.length} / {library.length} पुस्तकें (Books)
                        </span>
                      </div>
                    </div>

                    {/* Search & Category Filter Bar */}
                    <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={librarySearch}
                          onChange={(e) => setLibrarySearch(e.target.value)}
                          placeholder="किताब का नाम, लेखक या विषय खोजें (उदा. अस्पृश्य, शक्ति, चाणक्य)..."
                          className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                        />
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                        {libraryCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedLibraryCategory(cat)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                              selectedLibraryCategory === cat
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Books Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredLibrary.length === 0 ? (
                      <div className="lg:col-span-3 py-16 text-center space-y-4 bg-white/5 rounded-[32px] border border-white/5">
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto" />
                        <div>
                          <p className="text-white font-bold text-sm uppercase tracking-wider">No Manuscripts Match Search</p>
                          <p className="text-gray-500 text-xs font-mono mt-1">Try adjusting your category filter or search keywords</p>
                        </div>
                        {profile?.isAdmin && (
                          <button 
                            onClick={() => setActiveTab('admin')} 
                            className="mt-4 px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-black transition-all inline-block"
                          >
                            Add New Books via Admin Panel
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredLibrary.map(b => (
                        <BookCard 
                          key={b.id} 
                          book={b} 
                          isLocked={b.isPremium && !profile?.isStrategist && !profile?.isAdmin}
                          onClick={() => {
                            if (b.isPremium && !profile?.isStrategist && !profile?.isAdmin) {
                              openAscensionModal();
                            } else {
                              openBookModal(b);
                            }
                          }}
                          onUnlockClick={openAscensionModal}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })()}



            {activeTab === 'leaderboard' && (
              <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<ViewLoader label="Loading Leaderboard (शीर्ष साधक)..." />}>
                  <LeaderboardTab currentUserProfile={profile} />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {profile ? (
                  <ProfileView 
                    profile={profile} 
                    rank={rank} 
                    onOpenAscension={() => setIsAscensionOpen(true)}
                    onOpenCertificate={() => setShowCertificateModal(true)}
                    onOpenJournal={() => setShowJournalModal(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-white/5 rounded-3xl">
                    <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Loading Member Dossier...</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'forum' && (
              <motion.div key="forum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<ViewLoader label="Loading Community Forum (संवाद मंच)..." />}>
                  <CommunityForumView currentUserProfile={profile} onNavigateTab={(tab) => handleTabClick(tab as TabType)} />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'shop' && (
              <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ShopView profile={profile!} />
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {profile?.isAdmin ? (
                  <Suspense fallback={<ViewLoader label="Loading Nexus Admin Command..." />}>
                    <AdminPanel currentAdmin={profile} />
                  </Suspense>
                ) : (
                  <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-6 bg-[#0c0e14] border border-red-500/20 rounded-3xl">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-white uppercase italic">Administrator Access Restricted</h2>
                      <p className="text-xs text-zinc-400 font-mono">
                        This control panel requires verified administrator clearance. Logged in as: <span className="text-amber-400">{user?.email || 'Guest'}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleTabClick('journey')} 
                      className="px-6 py-2.5 bg-white text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all cursor-pointer"
                    >
                      Return to Course (वापस जाएं)
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Mobile Bottom Navigation Bar (Visible on mobile screens < 1024px) */}
        <nav aria-label={language === 'hi' ? 'मुख्य नेविगेशन' : 'Primary navigation'} className="lg:hidden shrink-0 min-h-[72px] bg-[#0c0e14]/95 backdrop-blur-xl border-t border-[#1a1d24] px-1 py-1 flex items-center justify-around safe-area-bottom shadow-[0_-4px_25px_rgba(0,0,0,0.8)] z-40">
          <button 
            type="button"
            onClick={() => handleTabClick('journey')}
            aria-current={activeTab === 'journey' ? 'page' : undefined}
            className={`flex-1 min-w-[50px] min-h-[60px] px-0.5 py-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === 'journey' ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'journey' ? 'text-amber-500 fill-amber-500/20' : ''}`} />
            <span className="text-[10px] font-semibold mt-1 leading-none">{t('nav.journeyShort')}</span>
          </button>

          <button 
            type="button"
            onClick={() => handleTabClick('framework')}
            aria-current={activeTab === 'framework' ? 'page' : undefined}
            className={`flex-1 min-w-[50px] min-h-[60px] px-0.5 py-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === 'framework' ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'framework' ? 'text-amber-500' : ''}`} />
            <span className="text-[10px] font-semibold mt-1 leading-none">{t('nav.frameworkShort')}</span>
          </button>
          
          <button 
            type="button"
            onClick={() => handleTabClick('archives')}
            aria-current={activeTab === 'archives' ? 'page' : undefined}
            className={`flex-1 min-w-[50px] min-h-[60px] px-0.5 py-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === 'archives' ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PlayCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'archives' ? 'text-amber-500' : ''}`} />
            <span className="text-[10px] font-semibold mt-1 leading-none">{t('nav.archivesShort')}</span>
          </button>

          <button 
            type="button"
            onClick={() => handleTabClick('library')}
            aria-current={activeTab === 'library' ? 'page' : undefined}
            className={`flex-1 min-w-[50px] min-h-[60px] px-0.5 py-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === 'library' ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'library' ? 'text-amber-500' : ''}`} />
            <span className="text-[10px] font-semibold mt-1 leading-none">{t('nav.libraryShort')}</span>
          </button>

          <button 
            type="button"
            onClick={() => handleTabClick('profile')}
            aria-current={activeTab === 'profile' ? 'page' : undefined}
            className={`flex-1 min-w-[50px] min-h-[60px] px-0.5 py-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'profile' ? 'text-amber-500' : ''}`} />
            <span className="text-[10px] font-semibold mt-1 leading-none">{t('nav.profileShort')}</span>
          </button>

          <button 
            type="button"
            onClick={openSidebarDrawer}
            aria-expanded={isSidebarOpen}
            aria-controls="navigation-drawer"
            aria-label={t('nav.more')}
            className="flex-1 min-w-[50px] min-h-[60px] px-0.5 py-2 flex flex-col items-center justify-center rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] font-semibold mt-1 leading-none">{t('nav.moreShort')}</span>
          </button>
        </nav>
      </main>

      <AnimatePresence>
        {selectedVideo && (() => {
          const isLocked = selectedVideo.isPremium && !profile?.isStrategist && !profile?.isAdmin;
          return (
            <ContentModal 
              title={selectedVideo.title} 
              onClose={closeVideoModal}
            >
              {isLocked ? (
                <div className="p-12 text-center space-y-6 my-auto">
                  <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg inline-block">
                      SOVEREIGN PREMIUM TRANSMISSION
                    </span>
                    <h3 className="text-xl font-black text-white uppercase italic">
                      {selectedVideo.title}
                    </h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      This video transmission is classified exclusively for Sovereign Tier members. Upgrade your account to unlock full access.
                    </p>
                  </div>
                  <button
                    onClick={() => { closeVideoModal(); openAscensionModal(); }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:scale-105 transition-all cursor-pointer font-mono"
                  >
                    Upgrade Account Access / अपग्रेड करें
                  </button>
                </div>
              ) : (
                <>
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-white/5">
                    {selectedVideo.videoUrl ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.videoUrl)}?autoplay=1`}
                        className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <img src={selectedVideo.thumbnail} className="w-full h-full object-cover opacity-20 grayscale" alt="video" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                            <PlayCircle className="w-10 h-10 text-black fill-black" />
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-white italic mb-2 tracking-tighter uppercase">{selectedVideo.title}</h2>
                          <div className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em]">Talk2Society Documentary Dossier</div>
                          <a
                            href={`https://www.youtube.com/@Talk2Society/search?query=${encodeURIComponent(selectedVideo.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer transition-all shadow-lg"
                          >
                            <Youtube className="w-4 h-4" />
                            <span>Watch on @Talk2Society YouTube</span>
                          </a>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Research Investigation Dossier */}
                  <div className="p-5 sm:p-7 md:p-8 space-y-6 bg-[#0a0b0e] border-t border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {selectedVideo.family && (
                          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs uppercase rounded-lg">
                            {selectedVideo.family}
                          </span>
                        )}
                        {selectedVideo.hindiFamily && (
                          <span className="text-xs text-zinc-400 font-medium font-mono">
                            ({selectedVideo.hindiFamily})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                        <span>{selectedVideo.views} Views</span>
                        <span>•</span>
                        <span>{selectedVideo.duration}</span>
                      </div>
                    </div>

                    {selectedVideo.question && (
                      <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-1.5">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black block">
                          CORE INVESTIGATION QUESTION // मूल प्रश्न
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                          “{selectedVideo.question}”
                        </h4>
                        {selectedVideo.hindiQuestion && (
                          <p className="text-xs text-zinc-400 italic">
                            {selectedVideo.hindiQuestion}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedVideo.hiddenSystemSummary && (
                        <div className="bg-black/50 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-2">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-black block">
                            THE HIDDEN SYSTEM // अदृश्य व्यवस्था
                          </span>
                          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
                            {selectedVideo.hiddenSystemSummary}
                          </p>
                        </div>
                      )}

                      {selectedVideo.consequence && (
                        <div className="bg-black/50 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-2">
                          <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-black block">
                            THE UNSEEN CONSEQUENCE // परिणाम
                          </span>
                          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
                            {selectedVideo.consequence}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedVideo.chandradiptiReflection && (
                      <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black block">
                            A. K. CHANDRADIPTI REFLECTION // चंद्रदीप्ति का चिंतन
                          </span>
                          <button
                            onClick={() => {
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                const utterance = new SpeechSynthesisUtterance(selectedVideo.chandradiptiReflection!);
                                utterance.rate = 0.95;
                                utterance.pitch = 0.9;
                                window.speechSynthesis.speak(utterance);
                              }
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen Voice</span>
                          </button>
                        </div>
                        <blockquote className="text-xs sm:text-sm text-amber-200 italic leading-relaxed">
                          “{selectedVideo.chandradiptiReflection}”
                        </blockquote>
                      </div>
                    )}
                  </div>
                </>
              )}
            </ContentModal>
          );
        })()}

        {selectedBook && (() => {
          const isLocked = selectedBook.isPremium && !profile?.isStrategist && !profile?.isAdmin;
          return (
            <ContentModal 
              title={selectedBook.title} 
              onClose={closeBookModal}
              maxWidth="max-w-7xl"
            >
              {isLocked ? (
                <div className="p-12 text-center space-y-6 my-auto">
                  <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg inline-block">
                      SOVEREIGN MANUSCRIPT RESTRICTED
                    </span>
                    <h3 className="text-2xl font-black text-white uppercase italic">
                      {selectedBook.title}
                    </h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      This strategic manuscript is restricted to Sovereign Tier members. Upgrade your account to unlock full manuscript reading.
                    </p>
                  </div>
                  <button
                    onClick={() => { closeBookModal(); openAscensionModal(); }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:scale-105 transition-all cursor-pointer font-mono"
                  >
                    Unlock Full Library Access / अपग्रेड करें
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col min-h-[85vh]">
                  <div className="p-8 border-b border-white/5 bg-black/40 shrink-0 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                    <div className="flex gap-8 items-start">
                      <div className="w-20 h-28 bg-neutral-900 border border-white/5 rounded-xl flex items-center justify-center shadow-2xl shrink-0 overflow-hidden">
                        {selectedBook.coverUrl ? (
                          <img src={selectedBook.coverUrl} className="w-full h-full object-cover" alt="cover" />
                        ) : (
                          <BookOpen className="w-8 h-8 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="text-amber-500 text-[8px] font-black uppercase tracking-widest mb-1">{selectedBook.category}</div>
                          <h2 className="text-2xl font-black text-white italic tracking-tighter leading-none">{selectedBook.title}</h2>
                          <div className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">— {selectedBook.author}</div>
                        </div>
                        <p className="text-gray-400 text-[10px] italic leading-relaxed line-clamp-2">
                          "{selectedBook.excerpt}"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-neutral-900 relative min-h-[600px]">
                    {selectedBook.fileUrl ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-0">
                          <div className="text-center p-8">
                            <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Initializing Secure Nexus Reader...</p>
                            <p className="text-gray-700 text-[10px] mt-2 italic max-w-xs mx-auto">
                              If the manuscript remains encrypted (does not load), ensure you are logged into Google and "Third-party cookies" are allowed for this session.
                            </p>
                          </div>
                        </div>
                        <iframe 
                          key={selectedBook.fileUrl}
                          src={getDrivePreviewUrl(selectedBook.fileUrl) || undefined} 
                          className="absolute inset-0 w-full h-full border-0 z-10"
                          title="book-viewer"
                          allow="autoplay"
                          sandbox="allow-scripts allow-same-origin allow-forms"
                          referrerPolicy="no-referrer"
                        />
                      </>
                    ) : selectedBook.chapters && selectedBook.chapters.length > 0 ? (
                      <Suspense fallback={<ViewLoader label="Loading Manuscript Reader..." />}>
                        <BuiltInBookReader book={selectedBook} />
                      </Suspense>
                    ) : (
                      <div className="h-full flex items-center justify-center p-12 text-center bg-[#0a0a0a]">
                        <div className="max-w-md space-y-6">
                          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="w-8 h-8 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Manuscript Restricted</h3>
                            <p className="text-gray-500 text-xs font-medium leading-relaxed uppercase tracking-widest">
                              The central database record for this manuscript does not contain a verified link. 
                            </p>
                          </div>
                          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">
                            <p className="mb-2 text-amber-500/80">ADMIN ACTION REQUIRED:</p>
                            1. Visit Nexus Command (Admin Panel)<br/>
                            2. Edit this book record<br/>
                            3. Provide a valid Google Drive Sharing URL
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ContentModal>
          );
        })()}

        {isSearchOpen && (
          <SearchModal 
            onClose={closeSearchModal} 
            journey={journeyModules} 
            archives={archives} 
            library={library} 
            profile={profile}
            onSelect={(type, item) => {
              const isLocked = item.isPremium && !profile?.isStrategist && !profile?.isAdmin;
              if (isLocked) {
                closeSearchModal();
                openAscensionModal();
                return;
              }
              if (type === 'journey') handleTabClick('journey');
              if (type === 'archive') {
                handleTabClick('archives');
                openVideoModal(item as VideoArchive);
              }
              if (type === 'library') {
                handleTabClick('library');
                openBookModal(item as LibraryBook);
              }
              closeSearchModal();
            }} 
          />
        )}

        {isAscensionOpen && (
          <AscensionModal onClose={closeAscensionModal} profile={profile!} />
        )}

        {showCertificateModal && profile && (
          <Suspense fallback={null}>
            <SovereignCertificateModal
              isOpen={showCertificateModal}
              onClose={() => setShowCertificateModal(false)}
              profile={profile}
            />
          </Suspense>
        )}

        {showJournalModal && profile && (
          <Suspense fallback={null}>
            <ReflectionsJournalModal
              isOpen={showJournalModal}
              onClose={() => setShowJournalModal(false)}
              reflections={profile.dailyReflections}
              userName={profile.displayName || 'Practitioner'}
            />
          </Suspense>
        )}

        {selectedJourneyModule && (
          <JourneyModuleDetailModal 
            module={selectedJourneyModule} 
            isCompleted={profile?.completedDays.includes(selectedJourneyModule.day) || false}
            isPrerequisiteLocked={selectedJourneyModule.day > 1 && !profile?.completedDays.includes(selectedJourneyModule.day - 1)}
            completedToday={isCompletedOnDate(profile?.lastCompletedAt)}
            isAdmin={profile?.isAdmin}
            onClose={closeJourneyModuleModal}
            onIntegrate={async () => {
              const day = selectedJourneyModule.day;
              closeJourneyModuleModal();
              await completeDay(day);
            }}
          />
        )}

        {isResetModalOpen && (
          <StrikeResetModal onClose={closeResetModal} />
        )}

        {showPWAInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-[#0a0a0a]/95 border border-amber-500/30 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md text-left"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-white text-xs font-black uppercase tracking-wider font-display">Talk2Society Mobile App / मोबाइल ऐप</h4>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none">ऑफ़लाइन और तेज़ स्पीड के लिए इनस्टॉल करें</div>
                </div>
              </div>
              <button 
                onClick={() => setShowPWAInstallPrompt(false)} 
                className="p-1 px-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-4 text-xs text-zinc-300 leading-relaxed font-sans">
              अपने मोबाइल पर **Talk2Society** ऐप इनस्टॉल करें ताकि बिना इंटरनेट रुकावट और पूरी स्क्रीन पर आसानी से वीडियो व किताबें पढ़ सकें।
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handlePWAInstall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install / इनस्टॉल</span>
              </button>
              <button
                onClick={() => setShowPWAInstallPrompt(false)}
                className="px-4 py-2.5 bg-white/5 border border-white/5 text-gray-400 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-colors"
              >
                Later
              </button>
            </div>
          </motion.div>
        )}

        {/* Global In-App Toast Notification */}
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[120] max-w-sm w-full p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 text-left ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50' 
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-200 shadow-amber-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-200 shadow-black/60'
            }`}
          >
            <div className="shrink-0 pt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="flex-1 space-y-1">
              <h5 className="text-xs font-bold font-mono tracking-wide">{toast.title}</h5>
              {toast.message && <p className="text-[11px] opacity-90 leading-relaxed font-sans">{toast.message}</p>}
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StrikeResetModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="bg-zinc-950 border-2 border-amber-500/30 rounded-[32px] md:rounded-[40px] p-6 md:p-12 max-w-xl w-full text-center space-y-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden my-auto"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />
        
        <div className="mx-auto w-24 h-24 bg-amber-600/10 rounded-full flex items-center justify-center border border-amber-500/20">
          <span className="text-5xl text-amber-500">🔥</span>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-display font-black text-amber-500 uppercase tracking-tight leading-none">
            STREAK RESET NOTICE
          </h2>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
            दैनिक निरंतरता अनुस्मारक
          </h3>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            अनुपस्थिति के कारण आपकी दैनिक स्ट्रीक (Streak) शून्य पर रीसेट हो गई है। 
            <br />
            <span className="text-emerald-400 font-bold">आपके पूरे किए गए सभी दिन (Completed Days), संचित XP एवं ज्ञान पूरी तरह सुरक्षित हैं।</span>
          </p>
          <p className="text-slate-400 text-xs md:text-sm italic leading-relaxed">
            "Your completed journey modules and achievements remain safely preserved in the database. Complete today's task to reignite your daily streak."
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-black text-xs md:text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl font-mono cursor-pointer"
        >
          I Understand, Continue / समझ गया, आगे बढ़ें
        </button>
      </motion.div>
    </motion.div>
  );
}

function ContentModal({ title, onClose, children, maxWidth = "max-w-5xl" }: { title: string, onClose: () => void, children: React.ReactNode, maxWidth?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-[#0a0a0a] border-t sm:border border-white/10 w-full ${maxWidth} rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[95vh] relative z-10`}
      >
        <div className="h-16 px-4 sm:px-6 md:px-8 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onClose} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white group cursor-pointer">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back (वापस)</span>
            </button>
            <div className="hidden md:block w-[1px] h-4 bg-white/10 mx-1" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic leading-tight truncate max-w-[200px] sm:max-w-md">{title}</span>
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-tight">सामाग्री लोड हो रही है</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Modals ---

function SearchModal({ onClose, journey, archives, library, onSelect, profile }: { 
  onClose: () => void, 
  journey: JourneyModule[], 
  archives: VideoArchive[], 
  library: LibraryBook[], 
  onSelect: (type: string, item: any) => void,
  profile: UserProfile | null
}) {
  const [queryStr, setQueryStr] = useState('');
  
  const results = [
    ...journey.filter(m => {
      const isCompleted = profile?.completedDays?.includes(m.day) || false;
      const isNext = (profile?.completedDays?.length || 0) + 1 === m.day;
      const journeyLocked = !isCompleted && !isNext && m.day > 1;
      const isPremiumLocked = m.isPremium && !profile?.isStrategist && !profile?.isAdmin;
      return !(journeyLocked || isPremiumLocked);
    }).map(m => ({ ...m, type: 'journey' })),
    ...archives.map(a => ({ ...a, type: 'archive' })),
    ...library.map(l => ({ ...l, type: 'library' }))
  ].filter(item => {
    const title = item.title?.toLowerCase() || '';
    const desc = (item as any).description?.toLowerCase() || (item as any).excerpt?.toLowerCase() || '';
    const q = queryStr.toLowerCase();
    return title.includes(q) || desc.includes(q);
  }).slice(0, 8);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-start justify-center pt-24 px-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <Target className="text-white w-6 h-6" />
          <input 
            autoFocus
            placeholder="COMMAND: SEARCH DATABASE..." 
            className="flex-1 bg-transparent border-none outline-none text-xl font-black italic text-white placeholder:text-neutral-700 font-mono"
            value={queryStr}
            onChange={e => setQueryStr(e.target.value)}
          />
          <div className="px-2 py-1 bg-white/5 rounded text-[8px] font-black uppercase text-gray-700 font-mono">ESC TO EXIT</div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {queryStr && results.length === 0 && (
            <div className="py-12 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">Zero Matches Found in Core</div>
          )}
          {!queryStr && (
            <div className="py-12 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">Input Directive to Search</div>
          )}
          {results.map((r, i: number) => (
            <button 
              key={i}
              onClick={() => onSelect(r.type, r)}
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-transparent hover:border-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  {r.type === 'journey' ? <Target size={16}/> : r.type === 'archive' ? <PlayCircle size={16}/> : <BookOpen size={16}/>}
                </div>
                <div>
                  <div className="text-white font-bold">{r.title}</div>
                  <div className="text-[10px] text-gray-700 uppercase font-black tracking-widest font-mono italic">{r.type} ARCHIVE</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-800" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function AscensionModal({ onClose, profile }: { onClose: () => void, profile: UserProfile }) {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.1)] relative p-6 md:p-10 text-center space-y-8 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header actions: Desktop Back button on left, Close button on right */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onClose}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back (वापस)</span>
          </button>
          <button 
            onClick={onClose}
            className="ml-auto p-2 rounded-xl bg-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-white/5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Premium Badge Icon */}
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.15)]">
          <Zap className="w-8 h-8 text-amber-500 fill-amber-500/20" />
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none select-none">
            Sovereign Ascension / संप्रभु प्रवेश
          </h2>
          <p className="text-zinc-500 font-mono text-[10px] font-black tracking-widest uppercase select-none">
            The Elite Strategists Handshake
          </p>
        </div>

        {/* Price Card */}
        <div className="p-4 bg-zinc-900 border border-zinc-900 rounded-2xl flex justify-between items-center text-left">
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Lifetime Membership / आजीवन सदस्यता</div>
            <div className="text-white font-black text-sm uppercase">Sovereign Pass / संप्रभु पास</div>
            <div className="text-[9px] text-amber-500 font-mono mt-0.5 uppercase tracking-wider font-extrabold flex items-center gap-1">
              <span className="w-1 h-1 bg-amber-500 rounded-full animate-ping" /> First 100 Users Special Offer
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="line-through text-zinc-600 text-xs font-bold">Rs. 2,999</span>
              <span className="text-2xl font-display font-black text-amber-500">Rs. 299</span>
            </div>
            <div className="text-[9px] font-mono text-zinc-500 font-black uppercase">One-Time / सदा के लिए</div>
          </div>
        </div>

        {/* Deliverables Checklist / Features */}
        <div className="p-5 bg-zinc-900/40 border border-zinc-900 rounded-2xl space-y-4 text-left">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Authorized Member Deliverables:</div>
          <div className="space-y-4 text-xs text-zinc-300 font-sans">
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block font-bold text-sm">100-Day Special Journey</strong>
                <span className="text-zinc-400">Unlock Day 01-100 full strategums, pdf scripts, and shadow channels.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block font-bold text-sm">Limitless Audio & Video Archives</strong>
                <span className="text-zinc-400">Gain access to all locked video lessons and hidden audio entries.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block font-bold text-sm">One-on-One Interaction Option</strong>
                <span className="text-zinc-400">Priority strategic mentor audit lesson with A. K. Chandradipti.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instruction Message */}
        <div className="p-6 bg-amber-500/[0.02] border border-amber-500/20 rounded-2xl space-y-3 text-center">
          <div className="text-amber-400 font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
            <Send className="w-3.5 h-3.5 fill-amber-500/10" /> Telegram DM Request
          </div>
          <p className="text-zinc-200 text-xs font-medium leading-relaxed max-w-sm mx-auto">
            To unlock Premium access for only <strong className="text-amber-400 font-bold">Rs. 299</strong> instead of the standard <span className="line-through text-zinc-500 font-bold">Rs. 2,999</span> (special slot for first 100 users), <strong className="text-amber-400 font-bold">DM us directly on Telegram</strong>. We will guide you to elevate your account manually.
          </p>
          <p className="text-zinc-400 text-[10px] font-semibold leading-relaxed max-w-sm mx-auto uppercase tracking-wide font-mono">
            पहले 100 उपयोगकर्ताओं के लिए विशेष छूट: असली कीमत Rs. 2,999 के बजाय केवल Rs. 299 में प्रीमियम एक्सेस और भुगतान विवरण प्राप्त करने के लिए कृपया टेलीग्राम पर हमें सीधे संदेश (DM) भेजें।
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <a 
            href="https://t.me/A_K_Chandradipti" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-mono font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 font-bold cursor-pointer font-sans"
          >
            <Send className="w-4 h-4 fill-black" /> DM on Telegram / टेलीग्राम पर संदेश भेजें
          </a>
          <button 
            onClick={onClose}
            className="px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl font-mono font-black uppercase tracking-widest text-[10px] md:text-xs transition-all cursor-pointer"
          >
            Close / बंद करें
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Sub-Components ---

function ProfileView({ 
  profile, 
  rank, 
  onOpenAscension,
  onOpenCertificate,
  onOpenJournal
}: { 
  profile: UserProfile, 
  rank: number | null, 
  onOpenAscension: () => void,
  onOpenCertificate: () => void,
  onOpenJournal: () => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile.displayName || "Anonymous User");
  const [newBio, setNewBio] = useState(profile.bio || "");
  const [newPhotoURL, setNewPhotoURL] = useState(profile.photoURL || "");
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setNewName(profile.displayName || "Anonymous User");
      setNewBio(profile.bio || "");
      setNewPhotoURL(profile.photoURL || "");
      setImageError(null);
    }
  }, [profile, isEditing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 700000) { // Limit to ~700KB for Base64 in Firestore to stay under 1MB doc limit
      setImageError("चित्र बहुत बड़ा है। कृपया 700KB से छोटा चित्र चुनें (Image must be under 700KB).");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoURL(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async () => {
    if (
      (!newName.trim() || newName === profile.displayName) && 
      newBio === (profile.bio || "") &&
      newPhotoURL === (profile.photoURL || "")
    ) {
      setIsEditing(false);
      return;
    }
    const userRef = doc(db, 'users', profile.uid);
    try {
      await updateDoc(userRef, { 
        displayName: newName,
        bio: newBio,
        photoURL: newPhotoURL,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start text-center md:text-left">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] md:rounded-[40px] overflow-hidden ring-4 ring-white/5 ring-offset-4 md:ring-offset-8 ring-offset-black shrink-0 shadow-2xl relative group">
          <img src={newPhotoURL || profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} alt="avatar" className="w-full h-full object-cover" />
          {isEditing && (
            <label className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="w-6 h-6 text-white mb-2" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white">Upload New</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
        {imageError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono max-w-xs">
            {imageError}
          </div>
        )}
        <div className="flex-1 space-y-6 w-full">
          <div className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Level {profile.level} / चरण {profile.level}</div>
          
          {isEditing ? (
            <div className="space-y-6 text-left">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Identity Display (नाम)</label>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Your Name (आपका नाम)"
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-xl sm:text-3xl font-display font-black text-white w-full max-w-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Profile Visual (प्रोफ़ाइल चित्र)</label>
                <div className="flex items-center gap-4 flex-wrap">
                  <button 
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="flex items-center gap-3 px-5 py-3 sm:px-6 sm:py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all text-left"
                  >
                    <ImageIcon size={16} />
                    Change Photo / फोटो बदलें
                  </button>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {newPhotoURL && newPhotoURL.startsWith('data:') && (
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">New Image Selected</span>
                  )}
                </div>
              </div>
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Talk about yourself... (अपने बारे में कुछ लिखें...)"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-gray-400 w-full max-w-md h-32 resize-none font-medium"
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md">
                <button onClick={updateProfile} className="px-8 py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl">
                  <Save size={16}/> Save Profile / सुरक्षित करें
                </button>
                <button onClick={() => {
                  setIsEditing(false);
                  setNewName(profile.displayName);
                  setNewBio(profile.bio || "");
                  setNewPhotoURL(profile.photoURL || "");
                }} className="px-8 py-3 bg-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-wider justify-center">
                  Cancel / रद्द करें
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-black text-white tracking-tight uppercase leading-none">{profile.displayName}</h1>
                <button onClick={() => setIsEditing(true)} className="p-2 md:p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5 shrink-0"><Edit2 size={18}/></button>
              </div>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-xl font-medium italic leading-relaxed mx-auto md:mx-0">
                {profile.bio || "No summary provided. Edit your profile to share your journey. (कोई जानकारी उपलब्ध नहीं है।)"}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3 text-gray-600 text-[10px] font-bold uppercase tracking-widest flex-wrap">
                <span>{profile.email}</span>
                <span className="w-1 h-1 bg-gray-800 rounded-full" />
                <span>Verified Participant</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Trophy className="text-white" />} label="Total Points" secondaryLabel="कुल अंक" value={(profile.xp ?? 0).toLocaleString()} />
        <StatCard icon={<Flame className="text-white" />} label="Daily Streak" secondaryLabel="दैनिक सिलसिला" value={`${profile.streak ?? 1} Days`} />
        {(() => {
          const rankInfo = getRankFromXP(profile.xp || 0);
          return <StatCard icon={<Target className="text-white" />} label="Your Rank" secondaryLabel={rankInfo.name} value={`#${rank || '...'}`} />;
        })()}
        <StatCard 
          icon={<Shield className="text-white" />} 
          label="Member Status" 
          secondaryLabel="सदस्यता स्तर"
          value={profile.isAdmin ? 'Admin' : profile.isStrategist ? 'Special' : 'Standard'} 
        />
      </div>

      {/* Quick Access Badges for Certificate & Wisdom Journal */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenCertificate}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 rounded-2xl text-xs font-mono font-bold text-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>संप्रभुता प्रमाण पत्र देखें (Milestone Certificate)</span>
        </button>

        <button
          onClick={onOpenJournal}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-xs font-mono font-bold text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>दैनिक चिंतन डायरी ({Object.keys(profile.dailyReflections || {}).length} प्रविष्टियां)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(!profile.isStrategist && !profile.isAdmin) ? (
          <Card className="lg:col-span-2 bg-white/5 border-white/20">
            {profile.premiumRequestStatus === 'pending' ? (
              <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                <div className="w-24 h-24 bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.15)] rotate-3 shrink-0">
                  <Zap size={48} className="text-amber-400 fill-amber-400/20" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-full text-[9px] font-mono font-black uppercase tracking-widest">
                    ⏱️ PAYMENT VERIFICATION PENDING / सत्यापन लंबित है
                  </div>
                  <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none pt-1">Ledger Update in Progress</h2>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">
                    व्यवस्थापक (<strong className="text-amber-400">A. K. Chandradipti</strong>) आपके भुगतान सत्यापन का मिलान कर रहे हैं। आपके अनुरोध की समीक्षा पूर्ण होने पर, आपकी सदस्यता स्वचालित रूप से <strong className="text-white">Special Strategist (संप्रभु)</strong> स्तर पर उन्नत कर दी जाएगी। (सामान्यतः इसमें 1-2 घंटे का समय लगता है)
                  </p>
                  <div className="pt-3 font-mono text-[10px] text-zinc-500 uppercase flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start">
                    <div>
                      <span className="text-zinc-600 font-bold">Plan Requested:</span> <strong className="text-amber-400 font-mono">{profile.premiumRequestPlan === 'elite' ? 'Elite 1-on-1 Consult' : 'Sovereign Full Pass'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-600 font-bold">Details:</span> <strong className="text-zinc-300 font-mono">{profile.premiumRequestDetails || 'Cash/UPI'}</strong>
                    </div>
                    {profile.premiumRequestTransactionId && (
                      <div>
                        <span className="text-zinc-600 font-bold">Transaction ID:</span> <strong className="text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20 rounded">{profile.premiumRequestTransactionId}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] rotate-3 shrink-0">
                  <Zap size={48} className="text-black fill-black" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Join Special Group / विशेष सदस्य बनें</h2>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-xl">
                    Unlock the exclusive full potential (<span className="line-through">Rs. 2,999</span> <strong className="text-amber-400 font-bold">Rs. 299</strong> only for the first 100 users!). Access all books, video breakdowns, and special training modules.
                  </p>
                  <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                    <button 
                      onClick={onOpenAscension}
                      className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-gray-200 transition-all shadow-xl flex flex-col items-center cursor-pointer font-bold"
                    >
                      <span>Unlock Special Access</span>
                      <span className="text-[8px] normal-case tracking-normal opacity-60">Rs. 299 (<s>Rs. 2,999</s>) • 1st 100 users offer</span>
                    </button>
                    <div className="px-6 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-700 font-mono">
                      Special Membership Required
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="lg:col-span-2 bg-gradient-to-r from-green-500/5 via-neutral-900 to-green-500/5 border-green-500/20">
            <div className="flex flex-col md:flex-row items-center gap-8 py-4">
              <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/30 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.15)] rotate-3 shrink-0">
                <Zap size={48} className="text-green-400 fill-green-400" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-400 rounded-full text-[9px] font-mono font-black uppercase tracking-widest">
                  👑 SOVEREIGN CLEARANCE / प्रीमियम संप्रभु प्राप्त है
                </div>
                <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none pt-1">Premium Access Active</h2>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">
                  Your payment confirmation has been successfully matched against the manual ledger and approved. You hold complete administrative & special membership permissions. Enjoy limitless files, strategies, and shadow channels.
                </p>
              </div>
            </div>
          </Card>
        )}
        
        <Card className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Curriculum Engagement / पाठ्यक्रम विवरण
            </h3>
            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Active</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">100-Day Consciousness</span>
              <div className="text-xl font-bold font-mono text-white">{(profile.completedDays || []).length} / 100 Days</div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Disciplined Presence</span>
              <div className="text-xl font-bold font-mono text-amber-400">{profile.streak || 1} Days Active</div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Reflection Journal</span>
              <div className="text-xl font-bold font-mono text-white">{Object.keys(profile.dailyReflections || {}).length} Entries</div>
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Recent Integrations
            </h3>
            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Encrypted</span>
          </div>
          <div className="space-y-3">
             {(!profile.completedDays || profile.completedDays.length === 0) ? (
               <p className="text-gray-500 italic text-sm">No modules integrated into frame yet.</p>
             ) : (
               [...(profile.completedDays || [])].reverse().slice(0, 5).map(day => (
                 <div key={day} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="text-xs font-black text-white/40 font-mono">DAY {day < 10 ? `0${day}` : day}</div>
                     <div className="text-xs text-white/70 font-bold uppercase tracking-tight">Pattern Recognized</div>
                   </div>
                   <div className="text-[10px] text-gray-700 font-mono">AUTHORIZED</div>
                 </div>
               ))
             )}
          </div>
        </Card>

        {/* TFS Dynamic Wisdom Log / Daily Reflections Timeline */}
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" /> Wisdom Log / दैनिक चिंतन इतिहास
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenJournal}
                className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3 h-3" />
                <span>डायरी खोलें व एक्सपोर्ट करें (Full Journal)</span>
              </button>
              <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
                {Object.keys(profile.dailyReflections || {}).length} Recorded
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {!profile.dailyReflections || Object.keys(profile.dailyReflections).length === 0 ? (
              <p className="text-gray-500 italic text-sm text-center py-8 col-span-2">
                No nightly reflections recorded yet. Your wisdom timeline will appear here. (कोई चिंतन उपलब्ध नहीं है।)
              </p>
            ) : (
              Object.entries(profile.dailyReflections)
                .sort((a, b) => b[0].localeCompare(a[0])) // Sort newest calendar date first
                .map(([date, reflection]) => (
                  <div key={date} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl space-y-3 transition-colors flex flex-col justify-between">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-500/10">
                        {date}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const text = `✦ Talk2Society Nightly Wisdom [${date}]\n"${reflection}"\n— ${profile.displayName}`;
                            navigator.clipboard.writeText(text);
                          }}
                          title="Copy reflection"
                          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => {
                            const msg = `*Talk2Society Nightly Wisdom* 📜\n\n"${reflection}"\n\n🗓️ Date: ${date}\n👤 Practitioner: ${profile.displayName}\n⚡ 100-Day Consciousness Journey`;
                            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          title="Share on WhatsApp"
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Share2 size={11} />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 font-medium italic leading-relaxed">
                      "{reflection}"
                    </p>
                  </div>
                ))
            )}
          </div>
        </Card>

        <div className="lg:col-span-2">
          <AndroidInstallCard />
        </div>

        <div className="lg:col-span-2 mt-8">
          <LeaderboardView currentUserUid={profile.uid} />
        </div>
      </div>
    </motion.div>
  );
}

function AndroidInstallCard() {
  const [installSupported, setInstallSupported] = useState(false);
  const [deferredPromptState, setDeferredPromptState] = useState<any>(null);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPromptState(e);
      setInstallSupported(true);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPromptState) {
      setShowManualGuide(prev => !prev);
      return;
    }
    deferredPromptState.prompt();
    const { outcome } = await deferredPromptState.userChoice;
    if (outcome === 'accepted') {
      setInstallSupported(false);
    }
  };

  return (
    <Card className="bg-[#0c0c0c] border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)] overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6">
        <div className="flex items-center gap-5 text-left">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <Smartphone className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 rounded-full font-mono uppercase tracking-widest select-none mb-1.5">
              <span>Android & iOS Native App Installer</span>
            </div>
            <h4 className="text-white text-lg font-black uppercase tracking-tight">Talk2Society मोबाइल ऐप इनस्टॉलर</h4>
            <p className="text-xs text-zinc-300 max-w-xl mt-1 leading-relaxed">
              Talk2Society ऐप को सीधे अपने फ़ोन में इंस्टॉल करें! इससे आपको मिलेगा तेज एक्सेस, बिना इंटरनेट रुकावट अध्ययन और मोबाइल स्क्रीन के अनुकूल शानदार अनुभव।
            </p>
          </div>
        </div>
        <button
          onClick={triggerInstall}
          className="w-full md:w-auto px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:scale-[1.02] text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>ऐप इनस्टॉल करें (Install App)</span>
        </button>
      </div>

      {showManualGuide && (
        <div className="mx-6 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono">
          <p className="font-bold flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-amber-400" />
            मोबाइल पर इनस्टॉल करने का आसान तरीका:
          </p>
          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
            यदि अपने आप इनस्टॉल का पॉपअप नहीं आया है, तो अपने मोबाइल ब्राउज़र (Chrome या Safari) के मेनू (तीन डॉट्स ⋮ या Share बटन) पर टैप करें और <strong>"Install app"</strong> या <strong>"Add to Home screen" (होम स्क्रीन पर जोड़ें)</strong> चुनें।
          </p>
        </div>
      )}
      
      <div className="border-t border-white/5 bg-black/40 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Step 01 • Connect URL</span>
          <h5 className="text-white text-xs font-black uppercase tracking-tight leading-none pt-0.5">Mobile Access Route</h5>
          <p className="text-[10px] text-gray-500 leading-normal">
            Open Chrome, Samsung Web Browser, or any Safari browser on your phone and enter this active URL.
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Step 02 • Native Install</span>
          <h5 className="text-white text-xs font-black uppercase tracking-tight leading-none pt-0.5">Launcher Integration</h5>
          <p className="text-[10px] text-gray-500 leading-normal">
            Select "Add to home screen" inside browser settings or click the button above to spawn the native icon package.
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Step 03 • Synchronized Core</span>
          <h5 className="text-white text-xs font-black uppercase tracking-tight leading-none pt-0.5">Real-Time Ledger</h5>
          <p className="text-[10px] text-gray-500 leading-normal">
            Log in on mobile to automatically resume your daily streaks, module integrations, and premium access with 100% security.
          </p>
        </div>
      </div>
    </Card>
  );
}

function LeaderboardView({ currentUserUid }: { currentUserUid?: string }) {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
    return onSnapshot(q, (snap) => {
      setLeaders(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'users/leaderboard');
      } else {
        console.warn("Waiting for internet connection to fetch leaderboard...");
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-[32px] border border-white/5" />
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <NoContent label="Strategists" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {leaders.slice(0, 3).map((leader, i) => {
          const rankInfo = getRankFromXP(leader.xp || 0);
          return (
            <motion.div
              key={leader.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-[32px] border flex flex-col items-center text-center relative overflow-hidden ${
                i === 0 ? 'bg-amber-500/10 border-amber-500/30 scale-105 z-10' : 
                i === 1 ? 'bg-blue-500/10 border-blue-500/30' : 
                'bg-slate-500/10 border-slate-500/30'
              }`}
            >
              <div className="absolute top-4 right-4 text-2xl font-black italic opacity-20">#{i + 1}</div>
              <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 ring-2 ring-white/10 p-0.5">
                <img src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`} className="w-full h-full object-cover" alt="" />
              </div>
              <h3 className="font-bold text-white uppercase tracking-tight text-lg leading-tight mb-1">{leader.displayName}</h3>
              <div className={`text-[10px] px-3 py-0.5 rounded-full font-black uppercase tracking-widest text-white mb-4 ${rankInfo.color}`}>
                {rankInfo.name}
              </div>
              <div className="text-2xl font-display font-black text-white italic">{(leader.xp || 0).toLocaleString()}<span className="text-[10px] ml-1 opacity-40 uppercase tracking-widest">xp</span></div>
            </motion.div>
          );
        })}
      </div>

      <Card className="p-0 border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Rank</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Member</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">XP Points</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader, index) => {
                const rankInfo = getRankFromXP(leader.xp || 0);
                const isCurrent = leader.uid === currentUserUid;
                return (
                  <tr key={leader.uid} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${isCurrent ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-8 py-6">
                      <span className={`text-sm font-black italic ${index < 3 ? 'text-amber-500' : 'text-gray-600'}`}>#{index + 1}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0">
                          <img src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white uppercase">{leader.displayName}</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{rankInfo.hindiName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-white italic">{(leader.xp || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest text-white inline-block ${rankInfo.color} shadow-lg`}>
                        {rankInfo.name}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )}
</div>
  );
}

function StatCard({ icon, label, secondaryLabel, value }: { icon: React.ReactNode, label: string, secondaryLabel?: string, value: string }) {
  return (
    <Card className="flex items-center gap-6 p-6">
      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">{icon}</div>
      <div className="flex flex-col items-start leading-tight">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</div>
        {secondaryLabel && <div className="text-[9px] text-gray-500 font-medium mb-1">{secondaryLabel}</div>}
        <div className="text-3xl font-display font-black text-white">{value}</div>
      </div>
    </Card>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-amber-500/10 border border-amber-500/30" />
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="absolute inset-[-4px] rounded-2xl border border-dashed border-amber-500/20"
        />
        <Logo className="w-12 h-12 relative z-10" src="/Logo-real.png" />
      </div>
      <div className="text-center space-y-2 max-w-xs">
        <div className="text-xs font-mono font-black tracking-widest text-white uppercase">
          TALK2SOCIETY // NEXUS
        </div>
        <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          सुरक्षित संप्रभु डेटाबेस सिंक्रोनाइज़ेशन...
        </p>
      </div>
      <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden mt-6 relative border border-white/5">
        <motion.div 
          animate={{ left: ['-40%', '100%'] }} 
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
        />
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center relative z-10 space-y-8 md:space-y-10">
        <div className="w-24 h-24 md:w-28 md:h-28 mx-auto relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/10 border border-amber-500/30 blur-sm" />
          <Logo className="w-20 h-20 md:w-24 md:h-24 relative z-10" src="/Logo-real.png" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-white uppercase">Talk2Society</h1>
          <p className="text-zinc-400 text-xs md:text-sm font-medium leading-relaxed">Social Reality &amp; Sovereign Platform / दिमागी स्वतंत्रता</p>
        </div>
        <button 
          onClick={onLogin} 
          className="w-full py-4 md:py-5 bg-white hover:bg-zinc-100 text-black rounded-2xl font-black uppercase tracking-wider text-xs transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xl cursor-pointer active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </div>
          <span className="text-[10px] text-zinc-600 font-semibold lowercase tracking-normal">गूगल से प्रवेश करें</span>
        </button>
      </motion.div>
    </div>
  );
}

function NoContent({ label }: { label: string }) {
  return (
    <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
      <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto">
        <Target className="w-6 h-6 text-amber-500/50" />
      </div>
      <div className="space-y-1">
        <p className="text-zinc-300 text-xs font-mono font-bold uppercase tracking-wider">
          डेटाबेस में {label} उपलब्ध नहीं
        </p>
        <p className="text-zinc-400 text-[11px] font-sans">
          Central records currently contain no entries for this category.
        </p>
      </div>
    </div>
  );
}

function VideoCard({ video, onClick, isLocked, onUnlockClick }: { video: VideoArchive, onClick: () => void, isLocked?: boolean, onUnlockClick?: () => void, key?: React.Key }) {
  return (
    <div 
      className={`group cursor-pointer flex flex-col justify-between space-y-4 ${isLocked ? 'opacity-85' : ''}`} 
      onClick={isLocked ? onUnlockClick : onClick}
    >
      <div className="space-y-3">
        {/* Filmic 16:9 Thumbnail Poster */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl transition-all group-hover:border-amber-500/40 group-hover:scale-[1.01] bg-zinc-950">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isLocked ? (
              <div className="w-14 h-14 bg-zinc-900/90 border border-amber-500/50 rounded-full flex flex-col items-center justify-center shadow-2xl">
                <Lock className="w-5 h-5 text-amber-500 mb-0.5" />
                <span className="text-[7px] font-mono text-amber-400 uppercase tracking-widest font-bold">Unlock</span>
              </div>
            ) : (
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <PlayCircle className="w-8 h-8 text-black fill-black" />
              </div>
            )}
          </div>

          {video.family && (
            <div className="absolute top-3 left-3 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider px-2.5 py-1 bg-black/80 backdrop-blur border border-amber-500/30 rounded-md">
              {video.family}
            </div>
          )}

          {video.isPremium && (
            <div className="absolute top-3 right-3 text-[9px] font-mono font-bold text-black uppercase tracking-wider px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-md flex items-center gap-1 shadow-md">
              Sovereign <Zap size={10} fill="black" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 px-0.5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
            {video.family ? `${video.family} · Investigation` : 'Documentary Case File'}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors tracking-tight line-clamp-2 leading-snug">
            {video.title}
          </h3>

          {video.question && (
            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
              "{video.question}"
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono pt-1">
            <span>{video.views} Views</span>
            <span aria-hidden="true">·</span>
            <span>{video.duration}</span>
            <span aria-hidden="true">·</span>
            <span>Hindi Commentary</span>
          </div>
        </div>
      </div>

      <button className={`w-full py-2.5 border rounded-xl transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer ${
        isLocked 
          ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500 hover:text-black' 
          : 'text-zinc-300 border-zinc-800 bg-zinc-900/60 group-hover:bg-white group-hover:text-black group-hover:border-white'
      }`}>
        {isLocked ? '🔒 Unlock Sovereign Dossier' : 'Watch & Inspect Dossier'}
      </button>
    </div>
  );
}

function BookCard({ book, onClick, isLocked, onUnlockClick }: { book: LibraryBook, onClick: () => void, isLocked?: boolean, onUnlockClick?: () => void, key?: React.Key }) {
  return (
    <div 
      className={`bg-[#0c0e14] border border-[#1d222e] hover:border-amber-500/30 rounded-[28px] p-5 transition-all group cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden ${isLocked ? 'opacity-90' : ''}`} 
      onClick={isLocked ? onUnlockClick : onClick}
    >
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="w-full sm:w-32 h-44 bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shrink-0 relative group-hover:scale-[1.02] transition-transform">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
          ) : (
            <div className="w-full h-full border border-white/5 bg-black/50 flex flex-col items-center justify-center p-2 text-center">
              <BookOpen className="w-8 h-8 text-amber-500/60 mb-2" />
              <span className="text-[8px] font-mono text-gray-500 uppercase">Strategic Text</span>
            </div>
          )}
          
          {isLocked && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-[2px]">
              <Lock className="w-6 h-6 text-amber-500 mb-1" />
              <span className="text-[7px] font-mono text-amber-500 font-black uppercase tracking-widest">Locked Pass</span>
            </div>
          )}

          {book.isPremium && (
            <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg z-10">
              <Zap size={10} className="text-black" fill="black" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500/90 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                {book.category || 'General'}
              </span>
              {book.isPremium && (
                <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  Sovereign <Zap size={8} fill="currentColor" />
                </span>
              )}
            </div>
            <h3 className="text-lg font-display font-black text-white group-hover:text-amber-400 transition-colors tracking-tight leading-snug line-clamp-2">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider mt-0.5">
                by {book.author}
              </p>
            )}
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 italic mt-2">
              "{book.excerpt}"
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className={`text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${isLocked ? 'text-amber-500' : 'text-gray-300 group-hover:text-amber-400'}`}>
              {isLocked ? '🔒 Unlock Sovereign Manuscript' : 'Read Manuscript'}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, secondaryLabel, active, onClick, collapsed }: any) {
  return (
    <button 
      onClick={onClick} 
      title={collapsed ? `${label}${secondaryLabel ? ` · ${secondaryLabel}` : ''}` : undefined}
      className={`transition-all duration-200 group relative flex items-center shrink-0 cursor-pointer select-none ${
        collapsed 
          ? `w-12 h-12 justify-center mx-auto rounded-2xl ${
              active 
                ? 'bg-amber-500/10 text-white shadow-md border border-amber-500/40' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`
          : `w-full gap-3 px-3 py-2.5 rounded-2xl ${
              active 
                ? 'bg-amber-500/10 text-white shadow-md border border-amber-500/40' 
                : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800'
            }`
      }`}
    >
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <span className={`relative z-10 flex items-center justify-center transition-transform duration-200 ${
          active ? 'text-amber-400 scale-105' : 'text-zinc-400 group-hover:text-white'
        }`}>
          {icon}
        </span>
      </div>

      {!collapsed && (
        <div className="flex flex-col items-start gap-0.5 overflow-hidden min-w-0 flex-1">
          <span className={`text-xs font-black uppercase tracking-wider leading-tight truncate ${active ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
            {label}
          </span>
          {secondaryLabel && (
            <span className={`text-[10px] font-bold leading-tight truncate ${active ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400/80'}`}>
              {secondaryLabel}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function ShopView({ profile }: { profile: UserProfile }) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'shop'), orderBy('category', 'asc'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopProduct));
      setProducts(data);
      localStorage.setItem('t2s_shop_cache', JSON.stringify(data));
      setLoading(false);
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'shop');
      } else {
        console.warn("Waiting for internet connection to fetch shop catalog...");
      }
      const cached = localStorage.getItem('t2s_shop_cache');
      if (cached) {
        try {
          setProducts(JSON.parse(cached));
        } catch (e) {
          console.error("Failed to parse cached shop products:", e);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleProductClick = async (product: ShopProduct) => {
    try {
      if (product.id) {
        await updateDoc(doc(db, 'shop', product.id), {
          clicks: increment(1)
        });
      }
    } catch (e) {
      console.error('Failed to track click:', e);
    }
  };

  const displayProducts = products.length > 0 ? products : DEFAULT_SHOP_PRODUCTS;

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-16 pb-20">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tight uppercase">Strategic <span className="text-gray-500">Shop</span></h1>
        <p className="text-gray-400 text-base md:text-xl leading-relaxed font-medium">
          Curated resources for your personal growth. We recommend essential tools from trusted external platforms.
          (आपके विकास के लिए बेहतरीन संसाधन)
        </p>
        <div className="flex items-center gap-2 text-[10px] text-amber-500/60 font-bold uppercase tracking-widest bg-amber-500/5 border border-amber-500/10 w-fit px-3 py-1 rounded-full">
          <ExternalLink size={10} />
          <span>Product links will redirect to respective stores</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {displayProducts.map(product => (
          <div key={product.id} className="group bg-[#0a0a0a] border border-white/5 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden flex flex-col hover:border-white/20 transition-all duration-500 shadow-2xl">
            <div className="aspect-[4/3] overflow-hidden bg-neutral-900 relative">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2">
                <div className="px-3 py-1 sm:px-4 sm:py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                  {product.category}
                </div>
                {product.platform && (
                  <div className="px-3 py-1 sm:px-4 sm:py-1.5 bg-amber-500 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-2xl">
                    On {product.platform}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 sm:p-8 md:p-10 flex-1 flex flex-col space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight leading-tight">{product.name}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-bold text-amber-500">{product.price}</span>
                  {product.clicks !== undefined && (
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{product.clicks} Clicks</span>
                  )}
                </div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed flex-1 italic">
                {product.description}
              </p>
              <a 
                href={product.affiliateUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => handleProductClick(product)}
                className="w-full py-4 sm:py-5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-xl sm:rounded-2xl hover:bg-neutral-200 transition-all flex flex-col items-center justify-center gap-1 shadow-xl group-hover:bg-amber-500 group-hover:text-black transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>View on {product.platform || 'Store'}</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] normal-case tracking-normal opacity-60 font-bold">Respective platform पर देखें</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {displayProducts.length === 0 && <NoContent label="Resources" />}
    </div>
  );
}

interface JourneyModuleDetailModalProps {
  module: JourneyModule;
  isCompleted: boolean;
  isPrerequisiteLocked?: boolean;
  completedToday?: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onIntegrate: () => void;
}

function JourneyModuleDetailModal({ 
  module, 
  isCompleted, 
  isPrerequisiteLocked = false, 
  completedToday = false, 
  isAdmin = false, 
  onClose, 
  onIntegrate 
}: JourneyModuleDetailModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-zinc-950 border border-white/10 rounded-[32px] md:rounded-[40px] max-w-2xl w-full text-left p-6 md:p-10 shadow-2xl relative overflow-hidden my-auto"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        
        <div className="flex items-center justify-between mb-2 pt-2">
          <button 
            onClick={onClose}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs text-zinc-300 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back (वापस)</span>
          </button>
          <button 
            onClick={onClose}
            className="ml-auto p-2 bg-white/5 border border-white/5 hover:border-white/10 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5 pt-4">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-500 font-mono block">
              {module.phase || "Phase 1: THE PURGE"}
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono font-black py-0.5 px-2.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20 shrink-0">
                DAY {module.day}
              </span>
              <h2 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-tight leading-none">
                {module.title}
              </h2>
            </div>
          </div>

          <div className="border-t border-white/5 my-4" />

          {/* Command */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-mono text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" /> COMMAND / निर्देश
            </h4>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white text-sm md:text-base leading-relaxed font-semibold">
              {module.command || module.description}
            </div>
          </div>

          {/* Dark Psychology */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-mono text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500" /> DARK PSYCHOLOGY / डार्क साइकोलॉजी (WHY)
            </h4>
            <div className="p-5 bg-rose-950/5 border border-rose-500/10 rounded-2xl text-zinc-300 text-xs md:text-sm leading-relaxed font-mono">
              {module.logic || "The logic for this day is heavily guided by ancient sovereign secrets. Formulate sovereignty in action."}
            </div>
          </div>

          <div className="border-t border-white/5 my-4" />

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            {isCompleted ? (
              <div className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-black uppercase tracking-widest rounded-2xl text-center flex flex-col items-center justify-center gap-1 font-mono">
                <span>✓ Day Completed / पूरा हो गया</span>
                <span className="text-[9px] opacity-60 font-medium normal-case font-sans">You have integrated this task.</span>
              </div>
            ) : isPrerequisiteLocked && !isAdmin ? (
              <div className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs md:text-sm font-black uppercase tracking-widest rounded-2xl text-center flex flex-col items-center justify-center gap-1 font-mono">
                <span>🔒 दिन {module.day - 1} पूरा करें (Locked)</span>
                <span className="text-[9px] opacity-75 font-medium normal-case font-sans">Prerequisite: Day {module.day - 1} must be completed first.</span>
              </div>
            ) : completedToday && !isAdmin ? (
              <div className="flex-1 py-4 bg-zinc-900 border border-amber-500/30 text-amber-300 text-xs md:text-sm font-black uppercase tracking-widest rounded-2xl text-center flex flex-col items-center justify-center gap-1 font-mono">
                <span>आज का कार्य पूर्ण • 12:00 AM IST पर खुलेगा</span>
                <span className="text-[9px] opacity-75 font-medium normal-case font-sans">Single task per day limit reached. Next unlocks tonight.</span>
              </div>
            ) : (
              <button
                onClick={onIntegrate}
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black text-xs md:text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] font-mono flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-98"
              >
                <span>Integrate Day {module.day} / संकलन करें</span>
                <span className="text-[9px] opacity-80 font-bold normal-case font-sans">Marks progress (+100 XP)</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-xs md:text-sm font-black uppercase tracking-widest rounded-2xl transition-all font-mono cursor-pointer"
            >
              Close / बंद करें
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
