export const TimeFrames: { [key: string]: number | string } = Object.freeze({
  'This Year': 'This Year',
  lastYear: new Date().getFullYear() - 1,
  twoYearsAgo: new Date().getFullYear() - 2,
  threeYearsAgo: new Date().getFullYear() - 3,
  yourYearsAgo: new Date().getFullYear() - 4,
  fiveYearsAgo: new Date().getFullYear() - 5,
});
