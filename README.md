# Neon Invaders

A Space Invaders–style arcade game with a neon aesthetic. Shoot the invaders before they reach you or hit you with their shots.

## How to play

- **← / →** — Move your ship
- **SPACE** — Shoot (and start game from the title screen)
- Clear all invaders to win. You have 3 lives; invaders and their bullets reduce lives.

## Run locally

No build step. Open `index.html` in a browser (double-click or use “Open with” your browser). For local development with a simple server:

```bash
npx serve .
```

Then open the URL shown (e.g. http://localhost:3000).

## Files

- `index.html` — Page and canvas
- `style.css` — Neon styling and layout
- `game.js` — Game loop, player, invaders, bullets, collision, score, lives
