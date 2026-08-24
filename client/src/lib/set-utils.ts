// Returns a NEW Set with `value` toggled in/out — used by the tree-picker
// UIs (path builder, subjects tree) to flip an expanded/selected id without
// mutating the Set held in state.
export function toggleSetMember<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}
