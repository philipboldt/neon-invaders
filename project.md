# Project Status: Neon Invaders

## Overview
A Space Invaders-style arcade shooter built with HTML5 Canvas and JavaScript. The player controls a spaceship to defeat waves of alien invaders, collect power-ups, and survive as long as possible.

## Current Features
- **Core Gameplay:**
  - Player movement (Left/Right arrows/touch buttons) and shooting (Spacebar/touch button).
- **Wave-based invader spawning:** Increasing difficulty, with special Boss encounters.
  - **Mini-Bosses:** Spawn at levels ending in 5 (e.g., 5, 15), featuring 250x health and 4x size. Immune to rockets.
  - **Bosses:** Spawn at levels ending in 0 (e.g., 10, 20), featuring 500x health, 6x size, unique color, and massive point drops. Immune to rockets.
  - Enemy types with different colors and hit points.
  - Collision detection for bullets, enemies, and player.

- **Power-up System:**
  - `Shield`: Grants a temporary shield that absorbs one hit.
  - `Double`: Increases shot count (up to 4) or damage (up to 5). Stops dropping when maxed.
  - `Rocket`: Fires homing missiles. Upgrade increases blast radius (Level 1-5). Deals 2x player damage.
  - `Pierce`: Shots pass through one enemy if the hit is fatal.
  - `Heal`: Restores 1 life (max 5 lives).

- **Parallax Starfield:** Multi-layered scrolling background with stars of different sizes and speeds to create depth and a dynamic feel, even on the start screen. **[NEW]**
- **UI/HUD:**
  - Lives, Score, Level, Shield Status, Damage Multiplier.
  - Pierce Status (None/Active).
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

- **Visual Feedback:**
  - **Dynamic Brightness:** Enemies with multiple HP (including regular invaders and bosses) now visually darken as they take damage.
  - **Smooth Level Transitions:** Levels now only end after all active visual effects—including particle explosions, rockets, and boss missiles—have fully cleared. This ensures players can appreciate the full impact of their final shots before the next wave begins. **[NEW]**

## Technical Stack
- **Language:** JavaScript (ES6+)
- **Standards:** Formally enforced via the custom **`pure-javascript`** Agent Skill (ES2020+, ESM, Async/Await). **[NEW]**
- **Rendering:** HTML5 Canvas API with Offscreen Buffering & Dynamic Color Darkening
- **Optimization:** Object Pooling (1024 entities) & Sprite Caching
- **Testing:** Playwright E2E Tests with **MCP-Ready State Inspection** (`window.game`) and **Visual Snapshots**. **[ENHANCED]**

## Recent Changes
- **Enhanced Boss Explosions:** Significantly increased the size and speed of particles in the boss's "Stunning Explosion" effect. The core flash and main burst now feature much larger particles, making boss defeats feel more impactful and visually distinct from regular enemy destructions. **[NEW]**
- **Canvas-Rendered HUD:** Completely moved the HUD from HTML/CSS to direct canvas rendering. This increases the effective screen size for the game and ensures the HUD is always perfectly aligned and styled within the game's coordinate system. The new HUD features two rows of stats at the top of the screen with a consistent neon aesthetic.
- **HUD Update (Rocket):** Simplified the "Rocket Blast" label to "Rocket" and changed the value display to show only the level number (or 'none'), consistent with other stats.
- **MCP Server Fix:** Resolved the "Connection closed" error during discovery by updating the Playwright MCP server configuration to use the correct package name, `@playwright/mcp`. This ensures proper communication between the Gemini CLI and the browser automation tools.
- **Testing Infrastructure (MCP-Ready):** Rewrote the entire Playwright test suite to leverage the new **Playwright MCP Server** capabilities. The game now exposes its internal state via `window.game`, allowing tests to inspect and manipulate levels, HP, and game status directly. Added visual snapshot testing for complex effects like the **Stunning Boss Explosion** and **Dynamic Brightness**.
- **Layout Fix (True Best Fit):** Implemented a robust "True Best Fit" responsive strategy. The game width is now dynamically calculated to respect both viewport width and available vertical space (reserving room for HUD/Title). This ensures the game maintains its 4:3 aspect ratio and 1:1 pixel logic while guaranteeing the player ship at the bottom is always visible on all devices, from vertical phones to ultra-wide monitors. Fixed border alignment issues where gaps would appear on certain resolutions. **[NEW]**
- **Visual Feedback (Dynamic Brightness):** Implemented a linear brightness reduction for all enemies with more than 1 HP. Damaged units gradually darken from 100% to 45% brightness.
- **Boss Explosion Effect:** Added a stunning, multi-layered particle explosion for bosses and mini-bosses, featuring core flashes and lingering embers.
