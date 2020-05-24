/**
 * Helper for generating complex class names
 */
export function cx(classNames) {
  if (Array.isArray(classNames)) return classNames.map(x => cx(x)).join(' ');
  if (typeof classNames === 'object') {
    return Object.keys(classNames).filter(key => Boolean(classNames[key])).join(' ');
  }
  if (typeof classNames === 'string') return classNames;
  throw new Error('Invalid className type');
}

/**
 * Calculates where we should place the borders depending on a
 * cell's location
 */
export function calcBorderValues({ row, column }) {
  const borders = {};

  if (row === 0 || row === 3 || row === 6) {
    borders.borderTop = '3px solid var(--border-color)';
  } else if (row === 8) {
    borders.borderTop = '1px solid var(--border-color)';
    borders.borderBottom = '3px solid var(--border-color)';
  } else {
    borders.borderTop = '1px solid var(--border-color)';
  }

  if (column === 0 || column === 3 || column === 6) {
    borders.borderLeft = '3px solid var(--border-color)';
  } else if (column === 8) {
    borders.borderLeft = '1px solid var(--border-color)';
    borders.borderRight = '3px solid var(--border-color)';
  } else {
    borders.borderLeft = '1px solid var(--border-color)';
  }

  return borders;
}

/** Immutable helpers */
export const addItem = (arr, x) => arr.concat(x);
export const updateItem = (arr, idx, x) => [...arr.slice(0, idx), x, ...arr.slice(idx+1)];
export const removeItem = (arr, idx) => [...arr.slice(0, idx), ...arr.slice(idx+1)]

export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    cache.set(key, fn(...args));
    return cache.get(key);
  };
}
