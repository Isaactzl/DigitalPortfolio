---
no: '001'
title: Event form automation
status: Deployed
kind: Internship · Triggered Games
stack: [Google Apps Script, JavaScript, HTML/CSS, Google Workspace APIs]
summary: Managers at both stores used it daily to set up event forms. Every event gets a link and a QR code, and it flags when two managers book the same one.
cover: ../../assets/projects/event-form-automation.png
coverAlt: The internal form tool, with the event setup panel on the left and the generated form on the right.
bench: forms
video:
  src: e39JZZxTby0
  kind: youtube
---

## The problem

Triggered Games runs events out of two store locations. Every event needed its own sign-up form, and the managers were setting those up by hand.

## What I built

An internal web tool on Google Apps Script. A manager fills in the event details and the tool creates the form, then generates a shareable link and a QR code for it, ready to send to the party attending by email or message.

Forms, Sheets, Drive and Gmail sit behind one dashboard, so nobody jumps between apps. Managers at both stores used it daily.

## Two managers, one Saturday

The part I'm proudest of is the duplicate check. With two stores booking at once, both managers could easily set up the same event. The tool notices and flags it before anything goes out, so the clash gets sorted between them instead of in front of the customer.

Try it: book the same event from both stores.
