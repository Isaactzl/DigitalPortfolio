/** A value that drifts towards 1 while `on` and back to 0 when not, for smooth hover effects. */
export function easedFlag(rate = 0.08) {
  let level = 0;
  return (on: boolean) => (level += ((on ? 1 : 0) - level) * rate);
}
