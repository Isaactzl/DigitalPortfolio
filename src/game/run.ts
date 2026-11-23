import type { Floor, Tile } from './map';
import { adjacentTarget, tryMove, type Dir, type Target } from './movement';
import { BOT_ROUTES, botPosition, touches } from './bots';
import { checkAnswer } from './questions';
import type { BaseQuestion, Question, Topic } from './types';

export const RUN_SECONDS = 240;
export const BOT_PENALTY = 10;
export const WRONG_PENALTY = 5;
export const CORRECT_BONUS = 8;
export const LOCK_SECONDS = 5;
export const DOOR_NEEDS = 4;
/** After a bot hit, the player can't be hit again for this long. */
export const BOT_GRACE = 1;

export type TerminalState = 'idle' | 'cracked' | { lockedUntil: number };

export interface Deck {
  draw(topic: Topic): Question;
}

export interface Run {
  floor: Floor;
  deck: Deck;
  player: Tile;
  /** Where the player stood before their last move; a bot hit knocks them back here. */
  previous: Tile;
  facing: Dir;
  timeLeft: number;
  elapsed: number;
  terminals: Record<number, TerminalState>;
  doorOpen: boolean;
  bots: Tile[];
  status: 'playing' | 'question' | 'won' | 'lost';
  pending?: { target: Target; question: BaseQuestion; part: 1 | 2; followUp?: BaseQuestion };
  correct: number;
  answered: number;
  graceUntil: number;
}

export interface AnswerResult {
  right: boolean;
  explain: string;
  topic: Topic;
  /** True when a right answer unlocks the mainframe's second part. */
  followUp: boolean;
}

export function createRun(floor: Floor, deck: Deck): Run {
  return {
    floor,
    deck,
    player: { ...floor.spawn },
    previous: { ...floor.spawn },
    facing: 'down',
    timeLeft: RUN_SECONDS,
    elapsed: 0,
    terminals: Object.fromEntries(floor.terminals.map((t) => [t.id, 'idle'])),
    doorOpen: false,
    bots: BOT_ROUTES.map((route) => botPosition(route, 0)),
    status: 'playing',
    correct: 0,
    answered: 0,
    graceUntil: 0,
  };
}

export function move(run: Run, dir: Dir) {
  if (run.status !== 'playing') return;
  run.facing = dir;
  const next = tryMove(run.floor, run.player, dir, run.doorOpen);
  if (next !== run.player) {
    run.previous = run.player;
    run.player = next;
  }
}

function endIfOutOfTime(run: Run) {
  if (run.timeLeft <= 0) {
    run.timeLeft = 0;
    run.status = 'lost';
  }
}

export function tick(run: Run, dt: number) {
  if (run.status !== 'playing') return;
  run.elapsed += dt;
  run.timeLeft -= dt;
  run.bots = BOT_ROUTES.map((route) => botPosition(route, run.elapsed));
  if (run.elapsed >= run.graceUntil && run.bots.some((bot) => touches(bot, run.player))) {
    run.timeLeft -= BOT_PENALTY;
    run.player = run.previous;
    run.graceUntil = run.elapsed + BOT_GRACE;
  }
  endIfOutOfTime(run);
}

export function isLocked(run: Run, id: number) {
  const state = run.terminals[id];
  return typeof state === 'object' && run.elapsed < state.lockedUntil;
}

/** Opens a question for whatever the player is facing, if it can be hacked right now. */
export function interact(run: Run): BaseQuestion | null {
  if (run.status !== 'playing') return null;
  const target = adjacentTarget(run.floor, run.player, run.facing);
  if (!target) return null;

  let question: Question;
  if (target.kind === 'terminal') {
    if (run.terminals[target.id] === 'cracked' || isLocked(run, target.id)) return null;
    const topic = run.floor.terminals.find((t) => t.id === target.id)!.topic;
    question = run.deck.draw(topic);
  } else {
    question = run.deck.draw('mainframe');
  }

  run.pending = { target, question, part: 1, followUp: question.followUp };
  run.status = 'question';
  return question;
}

export function answer(run: Run, given: number | string): AnswerResult {
  const pending = run.pending;
  if (run.status !== 'question' || !pending) throw new Error('No question is open');
  const { question, target } = pending;
  const right = checkAnswer(question, given);
  run.answered++;

  const result: AnswerResult = {
    right,
    explain: question.explain,
    topic: question.topic,
    followUp: false,
  };

  if (right) {
    run.correct++;
    run.timeLeft += CORRECT_BONUS;
    if (target.kind === 'terminal') {
      run.terminals[target.id] = 'cracked';
      const cracked = Object.values(run.terminals).filter((s) => s === 'cracked').length;
      if (cracked >= DOOR_NEEDS) run.doorOpen = true;
    } else if (pending.part === 1 && pending.followUp) {
      run.pending = { target, question: pending.followUp, part: 2 };
      result.followUp = true;
      return result;
    } else {
      run.pending = undefined;
      run.status = 'won';
      return result;
    }
  } else {
    run.timeLeft -= WRONG_PENALTY;
    if (target.kind === 'terminal') {
      run.terminals[target.id] = { lockedUntil: run.elapsed + LOCK_SECONDS };
    }
  }

  run.pending = undefined;
  run.status = 'playing';
  endIfOutOfTime(run);
  return result;
}

export const score = (run: Run) => Math.round(run.timeLeft) + run.correct * 10;
