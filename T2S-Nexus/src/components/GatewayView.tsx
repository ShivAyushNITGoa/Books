import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, BookOpen, Users, 
  ChevronRight, ArrowRight, ArrowLeft,
  Youtube, Send, ChevronDown,
  Layers, Flame, CheckCircle2, X,
  Library, AlertTriangle, ShieldCheck
} from 'lucide-react';
import Logo from './Logo';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { 
  FIVE_FOUNDATIONAL_MANUALS_DETAILS 
} from '../t2sData';
import { navHistory } from '../utils/navigationHistory';

interface GatewayViewProps {
  onLogin: () => void;
  onLoginRedirect?: () => void;
  onEnter: () => void;
  onEnterWithTab?: (tab: any) => void;
  isAuthenticated: boolean;
  userEmail?: string | null;
  authError?: string | null;
  setAuthError?: (err: string | null) => void;
  quotaError?: any;
  onLogout?: () => void;
  profile?: any;
  onOpenAscension?: () => void;
  canGoBack?: boolean;
  onDesktopBack?: () => void;
}

export default function GatewayView({ 
  onLogin, 
  onLoginRedirect, 
  onEnter, 
  onEnterWithTab,
  isAuthenticated, 
  userEmail,
  authError,
  setAuthError,
  quotaError,
  onLogout,
  profile,
  onOpenAscension,
  canGoBack,
  onDesktopBack
}: GatewayViewProps) {
  const { language, t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedManual, setSelectedManual] = useState<any | null>(null);
  const authErrorMessage = authError
    ? authError.toLowerCase().includes('popup-closed')
      ? t('gateway.errorClosed')
      : authError.toLowerCase().includes('network')
        ? t('gateway.errorNetwork')
        : t('gateway.errorGeneric')
    : null;

  const openManualModal = (manual: any) => {
    setSelectedManual(manual);
    navHistory.pushModal('gateway_manual', () => setSelectedManual(null));
  };

  const closeManualModal = () => {
    navHistory.closeModal('gateway_manual');
    setSelectedManual(null);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* 1. TOP HEADER (Simple, Clean, No Clutter) */}
      <header className="sticky top-0 z-50 bg-[#0c0e14]/95 backdrop-blur-md border-b border-zinc-800 py-2.5 sm:py-3 px-3 sm:px-6 lg:px-10 flex items-center justify-between select-none">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {canGoBack && onDesktopBack && (
            <button
              onClick={onDesktopBack}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 hover:text-white text-zinc-300 rounded-xl border border-zinc-700/70 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Back to Platform / प्लेटफॉर्म पर वापस जाएं"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Platform (वापस जाएं)</span>
            </button>
          )}

          <button
            type="button"
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={onEnter}
            aria-label={t('nav.home')}
          >
            <Logo className="w-8 h-8 sm:w-9 sm:h-9" src="/Logo-real.png" />
            <span className="text-base sm:text-xl font-black text-white tracking-tight">
              Talk2Society
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguageSwitcher className="px-2 sm:px-3" />
          <a
            href="https://www.youtube.com/@Talk2Society"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-1.5 sm:px-3 sm:py-1.5 bg-red-600/15 hover:bg-red-600/25 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold rounded-xl transition-all items-center gap-1.5 active:scale-95"
            title="Watch on YouTube"
          >
            <Youtube className="w-4 h-4 text-red-400 shrink-0" />
            <span className="hidden sm:inline">YouTube</span>
          </a>

          {isAuthenticated ? (
            <button
              onClick={onEnter}
              className="min-h-11 px-3 sm:px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>{t('action.openApp')}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="min-h-11 px-3 sm:px-4 py-2 bg-zinc-100 hover:bg-white text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span>{t('action.login')}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Hindi-first, low-friction welcome */}
      <section className="relative isolate max-w-5xl mx-auto px-4 sm:px-6 pt-9 sm:pt-16 pb-10 sm:pb-12 text-center space-y-6 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[min(90vw,640px)] h-72 rounded-full bg-amber-500/10 blur-3xl -z-10" />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs sm:text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)]" aria-hidden="true" />
          <span>{t('gateway.badge')}</span>
        </div>

        <h1 className="max-w-4xl mx-auto text-[2rem] sm:text-5xl md:text-6xl font-black text-white leading-[1.25]">
          {t('gateway.title')}
        </h1>

        <p className="text-zinc-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {t('gateway.body')}
        </p>
        <p className="text-zinc-400 text-xs sm:text-sm font-medium">
          {t('gateway.support')}
        </p>

        {/* Big Touch-Friendly Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
          {isAuthenticated ? (
            <button 
              onClick={onEnter}
              className="min-h-14 px-7 sm:px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-black text-base font-extrabold rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 focus-visible:ring-2 focus-visible:ring-white"
            >
              <Zap className="w-5 h-5 fill-black" />
              <span>{t('action.openApp')}</span>
            </button>
          ) : (
            <button 
              onClick={onLogin}
              className="min-h-14 px-7 sm:px-8 py-3.5 bg-zinc-100 hover:bg-white text-black text-base font-bold rounded-2xl transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-3 cursor-pointer active:scale-98 focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{t('action.google')}</span>
            </button>
          )}

          {onEnterWithTab && (
            <button
              onClick={() => onEnterWithTab('library')}
              className="min-h-14 px-6 py-3.5 border border-zinc-700 hover:border-amber-400 bg-zinc-900/80 hover:bg-zinc-800 text-white text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{t('action.books')}</span>
            </button>
          )}
        </div>
        {!isAuthenticated && (
          <p className="inline-flex items-center justify-center gap-2 text-xs text-zinc-400" role="note">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            {t('gateway.signinNote')}
          </p>
        )}

        {/* Auth Error Notification */}
        {authError && (
          <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl p-4 text-left max-w-lg mx-auto space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>सूचना / Sign-In Notice</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed" role="status" aria-live="polite">
              {authErrorMessage}
            </p>
            <div className="flex gap-2 pt-1">
              {onLoginRedirect && (
                <button
                  onClick={onLoginRedirect}
                  className="min-h-11 px-4 py-2 bg-amber-400 text-black text-sm font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-white"
                >
                  {t('action.redirect')}
                </button>
              )}
              <button
                onClick={() => { if (setAuthError) setAuthError(null); onLogin(); }}
                className="min-h-11 px-4 py-2 bg-zinc-800 text-white text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {t('action.retry')}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. THREE MAIN PILLARS (Simple, 3 Big Cards) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onEnterWithTab ? onEnterWithTab('library') : onEnter()}
            className="w-full min-h-48 text-left p-5 bg-zinc-900/80 border border-zinc-800 hover:border-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl space-y-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              {t('gateway.featureLibrary')}
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {t('gateway.featureLibraryBody')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onEnterWithTab ? onEnterWithTab('journey') : onEnter()}
            className="w-full min-h-48 text-left p-5 bg-zinc-900/80 border border-zinc-800 hover:border-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl space-y-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              {t('gateway.featurePractice')}
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {t('gateway.featurePracticeBody')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onEnterWithTab ? onEnterWithTab('archives') : onEnter()}
            className="w-full min-h-48 text-left p-5 bg-zinc-900/80 border border-zinc-800 hover:border-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl space-y-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              {t('gateway.featureVideo')}
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {t('gateway.featureVideoBody')}
            </p>
          </button>
        </div>
      </section>

      {/* 3.5 THE SOVEREIGN CRUCIBLE MASTER BLUEPRINT SHOWCASE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-gradient-to-br from-red-950/30 via-zinc-900 to-black border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-black uppercase tracking-wider rounded">
                  NEW • मास्टर-ब्लूप्रिंट
                </span>
                <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-mono uppercase tracking-wider rounded">
                  The Sovereign Crucible
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white">
                दिवास्वप्नों से ज़मीनी शक्ति तक: <span className="text-amber-400">द सॉवरेन क्रूसिबल</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                'अशोक का साम्राज्य' का सपना देखने और 'रोस्ट होने पर आँसू' बहाने के बीच की विशाल खाई को पाटने का 100% व्यावहारिक तंत्र।
              </p>
            </div>

            {onEnterWithTab && (
              <button
                onClick={() => onEnterWithTab('framework')}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-amber-500/20"
              >
                <span>ब्लूप्रिंट व ऑडिट खोलें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div 
              onClick={() => onEnterWithTab && onEnterWithTab('framework')}
              className="p-4 bg-black/50 border border-zinc-800 hover:border-red-500/50 rounded-2xl space-y-1.5 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>1. कम्युनिटी ऑडिट (3 अंतर्विरोध)</span>
              </div>
              <p className="text-xs text-zinc-300">
                पहले नर्वस सिस्टम संभालो, फिर मैकियावेली। रोस्टिंग और सामाजिक दबाव को बेअसर करने का आंतरिक पैमाना।
              </p>
            </div>

            <div 
              onClick={() => onEnterWithTab && onEnterWithTab('library')}
              className="p-4 bg-black/50 border border-zinc-800 hover:border-amber-500/50 rounded-2xl space-y-1.5 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <BookOpen className="w-4 h-4" />
                <span>2. चारों नई ई-बुक्स का पाठ्यक्रम</span>
              </div>
              <p className="text-xs text-zinc-300">
                सामाजिक कवच, मूक शिकारी, निर्मम प्रभाव और आर्थिक स्वायत्तता का संपूर्ण 5-अध्याय पाठ्यक्रम और फील्ड ड्रिल्स।
              </p>
            </div>

            <div 
              onClick={() => onEnterWithTab && onEnterWithTab('framework')}
              className="p-4 bg-black/50 border border-zinc-800 hover:border-blue-500/50 rounded-2xl space-y-1.5 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <Flame className="w-4 h-4" />
                <span>3. 'नो-गुरु' मर्यादा व वार रूम</span>
              </div>
              <p className="text-xs text-zinc-300">
                व्यक्ति-पूजा निषेध, निर्मम साथी समीक्षा, और सोमवार से रविवार तक चलने वाला 4-दिवसीय अनुशासनात्मक चक्र।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BOOKS SHOWCASE (Simple Cards with 'Read' Button) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              लाइब्रेरी (Books Library)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              प्रमुख किताबें और मैन्युअल्स
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              A. K. Chandradipti के 5 प्रमुख जीवन ग्रंथ और लाइब्रेरी की पुस्तकें
            </p>
          </div>

          {onEnterWithTab && (
            <button
              onClick={() => onEnterWithTab('library')}
              className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Library className="w-4 h-4 text-amber-400" />
              <span>पूरी लाइब्रेरी देखें (All Books)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIVE_FOUNDATIONAL_MANUALS_DETAILS.map((manual) => (
            <button
              type="button"
              key={manual.stage}
              onClick={() => openManualModal(manual)}
              className="w-full min-h-56 text-left bg-zinc-900 border border-zinc-800 hover:border-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl p-5 flex flex-col justify-between space-y-3 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] font-bold rounded">
                    किताब 0{manual.stage}
                  </span>
                  <BookOpen className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  {manual.title}
                </h3>
                <p className="text-xs text-amber-300 font-medium">
                  {manual.coreTheme}
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                  {manual.hindiTagline || manual.tagline}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-sm font-bold text-amber-300 group-hover:text-white">
                <span>{language === 'hi' ? 'विवरण पढ़ें' : 'Read details'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}

          {/* Dedicated Extra Card for Full Library */}
          <button
            type="button"
            onClick={() => onEnterWithTab ? onEnterWithTab('library') : onEnter()}
            className="w-full min-h-56 text-left bg-gradient-to-br from-amber-950/30 via-zinc-900 to-black border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 flex flex-col justify-between space-y-3 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-white"
          >
            <div className="space-y-1.5">
              <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded uppercase">
                और भी पुस्तकें
              </span>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                The Great Library (संपूर्ण संग्रह)
              </h3>
              <p className="text-xs text-amber-300 font-medium">
                Philosophy, Strategy & Mindset
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                लाइब्रेरी में सिर्फ 5 किताबें नहीं हैं। यहां दर्शन, पैसे की समझ, और स्वतंत्र सोच पर आधारित कई अन्य पुस्तकें भी पढ़ने के लिए उपलब्ध हैं।
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-bold text-amber-300 group-hover:text-white">
              <span>{language === 'hi' ? 'लाइब्रेरी खोलें' : 'Open library'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* 5. SIMPLE FAQ SECTION */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-white text-center">
          {language === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Common questions'}
        </h2>

        <div className="space-y-2 pt-2">
          {[
            {
              q: language === 'hi' ? "Talk2Society क्या है?" : "What is Talk2Society?",
              a: language === 'hi' ? "यह रोज़मर्रा के जीवन, पढ़ाई, करियर और समाज पर सोचने के लिए किताबें, वीडियो और छोटे अभ्यास देता है।" : "Explore everyday life, study, careers, and society through books, videos, and short practices.",
            },
            {
              q: language === 'hi' ? "क्या यहां केवल 5 किताबें हैं?" : "Are there only five books?",
              a: language === 'hi' ? "नहीं। पांच प्रमुख मैन्युअल्स के साथ लाइब्रेरी में जीवन, दर्शन और सोच पर अन्य किताबें भी हैं।" : "No. Alongside five featured guides, the library includes other books on life, philosophy, and clear thinking.",
            },
            {
              q: language === 'hi' ? "100-दिन का कोर्स क्या है?" : "What is the 100-day journey?",
              a: language === 'hi' ? "यह रोज़ का छोटा सोच-अभ्यास है। एक सवाल या गतिविधि चुनें और अपनी गति से आगे बढ़ें।" : "It is a short daily thinking practice. Choose a prompt or activity and move at your own pace.",
            },
            {
              q: language === 'hi' ? "क्या मेरी प्रगति सेव रहेगी?" : "Will my progress be saved?",
              a: language === 'hi' ? "पूरे किए गए दिन और XP आपके खाते से जुड़े रहते हैं। अपनी चिंतन डायरी की समीक्षा भी कर सकते हैं।" : "Completed days and XP are associated with your account. You can also review your reflection journal.",
            }
          ].map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="border border-zinc-800 bg-zinc-900/60 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  id={`gateway-faq-trigger-${idx}`}
                  aria-expanded={isOpen}
                  aria-controls={`gateway-faq-answer-${idx}`}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full min-h-14 px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-800/40 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <span className="text-sm font-bold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
                </button>

                {isOpen && (
                  <div id={`gateway-faq-answer-${idx}`} role="region" aria-labelledby={`gateway-faq-trigger-${idx}`} className="px-4 pb-4 pt-3 border-t border-zinc-800 text-sm text-zinc-300 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="p-6 sm:p-10 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl text-center space-y-4">
          <h2 className="text-xl sm:text-3xl font-black text-white">
            {t('gateway.title')}
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            {t('gateway.body')}
          </p>
          <div className="pt-2">
            {isAuthenticated ? (
              <button 
                onClick={onEnter}
                className="min-h-12 px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-black text-base font-bold rounded-2xl shadow-lg cursor-pointer"
              >
                {t('action.openApp')}
              </button>
            ) : (
              <button 
                onClick={onLogin}
                className="px-8 py-3.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl shadow-lg cursor-pointer"
              >
                {t('action.google')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 7. CLEAN SIMPLE FOOTER */}
      <footer className="border-t border-zinc-800 bg-[#060709] py-8 px-4 text-center text-xs text-zinc-400 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Logo className="w-5 h-5" src="/Logo-real.png" />
          <span className="font-bold text-white">Talk2Society</span>
        </div>
        <p className="text-zinc-500 text-[11px]">
          See the unsaid. Understand the system. Choose your own path.
        </p>
        <div className="flex items-center justify-center gap-4 text-zinc-400 pt-1">
          <a href="https://www.youtube.com/@Talk2Society" target="_blank" rel="noreferrer" className="hover:text-red-400">
            YouTube
          </a>
          <span>·</span>
          <a href="https://t.me/Talk2Society" target="_blank" rel="noreferrer" className="hover:text-blue-400">
            Telegram
          </a>
        </div>
        <p className="text-[11px] text-zinc-600 pt-2">
          © {new Date().getFullYear()} Talk2Society · A. K. Chandradipti · India
        </p>
      </footer>

      {/* BOOK DETAILS MODAL (Simple, Clean, Thumb-Friendly) */}
      <AnimatePresence>
        {selectedManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 sm:p-7 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 relative"
            >
              <button 
                onClick={closeManualModal}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 pr-6">
                <span className="text-xs font-bold text-amber-400">
                  किताब 0{selectedManual.stage}
                </span>
                <h3 className="text-xl font-bold text-white">
                  {selectedManual.title}
                </h3>
                <p className="text-xs text-amber-300 font-medium">
                  {selectedManual.coreTheme}
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-zinc-200">
                <div className="p-3.5 bg-black/50 border border-zinc-800 rounded-xl space-y-1">
                  <p className="text-white font-medium">
                    {selectedManual.hindiTagline || selectedManual.tagline}
                  </p>
                </div>

                {selectedManual.howItInfluences && (
                  <div className="p-3.5 bg-black/50 border border-zinc-800 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 block">
                      यह आपकी सोच कैसे बदलेगा?
                    </span>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {selectedManual.howItInfluences}
                    </p>
                  </div>
                )}

                {selectedManual.keyRule && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-400 block">
                      मुख्य नियम
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-amber-200">
                      “{selectedManual.keyRule}”
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2 border-t border-zinc-800">
                <button
                  onClick={closeManualModal}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-xl cursor-pointer"
                >
                  बंद करें (Close)
                </button>
                {onEnterWithTab && (
                  <button
                    onClick={() => {
                      closeManualModal();
                      onEnterWithTab('library');
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>लाइब्रेरी में पढ़ें (Read)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
