
/**
 * Enum representing the current state of a game instance.
 */
export enum GameStatus {
  MENU,
  PLAYING,
  GAME_OVER,
  WIN,
}

/**
 * Represents the state of the ball, including position, velocity, and special properties.
 */
export interface Ball {
  x: number;
  y: number;
  dx: number; // Horizontal velocity
  dy: number; // Vertical velocity
  radius: number;
  isPowerBall?: boolean; // Flag for when the Power Ball bonus is active
  powerBallTimer?: number; // Countdown timer for the Power Ball effect
}

/**
 * Represents the state of the paddle.
 */
export interface Paddle {
  x: number; // Left-most x-coordinate
  width: number;
  height: number;
}

/**
 * Represents a single breakable brick.
 */
export interface Brick {
  x: number;
  y: number;
  status: 1 | 0; // 1 for visible, 0 for broken
  isGolden?: boolean; // Flag for the special, high-risk/high-reward brick
}

/**
 * Represents a single particle for visual effects (e.g., explosions).
 */
export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  alpha: number; // Opacity
  life: number; // Remaining frames before disappearing
  color: string;
}

/**
 * Represents a piece of text that floats on the screen for a short duration (e.g., "JACKPOT!").
 */
export interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  life: number;
  initialLife: number; // Used to calculate alpha decay
  color: string;
}

/**
 * Represents a single star in the parallax background.
 */
export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
}

// --- AI Learning & Simulation Types ---

/**
 * Stores performance metrics for a specific opening strategy (i.e., which column to aim for first).
 */
export interface StrategyPerformance {
  avgTime: number; // Average time to complete a game (wins and losses)
  plays: number; // How many times this strategy has been tried
  wins: number; // How many times this strategy resulted in a win
}

/**
 * A shared data object that aggregates performance metrics across ALL game instances.
 * This represents the "collective knowledge" of the AI population.
 */
export interface AIStrategyData {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number; // Fastest win time across all games ever played
  strategyPerformance: Record<number, StrategyPerformance>; // Performance data for each opening strategy
  totalBricksDestroyed: number;
  totalJackpotsHit: number;
}

/**
 * Represents a single, independent AI agent and its game simulation.
 * This holds the agent's individual stats and learning parameters.
 */
export interface GameInstance {
    id: number;
    key: number; // A unique key used by React to force re-rendering of the Game component on reset.
    initialLives: number;
    strategy: number; // The column index for the opening strategy this agent will use.
    gamesPlayed: number;
    gamesWon: number;
    skillLevel: number; // The core metric of an agent's ability, affecting paddle speed, precision, and decision-making.
    careerProductivity: number; // A long-term average of productive vs. non-productive hits, representing decision quality.
    totalProductiveHits: number; // Bricks hit.
    totalNonProductiveHits: number; // Walls hit.
    totalWinTime: number; // Sum of durations for all wins, used to calculate average win time.
}