import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getLocalDateString = (d?: Date) => {
  const dateObj = d || new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface PresenceCalendarProps {
  presenceDays: string[];
  completedDaysCount: number;
}

export default function PresenceCalendar({ presenceDays = [], completedDaysCount = 0 }: PresenceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMinimized, setIsMinimized] = useState(true);
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const numDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const hindiMonths = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    days.push(i);
  }

  const todayStr = getLocalDateString();

  return (
    <div className="bg-[#0c0e14]/90 border border-[#1d222e] rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 md:p-6 w-full max-w-3xl mx-auto shadow-2xl transition-all duration-300 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-amber-500/80">
              Attendance Tracker / दैनिक उपस्थिति
            </span>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-black text-white uppercase italic tracking-tight leading-tight">
            Presence <span className="text-amber-500">Calendar</span>
          </h2>
          <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider sm:tracking-widest mt-0.5">
            दैनिक सक्रियता एवं उपस्थिति रिकॉर्ड
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button 
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-white/80 hover:bg-white/10 transition-colors shrink-0"
          >
            {isMinimized ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Maximize / पूर्ण रूप</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Minimize / संक्षिप्त रूप</span>
              </>
            )}
          </button>

          {!isMinimized && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button 
                type="button" 
                onClick={prevMonth} 
                className="p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
                title="Previous Month"
              >
                <ArrowLeft size={13} />
              </button>
              <button 
                type="button" 
                onClick={() => setCurrentDate(new Date())} 
                className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button 
                type="button" 
                onClick={nextMonth} 
                className="p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors rotate-180 flex items-center justify-center cursor-pointer"
                title="Next Month"
              >
                 <ArrowLeft size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div 
            key="minimized-presence"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Weekly Strip: Last 7 days (Calendar 1 - slightly reduced size, reduced date icon size, preserved text) */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4 md:p-5 max-w-xl mx-auto">
              <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider sm:tracking-widest mb-3 sm:mb-4 text-center sm:text-left">
                Last 7 Days Consistency / पिछले 7 दिन की निरंतरता
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 justify-items-center">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - idx));
                  const dateStr = getLocalDateString(d);
                  const isDayToday = dateStr === todayStr;
                  const isActive = presenceDays.includes(dateStr);
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                      <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        {dayName}
                      </span>
                      {/* Reduced date icon box size, retaining full legible font size */}
                      <div className={`relative w-8 h-8 sm:w-9 sm:h-9 max-w-[34px] sm:max-w-[38px] rounded-lg sm:rounded-xl border flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-amber-500/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                          : 'bg-white/5 border-white/10'
                      } ${isDayToday ? 'ring-1 ring-amber-500' : ''}`}>
                        <span className={`text-xs sm:text-sm font-bold leading-none ${isActive ? 'text-amber-400' : 'text-gray-400'}`}>
                          {d.getDate()}
                        </span>
                        {isActive && (
                          <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,1)]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="maximized-presence"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Monthly Calendar (Calendar 2 - slightly reduced container size, reduced date icon size, preserved text & buttons) */}
            <div className="max-w-[420px] sm:max-w-[460px] mx-auto">
              <div className="mb-3 sm:mb-4 text-center sm:text-left">
                <h3 className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider">
                  {months[month]} <span className="text-amber-500 font-extrabold">{year}</span>
                </h3>
                <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">
                  {hindiMonths[month]} {year}
                </p>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[8.5px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider pb-1.5 sm:pb-3">
                    {d}
                  </div>
                ))}
                
                {days.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} />;
                  
                  const dateObj = new Date(year, month, day);
                  const dateStr = getLocalDateString(dateObj);
                  const isToday = dateStr === todayStr;
                  const hasPresence = presenceDays.includes(dateStr);
                  
                  return (
                    <motion.div
                      key={day}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: Math.min(day * 0.004, 0.12) }}
                      className={`relative aspect-square max-w-[33px] sm:max-w-[40px] md:max-w-[44px] w-full mx-auto rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all group ${
                        hasPresence 
                          ? 'bg-amber-500/10 border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } ${isToday ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-black' : ''}`}
                    >
                      <span className={`text-[11px] sm:text-sm font-display font-black leading-none ${hasPresence ? 'text-amber-400' : 'text-gray-400'}`}>
                        {day}
                      </span>
                      
                      {hasPresence && (
                        <div className="absolute bottom-1 sm:bottom-1.5 w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,1)]" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend & Stats Bar with Exact Alignment of 'Presence' and 'Inactivity' */}
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-white/10 pt-5 sm:pt-6">
        <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 flex-wrap">
          {/* Presence item with exact icon & text alignment */}
          <div className="inline-flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold text-white/70 uppercase tracking-wider leading-none select-none flex items-center">
              Presence / उपस्थिति
            </span>
          </div>

          {/* Inactivity item with exact icon & text alignment */}
          <div className="inline-flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-white/10 border border-white/20 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold text-white/45 uppercase tracking-wider leading-none select-none flex items-center">
              Inactivity / निष्क्रिय
            </span>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl text-center min-w-[90px] sm:min-w-[100px]">
             <div className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest leading-none mb-1">Total Active</div>
             <div className="text-xs font-bold text-amber-400">{presenceDays.length} Days</div>
          </div>
          <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-center min-w-[90px] sm:min-w-[100px]">
             <div className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Milestones</div>
             <div className="text-xs font-bold text-white uppercase">{completedDaysCount}/100</div>
          </div>
        </div>
      </div>
    </div>
  );
}
