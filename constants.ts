


// --- Canvas & Game Dimensions ---
// Reduced for simulation view
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 300;

// --- Paddle ---
export const PADDLE_WIDTH = 60;
export const PADDLE_HEIGHT = 8;
export const PADDLE_Y_OFFSET = 15; // Distance from the bottom

// --- Ball ---
export const BALL_RADIUS = 5;
export const BALL_SPEED_X = 6;
export const BALL_SPEED_Y = -6;
export const MIN_BALL_SPEED = 4;
export const MAX_BALL_SPEED = 10;
export const PADDLE_SPIN_FACTOR = 4; // Multiplier for ball's dx change on paddle hit
export const PADDLE_VELOCITY_SPIN_FACTOR = 0.3; // Multiplier for paddle's velocity affecting spin
export const PADDLE_EDGE_BOOST = 2.5; // Extra spin multiplier for hitting with the paddle's edge
export const PADDLE_FLICK_SPEED_BONUS = 1.1; // Speed multiplier for a successful flick shot
export const BALL_FRICTION = 0.9995; // Slows the ball down over time


// --- Bricks ---
export const BRICK_ROW_COUNT = 5;
export const BRICK_COLUMN_COUNT = 9;
export const BRICK_WIDTH = 36;
export const BRICK_HEIGHT = 10;
export const BRICK_PADDING = 5;
export const BRICK_OFFSET_TOP = 20;
export const BRICK_OFFSET_LEFT = 18;

// --- Level Layouts ---
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
export const INITIAL_LIVES = 3;
export const POINTS_PER_BRICK = 10;
export const LOSS_PENALTY_SECONDS = 120; // Time added to a loss to penalize failing strategies
export const GOLDEN_BRICK_ROULETTE_CHANCES = {
  JACKPOT: 0.25, // 25%
  POWER_BALL: 0.35, // 35%
  DUD: 0.4, // 40%
};
export const POWER_BALL_DURATION = 240; // 4 seconds at 60fps


// --- Simulation ---
export const SIMULATION_GAME_COUNT = 6;
export const EXPLORATION_CHANCE = 0.25; // 25% chance to try a random strategy


// --- AI ---
export const AI_PADDLE_EASING = 0.4;
export const AI_PADDLE_JITTER_AMOUNT = 4; // Max pixels of random offset before a hit, for uniqueness.
export const AI_STUCK_FRAMES_THRESHOLD = 180; // ~3 seconds at 60fps
export const AI_POWER_SHOT_MULTIPLIER = 7;
export const AI_SHARP_ANGLE_OFFSET = 1.9;
export const AI_PADDLE_DEFENSIVE_OFFSET = 0.6; // How far off-center (as % of half-width) to hit the ball for a default defensive shot
export const AI_END_GAME_BRICK_COUNT = 3; // Bricks remaining to trigger end-game logic
export const AI_RECOVERY_FRAMES = 90; // Frames to wait after being unstuck (~1.5s)
export const AI_LOOP_DETECTION_HISTORY_LENGTH = 60; // 1 second at 60fps
export const AI_LOOP_DETECTION_BOX_SIZE = BALL_RADIUS * 6; // If ball hasn't moved outside this box, it's stuck
export const AI_STRATEGIC_PLANNING_THRESHOLD_Y = CANVAS_HEIGHT * 0.75; // Ball must be above this line to trigger planning
export const AI_SIMULATION_DEPTH = 4; // Max bounces to simulate for a strategic shot
export const AI_SIMULATION_ANGLES = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9]; // Normalized paddle impact points to test


// --- AI Learning ---
export const INITIAL_SKILL_LEVEL = 1.0;
export const SKILL_INCREASE_ON_WIN = 0.1; // Base increase, will be multiplied by productivity
export const SKILL_DECREASE_ON_LOSS = 0.03;
export const SKILL_INHERITANCE_CHANCE = 0.15; // 15% chance to inherit champion's skill on reset
export const MIN_SKILL_LEVEL = 0.7;
export const MAX_SKILL_LEVEL = 2.0;
export const CAREER_PRODUCTIVITY_INHERITANCE_THRESHOLD = 30; // Below this % CP, inheritance chance is boosted
export const SKILL_INHERITANCE_CHANCE_BOOST_FACTOR = 3; // Multiplier for inheritance chance for underperforming agents


// --- Visual Effects ---
export const PARTICLE_COUNT = 15;
export const PARTICLE_LIFESPAN = 40; // in frames
export const PARTICLE_SPEED = 2;
export const PARTICLE_FRICTION = 0.96;
export const BALL_TRAIL_LENGTH = 5;
export const BALL_TRAIL_OPACITY = 0.08;
export const PADDLE_TRAIL_LENGTH = 10;
export const PADDLE_TRAIL_OPACITY = 0.15;
export const BALL_GLOW_COLOR = 'rgba(255, 255, 255, 0.5)';
export const BALL_GLOW_SIZE = 10;
export const PADDLE_GLOW_COLOR = 'rgba(236, 72, 153, 0.4)';
export const PADDLE_GLOW_SIZE = 15;
export const SCREEN_SHAKE_INTENSITY = 2;
export const SCREEN_SHAKE_DURATION = 6; // in frames
export const IMPACT_FLASH_DURATION = 5; // in frames
export const IMPACT_FLASH_GRADIENT_SPREAD = 15; // max width of the gradient glow from the borders
export const FLOATING_TEXT_LIFESPAN = 50; // in frames
export const FLOATING_TEXT_SPEED = 0.8;
export const LAST_BRICK_GLOW_COLOR = 'rgba(255, 255, 255, 0.8)';
export const STAR_COUNT = 100;


// --- Colors ---
export const BRICK_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
export const PADDLE_COLOR = "#ec4899";
export const BALL_COLOR = "#f4f4f5";
export const FONT_COLOR = "#a1a1aa";
export const BG_COLOR = "#18181b";
export const GOLDEN_BRICK_COLOR = "#facc15";
export const GOLDEN_BRICK_GLOW_COLOR = "rgba(250, 204, 21, 0.7)";


// --- UI / Visualization ---
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