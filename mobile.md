# Mobile Optimization Plan: Neon Invaders (Portraitish)

Our goal is to transform the game from a fixed 4:3 landscape experience into a dynamic vertical shooter that scales elegantly for mobile devices in portrait orientation.

## 🎯 Core Strategy: The Dynamic Column
Instead of a fixed box, the game will use a **Fixed Logical Width (800 units)** and a **Variable Logical Height (600 - 1400 units)** based on the device's aspect ratio.

## 🕹️ Gameplay Balancing (The Challenge Compensation)
To prevent the game from becoming too easy on taller screens, we will implement the following:

### 1. Time-to-Impact Scaling (Rhythm Preservation)
*   **Concept:** Projectile speeds (bullets, missiles, rockets) will scale linearly with the logical height.
*   **Implementation:** `Speed = BaseSpeed * (CurrentHeight / 600)`.
*   **Result:** A bullet fired from the top will reach the bottom in the exact same time, regardless of screen length.

### 2. Faster Descent Scaling
*   **Concept:** The "drop down" distance (`INVADER_DROP_DOWN`) will increase on taller screens.
*   **Result:** The invaders "climb down the ladder" faster, maintaining the pressure of the landing-based Game Over condition.

### 3. Portrait-Friendly Grid Layout
*   **Concept:** Dynamically adjust the `INVADER_ROWS` and `INVADER_COLS` based on the aspect ratio.
*   **Layout Shift:**
    *   **Desktop (Landscape):** Standard 5x11 grid.
    *   **Mobile (Portrait):** Taller and narrower grid (e.g., ~9x6).
*   **Goal:** Keep the total number of enemies similar (~50-60) while ensuring they fit comfortably within the narrow 800-unit width without hitting the side margins immediately.

## 📱 User Interface & Ergonomics
*   **The "Safe Zone":** Position the player ship at a fixed distance from the *bottom* (`H - 80`).
*   **HUD Re-Anchoring:** Keep the HUD at the top, but ensure it scales correctly with the dynamic width.
*   **Touch Controls:** Ensure the touch buttons are positioned in a way that doesn't obstruct the player's view of the ship or incoming threats.

## 🛠️ Technical Implementation Steps
1.  **Remove Fixed Dimensions:** Strip `width="800" height="600"` from `index.html`.
2.  **CSS Update:** Change `.canvas-container` and `#game` to fill the available space while maintaining the logical coordinate system.
3.  **Dynamic Resize Listener:** Add a `resize` handler in `Game.js` to update `this.W` and `this.H` and reconfigure the PixiJS renderer.
4.  **Math Update:** Inject height-based multipliers into `EntityManager.js` and `WeaponManager.js`.
