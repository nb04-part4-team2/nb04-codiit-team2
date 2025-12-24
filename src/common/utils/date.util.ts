export const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
export const getEndOfDay = (date: Date) => new Date(date.setHours(23, 59, 59, 999));

export const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // adjust when day is sunday
  return getStartOfDay(new Date(d.setDate(diff)));
};

export const getEndOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  return getEndOfDay(new Date(d.setDate(diff)));
};

export const getStartOfMonth = (date: Date) =>
  getStartOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
export const getEndOfMonth = (date: Date) =>
  getEndOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));

export const getStartOfYear = (date: Date) => getStartOfDay(new Date(date.getFullYear(), 0, 1));
export const getEndOfYear = (date: Date) => getEndOfDay(new Date(date.getFullYear(), 11, 31));
