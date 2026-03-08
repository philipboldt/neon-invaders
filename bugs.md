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

## 🐛 Reported Bugs
*(No active bugs reported)*
