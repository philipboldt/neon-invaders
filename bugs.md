# Known Bugs: Neon Invaders

This document tracks identified bugs that need to be addressed.

## ✅ Fixed Bugs

### 1. Canvas Visibility
*   **Description:** The game frame/canvas is not always 100% visible in certain viewports.
*   **Fix:** Migrated to `100dvh` (Dynamic Viewport Height) in CSS to account for mobile browser bars.
*   **Status:** Resolved

### 2. UI Obstruction (Mobile)
*   **Description:** Play buttons and touch controls are partially or fully hidden behind the browser's bottom navigation bar.
*   **Fix:** Used `100dvh` for body height and `100%` for wrapper height, ensuring the entire UI stays within the visible area.
*   **Status:** Resolved

### 3. Border Scaling
*   **Description:** The game frame/border thickness was fixed at 2px and did not scale with the game world or high-resolution displays.
*   **Fix:** Centralized `UI_BORDER_THICKNESS` in constants and implemented dynamic scaling based on the game's `heightFactor` in `UIManager`.
*   **Status:** Resolved

## 🐛 Reported Bugs
*(No active bugs reported)*
