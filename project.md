# Project Status: Neon Invaders

## Overview
A Space Invaders-style arcade shooter built with **PixiJS (WebGL)** and JavaScript. The player controls a spaceship to defeat waves of alien invaders, collect power-ups, and survive as long as possible.

## Architecture
- **Engine:** PixiJS (v7) for high-performance WebGL rendering.
- **Game Logic:** Managed through specialized classes (`Player`, `EntityManager`, `WeaponManager`, `CollisionManager`).
- **Rendering:** Orchestrated by `Renderer.js` using PixiJS Layers (Containers).
- **Asset Management:** `SpriteManager.js` generates textures procedurally from HTML5 Canvas shims at runtime.
- **UI:** Hybrid approach using PixiJS for in-game HUD and standard HTML/CSS for menus and overlays.
- **Configuration:** All game balancing, colors, and physical constants are centralized in `src/constants.js`.

## Current Features
- **Core Gameplay:**
  - Player movement (Left/Right arrows/touch buttons) and shooting (Spacebar/touch button).
  - **Sidepods:** Two mini-ships (Left/Right) attached to the player. Each has 3 HP and cannot be healed. Start as inactive and are unlocked as boss rewards. Defeating a boss (from level 5 onwards) will fully heal or respawn any unlocked pods. Movement constraints dynamically adjust based on active pods. **[ENHANCED]**
    - **Left Pod:** Equipped with a **Point Defense Cannon (PDC)**. Unlocked by defeating the Level 5 boss. Rapidly targets enemy projectiles with a 10% interception chance. **[NEW]**
    - **Right Pod:** Equipped with the **Lightning Attack**. Unlocked by defeating the Level 10 boss. Automatically targets random enemies every 1.0s. **[NEW]**
- **Wave-based invader spawning:** Increasing difficulty, with special Boss encounters.
  - **Mini-Bosses:** Spawn at levels ending in 5 (e.g., 5, 15), featuring 125x health and 4x size. Immune to rockets. **[BALANCED]**
  - **Bosses:** Spawn at levels ending in 0 (e.g., 10, 20), featuring 250x health, 6x size, unique color, and massive point drops. Immune to rockets. **[BALANCED]**
  - Enemy types with different colors and hit points.
  - Collision detection for bullets, enemies, and player.

- **Power-up System:**
  - `Shield`: Grants a temporary shield that absorbs one hit.
  - `Double`: Increases shot count (up to 4) or damage (up to dynamic max).
  - `Rocket`: Fires homing missiles. Upgrade increases blast radius (Level 1-5).
  - `Pierce`: Shots pass through one enemy if the hit is fatal.
  - `Heal`: Restores 1 life (up to dynamic max).
  - `Points`: Gives Level x 100 Bonus Points.
  - **Dynamic Conversion:** When a player reaches the maximum limit for an upgrade type (e.g., max HP), all other upgrades of that type on the screen automatically transform into 'Points' upgrades. **[NEW]**

- **Parallax Starfield:** Multi-layered scrolling background with stars of different sizes and speeds to create depth and a dynamic feel. **[NEW]**
- **UI/HUD:**
  - **PixiJS-powered HUD** with Scores, Level, Lives, and active Upgrades for fluid scaling and performance. **[ENHANCED]**
  - Responsive Mobile Touch Controls (Left, Shoot, Right, Pause).
  - **Highscore List**: Persistent top 3 scores saved in `localStorage`.
  - **Arcade Name Input**:Retro arcade-style input for highscores. **[ENHANCED]**
  - **Boss Clear Info Screen**: pausing the game after boss kills to show rewards.

## Performance Optimizations
- **WebGL Rendering:** Powered by PixiJS for GPU-accelerated drawing.
- **Sprite Texture Caching:** Procedural assets are pre-rendered into high-performance PixiJS Textures.
- **Object Pooling:** Particle system utilizes a pre-allocated pool (1024 particles) to eliminate Garbage Collection spikes.
- **Modular Architecture:** Extracted core logic into specialized managers.

## Mobile Optimization (Portraitish)
- **Goal:** Transform the game into a dynamic vertical shooter for mobile portrait orientation.
- **Dynamic Canvas:** Fixed logical width (800) with variable logical height (600-1400) based on aspect ratio.
- **Gameplay Balancing:** 
  - **Time-to-Impact Scaling:** Projectile speeds scale with height to maintain game rhythm.
  - **Faster Descent:** Invader drop-down distance increases on taller screens.
  - **Portrait Grid:** Dynamic invader rows/cols (e.g., 9x6) to fit narrow screens.

## Recent Changes
- **Rocket Physics & Trajectory Fix:** Refactored player rockets to use physical screen coordinates for all targeting and movement math. Scaled speed, thrust, and phase limits by `heightFactor` to maintain game rhythm without distorting the path. This ensures rockets fly accurately toward targets on all aspect ratios. **[FIX]**
- **Collision Logic Refinement:** Removed redundant `heightFactor` scaling from projectile hitboxes and reduced player hitbox padding to 2px for better accuracy. **[FIX]**
- **Boss Missile Trajectory Fix:** Simplified boss missile targeting to use consistent buffer-pixel math, ensuring missiles follow a straight path toward the player. **[FIX]**
- **Universal Height Scaling Sweep:** Performed a comprehensive codebase audit to ensure all vertical position and speed calculations (`ParticleSystem`, `Starfield`, `Projectiles`, `Upgrades`) correctly implement the dynamic `heightFactor`. **[ENHANCED]**
- **Ghost Object Fix:** Added explicit sprite cleanup to `initInvaders` to ensure PixiJS sprites from previous waves are destroyed. **[FIX]**
- **Rocket Crash Fix:** Fixed a critical typo in `WeaponManager.js` where an undefined `target.sprite` was accessed. **[FIX]**
- **HUD FPS Counter:** Added a real-time FPS counter to the HUD. **[NEW]**
- **Rocket Physics Fix:** Refactored rocket steering to use logical `ry` coordinates for consistent behavior. **[FIX]**
- **Mobile Portrait Optimization:** Implemented dynamic logical height (600-1400) and responsive grid layouts for portrait screens. **[NEW]**
- **Mobile Optimization Plan:** Created `mobile.md` outlining the strategy for a "Portraitish" mobile version, including Time-to-Impact scaling and dynamic grid layouts. **[PLAN]**
- **Point Upgrade Values:** Fixed a regression from the PixiJS migration where point upgrades were missing their numeric values. They now dynamically display their point amount using `PIXI.Text`. **[FIX]**
- **Configuration Centralization:** Refactored all core managers (`EntityManager`, `Player`, `WeaponManager`, `ParticleSystem`, `UIManager`) to use centralized constants and colors from `src/constants.js`. **[ENHANCED]**
- **PixiJS Migration:** Successfully transitioned the entire game engine from manual 2D Canvas context to PixiJS. **[NEW ARCHITECTURE]**
    - Implemented tiered rendering layers (Background, Entities, Projectiles, Effects, UI).
    - Refactored `ParticleSystem` to use pooled PixiJS Graphics and Text objects.
    - Migrated HUD to use `PIXI.Text` for better performance and scaling.
    - Preserved existing procedural "neon" aesthetic via runtime texture generation.
- **Mobile Interaction Fix (Restart):** Added a pointer listener to the restart button to ensure it responds immediately to touch on mobile devices. **[FIX]**
- **Mobile Interaction Fix (Boss Clear):** Added a pointer listener to the boss clear screen, allowing mobile users to resume the game by tapping anywhere on the screen after defeating a boss. **[FIX]**
- **Dynamic Upgrade Conversion:** When a player reaches the maximum limit for an upgrade category (Health, Damage, Rockets, etc.), all other upgrades of that same type currently on the screen instantly transform into 'Points' upgrades. **[NEW]**
