export const getYearRange = (
  year: number,
): { startDay: Date; endDay: Date | undefined } => {
  const start = new Date(Date.UTC(
    year - 1, 
    11,         // month index (0-based, so 11 = December)
    31,         
    0,         
    0,         
    0,        
    0        
  ));

  const end = new Date(Date.UTC(
    year + 1, 
    0,         // month index (0-based, so 11 = December)
    1,         
    23,         
    59,         
    59,        
    999      
  ));

  return {
    startDay: start,
    endDay: end > new Date() ? undefined : end,
  };
};
