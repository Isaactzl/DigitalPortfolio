import { describe, expect, it } from 'vitest';
import { claimEvent } from './bookings';

const party = 'Sat 14 Dec · Birthday party · 12 pax';
const outing = 'Sun 15 Dec · Team outing · 20 pax';

describe('claimEvent', () => {
  it('gives the event to the first store that asks', () => {
    const owners = new Map<string, string>();
    expect(claimEvent(owners, 'A', party)).toEqual({ kind: 'created', store: 'A' });
    expect(owners.get(party)).toBe('A');
  });

  it('flags a second store booking the same event', () => {
    const owners = new Map<string, string>();
    claimEvent(owners, 'A', party);
    expect(claimEvent(owners, 'B', party)).toEqual({ kind: 'duplicate', store: 'B', owner: 'A' });
  });

  it('does not hand the event over to the store that was flagged', () => {
    const owners = new Map<string, string>();
    claimEvent(owners, 'A', party);
    claimEvent(owners, 'B', party);
    expect(owners.get(party)).toBe('A');
  });

  it('lets the owning store reuse its own form', () => {
    const owners = new Map<string, string>();
    claimEvent(owners, 'A', party);
    expect(claimEvent(owners, 'A', party)).toEqual({ kind: 'reused', store: 'A' });
  });

  it('treats different events independently', () => {
    const owners = new Map<string, string>();
    claimEvent(owners, 'A', party);
    expect(claimEvent(owners, 'B', outing)).toEqual({ kind: 'created', store: 'B' });
  });
});
