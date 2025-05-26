import { defineStore } from 'pinia';
import { from, ReplaySubject, take } from 'rxjs';
import { fetchCurrency } from '../service/fetch-currency';

const currency$ = new ReplaySubject<string>(1);
from(fetchCurrency())
  .pipe(take(1))
  .subscribe((currency) => currency$.next(currency));

export const useSharedStore = defineStore('shared', {
  state: () => {
    return {
      currency$: currency$.asObservable(),
    };
  },
  actions: {
    selectCurrency(newCurrency: string) {
      currency$.next(newCurrency);
    },
  },
});
