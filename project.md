# Project Status: Neon Invaders

## Overview
A Space Invaders-style arcade shooter built with **PixiJS (WebGL)** and JavaScript. The player controls a spaceship to defeat waves of alien invaders, collect power-ups, and survive as long as possible.

## Architecture
- **Engine:** PixiJS (v7) for high-performance WebGL rendering.
- **Game Logic:** Managed through specialized classes (`Player`, `EntityManager`, `WeaponManager`, `CollisionManager`).
- **Rendering:** Orchestrated by `Renderer.js` using PixiJS Layers (Containers).
- **Asset Management:** `SpriteManager.js` generates textures procedurally from HTML5 Canvas shims at runtime.
- **UI:** Pure PixiJS UI system for HUD and menus, eliminating DOM dependency for gameplay.
- **Configuration:** All game balancing, colors, and physical constants are centralized in `src/constants.js`.

## Current Features
- **Core Gameplay:**
  - Player movement and shooting (Keyboard & Pure Canvas Touch system).
  - **Sidepods:** Two mini-ships (Left/Right) attached to the player. Each has 3 HP and individual hitboxes. Protected by the player's energy shield when active.
    - **Left Pod:** Equipped with a **Point Defense Cannon (PDC)**. Unlocked at Level 5. Rapidly targets enemy projectiles.
    - **Right Pod:** Equipped with the **Lightning Attack**. Unlocked at Level 10. Automatically targets random enemies.
- **Wave-based invader spawning:** Increasing difficulty, with special Boss encounters every 5 levels.
- **Power-up System:** Shield, Weapon Upgrades (Double/Damage), Rockets, Pierce, and Heal.
- **Parallax Starfield:** Multi-layered scrolling background.
- **Advanced Timing:** Clamped Delta Time ensures consistent game speed across all monitor refresh rates (60Hz to 144Hz+).

## Testing & Integrity
- **Modern Suite (Playwright):** Comprehensive E2E tests for core mechanics, visuals, and responsive layouts.
- **Verification:** Automated tests verify pod progression, pierce logic, and mobile responsiveness.

## Project Status & Active Tracking
- **Enhancement Roadmap:** Tracked in `improve.md`.
- **Known Bugs:** Actively tracked in `bugs.md`.

## Recent Changes
- **UI Component Refactor:** Introduced a reusable `UIButton` class to standardize interactive elements. Refactored `SettingsView` to use this new component, centralizing logic for label formatting (`[ ]`), hover effects, and event handling. **[REFACTOR]**
- **Death Logic Centralization & Balance:** Unified the invader destruction process into `CollisionManager.handleInvaderDeath`. This ensures all kills (bullets, rockets, etc.) trigger consistent audio/visual feedback. Normalized rocket points to standard values for better game balance. **[REFACTOR/BALANCE]**
- **Enhanced Dynamic Feedback:** Overhauled the floating text system to support custom colors and random horizontal offsets. Score gains now appear in a "cloud" above the player to prevent overlapping, while upgrade notifications are color-coded to match their item (e.g., Cyan for Shield, Green for Weapons). **[NEW]**
- **Refined Planning Mandate:** Updated `Gemini.md` to a "MANDATORY STOP" policy. It now explicitly requires completing all research and presenting one comprehensive plan before any implementation or file modification. **[CRITICAL]**
- **Audio System Overhaul:** Integrated explosion SFX (`res/explosion.wav`) for invader, boss, player, and pod destruction. Refactored `AudioManager` to support independent muting of music and sound effects. Updated the "M" key to function as a global mute (Music & SFX OFF). Added a dedicated "Sound" toggle button to the settings menu. **[NEW]**
- **Settings UI & Interaction Fix:** Improved discoverability of settings buttons by adding `[ ]` frames. Fixed a bug where `InputManager` intercepted clicks in the settings view, preventing button interaction on desktop. **[FIX]**
- **Adaptive Framing:** Refined the framing logic to only show the neon border when horizontal letterboxing is active (on screens wider than 4:3). This keeps mobile and tall viewports clean while maintaining the "arcade cabinet" feel on desktops. **[FIX]**
- **Restored Hybrid Scaling:** Re-implemented the "best-fit" scaling strategy that handles wide and tall screens gracefully. Wide screens (landscape) now show a fixed 4:3 logical area centered, while tall screens (portrait) expand vertically to utilize the full height. Removed CSS aspect-ratio constraints to give JS full layout control. **[FIX]**
- **Dynamic Grid Scaling & Full Constant Centralization:** Implemented a responsive formation system that equalizes difficulty between landscape and portrait. It uses a base "Target Threat" (independent of ratio) and calculates a 1.0x to 1.5x scale factor for invaders. The grid dynamically adjusts its columns to maintain ~60% horizontal coverage on any screen, and its vertical start position is fixed at 20% of screen height to ensure consistent pressure. Every single magic number in the codebase has been migrated to `constants.js` for robust architectural control. **[BALANCE/REFACTOR]**
- **Settings System & Music Toggle:** Transformed the Quit Confirmation screen into a comprehensive "Settings" view. Accessible from all game states (Start, Playing, Game Over, etc.) via `Esc`. Added a music toggle button and a global `M` key shortcut. **[NEW]**
- **Audio System Integration:** Integrated `@pixi/sound` and implemented a dedicated `AudioManager`. Background music (`res/bgm.ogg`) now loops during gameplay, with robust handling for browser autoplay policies and state-aware pause/resume logic. **[NEW]**
- **Cinematic Credits System:** Added an automated "Attract Mode" and manual credits view featuring vertical neon scrolling, viewport masking, and state memory for seamless navigation. **[NEW]**
- **Dynamic Arcade Marquee:** On tall mobile screens, the game's title now acts as a permanent, glowing "arcade marquee" resting in the top letterbox space. The inner game border is removed to seamlessly blend the gameplay area into the full-screen animated starfield. **[DONE]**
- **Refined Pierce Logic:** Overhauled the "Pierce" upgrade. Shots now only pass through standard invaders if the hit is fatal. Bosses/Mini-Bosses remain solid targets. Includes visual feedback via a light-purple bullet tint. **[BALANCED]**
- **Vulnerable Sidepods:** Implemented full collision detection for sidepods. Pods now have individual hitboxes and 3 HP, protected by the player's shield. **[NEW]**
- **PixiJS Stabilization:** Reverted to stable defaults for resolution and density, resolving "Postage Stamp" rendering and auto-detection errors on high-DPI monitors. **[FIX]**
- **Clamped Delta Time:** Decoupled game logic from frame rate to ensure consistent gameplay speed on high-refresh monitors. **[FIX]**
- **Pure Canvas Touch System:** Removed all HTML/DOM touch buttons in favor of a 3-tier vertical touch zone system directly in PixiJS. **[NEW]**
- **Desktop Auto-Shoot Toggle:** Added auto-shoot toggle for the Space key on desktop. **[NEW]**
- **Quit Confirmation Stage (\"Airlock\"):** Added a safety state to prevent accidental mission aborts. **[NEW]**
- **Test Suite Refactor:** Completely rewrote the testing infrastructure into modular categories (`core`, `visual`, `responsive`). **[DONE]**
