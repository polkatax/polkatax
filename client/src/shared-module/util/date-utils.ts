export const formatDateUTC = (d: number) => {
  const date = new Date(d);
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth() + 1; // Months are zero-indexed
  const utcDate = date.getUTCDate();
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcSeconds = date.getUTCSeconds();

  // Format the UTC time as a string
  return `${utcYear}-${String(utcMonth).padStart(2, '0')}-${String(
    utcDate
  ).padStart(2, '0')}T${String(utcHours).padStart(2, '0')}:${String(
    utcMinutes
  ).padStart(2, '0')}:${String(utcSeconds).padStart(2, '0')}Z`;
};

export function formatDate(date: number) {
  const d = new Date(date),
    year = d.getFullYear();
  let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}

export const getBeginningAndEndOfYear = (
  year: number
): { beginning: number; end: number } => {
  const beginning = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
  const end = new Date(year, 11, 31, 23, 59, 99, 999).getTime();
  return { beginning, end };
};
