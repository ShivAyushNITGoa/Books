import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Share2, Printer, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { getRankFromXP } from '../constants';

interface SovereignCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const MILESTONES = [
  {
    id: 'day-7',
    dayReq: 7,
    titleEn: '7-Day Cognitive Awakening',
    titleHi: '७-दिवसीय वैचारिक जागरण',
    descEn: 'Completed initial deconstruction of conditioning and established daily stoic discipline.',
    descHi: 'सामाजिक कंडीशनिंग का प्रारंभिक विखंडन और दैनिक अनुशासन की स्थापना।'
  },
  {
    id: 'day-21',
    dayReq: 21,
    titleEn: '21-Day Habit Transformation',
    titleHi: '२१-दिवसीय आदत परिवर्तन',
    descEn: 'Transformed daily subconscious routines and cemented unshakeable habit loops.',
    descHi: 'अवचेतन आदतों का रूपांतरण और मानसिक दृढ़ता का निरंतर निर्माण।'
  },
  {
    id: 'day-50',
    dayReq: 50,
    titleEn: '50-Day Social Decoding',
    titleHi: '५०-दिवसीय सामाजिक डिकोडिंग',
    descEn: 'Mastered hidden behavioral patterns, status games, and strategic detachment.',
    descHi: 'सामाजिक प्रणालियों, स्टेटस गेम्स और रणनीतिक मूक प्रभाव की गहरी समझ।'
  },
  {
    id: 'day-100',
    dayReq: 100,
    titleEn: '100-Day Sovereign Master',
    titleHi: '१००-दिवसीय पूर्ण संप्रभुता (Sovereignty)',
    descEn: 'Attained supreme psychological sovereignty, conscious self-rule, and existential clarity.',
    descHi: 'पूर्ण मनोवैज्ञानिक स्वायत्तता, आंतरिक स्वराज और उच्चतम वैचारिक संप्रभुता।'
  }
];

export function SovereignCertificateModal({
  isOpen,
  onClose,
  profile
}: SovereignCertificateModalProps) {
  const completedCount = (profile.completedDays || []).length;
  
  // Find highest unlocked milestone, default to Day 7
  const initialMilestone = MILESTONES.slice().reverse().find(m => completedCount >= m.dayReq) || MILESTONES[0];
  const [selectedMilestone, setSelectedMilestone] = useState(initialMilestone);
  const [copiedLink, setCopiedLink] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const rank = getRankFromXP(profile.xp || 0);
  const participantName = profile.displayName || 'Dedicated Practitioner';
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const certId = `T2S-${profile.uid.slice(0, 6).toUpperCase()}-${selectedMilestone.dayReq}D`;

  const handleShareWhatsApp = () => {
    const text = `🎖️ *Talk2Society Sovereign Certificate*\n\nमैं A. K. Chandradipti के *100-Day Consciousness Journey* में *${selectedMilestone.titleHi} (${selectedMilestone.titleEn})* की उपलब्धि हासिल कर चुका हूँ!\n\n👤 Practitioner: ${participantName}\n⚡ Rank: ${rank.name} | Total XP: ${profile.xp || 0}\n📜 Certificate ID: ${certId}\n\nसत्यमेव आत्मसंप्रभुता • Talk2Society Nexus`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `Talk2Society Official Verification Certificate\nPractitioner: ${participantName}\nMilestone: ${selectedMilestone.titleEn} (${selectedMilestone.titleHi})\nRank: ${rank.name}\nCert ID: ${certId}\nDate: ${issueDate}`;
    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0b0c10] border border-amber-500/30 rounded-[28px] sm:rounded-[36px] max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl relative overflow-hidden"
        >
          {/* Top Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/15 rounded-2xl text-amber-400 border border-amber-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-display font-black text-white tracking-tight uppercase">
                  संप्रभुता प्रमाण पत्र (Sovereignty Certificate)
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                  Talk2Society Official Milestone Recognition • A. K. Chandradipti
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer border border-zinc-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Milestone Selector Tabs */}
          <div className="px-4 sm:px-6 py-3 bg-zinc-900/50 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
            {MILESTONES.map((m) => {
              const isUnlocked = completedCount >= m.dayReq;
              const isSelected = selectedMilestone.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMilestone(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : isUnlocked
                      ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'
                      : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:text-zinc-400'
                  }`}
                >
                  <span>{m.dayReq} Days</span>
                  {isUnlocked && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Certificate Printable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
            <div
              ref={certRef}
              id="printable-certificate"
              className="relative w-full max-w-2xl bg-gradient-to-b from-[#13151b] to-[#0c0d12] border-4 border-amber-500/40 rounded-3xl p-6 sm:p-10 text-center shadow-2xl overflow-hidden"
              style={{
                boxShadow: '0 0 50px rgba(245, 158, 11, 0.08)'
              }}
            >
              {/* Inner Ornate Border */}
              <div className="absolute inset-2 sm:inset-3 border border-amber-500/20 rounded-2xl pointer-events-none" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400" />

              {/* Watermark Logo */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <span className="text-[120px] font-black uppercase tracking-tighter">T2S</span>
              </div>

              {/* Certificate Header */}
              <div className="space-y-1 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-[10px] font-mono uppercase tracking-widest font-black">
                  <Sparkles className="w-3 h-3" /> TALK2SOCIETY NEXUS OFFICIAL
                </div>
                <h1 className="text-xl sm:text-3xl font-display font-black text-white tracking-wider uppercase pt-2">
                  CERTIFICATE OF SOVEREIGNTY
                </h1>
                <p className="text-xs sm:text-sm font-hindi text-amber-300 font-bold tracking-wide">
                  संप्रभुता एवं वैचारिक स्वायत्तता प्रमाण पत्र
                </p>
              </div>

              {/* Recipient */}
              <div className="my-6 space-y-2 relative z-10">
                <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
                  This certifies that / प्रमाणित किया जाता है कि
                </p>
                <h2 className="text-2xl sm:text-4xl font-display font-black text-amber-400 tracking-tight underline decoration-amber-500/30 decoration-2 underline-offset-8">
                  {participantName}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400 pt-1">
                  <span>Rank: <strong className="text-white">{rank.name}</strong></span>
                  <span>•</span>
                  <span>Total XP: <strong className="text-amber-400">{profile.xp || 0}</strong></span>
                </div>
              </div>

              {/* Achievement Text */}
              <div className="my-6 space-y-2 max-w-lg mx-auto relative z-10">
                <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
                  has demonstrated unwavering stoic consistency, independent reasoning, and disciplined progression in the 100-Day Consciousness Framework by conquering the milestone:
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-0.5">
                  <span className="block text-sm sm:text-base font-bold text-amber-300 font-mono">
                    ✦ {selectedMilestone.titleEn} ✦
                  </span>
                  <span className="block text-xs font-hindi text-amber-200">
                    ({selectedMilestone.titleHi})
                  </span>
                </div>
              </div>

              {/* Signatures & Verification Seal */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left relative z-10">
                <div className="text-center sm:text-left space-y-0.5">
                  <div className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                    A. K. Chandradipti
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Founder, Talk2Society • Social Strategist
                  </div>
                </div>

                {/* Seal Badge */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 p-[2px] shadow-lg shrink-0">
                  <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center text-center p-1">
                    <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-tighter leading-tight">
                      SEAL OF
                    </span>
                    <span className="text-[9px] font-mono font-black text-white uppercase tracking-tighter leading-tight">
                      SOVEREIGNTY
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right space-y-0.5 font-mono text-[10px] text-zinc-400">
                  <div>Date: <span className="text-white font-bold">{issueDate}</span></div>
                  <div>ID: <span className="text-amber-400 font-bold">{certId}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 sm:p-6 bg-zinc-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp पर शेयर करें</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>प्रिंट / PDF सेव करें</span>
              </button>
            </div>

            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : null}
              <span>{copiedLink ? 'विवरण कॉपी हुआ!' : 'प्रमाण पत्र विवरण कॉपी करें'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
