import { describe, expect, it } from 'vitest';
import { FLOOR, parseFloor, type Tile } from './map';
import { BOT_ROUTES } from './bots';
import {
  answer,
  createRun,
  interact,
  move,
  score,
  tick,
  BOT_PENALTY,
  CORRECT_BONUS,
  RUN_SECONDS,
  WRONG_PENALTY,
  type Run,
} from './run';
import { emptyStats, loadStats, recordAnswer, recordScore, weakestTopic } from './stats';
import type { Question, Topic } from './types';

const floor = parseFloor(FLOOR);

/** A deck whose every question has the same right answer: "yes". */
function fakeDeck() {
  return {
    draw(topic: Topic): Question {
      const base = {
        id: `${topic}-q`,
        topic,
        kind: 'typed' as const,
        prompt: 'Say yes',
        answer: ['yes'],
        explain: 'The answer was yes.',
      };
      return topic === 'mainframe' ? { ...base, followUp: { ...base, id: 'mf-2' } } : base;
    },
  };
}

/** Puts the player beside terminal `id`, facing it, without walking there. */
function standAt(run: Run, id: number) {
  const terminal = floor.terminals.find((t) => t.id === id)!.at;
  const spots: [Tile, Run['facing']][] = [
    [{ x: terminal.x - 1, y: terminal.y }, 'right'],
    [{ x: terminal.x + 1, y: terminal.y }, 'left'],
    [{ x: terminal.x, y: terminal.y - 1 }, 'down'],
    [{ x: terminal.x, y: terminal.y + 1 }, 'up'],
  ];
  const [at, facing] = spots.find(([t]) => !floor.walls.has(`${t.x},${t.y}`))!;
  run.player = at;
  run.facing = facing;
}

function crack(run: Run, id: number) {
  standAt(run, id);
  interact(run);
  answer(run, 'yes');
}

describe('a run', () => {
  it('starts at four minutes with every terminal idle and the door shut', () => {
    const run = createRun(floor, fakeDeck());
    expect(run.timeLeft).toBe(RUN_SECONDS);
    expect(Object.values(run.terminals).every((s) => s === 'idle')).toBe(true);
    expect(run.doorOpen).toBe(false);
    expect(run.status).toBe('playing');
  });

  it('ignores movement while a question is open', () => {
    const run = createRun(floor, fakeDeck());
    standAt(run, 1);
    interact(run);
    const before = { ...run.player };
    move(run, 'down');
    expect(run.player).toEqual(before);
  });

  it('cracks a terminal and adds time for a right answer', () => {
    const run = createRun(floor, fakeDeck());
    standAt(run, 2);
    expect(interact(run)?.topic).toBe('network');
    const result = answer(run, ' YES ');
    expect(result.right).toBe(true);
    expect(run.terminals[2]).toBe('cracked');
    expect(run.timeLeft).toBe(RUN_SECONDS + CORRECT_BONUS);
    expect(run.status).toBe('playing');
  });

  it('locks a terminal for five seconds and takes time for a wrong answer', () => {
    const run = createRun(floor, fakeDeck());
    standAt(run, 3);
    interact(run);
    expect(answer(run, 'no').right).toBe(false);
    expect(run.timeLeft).toBe(RUN_SECONDS - WRONG_PENALTY);
    expect(interact(run)).toBeNull();
    tick(run, 5);
    expect(interact(run)).not.toBeNull();
  });

  it('opens the vault door on the fourth crack, not the third', () => {
    const run = createRun(floor, fakeDeck());
    [1, 2, 3].forEach((id) => crack(run, id));
    expect(run.doorOpen).toBe(false);
    crack(run, 4);
    expect(run.doorOpen).toBe(true);
  });

  it('needs both parts of the mainframe question to win', () => {
    const run = createRun(floor, fakeDeck());
    [1, 2, 3, 4].forEach((id) => crack(run, id));
    run.player = { x: floor.mainframe.x - 1, y: floor.mainframe.y };
    run.facing = 'right';
    expect(interact(run)?.topic).toBe('mainframe');
    expect(answer(run, 'yes').followUp).toBe(true);
    expect(run.status).toBe('question');
    answer(run, 'yes');
    expect(run.status).toBe('won');
  });

  it('ends the run when time runs out', () => {
    const run = createRun(floor, fakeDeck());
    tick(run, RUN_SECONDS + 1);
    expect(run.status).toBe('lost');
    expect(run.timeLeft).toBe(0);
  });

  it('costs ten seconds once per grace period when a bot catches you', () => {
    const run = createRun(floor, fakeDeck());
    run.player = { ...BOT_ROUTES[0][0] };
    tick(run, 0.01);
    expect(run.timeLeft).toBeCloseTo(RUN_SECONDS - BOT_PENALTY - 0.01);
    run.player = { ...BOT_ROUTES[0][0] };
    tick(run, 0.01);
    expect(run.timeLeft).toBeCloseTo(RUN_SECONDS - BOT_PENALTY - 0.02);
  });

  it('scores time left plus ten per right answer', () => {
    const run = createRun(floor, fakeDeck());
    crack(run, 1);
    expect(score(run)).toBe(Math.round(RUN_SECONDS + CORRECT_BONUS) + 10);
  });
});

describe('revision stats', () => {
  const throwing = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  const holding = (value: string) => ({ getItem: () => value, setItem() {} });

  it('loads as empty when storage is blocked', () => {
    expect(loadStats(throwing)).toEqual(emptyStats());
  });

  it('loads as empty from corrupt or old data', () => {
    expect(loadStats(holding('{bad json'))).toEqual(emptyStats());
    expect(loadStats(holding('{"version":0}'))).toEqual(emptyStats());
  });

  it('counts answers per topic and keeps the best score', () => {
    let stats = recordAnswer(emptyStats(), 'python', true);
    stats = recordAnswer(stats, 'python', false);
    stats = recordScore(recordScore(stats, 120), 90);
    expect(stats.topics.python).toEqual({ right: 1, total: 2 });
    expect(stats.best).toBe(120);
  });

  it('names the weakest topic, ignoring topics with fewer than three answers', () => {
    let stats = emptyStats();
    for (const right of [true, true, true]) stats = recordAnswer(stats, 'linux', right);
    for (const right of [true, false, false]) stats = recordAnswer(stats, 'web', right);
    stats = recordAnswer(stats, 'data', false);
    expect(weakestTopic(stats)).toBe('web');
    expect(weakestTopic(emptyStats())).toBeNull();
  });
});
