# Performance & Optimization Plan: Neon Invaders

The game successfully migrated from the 2D Canvas API to WebGL via PixiJS, but it is still using "Canvas-style" logic in a WebGL environment. Adapting these patterns will yield massive performance gains.

## 1. Performance Bottlenecks & Optimization

### A. "Immediate Mode" Rendering in a "Retained Mode" Engine
*   **The Issue:** In `WeaponManager.js` (`updateProjectilesRender`), we call `PIXI.Graphics.clear()` and then redraw every single bullet, missile, and rocket with `.beginFill()` and `.drawRect()` *every single frame*. PixiJS is designed for "Retained Mode"—we should create a `Sprite` once and simply update its `.x` and `.y` properties.
*   **The Fix:** Pre-render a bullet texture once (like in `SpriteManager.js` for invaders), and use a pool of `PIXI.Sprite` objects for projectiles. Updating positions of sprites is exponentially faster than rebuilding geometry with `PIXI.Graphics` 60 times a second.

### B. Garbage Collection (GC) Pressure from `Array.filter`
*   **The Issue:** In `CollisionManager.js` and `EntityManager.js`, we frequently use `this.game.bullets = this.game.bullets.filter(...)` to remove destroyed objects. `Array.filter` creates a brand new array object in memory every single frame. This forces the browser's Garbage Collector to constantly clean up old arrays, which causes micro-stutters (frame drops).
*   **The Fix:** Refactor arrays to update "in-place." Instead of filtering, iterate backwards through the array (`for (let i = arr.length - 1; i >= 0; i--)`) and use `arr.splice(i, 1)` to remove dead entities without allocating new array memory.

### C. Heavy Particle System Objects
*   **The Issue:** While `ParticleSystem.js` correctly uses an object pool, every particle in the pool contains its own `PIXI.Graphics` and `PIXI.Text` instance. `PIXI.Text` is incredibly expensive because it uses an internal hidden HTML Canvas to draw the font, then uploads that canvas to the GPU as a texture. Doing this for dozens of particles is a heavy bottleneck.
*   **The Fix:** 
    1. For geometric particles, use a `PIXI.ParticleContainer` combined with a pre-rendered white square texture, changing only `tint`, `alpha`, and `scale`.
    2. For floating text, switch from `PIXI.Text` to `PIXI.BitmapText`. BitmapText uses a pre-generated font atlas and is infinitely faster for numbers that change rapidly.

### D. Redundant HUD Updates
*   **The Issue:** The `UIManager.js` updates the `.text` property of the HUD elements continuously. Even if the score hasn't changed, updating a `PIXI.Text` property forces PixiJS to check if it needs to re-render the internal texture.
*   **The Fix:** Cache the previous values. Only update `hudTexts.score.value.text` if `gameState.score !== this.previousScore`.

## 2. Refactoring Opportunities & Architecture

### A. Centralized Entity Management (The ECS Pattern)
*   **Current State:** State and cleanup logic are scattered. `CollisionManager` destroys upgrade sprites, `WeaponManager` destroys target sprites, and `Game.js` destroys what's left on reset. This caused the "ghost objects" bug.
*   **Refactor:** Implement a centralized Entity-Component-System (or unified `GameObject` manager). Every entity (player, invader, bullet, upgrade) should inherit from a base class with a `destroy()` method. When an entity dies, you just call `entity.destroy()`, and it handles its own array removal, particle spawning, and PixiJS sprite cleanup.

### B. Decouple Physics from Frame Rate (Delta Time)
*   **Current State:** Game physics (`x += vx`, `y += vy`) are bound strictly to the frame loop. If a device has a 120Hz screen, the game runs exactly twice as fast as on a 60Hz screen.
*   **Refactor:** Implement `Delta Time (dt)`. Modify `gameLoop(now)` to calculate the time since the last frame: `dt = (now - lastTime) / 1000`. Multiply all movement by `dt` (e.g., `p.x += p.vx * dt`). This guarantees the game plays at the exact same speed on a 60Hz monitor and a 144Hz monitor.

### C. Collision Spatial Partitioning
*   **Current State:** `checkCollisions` uses an O(N*M) loop. It checks every bullet against every invader. If you have 50 bullets and 50 invaders, that's 2,500 checks per frame.
*   **Refactor:** Since invaders are arranged in a strict grid, you can mathematically determine exactly which column and row a bullet is in. You only need to check collisions against the 1 or 2 invaders physically adjacent to the bullet, reducing checks down to about 50.