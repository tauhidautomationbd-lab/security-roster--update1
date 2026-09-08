export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDate = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const getMonthWeeks = (year: number, month: number) => {
  const weeks = [];
  let currentStart = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  
  while (currentStart <= endOfMonth) {
    let nextFriday = new Date(currentStart);
    let day = nextFriday.getDay();
    let daysToFriday = day === 6 ? 6 : (5 - day);
    
    let currentEnd = new Date(nextFriday);
    currentEnd.setDate(currentEnd.getDate() + daysToFriday);
    
    if (currentEnd > endOfMonth) {
      currentEnd = new Date(endOfMonth);
    }
    
    weeks.push({
      start: formatDate(currentStart),
      end: formatDate(currentEnd)
    });
    
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  return weeks;
};

export const getWeekDateRange = (weekNumber: number) => {
  let currentMonth = new Date(2026, 8, 1); // Anchor: Sept 1, 2026
  let targetWeek = weekNumber;
  
  if (targetWeek > 0) {
    while (true) {
      const weeks = getMonthWeeks(currentMonth.getFullYear(), currentMonth.getMonth());
      if (targetWeek <= weeks.length) {
        return weeks[targetWeek - 1];
      }
      targetWeek -= weeks.length;
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
  } else {
    while (true) {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      const weeks = getMonthWeeks(currentMonth.getFullYear(), currentMonth.getMonth());
      if (targetWeek + weeks.length > 0) {
        return weeks[targetWeek + weeks.length - 1];
      }
      targetWeek += weeks.length;
    }
  }
};

export const getEndDate = (startDateStr: string) => {
  const d = parseLocalDate(startDateStr);
  d.setDate(d.getDate() + 6);
  return formatDate(d);
};

export const formatDisplayDate = (dateStr: string) => {
  const d = parseLocalDate(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

