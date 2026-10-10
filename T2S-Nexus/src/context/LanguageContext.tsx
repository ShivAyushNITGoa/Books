import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Languages } from 'lucide-react';

export type AppLanguage = 'hi' | 'en';

type TranslationKey = keyof typeof messages.hi;

const messages = {
  hi: {
    'language.label': 'भाषा बदलें',
    'language.next': 'English',
    'nav.library': 'किताबें',
    'nav.journey': '100 दिन',
    'nav.journeyShort': 'यात्रा',
    'nav.archives': 'वीडियो',
    'nav.archivesShort': 'वीडियो',
    'nav.framework': 'गाइड',
    'nav.frameworkShort': 'गाइड',
    'nav.libraryShort': 'पुस्तकें',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.profileShort': 'प्रोफ़ाइल',
    'nav.more': 'और देखें',
    'nav.moreShort': 'और',
    'nav.forum': 'चर्चा मंच',
    'nav.shop': 'स्टोर',
    'nav.leaderboard': 'लीडरबोर्ड',
    'nav.home': 'होम',
    'nav.admin': 'एडमिन',
    'nav.moreServices': 'और सुविधाएं',
    'action.back': 'वापस',
    'action.search': 'खोजें',
    'action.openApp': 'ऐप खोलें',
    'action.login': 'लॉगिन',
    'action.google': 'Google से जारी रखें',
    'action.books': 'किताबें देखें',
    'action.retry': 'फिर कोशिश करें',
    'action.redirect': 'दूसरा तरीका आज़माएं',
    'gateway.errorClosed': 'साइन-इन विंडो बंद हो गई। फिर कोशिश करें या दूसरा तरीका चुनें।',
    'gateway.errorNetwork': 'इंटरनेट कनेक्शन जांचें और दोबारा कोशिश करें।',
    'gateway.errorGeneric': 'साइन-इन पूरा नहीं हो सका। कृपया फिर कोशिश करें।',
    'gateway.badge': 'सीखें, सोचें और अपनी राह चुनें',
    'gateway.title': 'अपनी सोच को मज़बूत बनाएं—एक दिन, एक कदम।',
    'gateway.body': 'पढ़ाई, करियर, रिश्ते या रोज़मर्रा के फैसले—हर दिन कुछ मिनट निकालकर बेहतर सवाल पूछना और साफ़ सोच बनाना सीखें।',
    'gateway.support': 'छोटे दैनिक अभ्यास · वीडियो और किताबें · अपनी गति से सीखें',
    'gateway.signinNote': 'Google खाते से आसान साइन-इन',
    'gateway.featurePractice': 'रोज़ का छोटा अभ्यास',
    'gateway.featurePracticeBody': 'कुछ मिनट में पूरा होने वाला एक स्पष्ट अगला कदम।',
    'gateway.featureLibrary': 'किताबें और मैन्युअल्स',
    'gateway.featureLibraryBody': 'अपनी रुचि के विषय को पढ़ें, सुनें और दोबारा देखें।',
    'gateway.featureVideo': 'वीडियो और विचार',
    'gateway.featureVideoBody': 'समाज और जीवन के सवालों पर नए नज़रिये।',
    'home.greeting': 'नमस्ते',
    'home.kicker': 'आपकी आज की प्रगति',
    'home.todayTitle': 'आज बस एक छोटा कदम',
    'home.completedTitle': 'आज का अभ्यास पूरा—बहुत बढ़िया!',
    'home.todayBody': 'एक छोटा अभ्यास चुनें और अपनी गति से आगे बढ़ें। रोज़ थोड़ा समय देना ही काफ़ी है।',
    'home.daysDone': 'दिन पूरे',
    'home.progress': 'आपकी 100-दिन की यात्रा',
    'home.open': 'आज का अभ्यास खोलें',
    'home.nextUnlock': 'अगला अभ्यास भारतीय समयानुसार आधी रात के बाद खुलेगा। तब तक आज की सीख पर आराम से सोचें।',
    'home.allDone': 'कमाल! आपने 100-दिन की यात्रा पूरी कर ली।',
    'journey.title': 'आपकी 100-दिन की यात्रा',
    'journey.subtitle': 'हर दिन एक छोटा, व्यावहारिक अभ्यास—अपनी गति से आगे बढ़ें।',
    'journey.journal': 'मेरी डायरी',
    'journey.certificate': 'प्रमाणपत्र',
    'journey.reflection': 'आज का चिंतन',
    'journey.search': 'दिन या विषय खोजें…',
    'journey.day': 'दिन',
    'journey.completed': 'पूरा',
    'journey.locked': 'बाद में खुलेगा',
    'journey.open': 'विवरण देखें',
    'journey.filters': 'यात्रा के फ़िल्टर',
    'journey.showing': 'दिख रहे हैं',
    'journey.days': 'दिन',
    'journey.allTopics': 'सभी विषय',
    'journey.mindset': 'सोच और नज़रिया',
    'journey.bodyLanguage': 'शारीरिक भाषा',
    'journey.socialReality': 'समाज की हकीकत',
    'journey.discipline': 'अनुशासन',
    'journey.mystery': 'मूक प्रभाव',
    'journey.strategy': 'रणनीतिक सोच',
    'journey.allDays': 'सभी 100 दिन',
    'journey.phase1': 'चरण 1 · दिन 1–25',
    'journey.phase2': 'चरण 2 · दिन 26–50',
    'journey.phase3': 'चरण 3 · दिन 51–75',
    'journey.phase4': 'चरण 4 · दिन 76–100',
    'journey.allStatus': 'सभी स्थितियां',
    'journey.completedStatus': 'पूरे किए गए',
    'journey.activeStatus': 'आज के लिए खुले',
    'journey.lockedStatus': 'बाद में खुलेंगे',
    'journey.classified': 'सुरक्षित',
    'journey.tomorrow': 'कल खुलेगा',
    'journey.read': 'पढ़ें',
    'journey.noModules': 'इन फ़िल्टर में कोई दिन नहीं मिला। फ़िल्टर बदलकर देखें।',
  },
  en: {
    'language.label': 'Change language',
    'language.next': 'हिन्दी',
    'nav.library': 'Library',
    'nav.journey': '100-day path',
    'nav.journeyShort': 'Journey',
    'nav.archives': 'Videos',
    'nav.archivesShort': 'Videos',
    'nav.framework': 'Guide',
    'nav.frameworkShort': 'Guide',
    'nav.libraryShort': 'Books',
    'nav.profile': 'Profile',
    'nav.profileShort': 'Profile',
    'nav.more': 'More',
    'nav.moreShort': 'More',
    'nav.forum': 'Community',
    'nav.shop': 'Store',
    'nav.leaderboard': 'Leaderboard',
    'nav.home': 'Home',
    'nav.admin': 'Admin',
    'nav.moreServices': 'More services',
    'action.back': 'Back',
    'action.search': 'Search',
    'action.openApp': 'Open app',
    'action.login': 'Log in',
    'action.google': 'Continue with Google',
    'action.books': 'Browse books',
    'action.retry': 'Try again',
    'action.redirect': 'Try another way',
    'gateway.errorClosed': 'The sign-in window was closed. Try again or choose another sign-in method.',
    'gateway.errorNetwork': 'Check your internet connection and try again.',
    'gateway.errorGeneric': 'Sign-in could not be completed. Please try again.',
    'gateway.badge': 'Learn, reflect, and choose your own path',
    'gateway.title': 'Build a stronger way of thinking—one day at a time.',
    'gateway.body': 'Study, career, relationships, everyday decisions. Spend a few minutes each day learning to ask better questions and think clearly.',
    'gateway.support': 'Small daily practices · Videos and books · Learn at your own pace',
    'gateway.signinNote': 'Quick, secure sign-in with your Google account',
    'gateway.featurePractice': 'A small daily practice',
    'gateway.featurePracticeBody': 'One clear next step that takes just a few minutes.',
    'gateway.featureLibrary': 'Books and guides',
    'gateway.featureLibraryBody': 'Read, listen, and revisit topics that interest you.',
    'gateway.featureVideo': 'Videos and ideas',
    'gateway.featureVideoBody': 'Fresh perspectives on society and everyday life.',
    'home.greeting': 'Welcome back',
    'home.kicker': 'Your progress today',
    'home.todayTitle': 'One small step for today',
    'home.completedTitle': 'Today’s practice is done—great work!',
    'home.todayBody': 'Choose one short practice and move forward at your own pace. A little time each day is enough.',
    'home.daysDone': 'days complete',
    'home.progress': 'Your 100-day journey',
    'home.open': 'Open today’s practice',
    'home.nextUnlock': 'Your next practice opens after midnight India time. Until then, take a moment to reflect on today’s learning.',
    'home.allDone': 'Amazing—you have completed the 100-day journey.',
    'journey.title': 'Your 100-day journey',
    'journey.subtitle': 'One small, practical activity each day. Move at your own pace.',
    'journey.journal': 'My journal',
    'journey.certificate': 'Certificate',
    'journey.reflection': 'Today’s reflection',
    'journey.search': 'Search by day or topic…',
    'journey.day': 'Day',
    'journey.completed': 'Complete',
    'journey.locked': 'Opens later',
    'journey.open': 'View details',
    'journey.filters': 'Journey filters',
    'journey.showing': 'Showing',
    'journey.days': 'days',
    'journey.allTopics': 'All topics',
    'journey.mindset': 'Mindset',
    'journey.bodyLanguage': 'Body language',
    'journey.socialReality': 'Social reality',
    'journey.discipline': 'Discipline',
    'journey.mystery': 'Quiet influence',
    'journey.strategy': 'Strategic thinking',
    'journey.allDays': 'All 100 days',
    'journey.phase1': 'Phase 1 · Days 1–25',
    'journey.phase2': 'Phase 2 · Days 26–50',
    'journey.phase3': 'Phase 3 · Days 51–75',
    'journey.phase4': 'Phase 4 · Days 76–100',
    'journey.allStatus': 'All statuses',
    'journey.completedStatus': 'Completed',
    'journey.activeStatus': 'Open today',
    'journey.lockedStatus': 'Opens later',
    'journey.classified': 'Protected',
    'journey.tomorrow': 'Opens tomorrow',
    'journey.read': 'Read',
    'journey.noModules': 'No days match these filters. Try changing them.',
  },
} as const;

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem('t2s_language');
    if (saved === 'hi' || saved === 'en') return saved;
  } catch {
    // Keep the Hindi-first default when browser storage is unavailable.
  }
  return 'hi';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('t2s_language', language);
    } catch {
      // Language selection still works for this session if storage is blocked.
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => messages[language][key],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used within LanguageProvider');
  return value;
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const nextLanguage: AppLanguage = language === 'hi' ? 'en' : 'hi';

  return (
    <button
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-xs font-bold text-zinc-200 transition-colors hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${className}`}
      aria-label={t('language.label')}
      title={t('language.label')}
    >
      <Languages className="h-4 w-4 text-amber-400" aria-hidden="true" />
      <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
    </button>
  );
}
