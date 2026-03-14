# Game Canvas Stretch & Aspect Ratio Strategy

## The Core Concept: The Flexible Logical Canvas
The game engine operates on a "flexible but bounded" logical aspect ratio.
*   **Logical Width:** Strictly locked at `800`.
*   **Logical Height:** Flexible, but bounded between a minimum of `600` (4:3) and a maximum of `1200` (2:3).
*   **Scaling Factor:** The game's vertical scaling adjustments (like enemy drop distance) are calculated based purely on this internal logical height relative to the `600` baseline.

## Handling Different Device Screens

We handle physical screen dimensions by categorizing them into three scenarios:

### 1. The "Goldilocks" Zone (Aspect ratios between 4:3 and 2:3)
*   *Devices:* Older tablets, iPads, foldable inner screens.
*   *Behavior:* We set the internal logical height to match the screen's exact ratio. The canvas is stretched to fill the full physical width and height perfectly. No letterboxing, no wasted space.

### 2. Too Wide (Aspect ratios wider than 4:3)
*   *Devices:* Desktop monitors, laptops (e.g., 16:9).
*   *Behavior:* The screen is wider than our minimum ratio. We lock the logical dimensions to exactly `800x600`. We stretch the canvas visually to fill the available screen height, and use CSS to center it, creating black horizontal pillarboxes (black bars on the left and right).

### 3. Too Tall (Aspect ratios taller than 2:3)
*   *Devices:* Modern smartphones in portrait mode (e.g., 19.5:9).
*   *Behavior (The "Canvas in Canvas" / Viewport Approach):* 
    *   The screen demands a logical height greater than `1200`. We cap the game's internal logical height at `1200` to prevent gameplay balance issues (e.g., enemies taking too long to reach the player).
    *   **The Screen Canvas (Root App):** The main PixiJS application fills the entire physical screen width and height. The animated Starfield background and the touch control guide lines are rendered on this full-screen layer. Touch inputs are registered across this entire area.
    *   **The Game Canvas (Inner Viewport):** We create an internal PixiJS Container acting as an inner canvas. This container is locked to `800x1200`. 
    *   We center this inner container vertically on the screen.
    *   All gameplay elements (Player, Enemies, Bullets, HUD, Particles) are rendered inside this centered inner container. 
    *   Because the internal elements calculate their `Y=0` relative to the inner container, we don't have to rewrite any collision or position logic, while still visually stretching the game to the maximum horizontal width available and providing a beautiful full-screen background experience.
