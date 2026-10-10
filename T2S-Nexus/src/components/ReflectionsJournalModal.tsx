import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Share2, Download, Copy, Check, BookOpen, Calendar, Sparkles } from 'lucide-react';

interface ReflectionsJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  reflections?: Record<string, string>;
  userName?: string;
}

export function ReflectionsJournalModal({
  isOpen,
  onClose,
  reflections = {},
  userName = 'Practitioner'
}: ReflectionsJournalModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const reflectionEntries = useMemo(() => {
    const list = Object.entries(reflections).map(([date, text]) => ({
      date,
      text: typeof text === 'string' ? text : JSON.stringify(text)
    }));

    list.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.date.localeCompare(a.date) 
        : a.date.localeCompare(b.date);
    });

    return list;
  }, [reflections, sortOrder]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return reflectionEntries;
    const term = searchTerm.toLowerCase();
    return reflectionEntries.filter(
      item => item.date.toLowerCase().includes(term) || item.text.toLowerCase().includes(term)
    );
  }, [reflectionEntries, searchTerm]);

  const totalWords = useMemo(() => {
    return reflectionEntries.reduce((acc, curr) => {
      const words = curr.text.trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
  }, [reflectionEntries]);

  const handleCopy = (date: string, text: string) => {
    const quote = `✦ Talk2Society Nightly Wisdom [${date}]\n"${text}"\n— ${userName}`;
    navigator.clipboard.writeText(quote);
    setCopiedKey(date);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShareWhatsApp = (date: string, text: string) => {
    const message = `*Talk2Society Nightly Wisdom* 📜\n\n"${text}"\n\n🗓️ Date: ${date}\n👤 Practitioner: ${userName}\n⚡ 100-Day Consciousness Journey (T2S)`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExportJournal = () => {
    if (reflectionEntries.length === 0) return;
    const header = `==========================================================\n TALK2SOCIETY (T2S) — PERSONAL REFLECTIONS JOURNAL\n Practitioner: ${userName}\n Total Reflections: ${reflectionEntries.length}\n Total Words: ${totalWords}\n Exported on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n==========================================================\n\n`;

    const body = reflectionEntries.map((item, idx) => {
      return `[ENTRY #${reflectionEntries.length - idx}] — ${item.date}\n${item.text}\n----------------------------------------------------------\n`;
    }).join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `T2S_Wisdom_Journal_${userName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-[#0b0d13] border border-amber-500/20 rounded-[28px] sm:rounded-[36px] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
        >
          {/* Top banner accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

          {/* Modal Header */}
          <div className="p-4 sm:p-6 border-b border-white/5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-display font-black text-white tracking-tight uppercase">
                    दैनिक चिंतन डायरी (Wisdom Journal)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                    10:00 PM Nightly Reflections Timeline • {userName}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer border border-zinc-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="px-4 sm:px-6 py-3 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white">{reflectionEntries.length}</strong> प्रविष्टियां (Entries)
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white">{totalWords.toLocaleString()}</strong> कुल शब्द (Words)
              </span>
            </div>

            <button
              onClick={handleExportJournal}
              disabled={reflectionEntries.length === 0}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>एक्सपोर्ट करें (.txt Export)</span>
            </button>
          </div>

          {/* Controls: Search and Sort */}
          <div className="p-4 sm:px-6 py-3 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="दिनांक या शब्द खोजें (Search date or reflections)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">क्रम (Sort):</span>
              <button
                onClick={() => setSortOrder('desc')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  sortOrder === 'desc'
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                नया पहले (Newest)
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  sortOrder === 'asc'
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                पुराना पहले (Oldest)
              </button>
            </div>
          </div>

          {/* Reflections List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[58vh]">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-500">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold text-sm">
                  {reflectionEntries.length === 0 
                    ? 'कोई चिंतन दर्ज नहीं हुआ है (No Reflections Yet)' 
                    : 'खोज के अनुसार कोई प्रविष्टि नहीं मिली (No matches found)'}
                </h4>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                  {reflectionEntries.length === 0
                    ? 'प्रतिदिन रात 10:00 बजे IST काउंसिल प्रश्न का उत्तर देकर अपने चिंतन यहाँ सुरक्षित करें।'
                    : 'कृपया कोई अन्य तारीख या खोज शब्द आज़माएँ।'}
                </p>
              </div>
            ) : (
              filteredEntries.map((item) => (
                <div
                  key={item.date}
                  className="p-4 sm:p-5 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 border border-zinc-800 hover:border-amber-500/30 rounded-2xl space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                        {item.date}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        10:00 PM IST Council
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(item.date, item.text)}
                        title="Copy to clipboard"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                      >
                        {copiedKey === item.date ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(item.date, item.text)}
                        title="Share to WhatsApp"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-zinc-200 text-xs sm:text-sm font-medium italic leading-relaxed pl-3 border-l-2 border-amber-500/40">
                    "{item.text}"
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 sm:px-6 bg-[#07090d] border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Talk2Society Sovereign Archive</span>
            <button
              onClick={onClose}
              className="text-amber-400 hover:underline cursor-pointer font-bold"
            >
              बंद करें (Close)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
