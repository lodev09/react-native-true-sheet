/**
 * Invokes the iteratee n times, returning an array of the results of each invocation.
 * The iteratee is invoked with one argument; (index).
 */
export const times = <T>(length: number, iteratee: (index: number) => T): T[] =>
  Array.from<T, number>({ length }, (_, k) => k).map(iteratee);
