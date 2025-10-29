
// --- Canvas & Game Dimensions ---
// These define the core size of the game area. They are kept small to allow
// multiple simulations to be viewed on a single screen without performance issues.
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 300;

// --- Paddle ---
// Defines the player-controlled (or AI-controlled) paddle's properties.
export const PADDLE_WIDTH = 60;
export const PADDLE_HEIGHT = 8;
export const PADDLE_Y_OFFSET = 15; // Distance from the bottom of the canvas.

// --- Ball ---
// Governs the ball's physical properties and behavior. This is the core of the game's physics.
export const BALL_RADIUS = 5;
export const BALL_SPEED_X = 6; // Initial horizontal speed.
export const BALL_SPEED_Y = -6; // Initial vertical speed (negative is up).
export const MIN_BALL_SPEED = 4; // Minimum overall speed to prevent the game from stalling.
export const MAX_BALL_SPEED = 10; // Maximum overall speed to keep the game playable.
export const PADDLE_SPIN_FACTOR = 4; // Multiplier for how much the ball's horizontal direction changes based on where it hits the paddle.
export const PADDLE_VELOCITY_SPIN_FACTOR = 0.3; // Multiplier for how much the paddle's own movement speed affects the ball's spin.
export const PADDLE_EDGE_BOOST = 2.5; // Extra spin multiplier for hitting the ball with the very edge of the paddle, creating a "flick shot".
export const PADDLE_FLICK_SPEED_BONUS = 1.1; // Speed multiplier for a successful flick shot, making it more powerful.
export const BALL_FRICTION = 0.9995; // A slight drag effect that very gradually slows the ball down over time.


// --- Bricks ---
// Defines the grid layout and properties of the breakable bricks.
export const BRICK_ROW_COUNT = 5;
export const BRICK_COLUMN_COUNT = 9;
export const BRICK_WIDTH = 36;
export const BRICK_HEIGHT = 10;
export const BRICK_PADDING = 5; // Space between bricks.
export const BRICK_OFFSET_TOP = 20; // Space from the top of the canvas.
export const BRICK_OFFSET_LEFT = 18; // Space from the left of the canvas.

// --- Level Layouts ---
// A collection of predefined 2D arrays representing different brick formations.
// 1 = brick, 0 = no brick.
export const LEVEL_LAYOUTS = [
  // Layout 1: Classic Solid Wall
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Layout 2: Pyramid
  [
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Layout 3: Gaps
  [
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
  ],
    // Layout 4: Fortress
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 0, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Layout 5: Sparse
  [
    [1, 0, 1, 0, 1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0, 1],
  ],
];

// --- Game Logic ---
// Core rules and values that define the game's state and progression.
export const INITIAL_LIVES = 3;
export const POINTS_PER_BRICK = 10;
export const LOSS_PENALTY_SECONDS = 120; // Time added to a game's duration upon a loss. This heavily penalizes failing strategies in the AI's learning algorithm.
export const GOLDEN_BRICK_ROULETTE_CHANCES = {
  JACKPOT: 0.25, // 25% chance to clear the entire row.
  POWER_BALL: 0.35, // 35% chance to activate the Power Ball.
  DUD: 0.4, // 40% chance for a negative outcome (e.g., max ball speed).
};
export const POWER_BALL_DURATION = 240; // Duration of the Power Ball effect in frames (4 seconds at 60fps).


// --- Simulation ---
// Constants related to the multi-agent simulation environment.
export const SIMULATION_GAME_COUNT = 6; // The number of game instances to run in parallel.
export const EXPLORATION_CHANCE = 0.25; // 25% chance for an AI agent to try a random opening strategy instead of an exploited one.


// --- AI ---
// Parameters that tune the AI's behavior, from basic movement to complex strategic decision-making.
export const AI_PADDLE_EASING = 0.4; // Controls how smoothly the AI paddle moves towards its target. A lower value is smoother, a higher value is more responsive.
export const AI_PADDLE_JITTER_AMOUNT = 4; // Max pixels of random offset applied to the paddle's target just before a hit, to introduce slight variations in shots.
export const AI_STUCK_FRAMES_THRESHOLD = 180; // Number of frames without a brick break before the AI considers the ball "stuck" in a loop (~3 seconds at 60fps).
export const AI_POWER_SHOT_MULTIPLIER = 7; // Increased spin factor when the AI decides to make an aggressive "power shot".
export const AI_SHARP_ANGLE_OFFSET = 1.9; // A factor used in calculating very sharp, angled shots.
export const AI_PADDLE_DEFENSIVE_OFFSET = 0.6; // How far off-center (as a % of half-width) the AI aims to hit the ball for a default defensive return.
export const AI_END_GAME_BRICK_COUNT = 3; // The number of bricks remaining that triggers the AI's "end-game" or "finisher" logic.
export const AI_RECOVERY_FRAMES = 90; // Number of frames the AI will wait and play defensively after detecting and recovering from a stuck loop (~1.5s).
export const AI_LOOP_DETECTION_HISTORY_LENGTH = 60; // How many past ball positions to store to detect a loop (1 second at 60fps).
export const AI_LOOP_DETECTION_BOX_SIZE = BALL_RADIUS * 6; // If the ball hasn't moved outside a bounding box of this size within the history, it's considered stuck.
export const AI_STRATEGIC_PLANNING_THRESHOLD_Y = CANVAS_HEIGHT * 0.75; // The ball must be above this Y-coordinate for the AI to run its shot simulation and planning logic.
export const AI_SIMULATION_DEPTH = 4; // The maximum number of bounces the AI will simulate for a single potential shot.
export const AI_SIMULATION_ANGLES = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9]; // The normalized paddle impact points (-1 to 1) that the AI will test in its simulations.


// --- AI Learning ---
// Constants governing the agent's learning, skill progression, and evolution within the collective.
export const INITIAL_SKILL_LEVEL = 1.0; // The starting skill level for all new agents.
export const SKILL_INCREASE_ON_WIN = 0.1; // The base amount skill increases on a win, which is then multiplied by the game's productivity score.
export const SKILL_DECREASE_ON_LOSS = 0.03; // The base amount skill decreases on a loss.
export const SKILL_INHERITANCE_CHANCE = 0.15; // The base chance (15%) for a losing agent to inherit the skill level of the current champion.
export const MIN_SKILL_LEVEL = 0.7; // The floor for an agent's skill level.
export const MAX_SKILL_LEVEL = 2.0; // The ceiling for an agent's skill level.
export const CAREER_PRODUCTIVITY_INHERITANCE_THRESHOLD = 30; // If an agent's long-term productivity drops below this percentage, its chance of inheriting skill is boosted.
export const SKILL_INHERITANCE_CHANCE_BOOST_FACTOR = 3; // The multiplier for the inheritance chance for underperforming agents.


// --- Visual Effects ---
// Parameters for all the eye-candy: particles, glows, trails, and screen effects.
export const PARTICLE_COUNT = 15; // Number of particles in a standard brick explosion.
export const PARTICLE_LIFESPAN = 40; // Lifespan of particles in frames.
export const PARTICLE_SPEED = 2; // Initial speed of particles.
export const PARTICLE_FRICTION = 0.96; // Slowdown factor for particles.
export const BALL_TRAIL_LENGTH = 5; // Number of frames for the ball's motion trail.
export const BALL_TRAIL_OPACITY = 0.08;
export const PADDLE_TRAIL_LENGTH = 10; // Number of frames for the paddle's motion trail.
export const PADDLE_TRAIL_OPACITY = 0.15;
export const BALL_GLOW_COLOR = 'rgba(255, 255, 255, 0.5)';
export const BALL_GLOW_SIZE = 10; // Blur radius for the ball's glow effect.
export const PADDLE_GLOW_COLOR = 'rgba(236, 72, 153, 0.4)';
export const PADDLE_GLOW_SIZE = 15; // Blur radius for the paddle's glow effect.
export const SCREEN_SHAKE_INTENSITY = 2; // Max pixel offset for screen shake.
export const SCREEN_SHAKE_DURATION = 6; // Duration of screen shake in frames.
export const IMPACT_FLASH_DURATION = 5; // Duration of the white border flash on impact.
export const IMPACT_FLASH_GRADIENT_SPREAD = 15; // Max width of the gradient glow from the borders.
export const FLOATING_TEXT_LIFESPAN = 50; // Lifespan of floating text like "JACKPOT!" in frames.
export const FLOATING_TEXT_SPEED = 0.8; // Upward speed of floating text.
export const LAST_BRICK_GLOW_COLOR = 'rgba(255, 255, 255, 0.8)'; // Special glow for the last few bricks.
export const STAR_COUNT = 100; // Number of stars in the background parallax effect.


// --- Colors ---
// Centralized color palette for the game's UI and elements.
export const BRICK_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
export const PADDLE_COLOR = "#ec4899";
export const BALL_COLOR = "#f4f4f5";
export const FONT_COLOR = "#a1a1aa";
export const BG_COLOR = "#18181b";
export const GOLDEN_BRICK_COLOR = "#facc15";
export const GOLDEN_BRICK_GLOW_COLOR = "rgba(250, 204, 21, 0.7)";


// --- UI / Visualization ---
// Colors used specifically for data visualization and UI elements, like the strategy indicators.
export const STRATEGY_COLORS = [
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#eab308", // yellow-500
  "#f97316", // orange-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
  "#14b8a6", // teal-500
  "#64748b", // slate-500
];