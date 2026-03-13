# Project Status: Neon Nuke

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
- **Enemy Sprite Integration:** Replaced the procedural rectangular invaders with the new high-fidelity enemy sprite (`res/enemy sprite.png`). Standard invaders now show their original natural colors (no base color tinting), while the dynamic darkening effect (HP-based) remains for damage feedback. Bosses continue to use their unique procedural red rectangular design for distinct visual hierarchy. **[NEW/VISUAL]**
- **Enemy Sprite Cleaning:** Used the updated `clean-sprite.js` tool to remove the magenta background from the new enemy sprite (`res/enemy sprite.png`), making it game-ready with transparency. **[TOOLING/DONE]**
- **Image Processing Helper Enhancement:** Refactored the `scripts/clean-sprite.js` tool to accept a filename as a command-line argument. This allows for flexible cleaning of any sprite in the `res` directory by simply passing its name (e.g., `node scripts/clean-sprite.js "enemy sprite.png"`). Increased the color matching threshold to 15 for better background removal. **[TOOLING/IMPROVED]**
- **Dynamic Invader Tinting:** Implemented a row-based coloring system for the Gemini enemy sprite. Each row of invaders is now dynamically tinted with its assigned neon color (Magenta, Green, Orange) using PixiJS's tinting engine. The system preserves damage feedback by progressively darkening the neon tint as an invader's HP drops. **[VISUAL/NEW]**
- **Gemini Enemy Sprite Integration:** Replaced the previous enemy sprite with the newly processed `res/gemini_processed.png`. This high-fidelity sprite was isolated from an AI-generated canvas using the `process-sprite.js` tool, ensuring perfect transparency and 48x48 pixel alignment. **[VISUAL/NEW]**
- **AI Sprite Post-Processor:** Created `scripts/process-sprite.js`, a specialized tool for isolating pixel-art sprites from AI-generated canvases. It automatically detects "Magenta Chroma Key" (#FF00FF) bounding boxes, removes "Green Screen" (#00FF00) backgrounds, and performs a 48x48 nearest-neighbor resize for perfect in-game fidelity. Includes a visual verification report (`test_sprite.html`) to inspect transparency and pixel alignment at 1:1 and 256x256 scales. **[TOOLING/NEW]**
- **Start Screen Visuals:** Increased the "NEON NUKE" logo size by 20% (factor 1.2) specifically on the start screen to enhance its presence as a centerpiece. The logo remains at its standard 1.0x scale in other game states (Pause, Game Over, etc.). **[VISUAL]**
- **Start Screen UI Refactor:** Simplified the start screen by removing the static "PRESS SPACE OR ENTER" text and consolidating the interaction into a single, unified button: `[ PRESS SPACE OR TAP TO START ]`. Changed the button color to match the primary "NEON NUKE" cyan logo color (`COLORS.text`) for better brand consistency. **[REFACTOR]**
- **UI Crash Fix (Attract Mode):** Resolved an `Uncaught TypeError` in `UIManager.js` that occurred when the idle timer triggered "Attract Mode" (Credits view) from the Start Screen. The crash was caused by an unsafe access to a non-existent `highscoreContainer` in `StartView`. **[FIX]**
- **Player Sprite Integration:** Replaced the procedural `PIXI.Graphics` player ship with a high-fidelity sprite (`res/player sprite.png`). Updated `SpriteManager` to support external image loading and refactored `Player.js` to utilize `PIXI.Sprite` for enhanced visual detail. Credited **NANO BANANA** for the mechanical design. **[NEW]**
- **Master Volume Factor:** Introduced `AUDIO_MASTER_VOLUME` set to 0.5. This constant acts as an overall global multiplier for both music and sound effects, providing an extra layer of control for the final output volume across the entire audio system. **[NEW]**
- **Audio Rebalancing:** Further reduced `AUDIO_GAIN_EXPLOSION` to 0.075 (92.5% total reduction). Verified the gain mechanism is correctly applied in `AudioManager.js`. This creates a very subtle "thud" for explosions, allowing player laser shots to be the dominant sound. **[BALANCE]**
- **Audio Rebalancing (Previous):** Further reduced `AUDIO_GAIN_EXPLOSION` to 0.15 (85% total reduction). **[BALANCE]**
- **Player Laser SFX:** Integrated the "laserthing" sound effect (`res/laserthing.wav`) for player shooting. Updated the `AudioManager` to handle pre-loading and volume scaling for the new asset. Credited the original creator, **FROSTY HAM**, in the in-game credits. **[NEW]**
- **Unified State-Based Touch Control:** Overhauled the touch system into a centralized, context-aware router in `InputManager.js`. Each game state (`START`, `PLAYING`, `PAUSED`, `SETTINGS`, `GAMEOVER`, etc.) now has its own isolated touch logic, resolving interferences between layers.
  - **Dynamic Control Overlay:** The `ControlOverlayView` now intelligently shows/hides labels based on the active state (e.g., hiding movement arrows in menus, showing "TAP TO RESTART" only on Game Over).
  - **Universal Exit:** Standardized "Double Tap TOP" as the universal gesture for `Escape/Abort` across all relevant states.
  - **Start/Settings Cleanup:** Removed redundant background listeners from `StartView` and `SettingsView`, centralizing all interaction logic within the state-driven `InputManager`. **[REFACTOR/FIX]**
- **Settings Interaction Fix (Mobile):** (Superseded by Unified Touch Control) **[REFACTOR]**
- **Start Screen Interaction:** Enhanced the `StartView` to support "tap anywhere to start," making the game more intuitive for mobile users. **[FIX]**
- **Name Entry Layout Fix:** Adjusted the layout constants in `NameEntryView` to prevent the character-changing interface from overlapping the "SAVE" button. Increased vertical spacing between slots, footer, and buttons for better ergonomics on touch screens. **[FIX]**
- **Lightning Visual Refinement:** Thinned the lightning beam and reduced its outline for a more precise "electric" look. Doubled the duration of the strike animation to 300ms, making the glow and flicker effects more impactful. **[VISUAL]**
- **Mobile Interaction Completeness:** Overhauled `NameEntryView` for full touch support, enabling character selection via tapping and vertical swiping. Added a "TAP TO START" button to the start screen and a "SAVE" button for high scores, ensuring all core game flows are accessible without a keyboard. **[ACCESSIBILITY]**
- **Rocket Rebalance:** Halved the rocket explosion radius by introducing `ROCKET_BLAST_RADIUS_MULT`. This requires more precise targeting and reduces the ability to clear massive clusters with a single shot. **[BALANCE]**
- **Improved Audio Scaling:** Implemented quadratic volume mapping in `AudioManager` to better match human perceived loudness. This ensures that low volume settings (e.g., 5-10%) are appropriately quiet. Lowered default volume constants for a better initial experience. **[FIX]**
- **Interactive Audio Controls:** Implemented a reusable `UISlider` component for fine-grained volume control. Added "Music Volume" and "SFX Volume" sliders to the Mission Settings menu, providing real-time audio feedback. **[NEW]**
- **UI Component Refactor:** Introduced a reusable `UIButton` class to standardize interactive elements. Refactored `SettingsView` to use this new component, centralizing logic for label formatting (`[ ]`), hover effects, and event handling. **[REFACTOR]**
- **UI Cleanup:** Removed the redundant "View Credits" button from the `HelpView` to reduce screen clutter and improve readability. Functional access remains available via the "Mission Settings" screen. **[CLEANUP]**
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
