import type { BaseQuestion, Question, Topic } from './types';

/** Makes typed answers comparable: case, outer spaces, repeated spaces and wrapping quotes don't count. */
export function normalise(input: string): string {
  let text = input.trim().replace(/\s+/g, ' ');
  const quoted = /^(["'])(.*)\1$/.exec(text);
  if (quoted) text = quoted[2].trim();
  return text.toLowerCase();
}

export function checkAnswer(question: BaseQuestion, given: number | string): boolean {
  if (question.kind === 'choice') return given === question.answer;
  if (typeof given !== 'string' || !Array.isArray(question.answer)) return false;
  const answer = normalise(given);
  return answer !== '' && question.answer.some((accepted) => normalise(accepted) === answer);
}

/**
 * Hands out questions per topic in a shuffled order, using every question once
 * before any repeats, then reshuffling.
 */
export function createDeck(pool: Question[], rng: () => number) {
  const piles = new Map<Topic, Question[]>();

  function refill(topic: Topic) {
    const pile = pool.filter((q) => q.topic === topic);
    if (pile.length === 0) throw new Error(`No questions for topic "${topic}"`);
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pile[i], pile[j]] = [pile[j], pile[i]];
    }
    piles.set(topic, pile);
    return pile;
  }

  return {
    draw(topic: Topic): Question {
      const pile = piles.get(topic);
      const next = pile && pile.length > 0 ? pile : refill(topic);
      return next.pop() as Question;
    },
  };
}
