# Performance Analysis: Neon Invaders (PixiJS Edition)

## 🔍 Root Cause Analysis

After migrating to PixiJS and implementing dynamic height scaling, the game has been reported as "sluggish." My analysis identifies three primary bottlenecks that contribute to this behavior.

### 1. The UI Update Bottleneck (Primary)
**Location:** `src/UIManager.js` -> `updateStats()`
**Problem:** In the current `Renderer.js` implementation, `ui.updateStats()` is called **every single frame** (60fps). 
*   **Technical Detail:** `PIXI.Text` objects in PixiJS are expensive. Every time the `.text` property is set, PixiJS re-generates a canvas texture for that string. 
*   **Impact:** Re-generating textures for 8-10 HUD elements (Score, Level, Lives, FPS, etc.) 60 times per second creates a massive CPU overhead, even when the values haven't changed. This is likely the "micro-stutter" or sluggishness being felt.

### 2. Redundant Property Syncing
**Location:** `src/EntityManager.js` and `src/WeaponManager.js`
**Problem:** The game currently loops through every active entity (Invaders, Bullets, Rockets) to manually sync logical `x/y` coordinates to `sprite.position.x/y` every frame.
*   **Impact:** While necessary for movement, we are also recalculating complex `tint` values (health-based darkening) for every invader every frame, even if they haven't taken damage.

### 3. Loop Synchronization & Ticker Logic
**Location:** `src/Game.js`
**Problem:** The game uses a manual `requestAnimationFrame(this.gameLoop)` while PixiJS runs its own internal ticker.
*   **Impact:** This can lead to "frame fighting" or slight desyncs between logic updates and rendering, especially on high-refresh-rate monitors or mobile devices with variable refresh rates.

### 4. Perceptual vs. Technical Sluggishness (Height Scaling)
**Problem:** On taller aspect ratios (Portrait), the logical height increases from 600 to up to 1400.
*   **Observation:** While speeds are scaled by `heightFactor`, the visual "Time-to-Impact" for projectiles feels longer because they have more screen space to cover. This makes the game feel "floaty" or less snappy compared to the original 4:3 layout.

---

## 🚀 Proposed Optimization Strategy

### Phase 1: Surgical UI Fix (High Priority)
*   **Value Caching:** Implement a `lastStats` cache in `UIManager`. Only update the `.text` property of a `PIXI.Text` object if the value has actually changed since the last frame.
*   **Frequency Reduction:** Move FPS updates to once per second (already partially implemented but needs to be decoupled from the main draw loop).

### Phase 2: Logic & Ticker Integration
*   **PIXI.Ticker:** Migrate `gameLoop` to `this.app.ticker.add()`. This ensures game logic is perfectly synced with Pixi's rendering cycle and provides a consistent `delta` for time-based movement.
*   **In-Place Updates:** Move sprite position updates directly into the movement logic (e.g., `updateProjectiles`) to avoid a secondary "sync pass" in the Renderer.

### Phase 3: "Snappiness" Calibration
*   **Speed Over-compensation:** Slightly increase the base speed multipliers when `heightFactor > 1.2` to ensure that bullets and invaders don't feel like they are moving in slow motion on tall screens.

---

## 📈 Expected Results
*   **CPU Usage:** ~40-60% reduction in HUD-related overhead.
*   **Frame Stability:** Elimination of micro-stutters caused by texture re-generation.
*   **Input Latency:** Improved responsiveness by syncing with the PixiJS Ticker.
