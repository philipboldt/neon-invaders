# 🚀 NEON INVADERS

A high-performance, Space Invaders-style arcade shooter built with **PixiJS (WebGL)** and a modern neon aesthetic. Defeat waves of alien invaders, unlock powerful sidepods, and survive massive boss encounters.

![Neon Invaders Screenshot](https://via.placeholder.com/800x450/0d0d14/00f5ff?text=NEON+INVADERS+GAMEPLAY)

## ✨ Features

- **WebGL Rendering:** Powered by **PixiJS v7** for ultra-smooth 60 FPS performance and hardware-accelerated effects.
- **Sidepod System:** Unlock auxiliary pods by defeating bosses to enhance your ship:
  - 🛡️ **Left Pod (PDC):** Automatic Point Defense Cannon that intercepts enemy projectiles.
  - ⚡ **Right Pod (Lightning):** High-voltage discharge that automatically strikes random enemies.
- **Dynamic Combat:** Fast-paced action with satisfying **Screen Shake**, particle explosions, and homing rockets.
- **Boss Encounters:**
  - **Mini-Bosses:** Spawn at levels ending in 5 with unique rewards.
  - **True Bosses:** Massive enemies at levels ending in 0 with 250x health and massive power-up drops.
- **Power-up System:**
  - 🛡️ **Shield:** Permanent recharge system (absorbs one hit).
  - ⚔️ **Double:** Increases shot count or damage.
  - 🚀 **Rocket:** Homing missiles with massive area-of-effect damage.
  - ⚡ **Pierce:** Fatal shots pass through enemies.
  - ❤️ **Heal:** Restores lost lives.
  - 💎 **Points:** Bonus points when stats are maxed out.
- **Responsive Proportional Scaling:** 
  - **Landscape:** Fits a perfect 4:3 arcade block into any screen height (letterboxed).
  - **Portrait:** Dynamically extends the vertical field of view for mobile play.

## 🛠️ Performance & Architecture

This project is engineered for maximum efficiency:
- **Unified Ticker:** Uses PixiJS's internal ticker for perfectly synced logic and rendering.
- **HUD Caching:** Value-based dirty checks for UI text to avoid expensive texture regeneration.
- **Particle Pooling:** A pre-allocated pool of **1,024 particles** eliminates Garbage Collection spikes.
- **In-Place Updates:** Entity positions are synced directly during logic loops to eliminate redundant iterations.

## 🎮 How to Play

### Desktop
- **← / →** : Move ship
- **SPACE** : Shoot (Hold for continuous fire)
- **H** : Toggle Help / Pause
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
The project includes a comprehensive E2E test suite using **Playwright**:
```bash
npm install
npx playwright install
npx playwright test
```

## 🏗️ Technical Stack
- **Engine:** PixiJS v7 (WebGL)
- **Language:** JavaScript (ES6+)
- **Styling:** CSS3 Flexbox/Grid with Orbitron typography
- **Testing:** Playwright E2E Framework

---
Built with ❤️ by [Philip Boldt](https://github.com/philipboldt)
