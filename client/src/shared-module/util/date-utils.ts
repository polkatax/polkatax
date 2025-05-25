export const getStartOfCurrentDay = () => {
  const temp = new Date();
  temp.setMilliseconds(0);
  temp.setSeconds(0);
  temp.setMinutes(0);
  temp.setHours(0);
  return temp;
};

export const getFirstDayOfYear = () => {
  const temp = new Date();
  temp.setMilliseconds(0);
  temp.setSeconds(0);
  temp.setMinutes(0);
  temp.setHours(0);
  temp.setMonth(0);
  temp.setDate(1);
  return temp;
};

export const getStartDate = (year: number) => {
  const temp = getStartOfCurrentDay();
  temp.setDate(1);
  temp.setMonth(0);
  temp.setFullYear(Number(year));
  return temp.getTime();
};

export const getEndDate = (year: number) => {
  const temp = getStartOfCurrentDay();
  temp.setDate(1);
  temp.setMonth(0);
  temp.setFullYear(Number(year) + 1);
  return temp.getTime();
};

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

export const formatTimeFrame = (year: number) => {
  const start = getStartDate(year);
  const end = new Date(getEndDate(year));
  end.setDate(end.getDate() - 1);
  return formatDate(start) + ' until ' + formatDate(end.getTime());
};
