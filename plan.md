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
