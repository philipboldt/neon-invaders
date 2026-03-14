# Potential Improvements: Neon Nuke

This document tracks identified areas for future enhancement, UX refinement, and logic polishing.

## 🚀 Priority Improvements

### 1. Visual Effects
*   **Screen Transitions:** Add a smooth fade-to-black or "hyper-speed" starfield effect during level changes.
*   **Particle Variety:** Implement different particle shapes or behaviors based on the entity type destroyed.

### 2. Gameplay Tuning
*   **Difficulty Scaling:** Refine the invader speed and fire rate curves for a smoother difficulty increase.
*   **Boss Patterns:** Add more varied attack patterns for Level 10+ bosses.
*   **Stackable Pierce:** Allow players to collect multiple Pierce upgrades to increase the number of enemies a single fatal shot can pass through (e.g., Pierce Level 1 = 1 enemy, Level 2 = 2 enemies).

### 3. Input & Controls
*   **Gamepad Support:** Implement the standard Web Gamepad API for controller support.
*   **Key Customization:** Allow players to rebind keys.

### 4. Technical / Engine
*   **Physics Sub-stepping:** For even higher precision on high-refresh monitors (144Hz+), implement sub-stepping where logic runs multiple times per frame if the delta is large, rather than just scaling by a single delta factor.
*   **State Interpolation:** Decouple rendering from logic completely by interpolating between the "previous" and "current" physics state for ultra-smooth visuals.

---

## 🛠️ Implementation Notes
*   *(Level Progression Logic improvement completed: Level transition no longer waits for projectiles).*
