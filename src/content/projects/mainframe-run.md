---
no: '006'
title: Mainframe Run
status: In use
kind: Personal project · Study tool
stack: [TypeScript, Canvas, Vitest, Playwright]
summary: A retro training-range game I built to revise for my DISE role. Every terminal is locked behind a Linux, networking, web, Python or security question.
cover: ../../assets/projects/mainframe-run.png
coverAlt: Mainframe Run in pixel art, with the blue hacker in a maze of server walls, three red firewall bots, five terminals, a striped door and the mainframe in the corner.
bench: arcade
live: play/
gallery:
  - src: ../../assets/gallery/mainframe-run/question.png
    alt: A Linux question open over the game, asking what -r means in rm -r logs/, with four answers to pick from.
    caption: Every terminal is a question. Wrong answers lock it for a few seconds.
  - src: ../../assets/gallery/mainframe-run/report.png
    alt: 'The end screen, showing a score, a revision report with a bar per topic, and "Revise next: Python tracing".'
    caption: The revision report, here with example numbers. It points at your weakest topic.
---

## Why

I'm getting ready for a junior DISE role, so I've been going through Linux commands, networking, HTTP and APIs, reading Python, and the basics of keeping data safe. Flashcards got boring fast. I wanted something I'd actually open when I'm bored, so I made revision into a game.

## How it plays

You're on an authorised training range, not hacking anything real. You have four minutes to crack the terminals around the floor, get through the door, and break into the mainframe.

- Each terminal asks a question from one topic. Right answers add time; wrong ones cost time and lock that terminal for a few seconds.
- Firewall bots patrol the corridors. Touch one and you lose time and get knocked back.
- The mainframe is two questions in a row, so you can't luck your way in.
- Some questions are multiple choice. Others make you type the answer, like a command or a port number, because recognising an answer is easier than remembering it.

At the end you get a revision report across all your runs, with a bar per topic and the one to revise next. It's saved in your browser, so it builds up the more you play.

## How it's built

No game engine. The floor is a grid of characters in code, the sprites are drawn pixel by pixel on a canvas, and the whole game is a few kilobytes of TypeScript that only loads on the game page.

I kept the game rules separate from the drawing. Movement, the bots, the clock and the answer checking are plain functions with no browser in them, so they're covered by unit tests: typed answers are trimmed and compared without caring about case or quotes, a topic never repeats a question until you've seen them all, and a broken save just starts fresh instead of crashing the game.

The browser tests then play it for real: walk to the first terminal, answer, and check it cracks, plus run the clock out and check the report shows up. They also check it on a phone, where you get an on-screen pad.

## The questions

The questions are mine, written from what I've been studying. They're not from any real test. They live in one JSON file that's checked when the site builds, so a question with a missing answer can't ship.

Yes, the answers are in the page source. It's a study tool, not an exam, and there's no server to keep them on, so there's nothing to protect: open DevTools and you've only cheated yourself. The question text goes into the page with `<` escaped and is only ever shown as plain text, so a question can't inject markup either.
