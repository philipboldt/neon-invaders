# Project Status: Neon Invaders

## Overview
A Space Invaders-style arcade shooter built with HTML5 Canvas and JavaScript. The player controls a spaceship to defeat waves of alien invaders, collect power-ups, and survive as long as possible.

## Current Features
- **Core Gameplay:**
  - Player movement (Left/Right arrows) and shooting (Spacebar).
  - Wave-based invader spawning with increasing difficulty.
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
  - Pierce Status (None/Active). **[NEW]**

- **Mechanics:**
  - **Lives:** Player starts with 3 lives. Max lives capped at 5.
  - **Health Drops:** 'Heal' power-ups only drop if player has fewer than 5 lives.
  - **Scoring:** Points awarded for destroying enemies.

## Technical Stack
- **Language:** JavaScript (ES6+)
- **Rendering:** HTML5 Canvas API
- **Styling:** CSS3 (Neon aesthetic)
- **Input:** Keyboard event listeners

## Recent Changes
- Added Pierce status indicator to the HUD.
- Restored accidentally deleted core variables and functions (`invaders`, `bullets`, `drawPlayer`, etc.) which prevented the game from starting.
- Fixed a crash issue where `lastPlayerShot` and `PLAYER_SHOOT_COOLDOWN` were undefined.
- Added `Pierce` power-up (Yellow): Bullets continue through one enemy if they deal the killing blow.
- Updated Help Screen to include the new power-up.
- Implemented maximum life cap of 5 and conditional health drops.
