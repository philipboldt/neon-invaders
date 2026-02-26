# 🚀 NEON INVADERS

A high-performance, Space Invaders-style arcade shooter built with HTML5 Canvas and a modern neon aesthetic. Defeat waves of alien invaders, survive boss encounters, and climb the highscore leaderboards.

![Neon Invaders Screenshot](https://via.placeholder.com/800x450/0d0d14/00f5ff?text=NEON+INVADERS+GAMEPLAY)

## ✨ Features

- **Dynamic Combat:** Fast-paced action with player movement, rapid-fire projectiles, and satisfying **Screen Shake** feedback.
- **Progressive Difficulty:** Waves of invaders with increasing health and speed.
- **Boss Encounters:**
  - **Mini-Bosses:** Spawn at levels ending in 5 with 5x health.
  - **True Bosses:** Massive enemies at levels ending in 0 with 10x health and multiple power-up drops.
  - **Homing Missiles:** Bosses fire targeted missiles that track the player's position.
- **Power-up System:**
  - 🛡️ **Shield:** Permanent recharge system (absorbs one hit).
  - ⚔️ **Double:** Increases shot count or damage.
  - 🚀 **Rocket:** Homing missiles with massive area-of-effect damage.
  - ⚡ **Pierce:** Fatal shots pass through enemies.
  - ❤️ **Heal:** Restores lost lives (max 5).
- **Persistent Highscores:** Top 3 local scores are saved and displayed on the start/game over screens.
- **Mobile Optimized:** Full touch controls with auto-fire toggle and responsive canvas scaling.

## 🛠️ Performance Overhaul

This project is optimized for a smooth 60 FPS experience even on lower-end devices:
- **Sprite Pre-rendering:** Invaders are cached in offscreen canvases to minimize expensive real-time glow/shadow calculations.
- **Particle Pooling:** A pre-allocated pool of **1,024 particles** eliminates Garbage Collection spikes and micro-stuttering.
- **Efficient Collision Engine:** Optimized math for handling hundreds of entities simultaneously.

## 🎮 How to Play

### Desktop
- **← / →** : Move ship
- **SPACE** : Shoot (Hold for continuous fire / Toggle on mobile)
- **H** : Toggle Help / Pause
- **D** : Toggle Debug Mode

### Mobile
- **Left/Right Buttons** : Move
- **SHOOT Button** : Toggle Auto-Fire on/off
- **Pause Button** : Toggle Help/Pause screen

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (optional, for local server)

### Run Locally
Simply open `index.html` in any modern web browser. 

Alternatively, use a local development server for the best experience:
```bash
npx serve .
```

### 🧪 Running Tests
The project includes a comprehensive E2E test suite using **Playwright**:
```bash
npm install
npx playwright install
npm test
```

## 🏗️ Technical Stack
- **Engine:** Vanilla JavaScript (ES6+)
- **Graphics:** HTML5 Canvas API
- **Optimization:** Offscreen Buffering & Object Pooling
- **Styling:** CSS3 Flexbox/Grid with Orbitron typography
- **Testing:** Playwright E2E Framework

---
Built with ❤️ by [Philip Boldt](https://github.com/philipboldt)
