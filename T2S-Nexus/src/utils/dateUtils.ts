export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getIstHourAndDateStr = (): { hour: number; dateStr: string } => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(new Date());
    const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    const year = getVal('year');
    const month = getVal('month');
    const day = getVal('day');
    const hour = parseInt(getVal('hour'), 10) || 0;
    
    const dateStr = `${year}-${month}-${day}`;
    return { hour, dateStr };
  } catch {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const dateStr = istDate.toISOString().split('T')[0];
    const hour = istDate.getUTCHours();
    return { hour, dateStr };
  }
};

export const getIstDateStrOfDate = (date: Date): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    const year = getVal('year');
    const month = getVal('month');
    const day = getVal('day');
    
    return `${year}-${month}-${day}`;
  } catch {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
  }
};

export const parseDateTime = (val: any): Date | null => {
  if (!val) return null;
  if (typeof val?.toDate === 'function') {
    const d = val.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  // Handles Firestore Timestamp serialized to JSON in localStorage or state:
  // e.g. { seconds: 1728470000, nanoseconds: 0 } or { _seconds: 1728470000, _nanoseconds: 0 }
  if (typeof val === 'object') {
    const sec = typeof val.seconds === 'number' ? val.seconds : (typeof val._seconds === 'number' ? val._seconds : null);
    if (sec !== null) {
      const nano = typeof val.nanoseconds === 'number' ? val.nanoseconds : (typeof val._nanoseconds === 'number' ? val._nanoseconds : 0);
      const d = new Date(sec * 1000 + Math.floor(nano / 1000000));
      return isNaN(d.getTime()) ? null : d;
    }
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const isCompletedOnDate = (lastCompletedAt: any): boolean => {
  if (!lastCompletedAt) return false;
  try {
    const lastDate = parseDateTime(lastCompletedAt);
    if (!lastDate) return false;

    // The canonical Talk2Society daily schedule resets every midnight at 12:00 AM IST (Asia/Kolkata).
    const todayIst = getIstHourAndDateStr().dateStr;
    const lastCompletedIst = getIstDateStrOfDate(lastDate);
    return todayIst === lastCompletedIst;
  } catch {
    return false;
  }
};
