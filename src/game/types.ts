export type Topic = 'linux' | 'network' | 'web' | 'python' | 'data' | 'mainframe';

export interface BaseQuestion {
  id: string;
  topic: Topic;
  kind: 'choice' | 'typed';
  prompt: string;
  code?: string;
  /** Options for a `choice` question. */
  choices?: string[];
  /** The index of the right choice, or every accepted typed answer. */
  answer: number | string[];
  /** Shown after answering, right or wrong: revision is the point. */
  explain: string;
}

export interface Question extends BaseQuestion {
  /** The mainframe's second part, asked after the first is right. */
  followUp?: BaseQuestion;
}

export const TOPIC_LABELS: Record<Topic, string> = {
  linux: 'Linux & CLI',
  network: 'Networking',
  web: 'Web & APIs',
  python: 'Python tracing',
  data: 'Data & security',
  mainframe: 'Mainframe',
};
