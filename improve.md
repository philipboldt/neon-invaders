# Potential Improvements: Neon Invaders

This document tracks identified areas for future enhancement, UX refinement, and logic polishing.

## 🚀 Priority Improvements

### 1. Level Progression Logic
*   **Faster Transitions:** The level end condition should no longer wait for player bullets (`this.bullets.length === 0`) to clear the screen. 
*   **Goal:** Once all invaders and their threats (bombs/missiles) are gone, the level should advance immediately, even if the player just fired a celebratory shot.

### 2. Visual Effects
*   **Screen Transitions:** Add a smooth fade-to-black or "hyper-speed" starfield effect during level changes.
*   **Particle Variety:** Implement different particle shapes or behaviors based on the entity type destroyed.

### 3. Gameplay Tuning
*   **Difficulty Scaling:** Refine the invader speed and fire rate curves for a smoother difficulty increase.
*   **Boss Patterns:** Add more varied attack patterns for Level 10+ bosses.

### 4. Input & Controls
*   **Gamepad Support:** Implement the standard Web Gamepad API for controller support.
*   **Key Customization:** Allow players to rebind keys.

---

## 🛠️ Implementation Notes
*   **For Item 1:** Modify the `noPlayerBullets` check in `Game.js` loop to be ignored during the transition calculation.
