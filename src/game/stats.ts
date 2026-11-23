import type { Topic } from './types';

export interface Stats {
  version: 1;
  topics: Partial<Record<Topic, { right: number; total: number }>>;
  best: number;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

const KEY = 'mainframe-run:stats';
/** Below this many answers a topic's accuracy is too noisy to call it weak. */
const MIN_ANSWERS = 3;

export const emptyStats = (): Stats => ({ version: 1, topics: {}, best: 0 });

/** Reading localStorage itself can throw when site data is blocked. */
function browserStore(): Store | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadStats(store: Store | null = browserStore()): Stats {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<Stats>;
    if (parsed.version !== 1 || typeof parsed.topics !== 'object' || parsed.topics === null) {
      return emptyStats();
    }
    return { version: 1, topics: parsed.topics, best: Number(parsed.best) || 0 };
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats: Stats, store: Store | null = browserStore()) {
  try {
    store?.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Storage full or blocked: the run still counts on screen, it just isn't remembered.
  }
}

export function recordAnswer(stats: Stats, topic: Topic, right: boolean): Stats {
  const before = stats.topics[topic] ?? { right: 0, total: 0 };
  return {
    ...stats,
    topics: {
      ...stats.topics,
      [topic]: { right: before.right + (right ? 1 : 0), total: before.total + 1 },
    },
  };
}

export const recordScore = (stats: Stats, score: number): Stats => ({
  ...stats,
  best: Math.max(stats.best, score),
});

export function weakestTopic(stats: Stats): Topic | null {
  let weakest: Topic | null = null;
  let lowest = Infinity;
  for (const [topic, counts] of Object.entries(stats.topics) as [
    Topic,
    { right: number; total: number },
  ][]) {
    if (counts.total < MIN_ANSWERS) continue;
    const accuracy = counts.right / counts.total;
    if (accuracy < lowest) {
      lowest = accuracy;
      weakest = topic;
    }
  }
  return weakest;
}
