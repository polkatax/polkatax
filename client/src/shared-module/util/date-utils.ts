import { TimeFrames } from '../model/time-frames';

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

export const getStartDate = (timeFrameKey: string) => {
  const timeFrame = TimeFrames[timeFrameKey];
  const temp = getStartOfCurrentDay();
  if (typeof timeFrame === 'string') {
    switch (timeFrame) {
      case TimeFrames['This Year']:
        temp.setDate(1);
        temp.setMonth(0);
        break;
        break;
    }
  } else {
    temp.setDate(1);
    temp.setMonth(0);
    temp.setFullYear(Number(timeFrame));
  }
  return temp.getTime();
};

export const getEndDate = (timeFrameKey: string) => {
  const timeFrame = TimeFrames[timeFrameKey];
  const temp = getStartOfCurrentDay();
  switch (timeFrame) {
    case TimeFrames['This Year']:
      temp.setDate(temp.getDate() + 1);
      break;
    default:
      temp.setDate(1);
      temp.setMonth(0);
      temp.setFullYear(Number(timeFrame) + 1);
      break;
  }
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

export const formatTimeFrame = (timeFrame: string) => {
  const start = getStartDate(timeFrame);
  const end = new Date(getEndDate(timeFrame));
  end.setDate(end.getDate() - 1);
  return formatDate(start) + ' until ' + formatDate(end.getTime());
};
