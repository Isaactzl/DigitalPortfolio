import { FLOOR, parseFloor } from './map';
import { adjacentTarget } from './movement';
import { createDeck } from './questions';
import { answer, createRun, interact, isLocked, move, score, tick, type Run } from './run';
import { createRenderer } from './render';
import { createInput } from './input';
import { loadStats, recordAnswer, recordScore, saveStats, weakestTopic } from './stats';
import { TOPIC_LABELS, type BaseQuestion, type Question, type Topic } from './types';

/** Tiles per second while gliding from one tile to the next. */
const GLIDE_SPEED = 9;
const REPORT_ORDER: Topic[] = ['linux', 'network', 'web', 'python', 'data', 'mainframe'];

/** The HUD updates every frame; rewriting unchanged text would make screen readers repeat it. */
function setText(el: Element, text: string) {
  if (el.textContent !== text) el.textContent = text;
}

function clock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function startGame(root: HTMLElement, bank: Question[]) {
  const $ = <T extends Element = HTMLElement>(selector: string) => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`Missing ${selector}`);
    return el;
  };

  const floor = parseFloor(FLOOR);
  const renderer = createRenderer($<HTMLCanvasElement>('canvas'), floor);
  const input = createInput(root);
  const hud = {
    time: $('[data-hud="time"]'),
    cracked: $('[data-hud="cracked"]'),
    hint: $('[data-hud="hint"]'),
  };
  const panels = { start: $('[data-panel="start"]'), end: $('[data-panel="end"]') };
  const pausedNote = $('[data-paused]');
  const dialog = $<HTMLDialogElement>('dialog');
  const q = {
    meta: $('[data-q-meta]'),
    prompt: $('[data-q-prompt]'),
    code: $<HTMLPreElement>('[data-q-code]'),
    choices: $('[data-q-choices]'),
    typed: $<HTMLFormElement>('[data-q-typed]'),
    field: $<HTMLInputElement>('[data-q-typed] input'),
    result: $('[data-q-result]'),
    verdict: $('[data-q-verdict]'),
    explain: $('[data-q-explain]'),
    next: $<HTMLButtonElement>('[data-q-continue]'),
  };

  let stats = loadStats();
  let run: Run;
  let drawn = { x: 0, y: 0 };
  let walkFrame = 0;
  let time = 0;
  let last = 0;
  let running = false;
  let afterAnswer: () => void = () => {};

  function newRun() {
    run = createRun(floor, createDeck(bank, Math.random));
    drawn = { ...run.player };
    walkFrame = 0;
    updateHud();
    renderer.draw(run, { player: drawn, walkFrame, time });
  }

  function updateHud() {
    setText(hud.time, clock(run.timeLeft));
    const cracked = Object.values(run.terminals).filter((s) => s === 'cracked').length;
    setText(hud.cracked, `${cracked}/${floor.terminals.length}`);

    const target = run.status === 'playing' ? adjacentTarget(floor, run.player, run.facing) : null;
    let hint = '';
    if (target?.kind === 'terminal') {
      const terminal = floor.terminals.find((t) => t.id === target.id)!;
      const label = `Terminal ${terminal.id} · ${TOPIC_LABELS[terminal.topic]}`;
      if (run.terminals[terminal.id] === 'cracked') hint = `${label} · cracked`;
      else if (isLocked(run, terminal.id)) hint = `${label} · locked`;
      else hint = `${label} · hack it`;
    } else if (target?.kind === 'mainframe') {
      hint = 'Mainframe · hack it';
    }
    setText(hud.hint, hint);
  }

  function showQuestion(question: BaseQuestion, part: 1 | 2) {
    input.enable(false);
    dialog.dataset.questionId = question.id;
    q.meta.textContent =
      question.topic === 'mainframe'
        ? `Mainframe · part ${part} of 2`
        : `${TOPIC_LABELS[question.topic]} terminal`;
    q.prompt.textContent = question.prompt;
    q.code.hidden = !question.code;
    q.code.firstElementChild!.textContent = question.code ?? '';
    q.result.hidden = true;
    q.choices.replaceChildren();
    q.typed.hidden = question.kind !== 'typed';

    if (question.kind === 'choice') {
      for (const [index, text] of (question.choices ?? []).entries()) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.addEventListener('click', () => submit(index));
        q.choices.append(button);
      }
    } else {
      q.field.value = '';
    }

    if (!dialog.open) dialog.showModal();
    (question.kind === 'choice' ? (q.choices.firstElementChild as HTMLElement) : q.field)?.focus();
  }

  function submit(given: number | string) {
    const question = run.pending?.question;
    if (!question) return;
    const result = answer(run, given);
    stats = recordAnswer(stats, result.topic, result.right);
    saveStats(stats);

    q.choices.replaceChildren();
    q.typed.hidden = true;
    if (result.right) {
      q.verdict.textContent =
        question.topic !== 'mainframe'
          ? 'Cracked · +8 seconds'
          : result.followUp
            ? 'Part 1 cracked · one more'
            : 'Mainframe breached';
    } else {
      q.verdict.textContent =
        question.topic === 'mainframe' ? 'Access denied · −5 seconds' : 'Locked · −5 seconds';
    }
    q.verdict.dataset.right = String(result.right);
    q.explain.textContent = result.explain;
    q.result.hidden = false;
    q.next.focus();
    updateHud();

    afterAnswer = () => {
      if (result.followUp && run.pending) {
        showQuestion(run.pending.question, 2);
        return;
      }
      dialog.close();
      if (run.status === 'playing') input.enable(true);
      else end();
    };
  }

  q.typed.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(q.field.value);
  });
  q.next.addEventListener('click', () => afterAnswer());
  // A question can't be dismissed with Escape; it has to be answered.
  dialog.addEventListener('cancel', (e) => e.preventDefault());

  function end() {
    running = false;
    input.enable(false);
    const final = score(run);
    stats = recordScore(stats, final);
    saveStats(stats);

    $('[data-end-title]').textContent =
      run.status === 'won' ? 'Mainframe breached!' : 'Out of time';
    $('[data-end-score]').textContent = String(final);
    $('[data-end-best]').textContent = String(stats.best);

    const report = $('[data-report]');
    report.replaceChildren();
    for (const topic of REPORT_ORDER) {
      const counts = stats.topics[topic];
      if (!counts) continue;
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = TOPIC_LABELS[topic];
      const meter = document.createElement('meter');
      meter.min = 0;
      meter.max = counts.total;
      meter.value = counts.right;
      meter.setAttribute('aria-label', `${TOPIC_LABELS[topic]} accuracy`);
      const tally = document.createElement('span');
      tally.textContent = `${counts.right}/${counts.total}`;
      item.append(label, meter, tally);
      report.append(item);
    }
    const weakest = weakestTopic(stats);
    $('[data-revise]').textContent = weakest
      ? `Revise next: ${TOPIC_LABELS[weakest]}`
      : 'Answer a few more to see what to revise next.';
    panels.end.hidden = false;
    $<HTMLButtonElement>('[data-restart]').focus();
  }

  function frame(timestamp: number) {
    if (!running) return;
    const dt = last ? Math.min((timestamp - last) / 1000, 0.1) : 0;
    last = timestamp;
    time += dt;
    pausedNote.hidden = !input.paused;

    if (run.status === 'playing' && !input.paused) {
      const dx = run.player.x - drawn.x;
      const dy = run.player.y - drawn.y;
      const distance = Math.hypot(dx, dy);
      const stepLength = GLIDE_SPEED * dt;
      if (distance > stepLength) {
        drawn = {
          x: drawn.x + (dx / distance) * stepLength,
          y: drawn.y + (dy / distance) * stepLength,
        };
      } else {
        drawn = { ...run.player };
        const dir = input.nextDir();
        if (dir) {
          const before = run.player;
          move(run, dir);
          if (run.player !== before) walkFrame++;
        }
        if (input.takeAction()) {
          const question = interact(run);
          if (question) showQuestion(question, 1);
        }
      }
      tick(run, dt);
    }

    updateHud();
    renderer.draw(run, { player: drawn, walkFrame, time });
    if (run.status === 'won' || run.status === 'lost') {
      if (!dialog.open) end();
      return;
    }
    requestAnimationFrame(frame);
  }

  function begin() {
    newRun();
    panels.start.hidden = true;
    panels.end.hidden = true;
    input.enable(true);
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }

  $('[data-start]').addEventListener('click', begin);
  $('[data-restart]').addEventListener('click', begin);
  $('[data-best]').textContent = String(stats.best);
  newRun();
}
