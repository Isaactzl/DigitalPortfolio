export type Status = 'Deployed' | 'In use' | 'Shipped' | 'Queued';
export type Tone = 'ok' | 'warm' | 'dim';

export const toneOf = (status: Status): Tone =>
  status === 'In use' ? 'warm' : status === 'Queued' ? 'dim' : 'ok';
