# Engineering Blueprint: Neon Invaders Refactor

This document outlines the architectural standards and best practices being applied during the "Pure Engine" migration (PixiJS + Modular JavaScript).

## 🎯 Primary Goals
1.  **100% Rendering Sovereignty:** Zero dependency on HTML/CSS for game visuals.
2.  **Encapsulation:** Entities (Invaders, Projectiles) should manage their own state and internal PixiJS representations.
3.  **Loop Optimization:** Centralized logic loops to prevent redundant iterations.
4.  **Memory Stability:** Efficient object pooling to maintain a zero-allocation gameplay loop.

---

## 🏗️ Architectural Patterns

### 1. The Stage/View Pattern (UI)
*   **Modular Views:** Each screen (Start, Help, GameOver) is an independent class.
*   **View Stack:** The `UIManager` acts as a state-based orchestrator, swapping views without knowing their internal layout.
*   **Responsive Scaling:** All views implement an `updateLayout(W, H)` method to handle dynamic aspect ratios.

### 2. Entity Component System (ECS) Lite
*   **BaseEntity:** Provides a unified interface for `x, y, vx, vy` and `syncSprite()`.
*   **Polymorphism:** Specific logic (like Boss movements or Rocket homing) is encapsulated in subclasses rather than giant `if/else` blocks in managers.
*   **In-Place Sync:** PixiJS sprites are updated immediately during the entity's logical `update()`, eliminating separate "rendering passes."

### 3. The Factory Pattern (Spawning)
*   **Centralized Creation:** All entities should be created through a factory or manager to ensure correct layer assignment and pooling.
*   **Texture Baking:** Use `SpriteManager` to pre-generate textures from Canvas shims, then reuse those textures across all sprites for GPU efficiency.

---

## ⚡ Performance Best Practices

### 1. Object Pooling (Crucial)
*   **Reuse, Don't Destroy:** Projectiles should never be `null`ed out. Instead, move them to a `pool` array and set `visible = false`.
*   **GC Avoidance:** Keeping the number of active objects stable prevents "Garbage Collection Stutters."

### 2. PixiJS Scene Graph Optimization
*   **Container Flattening:** Use containers for logical grouping (e.g., `entityLayer`, `uiLayer`), but avoid nesting containers more than 3-4 levels deep to keep the transform calculations fast.
*   **Tinting vs. Textures:** Use `.tint` for simple color shifts (like damage effects) rather than switching textures, as tinting is highly optimized in WebGL.

### 3. Ticker Synchronization
*   **Unified Ticker:** Run all logic inside the `PIXI.Ticker` callback to ensure logic and rendering are perfectly in phase with the browser's refresh rate.
*   **Delta-Time Awareness:** Use ticker delta for smooth movement regardless of frame rate fluctuations.

---

## 🛠️ Refactor Checklist (State of Play)

- [x] **Phase 1: UI Modularization** (Start, Help, Highscore views).
- [x] **Phase 2: Universal State Machine** (START, PLAYING, PAUSED, GAMEOVER).
- [x] **Phase 3: Entity Encapsulation** (BaseEntity, Invader, Projectile, Upgrade classes).
- [ ] **Phase 4: Manager Slimming** (Refactor `EntityManager` and `WeaponManager` to use classes).
- [ ] **Phase 5: Global Event Cleanup** (Remove remaining legacy HTML interactions).

---

## 📝 Coding Standards
*   **Class Consistency:** Use `ES6 Classes` for all logic units.
*   **Dependency Injection:** Pass the `game` instance to constructors so entities can access the layer system and managers easily.
*   **Naming:** Follow `camelCase` for variables/methods and `SCREAMING_SNAKE_CASE` for global constants.
