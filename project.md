# Project Status: Neon Invaders

## Overview
A Space Invaders-style arcade shooter built with HTML5 Canvas and JavaScript. The player controls a spaceship to defeat waves of alien invaders, collect power-ups, and survive as long as possible.

## Current Features
- **Core Gameplay:**
  - Player movement (Left/Right arrows/touch buttons) and shooting (Spacebar/touch button).
- **Wave-based invader spawning:** Increasing difficulty, with special Boss encounters.
  - **Mini-Bosses:** Spawn at levels ending in 5 (e.g., 5, 15), featuring 5x health and 4x size.
  - **Bosses:** Spawn at levels ending in 0 (e.g., 10, 20), featuring 10x health, 6x size, unique color, and massive point drops.
  - Enemy types with different colors and hit points.
  - Collision detection for bullets, enemies, and player.

- **Power-up System:**
  - `Shield`: Grants a temporary shield that absorbs one hit.
  - `Double`: Increases shot count (up to 4) or damage.
  - `Rocket`: Fires homing missiles at enemies.
  - `Pierce`: Shots pass through one enemy if the hit is fatal.
  - `Heal`: Restores 1 life (max 5 lives).

- **UI/HUD:**
  - Lives, Score, Level, Shield Status, Damage Multiplier.
  - Pierce Status (None/Active).
  - Responsive Mobile Touch Controls (Left, Shoot, Right, Pause).
  - Mobile Shoot Button acts as an Auto-Fire Toggle.
  - **Highscore List**: Persistent top 3 scores saved in `localStorage`, displayed on Start and Game Over screens. **[NEW]**

- **Mechanics:**
  - **Lives:** Player starts with 3 lives. Max lives capped at 5.
  - **Health Drops:** 'Heal' power-ups only drop if player has fewer than 5 lives.
  - **Scoring:** Points awarded for destroying enemies.

## Technical Stack
- **Language:** JavaScript (ES6+)
- **Rendering:** HTML5 Canvas API (Responsive scaling)
- **Styling:** CSS3 (Neon aesthetic)
- **Input:** Keyboard & Modern Pointer Events (Mobile-friendly)
- **Testing:** Playwright E2E Tests **[NEW]**

## Recent Changes
- **Boss Mechanics:** Bosses and Mini-Bosses now fire unguided, high-speed, targeted missiles directly at the player every 3 seconds, increasing their threat level significantly.
- **Boss Fights:** Added massive Boss and Mini-Boss enemies. Mini-Bosses spawn on levels ending in 5 with 5x health and 4x size. True Bosses spawn on levels ending in 0 with 10x health, 6x size, and guarantee multiple power-up drops upon defeat. They spawn above the regular alien formation and act as tough damage-sponges.
- **Gameplay Fix (Invader Movement):** Modified the invader swarm to move based on the logical width of the original grid rather than individual surviving invaders. This prevents the swarm from traveling further to the edges when columns are destroyed, fixing a potential safe-zone exploit.
- **Architecture Refactoring:** Rewrote the main `game.js` file into modular ES6 classes (`Game`, `Player`, `ParticleSystem`, `UIManager`) for better maintainability and cleaner structure.
- **Highscore List:** Added a persistent top 3 highscore list that saves to `localStorage` and displays on both the Start and Game Over screens.
- **HUD Layout Fix:** Addressed an issue where extremely large scores caused the HUD elements to wrap. Fixed via CSS Grid and text-truncation.
- **Mobile Auto-Fire Toggle:** Refactored the Mobile Shoot button to toggle auto-fire on and off with single taps. Added visual `.active` feedback so players know when auto-fire is locked on.
- **Mobile Layout Fix:** Swapped position of right arrow and pause buttons for improved reachability.
- **Mobile Support:** Added responsive canvas scaling and on-screen touch controls.
- **Pointer Events:** Migrated UI interaction to `pointerdown`/`pointerup` for seamless Android Chrome & iOS Safari compatibility.
- **Testing:** Integrated Playwright framework with E2E tests for desktop keyboard and mobile touch interactions, including highscore and layout shift tests.
