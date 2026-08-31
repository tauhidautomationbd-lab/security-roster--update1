export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDate = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

