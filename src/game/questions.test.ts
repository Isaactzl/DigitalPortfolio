import { describe, expect, it } from 'vitest';
import bank from '../content/questions.json';
import { checkAnswer, createDeck, normalise } from './questions';
import type { Question, Topic } from './types';

const typed: Question = {
  id: 't',
  topic: 'web',
  kind: 'typed',
  prompt: 'Which status code means "not found"?',
  answer: ['404'],
  explain: '404 means the server has nothing at that path.',
};

const concat: Question = {
  id: 'c',
  topic: 'python',
  kind: 'typed',
  prompt: 'print("45" + "90")',
  answer: ['4590'],
  explain: 'Adding two strings joins them.',
};

const choice: Question = {
  id: 'm',
  topic: 'linux',
  kind: 'choice',
  prompt: 'What does sudo do?',
  choices: ['Deletes a file', 'Runs a command as another user, usually root', 'Lists files'],
  answer: 1,
  explain: 'sudo runs one command with elevated privileges.',
};

/** Same sequence every run, so draws are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

describe('normalise', () => {
  it('trims, lowercases and collapses inner spaces', () => {
    expect(normalise('  True ')).toBe('true');
    expect(normalise('rw-  r-----')).toBe('rw- r-----');
  });

  it('strips one layer of surrounding quotes', () => {
    expect(normalise('"4590"')).toBe('4590');
    expect(normalise("'4590'")).toBe('4590');
  });
});

describe('checkAnswer', () => {
  it('accepts a typed answer with stray spaces', () => {
    expect(checkAnswer(typed, ' 404 ')).toBe(true);
    expect(checkAnswer(typed, '404')).toBe(true);
  });

  it('accepts a typed answer the player wrapped in quotes', () => {
    expect(checkAnswer(concat, '"4590"')).toBe(true);
  });

  it('rejects a wrong typed answer', () => {
    expect(checkAnswer(typed, '405')).toBe(false);
    expect(checkAnswer(typed, '')).toBe(false);
  });

  it('accepts the right choice index and rejects the others', () => {
    expect(checkAnswer(choice, 1)).toBe(true);
    expect(checkAnswer(choice, 0)).toBe(false);
    expect(checkAnswer(choice, 2)).toBe(false);
  });
});

describe('createDeck', () => {
  const pool: Question[] = [1, 2, 3].map((n) => ({ ...choice, id: `l${n}` }));

  it('draws every question in a topic before repeating one', () => {
    const deck = createDeck(pool, seeded());
    const ids = new Set([deck.draw('linux').id, deck.draw('linux').id, deck.draw('linux').id]);
    expect(ids.size).toBe(3);
  });

  it('starts a new cycle when a topic runs out instead of failing', () => {
    const deck = createDeck(pool, seeded());
    for (let i = 0; i < 10; i++) expect(() => deck.draw('linux')).not.toThrow();
  });

  it('throws a clear error for a topic with no questions at all', () => {
    const deck = createDeck(pool, seeded());
    expect(() => deck.draw('web')).toThrow(/web/);
  });
});

describe('the question bank', () => {
  const questions = bank as Question[];
  const count = (topic: Topic) => questions.filter((q) => q.topic === topic).length;

  it('has unique ids', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });

  it('has at least 8 questions per terminal topic and 6 for the mainframe', () => {
    for (const topic of ['linux', 'network', 'web', 'python', 'data'] as const) {
      expect(count(topic), topic).toBeGreaterThanOrEqual(8);
    }
    expect(count('mainframe')).toBeGreaterThanOrEqual(6);
  });

  it('only has answers that can actually be given', () => {
    for (const q of [...questions, ...questions.flatMap((q) => (q.followUp ? [q.followUp] : []))]) {
      if (q.kind === 'choice') {
        expect(typeof q.answer, q.id).toBe('number');
        expect(q.choices?.[q.answer as number], q.id).toBeDefined();
      } else {
        expect(Array.isArray(q.answer) && q.answer.length > 0, q.id).toBe(true);
      }
      expect(q.explain.length, q.id).toBeGreaterThan(10);
    }
  });

  it('gives every mainframe question a follow-up', () => {
    for (const q of questions.filter((q) => q.topic === 'mainframe')) {
      expect(q.followUp, q.id).toBeDefined();
    }
  });
});
