

// make working with ordered pairs a little bit easier
export type OrderedPair<T=number, R=number> = { x: T;y: R;};
type OrderedPairs<T=number,R=number> = OrderedPair<T,R>[];

/** Checks if a value is a number */
export const isNumber = (n: unknown): n is number => typeof n === 'number';

/** Converts two arrays into an array of ordered pairs [ {'x': x[i], 'y' : y[i]} , ... ] . */
export function toOrderedPairs<T,R>(x: T[], y: R[]): OrderedPairs<T,R> {
  return x.map((x, i) => ({ x, y: y[i] }));
}

/** Get the arrays from an OrderedPair[] */
export function fromOrderedPairs<T,R>(pairs: OrderedPairs<T,R>): [T[], R[]] {
  return [pairs.map((pair) => pair.x), pairs.map((pair) => pair.y)];
}


/** apply a function to an array and get back the order pairs */
export function elementWise<Input=number, Output=number>(array: Input[], operation: (x: Input) => Output): OrderedPairs<Input,Output> {
  return array.map((x) => ({ x, y: operation(x) }));
}



// Functions just for testing

function _noise(x: number, n: number): number {
  return x + Math.random() * n - n / 2;
}


// TimeSeries equations
function fractionalYear(date: Date): number {
  // get fractional year
  const year = date.getFullYear();
  const start = new Date(year, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  const diff = date.getTime() - start.getTime();
  const total = end.getTime() - start.getTime();
  return year + diff / total;
}



// function generate a fake time series and one with and without noise
export function generateFakeTimeSeries(start: Date, end: Date, n: number, noise: number = 0): OrderedPairs<Date> {
  // get a list of dates
  const dates = Array.from({ length: n }, (_, i) => start.getTime() + (end.getTime() - start.getTime()) * i / (n - 1));
  // get the sine of the fractional year. We want a 1 year period for test data
  const sine = dates.map( (date) => Math.sin(fractionalYear(new Date(date)) * 2 * Math.PI));
  // add noise if requested
  const out = noise ? sine.map(s => _noise(s,1)) : sine;
  // return the ordered pairs
  return toOrderedPairs(dates.map((d) => new Date(d)), out);
}
