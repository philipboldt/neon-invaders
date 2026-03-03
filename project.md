# Project Status: Neon Invaders

## Overview
A Space Invaders-style arcade shooter built with HTML5 Canvas and JavaScript. The player controls a spaceship to defeat waves of alien invaders, collect power-ups, and survive as long as possible.

## Current Features
- **Core Gameplay:**
  - Player movement (Left/Right arrows/touch buttons) and shooting (Spacebar/touch button).
- **Wave-based invader spawning:** Increasing difficulty, with special Boss encounters.
  - **Mini-Bosses:** Spawn at levels ending in 5 (e.g., 5, 15), featuring 125x health and 4x size. Immune to rockets. **[BALANCED]**
  - **Bosses:** Spawn at levels ending in 0 (e.g., 10, 20), featuring 250x health, 6x size, unique color, and massive point drops. Immune to rockets. **[BALANCED]**
  - Enemy types with different colors and hit points.
  - Collision detection for bullets, enemies, and player.

- **Power-up System:**
  - `Shield`: Grants a temporary shield that absorbs one hit.
  - `Double`: Increases shot count (up to 4) or damage (up to 5). Stops dropping when maxed.
  - `Rocket`: Fires homing missiles. Upgrade increases blast radius (Level 1-5). Deals 2x player damage.
  - `Pierce`: Neon purple. Shots pass through one enemy if the hit is fatal.
  - `Heal`: Restores 1 life (max 5 lives).
  - `Points`: Neon yellow. Displays awarded value (Level x 100) in black text inside the circle. Always available to drop. **[ENHANCED]**

- **Parallax Starfield:** Multi-layered scrolling background with stars of different sizes and speeds to create depth and a dynamic feel, even on the start screen. **[NEW]**
- **UI/HUD:**
  - Canvas-rendered HUD with Scores, Level, Lives, and active Upgrades. **[ENHANCED]**
  - Responsive Mobile Touch Controls (Left, Shoot, Right, Pause).
  - Mobile Shoot Button acts as an Auto-Fire Toggle.
  - **Highscore List**: Persistent top 3 scores saved in `localStorage`, displayed on Start and Game Over screens.

- **Mechanics:**
  - **Lives:** Player starts with 3 lives. Max lives capped at 5.
  - **Health Drops:** 'Heal' power-ups only drop if player has fewer than 5 lives.
  - **Scoring:** Points awarded for destroying enemies.
- **Performance Optimizations:**
  - **Sprite Pre-rendering:** Invaders are pre-rendered to offscreen canvases to minimize expensive real-time shadow and glow calculations.
  - **Object Pooling:** Particle system utilizes a pre-allocated pool (1024 particles) to eliminate Garbage Collection spikes and ensure smooth 60 FPS gameplay even during heavy combat.
  - **Draw Batching:** Optimized canvas state management to reduce overhead during high-entity frames.

- **Lightning Attack:**
  - Automatically targets a random enemy every 1.0s.
  - Visual: Thick zigzag bolt with black border and color transition (Grey -> Neon Blue -> White).
  - **Dynamic Zigzag:** Segment count scales with distance to target for a cleaner look on short hits.
  - Deals player damage and triggers matching hit particle effects. **[ENHANCED]**

- **Visual Feedback:**
  - **Dynamic Brightness:** Enemies with multiple HP (including regular invaders and bosses) now visually darken as they take damage.
  - **Smooth Level Transitions:** Levels now only end after all active visual effects—including particle explosions, rockets, boss missiles, upgrades, and the lightning bolt—have fully cleared.
  - **Floating Score Text:** Whenever the player earns points, a neon yellow particle (e.g., "+20") spawns above the player, growing in size while slowly floating upwards and fading out.
  - **Damage Markers:** Enemies display a static, growing neon red "-X" with a black border when taking damage, creating a "pop" effect. **[NEW]**
  - **Lightning Hit Particles:** Hits from the lightning attack spawn particles that transition colors matching the bolt. **[NEW]**

## Technical Stack
- **Language:** JavaScript (ES6+ Modules)
- **Deployment:** Zero-build architecture. Runs directly in the browser via native ESM. **[NEW]**
- **Standards:** Formally enforced via the custom **`pure-javascript`** Agent Skill (ES2020+, ESM, Async/Await).
- **Rendering:** HTML5 Canvas API with Offscreen Buffering & Dynamic Color Darkening
- **Optimization:** Object Pooling (1024 entities) & Sprite Caching
- **Input:** Keyboard & Modern Pointer Events (Mobile-friendly)
- **Overlay System:** Fixed overlays for universal interaction coverage.
- **Testing:** Playwright E2E Tests with **MCP-Ready State Inspection** (`window.game`) and **Visual Snapshots**.

## Recent Changes
- **Points Upgrade Visuals:** The awarded point value is now displayed in bold black text inside the neon yellow upgrade circle. **[NEW]**
- **Pierce Color Update:** Changed the Pierce upgrade color to neon purple for better visual distinction. **[NEW]**
- **Points Upgrade:** Introduced a new neon yellow upgrade that grants `Level x 100` bonus points upon collection. Unlike other power-ups, this can always spawn. **[NEW]**
- **Floating Score Text:** Added a neon yellow particle effect that displays earned points floating above the player. **[NEW]**
- **Floating Score Physics:** Increased the vertical speed of floating score particles for a more dynamic feel. **[NEW]**
- **Initialization Robustness:** Improved game initialization and added protocol checks for better compatibility. **[NEW]**
- **Zero-Build Architecture:** Migrated `index.html` to load source files directly via `<script type="module">`. This eliminates the need for manual bundling (`npm run build`) before pushing changes to GitHub Pages. The source code *is* the game. **[NEW]**
- **Mobile Interaction Fix:** Improved mobile and keyboard start logic. Fixed an issue where the game couldn't be started on some mobile devices by tapping or pressing Space.
- **Overlay Refactor:** Changed overlays (`start-screen`, `game-over`, `help-screen`) to `position: fixed` with a higher `z-index`, ensuring they cover the entire viewport and capture all user interactions regardless of the game area's size or centering.
- **Canvas-Rendered HUD:** Completely moved the HUD from HTML/CSS to direct canvas rendering.
- **Robust Input Handling:** Unified the start-game trigger into a single robust handler and expanded `Space` key detection to include `e.key` and `e.keyCode` fallbacks.
- **Architecture Refactoring:** Rewrote the main game into modular ES6 classes for better maintainability and cleaner structure.
- **Balance Update (HP):** Reduced Boss and Mini-Boss HP by a factor of 2 while increasing regular enemy HP growth.
- **Enhanced Boss Explosions:** Significantly increased particle size and speed for boss destructions.
- **Layout Fix (True Best Fit):** Implemented a robust responsive strategy that respects both width and height constraints.
