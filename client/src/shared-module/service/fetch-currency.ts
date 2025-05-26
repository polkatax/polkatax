import { currencyList } from '../const/currencyList';

function getCurrencyByCountry(countryCode: string) {
  for (const currencyInfo of currencyList) {
    if (currencyInfo.countries.indexOf(countryCode) > -1) {
      return currencyInfo.name;
    }
  }
  return 'USD';
}

export const fetchCurrency = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const body = await response.json();
    const countryCode = body.country; // e.g., "US"
    const currency = getCurrencyByCountry(countryCode);
    return currency;
  } catch {
    return 'USD';
  }
};
