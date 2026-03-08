# Game Canvas Resize & Aspect Ratio System

The game uses a hybrid approach to handle different aspect ratios (especially for mobile portrait vs. desktop landscape), keeping the horizontal coordinate logic consistent across all devices while scaling the vertical height.

## 1. The Core Concept: Fixed Logical Width, Dynamic Logical Height

*   **Logical Width (`this.W`)** is always strictly locked to **800** (`LOGICAL_WIDTH`).
*   **Logical Height (`this.H`)** is flexible. The baseline minimum is **600** (`LOGICAL_HEIGHT_MIN` - creating a base 4:3 ratio), but it can stretch up to **1400** (`LOGICAL_HEIGHT_MAX`) depending on how "tall" the screen is.

## 2. How `updateDimensions()` calculates the sizing (`src/Game.js`)

When the game initializes or the window resizes, it checks the available width (`availW`) and height (`availH`) of the parent container:

*   **Portrait / Tall Screens (Screen ratio is taller than 4:3):**
    *   The game calculates how tall the internal logical resolution needs to be to match the screen's aspect ratio (`800 * (availH / availW)`).
    *   This dynamic logical height is clamped between 600 and 1400.
    *   The canvas is styled via CSS (`canvas.style.width` and `height`) to completely fill the available pixel space of the screen.
    *   *Effect:* You see more space vertically. The player remains pinned to the bottom (via `this.H - PLAYER_Y_OFFSET`).

*   **Landscape / Wide Screens (Screen ratio is wider than or equal to 4:3):**
    *   The logical height is locked to the baseline **600**. The internal resolution stays at exactly 800x600.
    *   The physical canvas is scaled visually. Its height fills the available height (`availH`), and its width is calculated to maintain the strict 4:3 ratio (`availH * (4/3)`).
    *   CSS rules in `style.css` (the `@media (orientation: landscape)` block) also enforce a max-height and aspect-ratio to keep it centered on the screen like a classic arcade cabinet.

## 3. Scaling Game Elements vertically (`this.heightFactor`)

Because the logical height can change (e.g., it might be 1000 instead of 600 on a phone), the system calculates a `heightFactor` (`this.H / LOGICAL_HEIGHT_MIN`). This is used in places like the `ParticleSystem` to scale vertical movement appropriately so that things feel consistent regardless of how stretched the canvas is.

## 4. Handling Window Resizes

When the `resize` event fires, `handleResize()` is triggered:
*   It updates the internal PixiJS renderer to the new logical bounds (`this.W`, `this.H`).
*   It manually repositions the player so they don't get left behind if the screen gets taller/shorter.
*   It updates the `starfield` bounds.
*   It calls `this.ui.updateLayout(this)` so all the UI elements (HUD, Start Screen, Name Entry) can reposition themselves based on the newly calculated `this.H`.

## Summary
The game simulates a fixed-width `800` space where it dynamically increases the vertical bounds (`600` to `1400`) to fill tall mobile screens, whilst treating landscape mode as a classic 4:3 arcade box in the center of the screen.
