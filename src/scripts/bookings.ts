export type Claim =
  | { kind: 'created'; store: string }
  | { kind: 'reused'; store: string }
  | { kind: 'duplicate'; store: string; owner: string };

/**
 * The first store to claim an event owns it. A second store asking for the
 * same event is flagged instead of getting its own form.
 */
export function claimEvent(owners: Map<string, string>, store: string, event: string): Claim {
  const owner = owners.get(event);
  if (owner === undefined) {
    owners.set(event, store);
    return { kind: 'created', store };
  }
  if (owner === store) return { kind: 'reused', store };
  return { kind: 'duplicate', store, owner };
}
