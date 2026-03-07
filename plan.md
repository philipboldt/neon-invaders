# Plan: Global Highscore System

This document outlines the strategy for transitioning the current local-only highscore system to a permanent, global leaderboard accessible to players worldwide.

## 1. Architecture & Technology Choice
Since Neon Invaders is a static web application (hosted on GitHub Pages), we will use a **Backend-as-a-Service (BaaS)** to avoid maintaining a custom server.

*   **Primary Choice:** **Supabase** or **Firebase (Firestore)**.
    *   **Pros:** Easy JavaScript SDK, generous free tiers, real-time capabilities.
    *   **Cons:** Requires client-side API keys (publicly visible in static apps).

## 2. Database Schema
A simple `leaderboard` table/collection will store the following fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/String | Unique identifier for the entry. |
| `playerName` | String | The name or initials (3-10 chars) entered by the player. |
| `score` | Number | The final score achieved. |
| `levelReached`| Number | The level the player reached before game over. |
| `timestamp` | DateTime | Automatically generated when the score is saved. |

## 3. Frontend & UI/UX Changes
To support global scores, the following UI components must be added or updated:

*   **Name Entry Screen:**
    *   Triggered on Game Over if the score is high enough.
    *   Input field for player name/initials.
    *   "Submit" button that triggers the database write.
*   **Global Leaderboard Display:**
    *   Updated Start and Game Over screens to show the Top 10 global players.
    *   "Loading..." state while fetching data from the remote database.
    *   Clear distinction between "Global Top 10" and "Your Local Best".
*   **Feedback:**
    *   Visual confirmation (e.g., "Score Uploaded!") or error handling (e.g., "Offline: Score saved locally").

## 4. Implementation Workflow

1.  **BaaS Setup:**
    *   Create a project in Supabase/Firebase.
    *   Configure a `leaderboard` table with public read access and restricted write access (basic security rules).
2.  **SDK Integration:**
    *   Add the necessary SDK scripts to `index.html`.
    *   Initialize the database client in the game's entry point.
3.  **Modular Logic (`UIManager.js` & `Game.js`):**
    *   **Fetch:** Implement `async getGlobalScores()` to retrieve the top 10 entries ordered by score descending.
    *   **Submit:** Implement `async submitScore(name, score, level)` to push new data to the database.
4.  **Fallback Mechanism:**
    *   If the database is unreachable, the game must gracefully fall back to `localStorage` to ensure the player's session isn't interrupted and their local best is still tracked.

## 5. Security & Anti-Cheat Measures
Client-side games are inherently vulnerable to score manipulation. We will implement basic mitigations:

*   **Score Sanity Check:** Calculate a "Max Possible Score" based on game duration and level. If a submitted score exceeds this, flag or reject it.
*   **Rate Limiting:** Prevent multiple submissions from the same IP within a short timeframe.
*   **Manual Moderation:** Use the BaaS dashboard to delete obviously fake or offensive names/scores.
*   **Obfuscation:** Minify the submission logic to deter casual tampering.

---

# Plan: PixiJS Integration

This document outlines the strategy for transitioning the manual HTML5 Canvas 2D rendering to **PixiJS** to improve performance, simplify effect management, and scale the game's visuals.

## 1. Goal
Replace the current `Renderer.js` and manual 2D context drawing with a PixiJS-based engine while maintaining the existing zero-build (ESM) architecture and neon aesthetic.

## 2. Setup & Initialization
- **CDN Integration:** Add PixiJS to `index.html` via a `<script type="module">` compatible CDN (e.g., [esm.run](https://esm.run/pixi.js) or [cdnjs](https://cdnjs.com/libraries/pixi.js)).
- **Application Setup:** Modify `Game.js` to initialize a `PIXI.Application`. The `app.view` will replace or be attached to the existing `.canvas-container`.
- **Layering:** Use `PIXI.Container` to organize the scene into layers:
    - `backgroundContainer` (Starfield)
    - `entityContainer` (Invaders, Player, Pods)
    - `projectileContainer` (Bullets, Missiles, Rockets)
    - `effectContainer` (Explosions, Lightning, PDC Tracers)
    - `uiContainer` (HUD, Debug Info)

## 3. Sprite & Texture Migration
- **Procedural Textures:** Refactor `SpriteManager.js` to use `PIXI.Graphics` for drawing the neon shapes, then use `app.renderer.generateTexture(graphics)` to create reusable `PIXI.Texture` objects.
- **Tinting & Effects:** Leverage PixiJS's `tint` property to handle the "darken on damage" effect, replacing manual `darkenColor` calculations.

## 4. Component Refactoring
- **`Player.js`, `EntityManager.js`:** 
    - Entities will now own a `PIXI.Sprite` or `PIXI.AnimatedSprite`.
    - Implement a `syncRender()` method for each entity to update its PixiJS object's `position`, `rotation`, `alpha`, and `visible` state based on game logic.
- **`Renderer.js`:** 
    - Transition from a manual `draw()` loop to managing the PixiJS Stage.
    - Handle screen shake using `stage.position` offsets.
- **`ParticleSystem.js`:** 
    - Use `PIXI.ParticleContainer` or a pool of `PIXI.Sprite` objects for high-performance explosions and effects.
- **`Starfield.js`:** 
    - Migrate to a pool of simple `PIXI.Graphics` (circles) or small textures.

## 5. UI & Interaction
- **HUD:** Re-implement `UIManager.drawHUD` using `PIXI.Text` objects within the `uiContainer`.
- **Overlays:** Retain the current HTML/CSS overlays (Start Screen, Boss Clear, Game Over) as they are already effective and decoupled from the game's rendering performance.

## 6. Implementation Workflow
1.  **Phase 1 (Setup):** Add PixiJS to `index.html` and initialize the `PIXI.Application` in `Game.js`.
2.  **Phase 2 (Sprites):** Update `SpriteManager.js` to generate PixiJS textures.
3.  **Phase 3 (Core Entities):** Migrate the Player and Invaders to use PixiJS Sprites.
4.  **Phase 4 (Projectiles & Effects):** Migrate Bullets, Rockets, and the Particle System.
5.  **Phase 5 (HUD & Cleanup):** Migrate the HUD and remove legacy `ctx` drawing code.
6.  **Phase 6 (Verification):** Run Playwright E2E tests and verify visual parity.

