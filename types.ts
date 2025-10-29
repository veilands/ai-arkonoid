


export enum GameStatus {
  MENU,
  PLAYING,
  GAME_OVER,
  WIN,
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  isPowerBall?: boolean;
  powerBallTimer?: number;
}

export interface Paddle {
  x: number;
  width: number;
  height: number;
}

export interface Brick {
  x: number;
  y: number;
  status: 1 | 0; // 1 for visible, 0 for broken
  isGolden?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  alpha: number;
  life: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  life: number;
  initialLife: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
}

// --- AI Learning & Simulation Types ---

export interface StrategyPerformance {
  avgTime: number;
  plays: number;
  wins: number;
}

export interface AIStrategyData {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number;
  strategyPerformance: Record<number, StrategyPerformance>;
  totalBricksDestroyed: number;
  totalJackpotsHit: number;
}

export interface GameInstance {
    id: number;
    key: number; // For React re-rendering
    initialLives: number;
    strategy: number; // The column index for the opening strategy
    gamesPlayed: number;
    gamesWon: number;
    skillLevel: number;
    careerProductivity: number; // long-term average
    totalProductiveHits: number;
    totalNonProductiveHits: number;
    totalWinTime: number;
}