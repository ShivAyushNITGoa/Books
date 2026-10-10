import { PlayCircle, Sparkles } from 'lucide-react';
import { JourneyModule, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DailyStartCardProps {
  profile: UserProfile | null;
  completedCount: number;
  completedToday: boolean;
  nextModule?: JourneyModule;
  onOpenModule: (module: JourneyModule) => void;
}

export default function DailyStartCard({
  profile,
  completedCount,
  completedToday,
  nextModule,
  onOpenModule,
}: DailyStartCardProps) {
  const { language, t } = useLanguage();
  const progressPercent = Math.round((Math.min(100, completedCount) / 100) * 100);
  const firstName = (profile?.displayName || '').trim().split(/\s+/)[0];
  const isFinished = completedCount >= 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.25fr_0.75fr] gap-4">
      <section className="relative overflow-hidden rounded-[28px] border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-[#11131a] to-[#0c0e14] p-5 sm:p-7 shadow-xl">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-300">{t('home.kicker')}</p>
            <h3 className="mt-0.5 text-lg sm:text-xl font-bold text-white">
              {t('home.greeting')}{firstName && firstName !== 'Sovereign' ? `, ${firstName}` : ''} 👋
            </h3>
          </div>
        </div>

        <div className="relative mt-5">
          <h4 className="text-base sm:text-lg font-bold text-white">
            {isFinished ? t('home.allDone') : completedToday ? t('home.completedTitle') : t('home.todayTitle')}
          </h4>
          {completedToday && !isFinished ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">{t('home.nextUnlock')}</p>
          ) : !isFinished && nextModule ? (
            <>
              <p className="mt-2 text-sm font-semibold text-amber-200">
                {t('journey.day')} {nextModule.day} · {nextModule.title}
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-300 line-clamp-2">
                {nextModule.description}
              </p>
              <button
                type="button"
                onClick={() => onOpenModule(nextModule)}
                className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {t('home.open')}
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t('home.allDone')}</p>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#0c0e14] p-5 sm:p-7 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-zinc-400">{t('home.progress')}</p>
            <p className="mt-1 text-3xl font-black text-white tabular-nums">
              {Math.min(100, completedCount)}<span className="text-base font-semibold text-zinc-500"> / 100</span>
            </p>
            <p className="mt-1 text-xs text-zinc-400">{t('home.daysDone')}</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-lg font-black text-emerald-300 tabular-nums">
            {progressPercent}%
          </div>
        </div>
        <div
          className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label={t('home.progress')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300">⚡ {profile?.xp || 0} XP</span>
          <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300">🔥 {profile?.streak || 0} {language === 'hi' ? 'दिन की लय' : 'day streak'}</span>
        </div>
      </section>
    </div>
  );
}
