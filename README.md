# 🚀 NEON NUKE

A high-performance, Space Invaders-style arcade shooter built with **PixiJS (WebGL)** and a modern neon aesthetic. Defeat waves of alien invaders, unlock powerful sidepods, and survive massive boss encounters.

![Neon Nuke Screenshot](https://via.placeholder.com/800x450/0d0d14/00f5ff?text=NEON+NUKE+GAMEPLAY)

## ✨ Features

- **WebGL Rendering:** Powered by **PixiJS v7** for hardware-accelerated 60 FPS performance.
- **Pure Canvas UI:** 100% of the game visuals, including menus, highscores, and name entry, are rendered within the WebGL context for a seamless, immersive experience.
- **Sidepod System:** Unlock auxiliary pods by defeating bosses:
  - 🛡️ **Left Pod (PDC):** Automatic Point Defense Cannon that intercepts enemy projectiles.
  - ⚡ **Right Pod (Lightning):** High-voltage discharge that strikes random enemies.
- **Dynamic Combat:** Satisfying **Screen Shake**, particle explosions, and homing rockets.
- **RPG-Style Progression:** Increase your ship's "Potential" (Max Health & Damage) by defeating bosses.
- **Responsive Proportional Scaling:** 
  - **Landscape:** Fits a perfect 4:3 arcade block into any screen height.
  - **Portrait:** Dynamically extends the vertical field of view for mobile play.

## 🛠️ Architecture & Performance

This project uses a modular, engine-grade architecture:
- **Unified State Machine:** Robust management of game states (`START`, `PLAYING`, `PAUSED`, `GAMEOVER`, `BOSSKILLED`, `HIGHSCORE`).
- **Modular View System:** Encapsulated view classes (`StartView`, `HudView`, `NameEntryView`, etc.) for clean UI management.
- **ECS-Lite Entity System:** Class-based entities (`Invader`, `Projectile`, `Upgrade`) that handle their own logic and sprite synchronization.
- **Centralized Constants:** A single source of truth in `src/constants.js` for all game parameters, colors, and layout offsets.
- **Universal Dimmer:** Automatic state-based background dimming for high-contrast UI overlays.
- **Object Pooling:** Zero-allocation projectile management to prevent Garbage Collection stutters.

## 🎮 How to Play

### Desktop
- **← / →** : Move ship
- **SPACE** : Shoot (Hold for continuous fire / Start Game)
- **H** : Toggle Help / Pause
- **ESC** : End Session / Return to Menu
- **D** : Toggle Debug Mode

### Mobile
- **Left/Right Buttons** : Move
- **SHOOT Button** : Toggle Auto-Fire on/off
- **Pause Button** : Toggle Help/Pause screen

## 🚀 Getting Started

### Run Locally
You can run the game using any local development server:
```bash
npx serve .
```
Then visit `http://localhost:3000` in your browser.

### 🧪 Running Tests
```bash
npm install
npx playwright install
npx playwright test
```

## 🏗️ Technical Stack
- **Engine:** PixiJS v7 (WebGL)
- **Language:** JavaScript (ES6+ Classes)
- **Architecture:** Modular View-Controller + State Machine
- **Testing:** Playwright E2E Framework

---
Built with ❤️ by [Philip Boldt](https://github.com/philipboldt)
