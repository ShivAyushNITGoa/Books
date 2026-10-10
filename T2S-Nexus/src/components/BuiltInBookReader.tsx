import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ChevronLeft, ChevronRight, CheckCircle2, 
  Target, Shield, Award, Sparkles, Bookmark, Share2, 
  Menu, X, Type, Volume2, VolumeX, Pause, Play
} from 'lucide-react';
import { LibraryBook, BookChapter } from '../types';

interface BuiltInBookReaderProps {
  book: LibraryBook;
}

export default function BuiltInBookReader({ book }: BuiltInBookReaderProps) {
  const chapters = book.chapters || [];
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isPausedAudio, setIsPausedAudio] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('t2s_audio_rate');
      return saved ? parseFloat(saved) : 0.95;
    } catch {
      return 0.95;
    }
  });
  const [savedChapters, setSavedChapters] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`t2s_book_read_${book.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stop speech when chapter changes or unmounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeChapterIndex]);

  const toggleAudioNarration = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      return;
    }

    const ch = chapters[activeChapterIndex];
    if (!ch) return;

    // Build the Hindi audio script
    const textToSpeak = `${ch.hindiTitle || ch.title}. ${ch.summary || ''}. मुख्य नियम: ${ch.keyLesson || ''}. ${ch.content || ''}`;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Pick Hindi voice if available, else standard
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('hi-IN'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    utterance.lang = 'hi-IN';
    utterance.rate = speechRate;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const pauseAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio && !isPausedAudio) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
    }
  };

  const resumeAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio && isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem('t2s_audio_rate', rate.toString());
    if (isPlayingAudio && !isPausedAudio) {
      window.speechSynthesis.cancel();
      const ch = chapters[activeChapterIndex];
      if (!ch) return;
      const textToSpeak = `${ch.hindiTitle || ch.title}. ${ch.summary || ''}. मुख्य नियम: ${ch.keyLesson || ''}. ${ch.content || ''}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('hi-IN'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = rate;
      utterance.onend = () => { setIsPlayingAudio(false); setIsPausedAudio(false); };
      utterance.onerror = () => { setIsPlayingAudio(false); setIsPausedAudio(false); };
      window.speechSynthesis.speak(utterance);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-center bg-[#0a0a0a]">
        <div className="max-w-md space-y-4">
          <BookOpen className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">पांडुलिपि विवरण (Manuscript Overview)</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">{book.excerpt}</p>
        </div>
      </div>
    );
  }

  const currentChapter = chapters[activeChapterIndex] || chapters[0];
  const isCurrentFinished = savedChapters.includes(currentChapter.number);

  const toggleChapterFinished = (num: number) => {
    let next: number[];
    if (savedChapters.includes(num)) {
      next = savedChapters.filter(n => n !== num);
    } else {
      next = [...savedChapters, num];
    }
    setSavedChapters(next);
    localStorage.setItem(`t2s_book_read_${book.id}`, JSON.stringify(next));
  };

  return (
    <div className="flex h-full min-h-[600px] bg-[#08090d] text-zinc-200 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-20 md:hidden"
        />
      )}

      {/* Chapters Sidebar */}
      <div className={`w-72 sm:w-80 border-r border-zinc-800 bg-[#0d0e14] flex flex-col shrink-0 z-30 transition-all duration-300 ${
        isSidebarOpen 
          ? 'fixed inset-y-0 left-0 shadow-2xl' 
          : 'hidden md:flex'
      }`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
              पाठ्यक्रम तालिका (Table of Contents)
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {chapters.length} अध्याय • {savedChapters.length} पूर्ण
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 md:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
          {chapters.map((ch, idx) => {
            const isSelected = idx === activeChapterIndex;
            const isDone = savedChapters.includes(ch.number);
            return (
              <button
                key={ch.number}
                onClick={() => {
                  setActiveChapterIndex(idx);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/70 text-white shadow-md'
                    : 'bg-black/40 hover:bg-zinc-800/60 border-zinc-800/80 text-zinc-400'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono font-bold mt-0.5 ${
                  isDone 
                    ? 'bg-emerald-500 text-black' 
                    : isSelected ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isDone ? '✓' : ch.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {ch.hindiTitle || ch.title}
                  </h4>
                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5 font-mono">
                    {ch.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Ground Rule at Bottom of Sidebar */}
        {book.groundRule && (
          <div className="p-3.5 border-t border-zinc-800 bg-black/50 text-[11px] space-y-1">
            <span className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
              कैनन आधार नियम:
            </span>
            <p className="text-zinc-300 italic">“{book.groundRule}”</p>
          </div>
        )}
      </div>

      {/* Main Chapter Reader View */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-800 bg-[#0c0d12] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg md:hidden cursor-pointer"
              title="Open Chapter List"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold rounded uppercase">
              अध्याय 0{currentChapter.number}
            </span>
            <span className="text-xs text-zinc-400 truncate hidden sm:inline">
              {currentChapter.hindiTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {'speechSynthesis' in window && (
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <div className="flex items-center">
                  {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        speechRate === speed
                          ? 'bg-amber-500 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {isPlayingAudio && (
                  <button
                    onClick={isPausedAudio ? resumeAudio : pauseAudio}
                    className="p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                    title={isPausedAudio ? "Resume" : "Pause"}
                  >
                    {isPausedAudio ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                  </button>
                )}

                <button
                  onClick={toggleAudioNarration}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-amber-400'
                  }`}
                  title={isPlayingAudio ? "Stop Audio (ऑडियो रोकें)" : "Listen in Hindi (हिंदी में सुनें)"}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3 h-3 text-black" />
                      <span>रोकें</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      <span className="hidden xs:inline">सुनें</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Toggle Font Size"
            >
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>{fontSize === 'normal' ? 'A+' : 'A-'}</span>
            </button>

            <button
              onClick={() => toggleChapterFinished(currentChapter.number)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isCurrentFinished
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isCurrentFinished ? 'पूर्ण (Completed)' : 'पूर्ण मार्क करें'}</span>
            </button>
          </div>
        </div>

        {/* Chapter Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 space-y-8 max-w-4xl mx-auto w-full">
          {/* Chapter Title & Header */}
          <div className="space-y-2 border-b border-zinc-800/80 pb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
              CHAPTER {currentChapter.number} OF {chapters.length}
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {currentChapter.hindiTitle || currentChapter.title}
            </h2>
            <p className="text-sm text-zinc-400 font-mono">
              {currentChapter.title}
            </p>
          </div>

          {/* Chapter Summary Callout */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/20 to-black border border-amber-500/30 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block">
              संक्षिप्त सार (Chapter Overview)
            </span>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
              {currentChapter.summary}
            </p>
          </div>

          {/* Core Lesson Callout */}
          <div className="p-4 sm:p-5 bg-black/60 border border-zinc-800 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block">
              मूल कैनन सिद्धांत (The Inviolable Law)
            </span>
            <p className="text-xs sm:text-base text-white italic font-serif leading-relaxed">
              “{currentChapter.keyLesson}”
            </p>
          </div>

          {/* Full Chapter Text */}
          {currentChapter.content && (
            <div className={`space-y-4 text-zinc-200 leading-relaxed font-sans ${
              fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
            }`}>
              {currentChapter.content.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-relaxed text-zinc-300">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Practical Street Drill */}
          {currentChapter.practicalDrill && (
            <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-black border-2 border-emerald-500/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Target className="w-4 h-4" />
                <span className="text-xs font-mono uppercase font-bold tracking-widest">
                  सड़क व दफ्तर का ज़मीनी असाइनमेंट (Field Drill)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                {currentChapter.practicalDrill}
              </p>
            </div>
          )}

          {/* Bottom Chapter Navigation */}
          <div className="pt-8 border-t border-zinc-800 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                if (activeChapterIndex > 0) setActiveChapterIndex(activeChapterIndex - 1);
              }}
              disabled={activeChapterIndex === 0}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>पिछला अध्याय (Previous)</span>
            </button>

            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
              {activeChapterIndex + 1} / {chapters.length}
            </span>

            <button
              onClick={() => {
                if (activeChapterIndex < chapters.length - 1) setActiveChapterIndex(activeChapterIndex + 1);
              }}
              disabled={activeChapterIndex === chapters.length - 1}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <span>अगला अध्याय (Next)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
