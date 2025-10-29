# Arkanoid AI Mission Control

**A sophisticated simulation where a collective of AI agents learn, compete, and evolve psychological traits to master the game of Arkanoid.**

This project transcends a simple brick-breaker game. It is a parallel training gym where multiple AI agents play simultaneously, learning from their successes and failures. The Mission Control dashboard provides a high-level overview of the AI collective, ranking them in real-time and showcasing the emergence of complex, intelligent, and surprisingly "human" behaviors.

Built with React, TypeScript, and the Canvas API.

Check it out on google AI Studio [Watch Arkonoid Game Simulation Online](https://ai.studio/apps/drive/1sAgyzJYTI6KVC3POi2sZBucof2IQMLNG)

---

## Core Achievements & Key Concepts

The simulation is designed to explore machine learning concepts in a competitive environment. Here are the key pillars of the AI's intelligence:

### 1. The AI Collective & Competitive Evolution

Instead of a single AI, we run a collective of agents in parallel. This creates a competitive ecosystem where:

-   **Real-time Ranking:** Agents are continuously ranked based on their **Efficiency** (Wins per Second), a metric that rewards both victory and speed. The top-ranked agent is designated the "Champion."
-   **Skill Inheritance:** To accelerate learning across the entire population, underperforming agents have a chance to "inherit" the `skillLevel` of the current Champion. This prevents stagnation and rapidly elevates the collective's baseline performance. Low `careerProductivity` significantly boosts this chance, acting as a powerful catch-up mechanism.

### 2. Advanced Tactical Intelligence

The AI's decision-making goes far beyond simple reaction. It operates on multiple tactical layers.

-   **Defensive Baseline:** At its core, the AI performs flawless real-time physics calculations to predict the ball's trajectory and determine the optimal defensive paddle position.
-   **Strategic Planning:** The AI is a proactive planner. When the ball is in the upper half of the screen, it runs dozens of micro-simulations, projecting multiple potential shots at various angles. It visualizes these paths on-screen (faint white/pink lines) and selects the one that yields the highest score (i.e., breaks the most bricks).
-   **"Finisher" Instinct:** When only a few bricks remain, the AI enters a hyper-aggressive "Finisher" mode. Its logic narrows to pure offense, prioritizing ending the game quickly and decisively.
-   **Stagnation Protocol (Loop Detection):** The AI maintains a short-term memory of the ball's position. If it detects the ball is trapped in a repetitive, non-productive loop, it flags the situation as "stuck," overrides its standard logic, and executes a sharp "flick shot" to break the pattern.

### 3. Emergent Psychological Modeling

This is the most fascinating aspect of the simulation. Agents develop distinct "personalities" and psychological states based on their rank and current game situation. This makes their behavior less predictable and more dramatic.

-   **🏆 Champion's Caution (Rank #1):** The top-ranked agent plays to protect its lead. It is highly risk-averse, focusing on flawless defense and high-probability shots. It will almost always ignore the high-risk "Golden Brick," viewing it as an unnecessary gamble.
-   **🔥 Underdog's "Gold Fever" (Last Rank):** An agent in last place becomes desperate. It develops "Gold Fever"—an obsession with the Golden Brick. It will override its defensive logic to take risky, aggressive shots at this target, seeing it as its only path to a comeback.
-   **Confidence & Grit:** Each agent has an internal **Confidence** metric (`dynamicAggressionFactor`) that rises with successful brick hits and falls with wall bounces. This value directly influences its willingness to attempt a difficult offensive shot over a safe defensive one. In certain situations, like having low lives but high score potential, an agent can enter a "Grit" mode, boosting its confidence to attempt a comeback.

### 4. High-Risk, High-Reward Mechanics

To test the AI's risk-management and decision-making, we introduced the **Golden Brick**.

-   At the start of each match, one random brick is designated as "golden."
-   Hitting it triggers a roulette of powerful outcomes:
    -   **Jackpot:** Instantly clears the entire row of bricks.
    -   **Power Ball:** Temporarily makes the ball larger and able to break bricks without bouncing.
    -   **Dud:** Dangerously increases the ball's speed to the maximum limit.
-   This single mechanic serves as a catalyst for the AI's psychological drama, forcing a choice between a safe play and a game-changing gamble.

---

## What to Observe in the Simulation

Look for these visual cues on the dashboard and within each game instance to understand the AI's thought process.

#### On the Mission Control Dashboard:

-   **The Leaderboard:** Watch how the ranks shift over time. Can an underdog with "Gold Fever" successfully gamble and climb the ranks? Does the Champion's cautious strategy keep it on top?
-   **Agent Cards:**
    -   **Efficiency (W/s):** The primary metric for ranking. Who wins the fastest?
    -   **Career Prod.:** A measure of long-term decision quality. Is the agent making smart hits?
    -   **Skill Level:** The raw measure of the agent's refined abilities. Watch it increase after productive wins.

#### Inside Each Game Canvas:

-   **🧠 Strategic Paths:** The faint trajectory lines projected from the paddle show the AI's active planning. A bright pink line indicates the chosen "best" path.
-   **🎯 Targeting Glow:** A soft glow on a brick indicates it is the AI's current offensive target. Watch how this changes based on its strategic goals.
-   **❤️ Psychological State Indicator:** An emoji next to the agent's ID in the bottom-left HUD reveals its current mindset:
    -   `🏆`: **Champion's Focus** - Risk-averse, protecting the lead.
    -   `🔥`: **Underdog's Gamble** - Desperate, high-risk "Gold Fever".
    -   `🎯`: **Finisher Mode** - Hyper-aggressive, closing out the game.
    -   `💪`: **Grit** - Attempting a comeback through pure confidence.
    -   `😰`: **Clutch** - On its last life, playing under extreme pressure.
-   **📊 Confidence Bar:** The small horizontal bar in the bottom-right HUD visually represents the AI's current confidence. It fills and empties based on performance and changes color to reflect its psychological state, providing a direct window into its willingness to take risks.
-   **❗ Floating Text:** On-screen text like `"LOOP DETECTED"` or `"JACKPOT!"` gives you real-time insight into key events and AI interventions.

---

## A Collaborative Creation

This project was a fun and collaborative effort between a passionate user and a world-class AI frontend engineer. It was a pleasure to build and learn together!

Thumbs up, hugs, and kisses! Here's to the next game! 🚀
