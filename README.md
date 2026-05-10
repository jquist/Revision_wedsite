# Revision App v2

This is a full normal React app that runs with:

```bash
npm install
npm start
```

It does not need Vite.

## New in this version

- Add new subject card on the dashboard.
- New subject card is the same visual size as the subject cards.
- Topic selector includes `All topics`.
- Flashcards can be filtered by score:
  - `+3`
  - `+2`
  - `+1`
  - `0`
  - `-1`
  - `-2`
  - `-3`
- Flashcards also have:
  - `All Cards`
  - `Refresh Cards`
- Each card starts with score `0`.
- Correct answer adds `+1`.
- Wrong answer adds `-1`.
- Score is clamped between `-3` and `+3`.
- Add-card form is now inside the flashcard section.
- Added subjects, added cards, and card progress save to localStorage.

## Run

Unzip the folder, open a terminal inside it, then run:

```bash
npm install
npm start
```

Then open:

```txt
http://localhost:3000
```
