export const mapWithPrevValue = <T, U>(
  fn: (item: T, index: number, prev: any | undefined) => U,
  arr: T[]
): U[] =>
  arr.reduce((prev, current, index) => [...prev, fn(current, index, prev.at(-1))], [] as U[])
