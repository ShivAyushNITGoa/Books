import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlayCircle, CheckCircle2, Lock, Flame, Sparkles, 
  Search, BookOpen, Volume2, VolumeX, ArrowLeft, ChevronRight, X, Send, Award,
  HelpCircle, ShieldCheck, ChevronDown, Clock, Zap, AlertTriangle, Filter,
  Pause, Play, FileText, Share2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JourneyModule, UserProfile } from '../types';
import DayCountdownTimer from './DayCountdownTimer';
import PresenceCalendar from './PresenceCalendar';
import { navHistory } from '../utils/navigationHistory';
import { isCompletedOnDate } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import DailyStartCard from './DailyStartCard';

const ReflectionsJournalModal = React.lazy(() => 
  import('./ReflectionsJournalModal').then(m => ({ default: m.ReflectionsJournalModal }))
);
const SovereignCertificateModal = React.lazy(() => 
  import('./SovereignCertificateModal').then(m => ({ default: m.SovereignCertificateModal }))
);

interface JourneyViewProps {
  journeyModules: JourneyModule[];
  profile: UserProfile | null;
  onCompleteDay: (day: number) => Promise<void>;
  onSubmitReflection: (content: string) => Promise<void>;
}

export default function JourneyView({ 
  journeyModules, 
  profile, 
  onCompleteDay,
  onSubmitReflection 
}: JourneyViewProps) {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDayPhase, setSelectedDayPhase] = useState<string>('All Days');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalModule, setActiveModalModule] = useState<JourneyModule | null>(null);
  const [reflectionInput, setReflectionInput] = useState('');
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  const [isPausedTTS, setIsPausedTTS] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('t2s_audio_rate');
      return saved ? parseFloat(saved) : 0.95;
    } catch {
      return 0.95;
    }
  });
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Stop speech when modal closes or changes
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
    setIsPausedTTS(false);
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeModalModule]);

  const toggleDayTTS = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
      setIsPausedTTS(false);
      return;
    }
    if (!activeModalModule) return;

    const speechText = `दिन ${activeModalModule.day}: ${activeModalModule.hindiTitle || activeModalModule.title}. ${activeModalModule.hindiDescription || activeModalModule.description}. ${activeModalModule.content || ''}`;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('hi-IN'));
    if (hindiVoice) utterance.voice = hindiVoice;
    utterance.lang = 'hi-IN';
    utterance.rate = audioSpeed;
    utterance.onend = () => {
      setIsPlayingTTS(false);
      setIsPausedTTS(false);
    };
    utterance.onerror = () => {
      setIsPlayingTTS(false);
      setIsPausedTTS(false);
    };
    window.speechSynthesis.speak(utterance);
    setIsPlayingTTS(true);
    setIsPausedTTS(false);
  };

  const pauseDayTTS = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingTTS && !isPausedTTS) {
      window.speechSynthesis.pause();
      setIsPausedTTS(true);
    }
  };

  const resumeDayTTS = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingTTS && isPausedTTS) {
      window.speechSynthesis.resume();
      setIsPausedTTS(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setAudioSpeed(speed);
    localStorage.setItem('t2s_audio_rate', speed.toString());
    if (isPlayingTTS && !isPausedTTS && activeModalModule) {
      window.speechSynthesis.cancel();
      const speechText = `दिन ${activeModalModule.day}: ${activeModalModule.hindiTitle || activeModalModule.title}. ${activeModalModule.hindiDescription || activeModalModule.description}. ${activeModalModule.content || ''}`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('hi-IN'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = speed;
      utterance.onend = () => {
        setIsPlayingTTS(false);
        setIsPausedTTS(false);
      };
      utterance.onerror = () => {
        setIsPlayingTTS(false);
        setIsPausedTTS(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const JOURNEY_FAQS = [
    {
      q_en: "How does the Daily Unlock Cycle work?",
      q_hi: "अनलॉक समय चक्र कैसे काम करता है?",
      a_en: "Every new day's module unlocks automatically at 12:00 AM Midnight IST (India Standard Time, UTC+5:30). You can track the live countdown timer at the top of the Journey view to see exact hours, minutes, and seconds remaining until the next module unlocks.",
      a_hi: "हर नए दिन का मॉड्यूल भारतीय समयानुसार (IST) रात १२:०० बजे (मध्यरात्रि) अपने आप अनलॉक होता है। आप जर्नी व्यू में ऊपर चल रहे लाइव काउंटडाउन टाइमर से देख सकते हैं कि अगला मॉड्यूल खुलने में कितने घंटे, मिनट और सेकंड बाकी हैं।"
    },
    {
      q_en: "Can I skip days or complete modules out of order?",
      q_hi: "क्या मैं बीच के दिन छोड़कर आगे बढ़ सकता हूँ?",
      a_en: "No. The 100-Day Journey enforces a strict sequential prerequisite rule. You must complete Day N-1 before Day N unlocks. This builds genuine daily consistency and prevents rushing through lessons without internalizing them.",
      a_hi: "नहीं। १००-दिन का सफर एक सख्त क्रमिक (Sequential) नियम का पालन करता है। दिन 'N' केवल तभी अनलॉक होगा जब आप उससे पिछला दिन 'N-1' सफलता पूर्वक पूरा कर लेंगे। यह दैनिक अनुशासन और निरंतरता बनाए रखने के लिए अनिवार्य है।"
    },
    {
      q_en: "What happens if I miss a day?",
      q_hi: "अगर एक दिन छूट जाए तो क्या होगा?",
      a_en: "Your completed days stay in your Journey when you take a break. Your streak may reset after a gap; when you return, continue with the next day available to you.",
      a_hi: "कुछ दिन का विराम लेने पर पूरे किए गए दिन आपकी यात्रा में बने रहते हैं। अंतराल के बाद आपकी स्ट्रीक रीसेट हो सकती है; लौटने पर अगले उपलब्ध दिन से जारी रखें।"
    },
    {
      q_en: "How can I record a reflection?",
      q_hi: "मैं अपना चिंतन कैसे लिख सकता हूँ?",
      a_en: "Use the reflection button or your journal to save a note about what you learned. You can revisit your notes from the Journey view.",
      a_hi: "अपनी सीख या अनुभव लिखने के लिए चिंतन बटन या डायरी खोलें। आप Journey view से अपने पुराने नोट्स फिर देख सकते हैं।"
    },
    {
      q_en: "How do XP points and Leaderboard Ranks work?",
      q_hi: "एक्सपी (XP) और लीडरबोर्ड रैंक कैसे काम करते हैं?",
      a_en: "You earn XP for completing activities. Your rank advances through six tiers: Practitioner (0 XP), Knight (500 XP), Strategist (1,500 XP), Commander (3,500 XP), Overlord (7,500 XP), and Sovereign (15,000 XP).",
      a_hi: "अभ्यास पूरे करने पर XP मिलते हैं। आपके XP से रैंक छह स्तरों में आगे बढ़ती है: साधक (0 XP), नाइट (500 XP), रणनीतिज्ञ (1,500 XP), सेनापति (3,500 XP), अधिपति (7,500 XP) और सर्वसत्ता शासक (15,000 XP)।"
    },
    {
      q_en: "How is my progress stored?",
      q_hi: "मेरी प्रगति कहाँ सुरक्षित रहती है?",
      a_en: "Your completed days, XP and reflections are associated with your account. This app is a learning and habit-building tool; leaderboard data is not an official record or proof of verified achievement.",
      a_hi: "आपके पूरे किए गए दिन, XP और चिंतन आपके खाते से जुड़े रहते हैं। यह ऐप सीखने और अच्छी आदतें बनाने का साधन है; लीडरबोर्ड को आधिकारिक रिकॉर्ड या सत्यापित उपलब्धि का प्रमाण न मानें।"
    },
    {
      q_en: "Can I review or re-read previously completed days?",
      q_hi: "क्या मैं पुराने दिनों के पाठ दोबारा पढ़ सकता हूँ?",
      a_en: "Yes! All completed days remain permanently unlocked in your Journey calendar. You can click on any completed day card at any time to re-read the strategies, psychological commands, and stoic wisdom.",
      a_hi: "बिल्कुल! आपके द्वारा पूरे किए गए सभी दिन हमेशा खुले रहते हैं। आप जर्नी व्यू में किसी भी पुराने पूरे किए गए कार्ड पर क्लिक करके उसके सिद्धांतों और रणनीति को कभी भी दोबारा पढ़ सकते हैं।"
    }
  ];

  const categories = [
    { id: 'All', label: t('journey.allTopics') },
    { id: 'Mindset', label: t('journey.mindset') },
    { id: 'Body Language', label: t('journey.bodyLanguage') },
    { id: 'Social Systems & Reality', label: t('journey.socialReality') },
    { id: 'Discipline', label: t('journey.discipline') },
    { id: 'Mystery & Presence', label: t('journey.mystery') },
    { id: 'Strategic Thinking', label: t('journey.strategy') }
  ];

  const dayPhases = [
    { id: 'All Days', label: t('journey.allDays'), min: 1, max: 100 },
    { id: 'Phase 1', label: t('journey.phase1'), min: 1, max: 25 },
    { id: 'Phase 2', label: t('journey.phase2'), min: 26, max: 50 },
    { id: 'Phase 3', label: t('journey.phase3'), min: 51, max: 75 },
    { id: 'Phase 4', label: t('journey.phase4'), min: 76, max: 100 }
  ];

  const statuses = [
    { id: 'All Status', label: t('journey.allStatus') },
    { id: 'Completed', label: t('journey.completedStatus') },
    { id: 'Unlocked Today', label: t('journey.activeStatus') },
    { id: 'Locked', label: t('journey.lockedStatus') }
  ];

  const [modalFeedback, setModalFeedback] = useState<{ text: string; type: 'warning' | 'info' | 'error' } | null>(null);

  const completedDaysSet = useMemo(() => new Set(profile?.completedDays || []), [profile?.completedDays]);
  const maxCompletedDay = useMemo(() => Math.max(0, ...(profile?.completedDays || [0])), [profile?.completedDays]);
  
  // Accurate check if today's calendar date is already completed
  const completedToday = useMemo(() => isCompletedOnDate(profile?.lastCompletedAt), [profile?.lastCompletedAt]);
  const completedCount = Math.min(100, completedDaysSet.size);
  const nextModule = journeyModules.find(module => module.day === maxCompletedDay + 1);

  const filteredModules = useMemo(() => {
    return journeyModules.filter(m => {
      // 1. Category filter
      const matchesCategory = selectedCategory === 'All' || m.category?.toLowerCase() === selectedCategory.toLowerCase();

      // 2. Day Phase filter
      const activePhaseObj = dayPhases.find(p => p.id === selectedDayPhase) || dayPhases[0];
      const matchesDayPhase = m.day >= activePhaseObj.min && m.day <= activePhaseObj.max;

      // 3. Status filter
      const isCompleted = completedDaysSet.has(m.day);
      const isUnlockedToday = (!completedToday || !!profile?.isAdmin) && m.day === maxCompletedDay + 1;
      const isLocked = !isCompleted && !isUnlockedToday;

      let matchesStatus = true;
      if (selectedStatus === 'Completed') matchesStatus = isCompleted;
      else if (selectedStatus === 'Unlocked Today') matchesStatus = isUnlockedToday;
      else if (selectedStatus === 'Locked') matchesStatus = isLocked;

      // 4. Search query filter
      const matchesSearch = (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (m.hindiTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            `day ${m.day}`.includes(searchTerm.toLowerCase());

      return matchesCategory && matchesDayPhase && matchesStatus && matchesSearch;
    });
  }, [journeyModules, selectedCategory, selectedDayPhase, selectedStatus, searchTerm, completedDaysSet, maxCompletedDay, completedToday, profile?.isAdmin, dayPhases]);

  const handleModuleClick = (module: JourneyModule) => {
    setModalFeedback(null);
    setActiveModalModule(module);
    navHistory.pushModal('journey_active_module', () => setActiveModalModule(null));
  };

  const closeModalModule = () => {
    setModalFeedback(null);
    navHistory.closeModal('journey_active_module');
    setActiveModalModule(null);
  };

  const handleOpenReflection = () => {
    setShowReflectionModal(true);
    navHistory.pushModal('journey_reflection', () => setShowReflectionModal(false));
  };

  const handleCloseReflection = () => {
    navHistory.closeModal('journey_reflection');
    setShowReflectionModal(false);
  };

  const handleClaimDayCompletion = async (day: number) => {
    setModalFeedback(null);
    // Validate day prerequisite: Cannot complete Day N if Day N-1 is not completed (unless Day 1)
    if (day > 1 && !completedDaysSet.has(day - 1)) {
      setModalFeedback({
        text: `🔒 पूर्वापेक्षा क्रम (Prerequisite): दिन ${day} अनलॉक करने से पहले कृपया दिन ${day - 1} पूरा करें (Complete Day ${day - 1} first).`,
        type: 'warning'
      });
      return;
    }

    // Daily limit check: One day task per calendar day (IST)
    if (completedToday && !profile?.isAdmin) {
      setModalFeedback({
        text: `⏳ प्रतिदिन केवल एक कार्य (One Day Per Day): आपने आज का कार्य पहले ही पूरा कर लिया है। दिन ${day} मध्यरात्रि 12:00 AM IST पर अनलॉक होगा!`,
        type: 'warning'
      });
      return;
    }

    try {
      await onCompleteDay(day);
      closeModalModule();
    } catch (e: any) {
      setModalFeedback({
        text: e?.message || "प्रगति सहेजने में समस्या आई। कृपया पुनः प्रयास करें।",
        type: 'error'
      });
    }
  };

  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionInput.trim() || isSubmittingReflection) return;
    setIsSubmittingReflection(true);
    try {
      await onSubmitReflection(reflectionInput.trim());
      setReflectionInput('');
      handleCloseReflection();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner & Timer */}
      <div className="space-y-6">
        <div className="bg-[#0c0e14] border border-[#1d222e] rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-amber-300">
              {t('journey.title')}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {t('journey.title')}
          </h2>
          <p className="text-sm text-gray-300 mt-2 max-w-xl leading-relaxed">
            {t('journey.subtitle')}
          </p>

          {/* Quick Action Navigation Bar */}
          <div className="pt-4 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowJournalModal(true)}
              className="min-h-11 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <FileText className="w-4 h-4" />
              <span>{t('journey.journal')} · {Object.keys(profile?.dailyReflections || {}).length}</span>
            </button>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="min-h-11 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t('journey.certificate')}</span>
            </button>

            <button
              onClick={handleOpenReflection}
              className="min-h-11 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('journey.reflection')} (+25 XP)</span>
            </button>
          </div>
        </div>

        <DailyStartCard
          profile={profile}
          completedCount={completedCount}
          completedToday={completedToday}
          nextModule={nextModule}
          onOpenModule={handleModuleClick}
        />

        {/* Live Unlock Schedule Countdown Timer */}
        <DayCountdownTimer 
          completedToday={completedToday} 
          completedDay={maxCompletedDay}
          nextDay={maxCompletedDay + 1 <= 100 ? maxCompletedDay + 1 : 100}
          currentDay={maxCompletedDay + 1 <= 100 ? maxCompletedDay + 1 : 100} 
        />
      </div>

      {/* Attendance Calendar */}
      <div>
        <PresenceCalendar 
          presenceDays={profile?.presenceDays || []} 
          completedDaysCount={(profile?.completedDays || []).length} 
        />
      </div>

      {/* Day, Category & Status Filter Controls */}
      <div className="bg-[#0c0e14] border border-[#1d222e] rounded-[24px] p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-widest text-white">
              {t('journey.filters')}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-400">
            {t('journey.showing')} {filteredModules.length} / {journeyModules.length} {t('journey.days')}
          </span>
        </div>

        {/* Search Input & Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label={t('journey.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('journey.search')}
              className="w-full min-h-12 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
            />
          </div>

          {/* Day Phase Filter */}
          <div>
            <select
              value={selectedDayPhase}
              onChange={(e) => setSelectedDayPhase(e.target.value)}
              className="w-full min-h-12 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm font-semibold text-amber-300 focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
            >
              {dayPhases.map(p => (
                <option key={p.id} value={p.id} className="bg-[#0c0e14] text-white">
                  📅 {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full min-h-12 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0c0e14] text-white">
                  📂 {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full min-h-12 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
            >
              {statuses.map(st => (
                <option key={st.id} value={st.id} className="bg-[#0c0e14] text-white">
                  🎯 {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-10 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 border cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredModules.map((module) => {
          const isCompleted = completedDaysSet.has(module.day);
          const isUnlockedToday = (!completedToday || !!profile?.isAdmin) && module.day === maxCompletedDay + 1;
          const isLockedUntilTomorrow = completedToday && !profile?.isAdmin && module.day === maxCompletedDay + 1;
          const isPrerequisiteLocked = module.day > maxCompletedDay + 1;

          return (
            <motion.button
              type="button"
              key={module.id || `journey-day-${module.day}`}
              onClick={() => handleModuleClick(module)}
              whileHover={{ y: -4 }}
              aria-label={`${t('journey.day')} ${module.day}: ${language === 'hi' ? (module.hindiTitle || module.title) : module.title}`}
              className={`w-full text-left p-5 rounded-[24px] border cursor-pointer transition-all flex flex-col justify-between h-48 relative overflow-hidden group focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isCompleted
                  ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60'
                  : isUnlockedToday
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                  : isLockedUntilTomorrow
                  ? 'bg-[#0f1118] border-amber-500/30 hover:border-amber-500/50 opacity-90'
                  : 'bg-[#0c0e14] border-[#1d222e] hover:border-white/20 opacity-70'
              }`}
            >
              {/* Day Badge Header */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                  isCompleted 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                    : isUnlockedToday 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                    : isLockedUntilTomorrow
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}>
                  {t('journey.day')} {module.day}
                </span>

                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isUnlockedToday ? (
                  <Sparkles className="w-5 h-5 text-amber-400" />
                ) : isLockedUntilTomorrow ? (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" title="Unlocks at 12:00 AM Midnight IST" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-500" />
                )}
              </div>

              {/* Title & Hindi Title */}
              <div className="my-2">
                <h3 className="text-sm font-bold transition-colors line-clamp-1">
                  {isPrerequisiteLocked ? (
                    <span className="text-gray-400 flex items-center gap-1.5 font-mono">
                      <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {t('journey.locked')} #{module.day}
                    </span>
                  ) : isLockedUntilTomorrow ? (
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {language === 'hi' ? (module.hindiTitle || module.title) : module.title}
                    </span>
                  ) : (
                    <span className="text-white group-hover:text-amber-400">
                      {language === 'hi' ? (module.hindiTitle || module.title) : module.title}
                    </span>
                  )}
                </h3>
                <span className="text-[10px] text-gray-400 font-mono block line-clamp-1 mt-0.5">
                  {isPrerequisiteLocked ? (
                    <span className="text-zinc-500">
                      दिन {module.day - 1} पूरा करने पर खुलेगा
                    </span>
                  ) : isLockedUntilTomorrow ? (
                    <span className="text-amber-400 font-medium">
                      आज का कार्य पूर्ण • 12:00 AM IST पर खुलेगा
                    </span>
                  ) : (
                    language === 'hi' ? module.title : (module.hindiTitle || module.description)
                  )}
                </span>
              </div>

              {/* Category Footer */}
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-2 border-t border-white/5">
                <span>
                  {isPrerequisiteLocked 
                    ? `🔒 ${t('journey.classified')}` 
                    : isLockedUntilTomorrow 
                    ? `⏳ ${t('journey.tomorrow')}` 
                    : (module.category || (language === 'hi' ? 'सामान्य' : 'General'))}
                </span>
                <span className={`${isPrerequisiteLocked ? 'text-gray-500' : 'text-amber-500'} flex items-center gap-1`}>
                  {isPrerequisiteLocked ? t('journey.locked') : isLockedUntilTomorrow ? t('journey.tomorrow') : t('journey.read')} <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
      {filteredModules.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-zinc-300" role="status">
          {t('journey.noModules')}
        </p>
      )}

      {/* 100-Day Journey FAQ & Rules Accordion */}
      <div className="bg-[#0c0e14] border border-[#1d222e] rounded-[32px] p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-500">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 block">
              {language === 'hi' ? 'आपकी यात्रा के नियम' : 'Your Journey guide'}
            </span>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {language === 'hi' ? 'आम सवाल और जवाब' : 'Questions & answers'}
            </h3>
          </div>
        </div>

        <div className="space-y-3">
          {JOURNEY_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={`journey-faq-${idx}`}
                className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  id={`journey-faq-trigger-${idx}`}
                  aria-expanded={isOpen}
                  aria-controls={`journey-faq-answer-${idx}`}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full min-h-14 text-left p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <span className="text-sm md:text-base font-semibold text-white text-left flex items-start gap-3">
                    <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0">0{idx + 1}.</span>
                    {language === 'hi' ? faq.q_hi : faq.q_en}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-amber-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={`journey-faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`journey-faq-trigger-${idx}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-5 md:px-5 md:pb-5 text-sm leading-relaxed border-t border-white/5 pt-3 space-y-2.5"
                    >
                      <div className="text-zinc-200 text-sm font-medium leading-relaxed bg-white/[0.04] p-4 rounded-xl border border-white/5">
                        {language === 'hi' ? faq.a_hi : faq.a_en}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Detail Modal */}
      <AnimatePresence>
        {activeModalModule && (() => {
          const isCompleted = completedDaysSet.has(activeModalModule.day);
          const isUnlockedToday = (!completedToday || !!profile?.isAdmin) && activeModalModule.day === maxCompletedDay + 1;
          const isLockedUntilTomorrow = completedToday && !profile?.isAdmin && activeModalModule.day === maxCompletedDay + 1;
          const isPrerequisiteLocked = activeModalModule.day > maxCompletedDay + 1;

          return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0c0e14] border border-[#1d222e] rounded-[32px] p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative shadow-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={closeModalModule}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Back (वापस)</span>
                  </button>
                  <button
                    onClick={closeModalModule}
                    className="ml-auto p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isPrerequisiteLocked ? (
                  <div className="py-8 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg inline-block">
                        LOCKED DAY #{activeModalModule.day}
                      </span>
                      <h3 className="text-xl font-black text-white uppercase italic pt-1">
                        Task Protocol is Classified
                      </h3>
                      <p className="text-xs text-amber-500 font-mono">
                        यह कार्य अभी गुप्त एवं सुरक्षित है
                      </p>
                    </div>

                    <div className="bg-black/50 border border-white/10 rounded-2xl p-5 text-xs text-gray-300 max-w-md mx-auto space-y-2 text-left">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Prerequisite Locked / पूर्वापेक्षा नियम:
                      </p>
                      <p className="text-gray-400 leading-relaxed">
                        You must complete Day {activeModalModule.day - 1} before unlocking Day {activeModalModule.day}. The daily task details, audio transmission, and psychological strategy are revealed automatically when you unlock this day.
                      </p>
                      <p className="text-amber-400/90 font-medium pt-2 border-t border-white/5 leading-relaxed">
                        दिन {activeModalModule.day} के टास्क और पाठ को देखने के लिए पहले दिन {activeModalModule.day - 1} पूरा करें।
                      </p>
                    </div>

                    <button
                      onClick={closeModalModule}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
                    >
                      Return to Active Path / वापस जाएं
                    </button>
                  </div>
                ) : isLockedUntilTomorrow ? (
                  <div className="py-8 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <Clock className="w-8 h-8 text-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg inline-block">
                        LOCKED UNTIL 12:00 AM IST • DAY #{activeModalModule.day}
                      </span>
                      <h3 className="text-xl font-black text-white uppercase italic pt-1">
                        आज का कार्य पूरा हो चुका है (Daily Limit Reached)
                      </h3>
                      <p className="text-xs text-amber-400 font-mono">
                        प्रतिदिन केवल एक ही दिन का कार्य पूरा किया जा सकता है
                      </p>
                    </div>

                    <div className="bg-black/50 border border-amber-500/20 rounded-2xl p-5 text-xs text-gray-300 max-w-md mx-auto space-y-3 text-left">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Next Day Unlocks at 12:00 AM Midnight IST / मध्यरात्रि नियम:
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        आप एक कैलेंडर दिन में केवल एक ही दिन का कार्य पूरा कर सकते हैं। आपने आज दिन {maxCompletedDay} सफलता पूर्वक पूरा कर लिया है।
                      </p>
                      <p className="text-amber-400/90 font-medium border-t border-white/5 pt-2 leading-relaxed">
                        दिन {activeModalModule.day} का टास्क और पाठ आज रात ठीक 12:00 AM Midnight IST पर अपने आप अनलॉक हो जाएगा।
                      </p>
                    </div>

                    <button
                      onClick={closeModalModule}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
                    >
                      Understood (समझ गया / वापस जाएं)
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider rounded-lg inline-block">
                        Day {activeModalModule.day} Module
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold text-white pt-2">
                        {activeModalModule.title}
                      </h2>
                      <p className="text-xs text-amber-500 font-mono">
                        {activeModalModule.hindiTitle}
                      </p>
                    </div>

                    {/* Audio Player / TTS Narration with Speed & Pause Controls */}
                    <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isPlayingTTS && !isPausedTTS 
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' 
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isPlayingTTS && !isPausedTTS ? (
                            <Volume2 className="w-4 h-4 animate-bounce" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white block">ऑडियो पाठ (Audio Narration)</span>
                            {isPlayingTTS && (
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isPausedTTS ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {isPausedTTS ? 'PAUSED' : 'PLAYING'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400">कमजोर पाठकों के लिए स्पष्ट हिंदी उच्चारण</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        {/* Speed Selector */}
                        <div className="flex items-center bg-black/40 border border-zinc-800 rounded-xl p-0.5">
                          {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => handleSpeedChange(speed)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                audioSpeed === speed
                                  ? 'bg-amber-500 text-black font-black'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>

                        {'speechSynthesis' in window && (
                          <div className="flex items-center gap-1.5">
                            {isPlayingTTS && (
                              <button
                                type="button"
                                onClick={isPausedTTS ? resumeDayTTS : pauseDayTTS}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                                title={isPausedTTS ? "Resume (शुरू करें)" : "Pause (विराम दें)"}
                              >
                                {isPausedTTS ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                                <span className="text-[11px]">{isPausedTTS ? 'Resume' : 'Pause'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={toggleDayTTS}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isPlayingTTS
                                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40'
                                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 font-black'
                              }`}
                            >
                              {isPlayingTTS ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5" />
                                  <span>रोकें (Stop)</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>सुनें (Listen)</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lesson Text */}
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed text-gray-300 space-y-3 bg-black/40 p-5 rounded-2xl border border-white/5">
                      <p>{activeModalModule.content || activeModalModule.description}</p>
                      {activeModalModule.hindiDescription && (
                        <p className="text-gray-400 italic font-mono pt-2 border-t border-white/5">
                          {activeModalModule.hindiDescription}
                        </p>
                      )}
                    </div>

                    {modalFeedback && (
                      <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                        modalFeedback.type === 'error'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : modalFeedback.type === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}>
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>{modalFeedback.text}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button
                        onClick={handleOpenReflection}
                        className="w-full sm:w-auto px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>दैनिक विचार लिखें (Reflection)</span>
                        <span className="text-amber-400 font-mono font-bold">+25 XP</span>
                      </button>

                      {completedDaysSet.has(activeModalModule.day) ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 font-mono px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>सफलतापूर्वक पूरा हुआ (Completed)</span>
                        </span>
                      ) : isPrerequisiteLocked && !profile?.isAdmin ? (
                        <div className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono font-bold flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4 text-zinc-500" />
                          <span>दिन {activeModalModule.day - 1} पूरा करें (Locked)</span>
                        </div>
                      ) : completedToday && !profile?.isAdmin ? (
                        <div className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span>आज का कार्य पूर्ण • 12:00 AM IST पर खुलेगा</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimDayCompletion(activeModalModule.day)}
                          className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>दिन {activeModalModule.day} पूरा करें (+100 XP)</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Reflection Modal */}
      <AnimatePresence>
        {showReflectionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0e14] border border-[#1d222e] rounded-[32px] p-6 max-w-lg w-full space-y-4 relative shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCloseReflection}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>Back (वापस)</span>
                </button>
                <button
                  onClick={handleCloseReflection}
                  className="ml-auto p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-white">Daily Reflection / आज का चिंतन</h3>
              <p className="text-xs text-gray-400">
                "What did you teach the world today?" / "आज तुमने दुनिया को क्या सिखाया?"
              </p>

              <form onSubmit={handleReflectionSubmit} className="space-y-4">
                <textarea
                  value={reflectionInput}
                  onChange={(e) => setReflectionInput(e.target.value)}
                  placeholder="Record your stoic observation or daily victory..."
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none min-h-[120px]"
                />

                <button
                  type="submit"
                  disabled={!reflectionInput.trim() || isSubmittingReflection}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all"
                >
                  Submit Reflection (+25 XP)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sovereign Reflections Journal Modal */}
      {showJournalModal && (
        <React.Suspense fallback={null}>
          <ReflectionsJournalModal
            isOpen={showJournalModal}
            onClose={() => setShowJournalModal(false)}
            reflections={profile?.dailyReflections}
            userName={profile?.displayName || 'Practitioner'}
          />
        </React.Suspense>
      )}

      {/* Sovereign Certificate Milestone Modal */}
      {showCertificateModal && profile && (
        <React.Suspense fallback={null}>
          <SovereignCertificateModal
            isOpen={showCertificateModal}
            onClose={() => setShowCertificateModal(false)}
            profile={profile}
          />
        </React.Suspense>
      )}
    </div>
  );
}
