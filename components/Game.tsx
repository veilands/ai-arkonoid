import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, Paddle, Brick, Particle, FloatingText, AIStrategyData, Star } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y_OFFSET,
  BALL_RADIUS,
  BALL_SPEED_X,
  BALL_SPEED_Y,
  MIN_BALL_SPEED,
  MAX_BALL_SPEED,
  PADDLE_SPIN_FACTOR,
  PADDLE_VELOCITY_SPIN_FACTOR,
  PADDLE_EDGE_BOOST,
  PADDLE_FLICK_SPEED_BONUS,
  BALL_FRICTION,
  BRICK_ROW_COUNT,
  BRICK_COLUMN_COUNT,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_PADDING,
  BRICK_OFFSET_TOP,
  BRICK_OFFSET_LEFT,
  POINTS_PER_BRICK,
  BRICK_COLORS,
  PADDLE_COLOR,
  BALL_COLOR,
  FONT_COLOR,
  BG_COLOR,
  LEVEL_LAYOUTS,
  GOLDEN_BRICK_ROULETTE_CHANCES,
  POWER_BALL_DURATION,
  AI_PADDLE_EASING,
  AI_PADDLE_JITTER_AMOUNT,
  AI_STUCK_FRAMES_THRESHOLD,
  AI_POWER_SHOT_MULTIPLIER,
  AI_SHARP_ANGLE_OFFSET,
  AI_PADDLE_DEFENSIVE_OFFSET,
  AI_END_GAME_BRICK_COUNT,
  AI_RECOVERY_FRAMES,
  AI_LOOP_DETECTION_HISTORY_LENGTH,
  AI_LOOP_DETECTION_BOX_SIZE,
  AI_STRATEGIC_PLANNING_THRESHOLD_Y,
  AI_SIMULATION_DEPTH,
  AI_SIMULATION_ANGLES,
  PARTICLE_COUNT,
  PARTICLE_LIFESPAN,
  PARTICLE_SPEED,
  PARTICLE_FRICTION,
  BALL_TRAIL_LENGTH,
  BALL_TRAIL_OPACITY,
  PADDLE_TRAIL_LENGTH,
  PADDLE_TRAIL_OPACITY,
  BALL_GLOW_COLOR,
  BALL_GLOW_SIZE,
  PADDLE_GLOW_COLOR,
  PADDLE_GLOW_SIZE,
  SCREEN_SHAKE_INTENSITY,
  SCREEN_SHAKE_DURATION,
  IMPACT_FLASH_DURATION,
  IMPACT_FLASH_GRADIENT_SPREAD,
  FLOATING_TEXT_LIFESPAN,
  FLOATING_TEXT_SPEED,
  LAST_BRICK_GLOW_COLOR,
  GOLDEN_BRICK_COLOR,
  GOLDEN_BRICK_GLOW_COLOR,
  STAR_COUNT,
} from '../constants';

interface GameProps {
  instanceId: number;
  initialStrategy: number;
  onGameEnd: (
      instanceId: number, 
      result: 'win' | 'loss', 
      score: number, 
      time: number, 
      strategy: number, 
      remainingLives: number, 
      productivity: number,
      productiveHits: number,
      nonProductiveHits: number,
      jackpotsHit: number,
  ) => void;
  initialLives: number;
  initialSkillLevel: number;
  careerProductivity: number;
  isActive?: boolean;
  isAIEnabled: boolean;
  gamesPlayed: number;
  rank: number;
  totalInstances: number;
  sharedAIData: AIStrategyData;
  efficiency: number;
  averageWinTime: number;
  className?: string;
}

interface SimulatedPath {
    path: { x: number; y: number }[];
    hits: Brick[];
    score: number;
    requiredPaddleCenter: number;
}

/**
 * The core Game component. It encapsulates the entire game logic, rendering,
 * and AI decision-making for a single instance of Arkanoid.
 * It's a self-contained simulation that reports its results back to the App component.
 */
const Game: React.FC<GameProps> = ({ 
    instanceId, initialStrategy, onGameEnd, initialLives, initialSkillLevel, 
    careerProductivity, isActive = false, isAIEnabled, gamesPlayed, rank, 
    totalInstances, sharedAIData, efficiency, averageWinTime, className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // State flags for triggering win/loss animations or logic.
  const [isWinning, setIsWinning] = useState(false);
  const [isLosing, setIsLosing] = useState(false);


  // --- Core Game State Refs ---
  // Using refs is crucial here for performance. It allows us to mutate these values
  // within the requestAnimationFrame loop without causing React to re-render the
  // entire component on every frame.
  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_RADIUS,
    dx: BALL_SPEED_X,
    dy: BALL_SPEED_Y,
    radius: BALL_RADIUS,
    isPowerBall: false,
    powerBallTimer: 0,
  });

  const paddleRef = useRef<Paddle>({
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  });
  
  const prevPaddleXRef = useRef((CANVAS_WIDTH - PADDLE_WIDTH) / 2); // For calculating paddle velocity
  const paddleVelocityRef = useRef(0);

  const bricksRef = useRef<Brick[][]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(initialLives);
  const isPowerShotModeRef = useRef(false); // AI flag for an aggressive shot
  
  // --- Visual Effects State Refs ---
  const particlesRef = useRef<Particle[]>([]);
  const ballTrailRef = useRef<{ x: number, y: number }[]>([]);
  const paddleTrailRef = useRef<{ x: number, width: number }[]>([]);
  const screenShakeRef = useRef({ intensity: 0, duration: 0 });
  const flashFrameCounterRef = useRef(0); // For wall impact flash
  const flickShotEffectRef = useRef(0); // Timer for flick shot visual
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const finisherShotPathRef = useRef<{from: {x: number, y: number}, to: {x: number, y: number}} | null>(null);
  const starsRef = useRef<Star[]>([]);

  // --- AI & Game Logic State Refs ---
  const frameCounterRef = useRef(0);
  const lastBrickBreakFrameRef = useRef(0); // For detecting if the ball is stuck
  const gameStartTimeRef = useRef<number>(0);
  const ballPositionHistoryRef = useRef<{ x: number, y: number }[]>([]); // For loop detection
  const recoveringFromStuckCounterRef = useRef(0); // Cooldown timer after breaking a loop
  const isStuckRef = useRef(false);
  const productiveHitsRef = useRef(0); // Hits that break a brick
  const nonProductiveHitsRef = useRef(0); // Hits against walls/ceiling
  const dynamicAggressionFactorRef = useRef(1.0); // The AI's "confidence" metric
  const currentTargetBrickRef = useRef<Brick | null>(null); // The brick the AI is currently aiming for
  const strategicPlanRef = useRef<{ paths: SimulatedPath[], bestPathIndex: number } | null>(null); // Stores results of AI shot simulations
  const jackpotsThisGameRef = useRef(0);
  
  /**
   * Initializes the starfield background.
   */
  const createStars = useCallback(() => {
    const newStars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        newStars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            radius: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.4 + 0.1,
            speed: Math.random() * 0.25 + 0.1,
        });
    }
    starsRef.current = newStars;
  }, []);

  /**
   * Creates the brick layout for a new game.
   * It selects a random layout and designates one random brick as "golden".
   */
  const createBricks = useCallback(() => {
    const layout = LEVEL_LAYOUTS[Math.floor(Math.random() * LEVEL_LAYOUTS.length)];
    const newBricks: Brick[][] = [];
    const availableBricks: {c: number, r: number}[] = [];

    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      newBricks[c] = [];
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        const hasBrick = layout[r]?.[c] === 1;
        newBricks[c][r] = { x: 0, y: 0, status: hasBrick ? 1 : 0 };
        if (hasBrick) {
          availableBricks.push({c, r});
        }
      }
    }

    if (availableBricks.length > 0) {
      const goldenIndex = Math.floor(Math.random() * availableBricks.length);
      const {c, r} = availableBricks[goldenIndex];
      newBricks[c][r].isGolden = true;
    }

    bricksRef.current = newBricks;
  }, []);
  
  /**
   * Resets the ball and paddle to their starting positions.
   * Called when a life is lost or a new game starts.
   */
  const resetBallAndPaddle = useCallback(() => {
    ballRef.current.x = CANVAS_WIDTH / 2;
    ballRef.current.y = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_RADIUS;
    ballRef.current.dx = BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1);
    ballRef.current.dy = BALL_SPEED_Y;
    ballRef.current.isPowerBall = false;
    ballRef.current.powerBallTimer = 0;
    paddleRef.current.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    ballTrailRef.current = [];
    paddleTrailRef.current = [];
  }, []);

  /**
   * Spawns a particle explosion at a given location.
   * Used for brick breaks and other effects.
   */
  const createParticleExplosion = (x: number, y: number, color: string, count: number, speed: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed;
      particlesRef.current.push({
        x,
        y,
        dx: Math.cos(angle) * velocity,
        dy: Math.sin(angle) * velocity,
        radius: Math.random() * 2 + 1,
        alpha: 1,
        life: PARTICLE_LIFESPAN,
        color: color,
      });
    }
  };
  
  /**
   * Triggers all visual effects associated with a brick breaking.
   */
  const triggerBrickBreakEffects = (brick: Brick) => {
    const color = brick.isGolden ? GOLDEN_BRICK_COLOR : BRICK_COLORS[Math.floor(brick.y / (BRICK_HEIGHT + BRICK_PADDING)) % BRICK_COLORS.length];
    createParticleExplosion(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2, color, PARTICLE_COUNT / (brick.isGolden ? 0.5 : 2), PARTICLE_SPEED * (brick.isGolden ? 1.5 : 1));
    screenShakeRef.current = { intensity: SCREEN_SHAKE_INTENSITY * (brick.isGolden ? 2 : 1), duration: SCREEN_SHAKE_DURATION };
    flashFrameCounterRef.current = IMPACT_FLASH_DURATION;
  };
  
  /**
   * Triggers the visual flair for a successful "flick shot" at the paddle's edge.
   */
  const triggerFlickShotEffect = (x: number, y: number, direction: number) => {
      flickShotEffectRef.current = 10;
      for (let i = 0; i < 10; i++) {
        const angle = direction * (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 4);
        const speed = PARTICLE_SPEED * 1.5 + Math.random();
        particlesRef.current.push({
          x, y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          radius: Math.random() * 1.5 + 0.5,
          alpha: 1,
          life: PARTICLE_LIFESPAN / 2,
          color: '#ffffff',
        });
      }
  };


  // --- Drawing Functions ---
  // These functions are called every frame to render game objects onto the canvas.

  /** Draws the ball, its trail, and any special glow effects. */
  const drawBall = (ctx: CanvasRenderingContext2D) => {
    const isFlicking = flickShotEffectRef.current > 0;
    const isStuck = isStuckRef.current;
    const isPower = ballRef.current.isPowerBall;

    ballTrailRef.current.forEach((pos, index) => {
      const opacity = (index / ballTrailRef.current.length) * BALL_TRAIL_OPACITY * (isPower ? 2.5 : 1);
      const finalOpacity = isStuck ? opacity * 2.5 : opacity;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ballRef.current.radius * (index / ballTrailRef.current.length), 0, Math.PI * 2);
      let baseColor = '244, 244, 245';
      if (isFlicking) baseColor = '255, 255, 255';
      if (isPower) baseColor = '236, 72, 153';
      const trailColor = isStuck ? '249, 115, 22' : baseColor;
      ctx.fillStyle = `rgba(${trailColor}, ${finalOpacity})`;
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2);
    if (isPowerShotModeRef.current || isFlicking || isStuck || isPower) {
        let shadow = BALL_GLOW_COLOR;
        if (isStuck) shadow = 'rgba(249, 115, 22, 0.8)';
        if (isPower) shadow = 'rgba(236, 72, 153, 0.9)';
        ctx.shadowColor = shadow;
        ctx.shadowBlur = BALL_GLOW_SIZE * (isFlicking || isPower ? 2 : 1);
    }
    ctx.fillStyle = isPower ? PADDLE_COLOR : BALL_COLOR;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  };

  /** Draws the paddle and its motion trail. */
  const drawPaddle = (ctx: CanvasRenderingContext2D) => {
    paddleTrailRef.current.forEach((pos, index) => {
      const opacity = (index / paddleTrailRef.current.length) * PADDLE_TRAIL_OPACITY;
      ctx.beginPath();
      ctx.rect(pos.x, CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT, pos.width, PADDLE_HEIGHT);
      ctx.fillStyle = `rgba(236, 72, 153, ${opacity})`;
      ctx.fill();
      ctx.closePath();
    });
    
    ctx.beginPath();
    ctx.rect(paddleRef.current.x, CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT, paddleRef.current.width, paddleRef.current.height);
    
    const isFlicking = flickShotEffectRef.current > 0;
    const confidenceNormalized = Math.max(0, Math.min(1, (dynamicAggressionFactorRef.current - 0.5)));
    const paddleGlowIntensity = isPowerShotModeRef.current ? PADDLE_GLOW_SIZE * 1.5 : PADDLE_GLOW_SIZE * 0.5;
    const finalGlow = isFlicking ? PADDLE_GLOW_SIZE * 2 : (paddleGlowIntensity + (confidenceNormalized * 20)); 
    const paddleGlowOpacity = isFlicking ? 0.8 : (0.4 + (confidenceNormalized * 0.4)); 
    ctx.shadowColor = `rgba(236, 72, 153, ${paddleGlowOpacity})`;
    ctx.shadowBlur = finalGlow;

    ctx.fillStyle = PADDLE_COLOR;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  };

  /** Draws all the bricks, applying special glows for golden, targeted, or last remaining bricks. */
  const drawBricks = (ctx: CanvasRenderingContext2D) => {
    const remainingBricks = bricksRef.current.flat().filter(b => b.status === 1);
    const isEndGame = remainingBricks.length > 0 && remainingBricks.length <= AI_END_GAME_BRICK_COUNT;

    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        const brick = bricksRef.current[c][r];
        if (brick.status === 1) {
          const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
          const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
          brick.x = brickX;
          brick.y = brickY;
          
          if (brick.isGolden) {
             const glowSize = 10 + Math.sin(frameCounterRef.current * 0.15) * 5;
             ctx.shadowColor = GOLDEN_BRICK_GLOW_COLOR;
             ctx.shadowBlur = glowSize;
          }
          else if (brick === currentTargetBrickRef.current) {
             const targetingGlowSize = 12 + Math.sin(frameCounterRef.current * 0.3) * 6;
             ctx.shadowColor = brick.isGolden ? GOLDEN_BRICK_GLOW_COLOR : 'rgba(236, 72, 153, 0.9)';
             ctx.shadowBlur = targetingGlowSize;
          } else if (isEndGame) {
            const glowSize = 15 + Math.sin(frameCounterRef.current * 0.2) * 8;
            ctx.shadowColor = LAST_BRICK_GLOW_COLOR;
            ctx.shadowBlur = glowSize;
          }
          ctx.beginPath();
          ctx.rect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
          ctx.fillStyle = brick.isGolden ? GOLDEN_BRICK_COLOR : BRICK_COLORS[r % BRICK_COLORS.length];
          ctx.fill();
          ctx.closePath();
          ctx.shadowBlur = 0;
        }
      }
    }
  };

  /** Draws and updates all active particles. */
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        p.dx *= PARTICLE_FRICTION;
        p.dy *= PARTICLE_FRICTION;
        p.life--;
        p.alpha = p.life / PARTICLE_LIFESPAN;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const color = p.color.slice(1);
        const r = parseInt(color.substring(0,2), 16);
        const g = parseInt(color.substring(2,4), 16);
        const b = parseInt(color.substring(4,6), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        ctx.fill();
        ctx.closePath();
        if (p.life <= 0) {
            particlesRef.current.splice(index, 1);
        }
    });
  };

  /** Draws and updates all floating text elements. */
  const drawFloatingTexts = (ctx: CanvasRenderingContext2D) => {
    floatingTextsRef.current.forEach((ft, index) => {
        ft.y -= FLOATING_TEXT_SPEED;
        ft.life--;
        ft.alpha = ft.life / ft.initialLife;

        ctx.save();
        
        let fontSize = 24;
        if (ft.text === "LOOP DETECTED" || ft.text.includes("!")) {
            const pulse = 1 + Math.sin(frameCounterRef.current * 0.2) * 0.1;
            fontSize *= pulse;
        }
        ctx.font = `bold ${fontSize}px 'Courier New', Courier, monospace`;

        ctx.fillStyle = ft.color.replace('%A%', `${ft.alpha}`);
        ctx.shadowColor = ft.color.replace('%A%', `${ft.alpha * 0.7}`);
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.life <= 0) {
            floatingTextsRef.current.splice(index, 1);
        }
    });
  };
  
  /** Draws and updates the parallax starfield background. */
  const drawStars = (ctx: CanvasRenderingContext2D) => {
    starsRef.current.forEach(star => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * CANVAS_WIDTH;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 244, 245, ${star.alpha})`;
        ctx.fill();
    });
  };

  /** Calculates the productivity for the current game. */
  const getProductivity = () => {
    const totalHits = productiveHitsRef.current + nonProductiveHitsRef.current;
    return totalHits > 0 ? (productiveHitsRef.current / totalHits) * 100 : 0;
  }
  
  /**
   * Handles the outcome of hitting the special Golden Brick.
   * It runs a "roulette" to determine if the result is a Jackpot, Power Ball, or Dud.
   */
  const handleGoldenBrick = (brick: Brick) => {
    const rand = Math.random();
    let outcome: 'JACKPOT' | 'POWER_BALL' | 'DUD' = 'DUD';
    let cumulative = 0;

    if (rand < (cumulative += GOLDEN_BRICK_ROULETTE_CHANCES.JACKPOT)) outcome = 'JACKPOT';
    else if (rand < (cumulative += GOLDEN_BRICK_ROULETTE_CHANCES.POWER_BALL)) outcome = 'POWER_BALL';
    
    const life = FLOATING_TEXT_LIFESPAN * 1.5;

    if (outcome === 'JACKPOT') {
      jackpotsThisGameRef.current++;
      const row = Math.round((brick.y - BRICK_OFFSET_TOP) / (BRICK_HEIGHT + BRICK_PADDING));
      for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        const b = bricksRef.current[c][row];
        if (b.status === 1) {
          b.status = 0;
          scoreRef.current += POINTS_PER_BRICK;
          productiveHitsRef.current++;
          triggerBrickBreakEffects(b);
        }
      }
      floatingTextsRef.current.push({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, text: "JACKPOT!", alpha: 1, life, initialLife: life, color: 'rgba(34, 197, 94, %A%)'});
    } else if (outcome === 'POWER_BALL') {
      ballRef.current.isPowerBall = true;
      ballRef.current.powerBallTimer = POWER_BALL_DURATION;
      const speed = Math.sqrt(ballRef.current.dx ** 2 + ballRef.current.dy ** 2);
      const scale = (speed + 2) / speed;
      ballRef.current.dx *= scale;
      ballRef.current.dy *= scale;
      floatingTextsRef.current.push({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, text: "POWER BALL!", alpha: 1, life, initialLife: life, color: 'rgba(236, 72, 153, %A%)'});
    } else { // DUD
      const speed = Math.sqrt(ballRef.current.dx ** 2 + ballRef.current.dy ** 2);
      const scale = MAX_BALL_SPEED / speed;
      ballRef.current.dx *= scale;
      ballRef.current.dy *= scale;
      floatingTextsRef.current.push({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, text: "DANGER!", alpha: 1, life, initialLife: life, color: 'rgba(239, 68, 68, %A%)'});
    }
  };

  /**
   * The core physics and collision detection logic.
   * This function checks for collisions between the ball and bricks, walls, and the paddle.
   * It also handles win/loss conditions.
   */
  const collisionDetection = useCallback(() => {
    const ball = ballRef.current;
    
    let totalLayoutBricks = 0;
    let brokenBricks = 0;
    let collisionDetectedThisFrame = false;

    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        const b = bricksRef.current[c][r];
        
        if (b.status === 0 && b.x === 0 && b.y === 0) continue;
        totalLayoutBricks++;
        if (b.status === 0) {
          brokenBricks++;
          continue;
        }

        const closestX = Math.max(b.x, Math.min(ball.x, b.x + BRICK_WIDTH));
        const closestY = Math.max(b.y, Math.min(ball.y, b.y + BRICK_HEIGHT));
        const distanceSquared = (ball.x - closestX)**2 + (ball.y - closestY)**2;

        if (distanceSquared < ball.radius * ball.radius && !collisionDetectedThisFrame) {
          if (!ball.isPowerBall) collisionDetectedThisFrame = true;
          b.status = 0;
          scoreRef.current += POINTS_PER_BRICK;
          productiveHitsRef.current++;
          dynamicAggressionFactorRef.current = Math.min(1.5, dynamicAggressionFactorRef.current + (0.05 * initialSkillLevel));
          lastBrickBreakFrameRef.current = frameCounterRef.current;
          triggerBrickBreakEffects(b);

          if (b.isGolden) handleGoldenBrick(b);
          
          if (!ball.isPowerBall) {
            const prevY = ball.y - ball.dy;
            const wasVerticallyClear = prevY + ball.radius <= b.y || prevY - ball.radius >= b.y + BRICK_HEIGHT;
            if (wasVerticallyClear) ball.dy = -ball.dy;
            else ball.dx = -ball.dx;
          }
        }
      }
    }
    
    if (totalLayoutBricks > 0 && brokenBricks === totalLayoutBricks && !isWinning) {
      setIsWinning(true);
      const life = FLOATING_TEXT_LIFESPAN * 1.5;
      floatingTextsRef.current.push({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, text: "+1 Life", alpha: 1, life: life, initialLife: life, color: 'rgba(34, 197, 94, %A%)' });

      setTimeout(() => {
        const duration = (performance.now() - gameStartTimeRef.current) / 1000;
        onGameEnd(instanceId, 'win', scoreRef.current, duration, initialStrategy, livesRef.current, getProductivity(), productiveHitsRef.current, nonProductiveHitsRef.current, jackpotsThisGameRef.current);
      }, 750);
      return;
    }

    if (ball.x + ball.radius > CANVAS_WIDTH) {
      ball.x = CANVAS_WIDTH - ball.radius; ball.dx = -ball.dx; nonProductiveHitsRef.current++;
      dynamicAggressionFactorRef.current = Math.max(0.5, dynamicAggressionFactorRef.current - (0.02 * initialSkillLevel));
    } else if (ball.x - ball.radius < 0) {
      ball.x = ball.radius; ball.dx = -ball.dx; nonProductiveHitsRef.current++;
      dynamicAggressionFactorRef.current = Math.max(0.5, dynamicAggressionFactorRef.current - (0.02 * initialSkillLevel));
    }

    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius; ball.dy = -ball.dy; nonProductiveHitsRef.current++;
      dynamicAggressionFactorRef.current = Math.max(0.5, dynamicAggressionFactorRef.current - (0.02 * initialSkillLevel));
    }

    const paddleTopY = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
    if ( ball.dy > 0 && ball.y + ball.radius >= paddleTopY && ball.y - ball.dy < paddleTopY && ball.x > paddleRef.current.x && ball.x < paddleRef.current.x + paddleRef.current.width ) {
      if (isStuckRef.current) isStuckRef.current = false;
      ball.y = paddleTopY - ball.radius; ball.dy = -ball.dy;
      const collidePoint = (ball.x - (paddleRef.current.x + paddleRef.current.width / 2)) / (paddleRef.current.width / 2);
      const spinFromVelocity = paddleVelocityRef.current * PADDLE_VELOCITY_SPIN_FACTOR;
      let spin = collidePoint * (isPowerShotModeRef.current ? AI_POWER_SHOT_MULTIPLIER : PADDLE_SPIN_FACTOR);
      if (Math.abs(collidePoint) > 0.85) {
        spin *= PADDLE_EDGE_BOOST; ball.dy *= PADDLE_FLICK_SPEED_BONUS;
        triggerFlickShotEffect(ball.x, ball.y, Math.sign(collidePoint));
      }
      ball.dx = spin + spinFromVelocity; isPowerShotModeRef.current = false;
      if (Math.abs(ball.dx) < 0.2) ball.dx = Math.sign(ball.dx || 1) * 0.5;
    }

    if (ball.y - ball.radius > CANVAS_HEIGHT) {
      livesRef.current--;
      if (livesRef.current === 0) {
        setIsLosing(true);
        const life = FLOATING_TEXT_LIFESPAN * 1.5;
        floatingTextsRef.current.push({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, text: "Defeated", alpha: 1, life: life, initialLife: life, color: 'rgba(239, 68, 68, %A%)' });
        setTimeout(() => {
            const duration = (performance.now() - gameStartTimeRef.current) / 1000;
            onGameEnd(instanceId, 'loss', scoreRef.current, duration, initialStrategy, 0, getProductivity(), productiveHitsRef.current, nonProductiveHitsRef.current, jackpotsThisGameRef.current);
        }, 750);
      } else {
        resetBallAndPaddle();
      }
    }
  }, [onGameEnd, resetBallAndPaddle, instanceId, initialStrategy, isWinning, initialSkillLevel]);

  // --- AI Logic Functions ---

  /**
   * AI helper to identify the "best" non-golden brick to target.
   * "Best" is determined by a heuristic that prioritizes isolated or strategically important bricks.
   */
  const findBestTargetBrick = useCallback(() => {
    const remainingBricks = bricksRef.current.flat().filter(b => b.status === 1 && !b.isGolden);
    if (remainingBricks.length === 0) return null;
    let bestBrick: Brick | null = null;
    let maxThreat = -1;
    for (const brick of remainingBricks) {
      let threatScore = 0;
      const c = Math.round((brick.x - BRICK_OFFSET_LEFT) / (BRICK_WIDTH + BRICK_PADDING));
      const r = Math.round((brick.y - BRICK_OFFSET_TOP) / (BRICK_HEIGHT + BRICK_PADDING));
      threatScore += Math.abs(c - (BRICK_COLUMN_COUNT - 1) / 2);
      let neighborCount = 0;
      const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dc, dr] of neighbors) {
        if (bricksRef.current[c + dc]?.[r + dr]?.status === 1) neighborCount++;
      }
      threatScore += (4 - neighborCount) * 1.5;
      if (threatScore > maxThreat) {
        maxThreat = threatScore;
        bestBrick = brick;
      }
    }
    return bestBrick;
  }, []);

  /**
   * AI helper for calculating the purely defensive paddle position.
   * It projects the ball's path to the paddle line, accounting for wall bounces,
   * to determine where to intercept it.
   */
  const getDefensiveTargetX = useCallback(() => {
      const ball = ballRef.current;
      const paddleY = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
      if (ball.dy <= 0.1) return ball.x;
      let timeToImpact = (paddleY - ball.y) / ball.dy;
      let simX = ball.x, simDX = ball.dx;
      const maxSteps = 10;
      let steps = 0;
      while (timeToImpact > 0 && steps < maxSteps) {
          steps++;
          let timeToWall = simDX > 0 ? (CANVAS_WIDTH - ball.radius - simX) / simDX : (simX - ball.radius) / -simDX;
          if (timeToWall >= timeToImpact || timeToWall <= 0) {
              simX += simDX * timeToImpact;
              timeToImpact = 0;
          } else {
              simX += simDX * timeToWall;
              simDX *= -1;
              timeToImpact -= timeToWall;
          }
      }
      return simX;
  }, []);

  /**
   * Simulates a single potential ball trajectory from the paddle.
   * @returns The simulated path, a list of bricks it would hit, and the resulting score.
   */
  const projectTrajectory = useCallback((startX: number, startY: number, startDX: number, startDY: number, bricks: Brick[][], depth: number): { path: {x:number, y:number}[], hits: Brick[], score: number } => {
      let path = [{ x: startX, y: startY }];
      let hits: Brick[] = [];
      let simBall = { x: startX, y: startY, dx: startDX, dy: startDY, radius: BALL_RADIUS };
      let liveBricks = bricks.flat().filter(b => b.status === 1);
      let bounces = 0;
      for (let step = 0; step < 500; step++) {
          simBall.x += simBall.dx; simBall.y += simBall.dy;
          path.push({ x: simBall.x, y: simBall.y });
          if (simBall.x > CANVAS_WIDTH || simBall.x < 0) { simBall.dx *= -1; bounces++; }
          if (simBall.y < 0) { simBall.dy *= -1; bounces++; }
          if (simBall.y > CANVAS_HEIGHT) break;
          for (let i = liveBricks.length - 1; i >= 0; i--) {
              const b = liveBricks[i];
              if (simBall.x > b.x && simBall.x < b.x + BRICK_WIDTH && simBall.y > b.y && simBall.y < b.y + BRICK_HEIGHT) {
                  hits.push(b); liveBricks.splice(i, 1);
                  simBall.dy *= -1; bounces++;
                  break;
              }
          }
          if (bounces >= depth) break;
      }
      return { path, hits, score: hits.length };
  }, []);

  /**
   * The AI's main strategic planning function.
   * It runs multiple `projectTrajectory` simulations at different angles
   * to find the shot that will break the most bricks.
   */
  const runShotSimulations = useCallback(() => {
    const ball = ballRef.current;
    const paddle = paddleRef.current;
    const paddleY = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
    const startX = ball.x;
    const startY = paddleY;
    const paths: SimulatedPath[] = AI_SIMULATION_ANGLES.map(angle => {
        const collidePoint = angle;
        const requiredPaddleCenter = startX - (collidePoint * (paddle.width / 2));
        const simDX = collidePoint * PADDLE_SPIN_FACTOR * 1.2;
        const simDY = BALL_SPEED_Y; 
        const projected = projectTrajectory(startX, startY, simDX, simDY, bricksRef.current, AI_SIMULATION_DEPTH);
        return { ...projected, requiredPaddleCenter };
    });
    let bestPathIndex = -1;
    let maxScore = 0;
    paths.forEach((p, i) => {
        if (p.score > maxScore) {
            maxScore = p.score;
            bestPathIndex = i;
        }
    });
    if (maxScore > 1) strategicPlanRef.current = { paths, bestPathIndex };
    else strategicPlanRef.current = null;
  }, [projectTrajectory]);


  /**
   * The main drawing and game loop function, called by requestAnimationFrame.
   * It orchestrates all drawing, updates game state, and runs the AI logic for each frame.
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCounterRef.current++;
    if (recoveringFromStuckCounterRef.current > 0) recoveringFromStuckCounterRef.current--;
    if (flickShotEffectRef.current > 0) flickShotEffectRef.current--;
    if (ballRef.current.powerBallTimer && ballRef.current.powerBallTimer > 0) {
      ballRef.current.powerBallTimer--;
      if (ballRef.current.powerBallTimer === 0) {
        ballRef.current.isPowerBall = false;
        const speed = Math.sqrt(ballRef.current.dx**2 + ballRef.current.dy**2);
        if (speed > MAX_BALL_SPEED * 0.8) {
          const scale = (MIN_BALL_SPEED + 2) / speed;
          ballRef.current.dx *= scale; ballRef.current.dy *= scale;
        }
      }
    }
    
    const paddle = paddleRef.current;
    const ball = ballRef.current;
    paddleVelocityRef.current = paddle.x - prevPaddleXRef.current;
    prevPaddleXRef.current = paddle.x;

    ctx.save();
    if (screenShakeRef.current.duration > 0) {
        const { intensity } = screenShakeRef.current;
        ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
        screenShakeRef.current.duration--;
    }

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStars(ctx);
    drawBricks(ctx);
    drawParticles(ctx);
    
    const remainingBricks = bricksRef.current.flat().filter(b => b.status === 1);
    const isEndGame = remainingBricks.length > 0 && remainingBricks.length <= AI_END_GAME_BRICK_COUNT;
    
    // --- Agent Psychological State Determination ---
    // Determines the agent's current "mood" or state based on game conditions.
    // This state influences its decision-making logic (e.g., risk-taking).
    let agentMode: 'normal' | 'grit' | 'clutch' | 'finisher' = 'normal';
    if (isEndGame) agentMode = 'finisher';
    else if (livesRef.current === 1) agentMode = 'clutch';
    else if (livesRef.current > 2 && getProductivity() < 40 && frameCounterRef.current > 180) agentMode = 'grit';

    // --- Main AI Decision-Making Block ---
    if (isAIEnabled) {
      const isRecovering = recoveringFromStuckCounterRef.current > 0;
      strategicPlanRef.current = null;

      // Step 1: Strategic Planning (if conditions are right)
      if (ball.dy < 0 && ball.y < AI_STRATEGIC_PLANNING_THRESHOLD_Y && !isRecovering && !isStuckRef.current) runShotSimulations();
      
      // Step 2: Calculate Defensive Target
      const defensiveTargetX = getDefensiveTargetX();
      let offensiveTargetX: number | null = null;
      currentTargetBrickRef.current = null;
      
      // Step 3: Identify High-Value Offensive Targets (Golden Brick, Finisher Shots)
      const goldenBrick = bricksRef.current.flat().find(b => b.isGolden && b.status === 1);
      let wantsToGamble = false;
      // The agent's willingness to gamble for the golden brick depends on its rank and confidence.
      if (goldenBrick && livesRef.current > 1) {
          if (rank === totalInstances && totalInstances > 1) wantsToGamble = true; // Underdog's desperation
          else if (rank === 1 && totalInstances > 1) wantsToGamble = false; // Champion's caution
          else if (dynamicAggressionFactorRef.current > 1.2) wantsToGamble = true;
      }
      if (wantsToGamble && goldenBrick) {
          currentTargetBrickRef.current = goldenBrick;
          const paddleY = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
          const aimPoint = { x: goldenBrick.x + BRICK_WIDTH / 2, y: goldenBrick.y + BRICK_HEIGHT / 2 };
          const timeToImpact = (paddleY - ball.y) / ball.dy;
          if (timeToImpact > 0) {
            const requiredDX = (aimPoint.x - ball.x) / timeToImpact;
            const requiredCollidePoint = requiredDX / (PADDLE_SPIN_FACTOR * 1.5);
            const targetPaddleCenter = ball.x - (requiredCollidePoint * (paddle.width / 2));
            offensiveTargetX = targetPaddleCenter;
          }
      }

      // If not gambling, check for other strategic opportunities.
      if (offensiveTargetX === null) {
        const bestPlan = strategicPlanRef.current?.paths[strategicPlanRef.current.bestPathIndex];
        if (bestPlan && bestPlan.score > 1) {
            offensiveTargetX = bestPlan.requiredPaddleCenter; // Execute the best simulated shot
        }
        else if (!isRecovering && !strategicPlanRef.current) {
          finisherShotPathRef.current = null;
          // In the end-game, calculate a direct "finisher" shot.
          if (isEndGame) {
            const targetBrick = remainingBricks.reduce((lowest, current) => current.y > lowest.y ? current : lowest, remainingBricks[0]);
            currentTargetBrickRef.current = targetBrick;
            const aimPoint = { x: targetBrick.x + BRICK_WIDTH / 2, y: targetBrick.y + BRICK_HEIGHT / 2 };
            const paddleY = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
            const requiredDX = (aimPoint.x - ball.x) / ((paddleY - ball.y) / ball.dy);
            const requiredCollidePoint = requiredDX / PADDLE_SPIN_FACTOR;
            const targetPaddleCenter = ball.x - (requiredCollidePoint * (paddle.width / 2));
            offensiveTargetX = targetPaddleCenter;
            if (offensiveTargetX <= paddle.width/2 || offensiveTargetX >= CANVAS_WIDTH - paddle.width/2) offensiveTargetX = null;
            else {
              const paddleImpactX = ball.x + requiredDX * ((paddleY - ball.y) / ball.dy);
              finisherShotPathRef.current = { from: { x: paddleImpactX, y: paddleY }, to: aimPoint };
            }
          }
        }
        // If no other plans, find the next-best regular brick to target.
        if (offensiveTargetX === null && !isRecovering && !strategicPlanRef.current) {
          const bestTarget = findBestTargetBrick();
          if (bestTarget) {
              currentTargetBrickRef.current = bestTarget;
              const paddleY = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
              const aimPoint = { x: bestTarget.x + BRICK_WIDTH / 2, y: bestTarget.y + BRICK_HEIGHT / 2 };
              const shotMultiplier = AI_POWER_SHOT_MULTIPLIER;
              const calculatePaddleCenter = (tx: number, ty: number) => (tx - ball.x) * (-ball.dy) / (ty - paddleY) / shotMultiplier * (paddle.width / 2);
              const virtualTargets = [aimPoint.x, -aimPoint.x, 2 * CANVAS_WIDTH - aimPoint.x];
              const options = virtualTargets.map(tx => ({ pos: ball.x - calculatePaddleCenter(tx, aimPoint.y), dist: Math.abs(ball.x - calculatePaddleCenter(tx, aimPoint.y) - defensiveTargetX) })).filter(opt => opt.pos > 0 && opt.pos < CANVAS_WIDTH);
              if (options.length > 0) offensiveTargetX = options.reduce((p, c) => c.dist < p.dist ? c : p).pos;
          }
        }
      }

      // Step 4: Weigh Options and Set Final Target
      let finalTargetX = defensiveTargetX; // Default to a safe, defensive position
      isPowerShotModeRef.current = false;
      let useFlickShot = false;
      const safeZone = paddle.width * 0.7; 
      if (!isStuckRef.current && Math.abs(defensiveTargetX - (paddle.x + paddle.width/2)) > safeZone / 2) {
          if (defensiveTargetX > paddle.x + paddle.width/2) { finalTargetX = defensiveTargetX - (paddle.width / 2) + (paddle.width * 0.1); } 
          else { finalTargetX = defensiveTargetX + (paddle.width / 2) - (paddle.width * 0.1); }
          useFlickShot = true;
      }
      
      // Determine agent's confidence based on performance and psychological state.
      let decisionConfidence = dynamicAggressionFactorRef.current;
      if (agentMode === 'finisher') decisionConfidence = 2.0;
      else if (agentMode === 'grit') decisionConfidence = 1.5;
      else if (agentMode === 'clutch') decisionConfidence = 0.5;
      if (rank === 1 && totalInstances > 1) decisionConfidence *= 1.1; 
      if (rank === totalInstances && totalInstances > 1) decisionConfidence = Math.max(decisionConfidence, 1.4);
      
      // Override logic for special cases like being stuck.
      if (isStuckRef.current && !isRecovering) {
          const flickDirection = Math.sign(CANVAS_WIDTH / 2 - ball.x) || 1;
          finalTargetX = defensiveTargetX - ((paddle.width / 2) * 0.9 * flickDirection);
          useFlickShot = true;
      } else if (!isRecovering && !useFlickShot && offensiveTargetX !== null) {
        // Decide whether to take the offensive shot based on confidence and risk.
        const requiredPaddleMovement = Math.abs(offensiveTargetX - defensiveTargetX);
        const riskFactor = requiredPaddleMovement / (CANVAS_WIDTH * 0.75);
        if (decisionConfidence > (0.7 + riskFactor)) {
            finalTargetX = offensiveTargetX; // Commit to the offensive shot
            const bestPlan = strategicPlanRef.current?.paths[strategicPlanRef.current.bestPathIndex];
            isPowerShotModeRef.current = bestPlan ? bestPlan.score > 2 : true;
        }
      }
      
      // Step 5: Execute Paddle Movement
      // Apply easing and jitter for more natural, less robotic movement.
      let finalEasing = AI_PADDLE_EASING * initialSkillLevel;
      if (agentMode === 'grit' || useFlickShot || agentMode === 'finisher') finalEasing *= 1.5;
      let jitter = 0;
      if (ball.dy > 0 && ball.y > CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - 50) { 
          const jitterMagnitude = AI_PADDLE_JITTER_AMOUNT / initialSkillLevel;
          jitter = (Math.random() - 0.5) * jitterMagnitude;
      }
      paddle.x += (finalTargetX + jitter - (paddle.x + paddle.width / 2)) * finalEasing;
      paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, paddle.x));
    }

    if (strategicPlanRef.current) {
        const { paths, bestPathIndex } = strategicPlanRef.current;
        paths.forEach((p, index) => {
            const isBest = index === bestPathIndex;
            if (!isBest && p.score <= 1) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.path[0].x, p.path[0].y);
            p.path.forEach(point => ctx.lineTo(point.x, point.y));
            if (isBest) {
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)'; ctx.lineWidth = 2;
                ctx.shadowColor = 'rgba(236, 72, 153, 1)'; ctx.shadowBlur = 10;
            } else {
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + p.score * 0.05})`; ctx.lineWidth = 1;
            }
            ctx.setLineDash([3, 5]); ctx.stroke(); ctx.restore();
            if (isBest) {
                p.hits.forEach(brick => {
                    ctx.save();
                    ctx.fillStyle = 'rgba(236, 72, 153, 0.2)'; ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
                    ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)'; ctx.lineWidth = 1.5;
                    ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT); ctx.restore();
                });
            }
        });
    }

    drawBall(ctx);

    // --- Loop Detection ---
    // Checks the ball's recent position history to see if it's trapped in a repetitive, non-productive loop.
    ballPositionHistoryRef.current.push({ x: ball.x, y: ball.y });
    if (ballPositionHistoryRef.current.length > AI_LOOP_DETECTION_HISTORY_LENGTH) ballPositionHistoryRef.current.shift();
    const history = ballPositionHistoryRef.current;
    if (!isStuckRef.current && recoveringFromStuckCounterRef.current === 0 && history.length === AI_LOOP_DETECTION_HISTORY_LENGTH) {
        const minX = Math.min(...history.map(p => p.x)); const maxX = Math.max(...history.map(p => p.x));
        const minY = Math.min(...history.map(p => p.y)); const maxY = Math.max(...history.map(p => p.y));
        const framesSinceLastBreak = frameCounterRef.current - lastBrickBreakFrameRef.current;
        if (framesSinceLastBreak > AI_STUCK_FRAMES_THRESHOLD && (maxX - minX < AI_LOOP_DETECTION_BOX_SIZE) && (maxY - minY < AI_LOOP_DETECTION_BOX_SIZE)) {
            isStuckRef.current = true; recoveringFromStuckCounterRef.current = AI_RECOVERY_FRAMES; ballPositionHistoryRef.current = [];
            const life = FLOATING_TEXT_LIFESPAN;
             floatingTextsRef.current.push({ x: ball.x, y: ball.y - 20, text: "LOOP DETECTED", alpha: 1, life: life, initialLife: life, color: 'rgba(249, 115, 22, %A%)' });
        }
    }
    
    drawPaddle(ctx);
    drawFloatingTexts(ctx);

    if (finisherShotPathRef.current) {
      ctx.save(); ctx.beginPath();
      ctx.moveTo(finisherShotPathRef.current.from.x, finisherShotPathRef.current.from.y);
      ctx.lineTo(finisherShotPathRef.current.to.x, finisherShotPathRef.current.to.y);
      ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1;
      ctx.stroke(); ctx.restore();
    }
    
    if (flashFrameCounterRef.current > 0) {
        const progress = flashFrameCounterRef.current / IMPACT_FLASH_DURATION;
        const spread = IMPACT_FLASH_GRADIENT_SPREAD * progress;
        const opacity = progress * 0.2;
        const gradTop = ctx.createLinearGradient(0,0,0,spread); gradTop.addColorStop(0,`rgba(255,255,255,${opacity})`); gradTop.addColorStop(1,'transparent'); ctx.fillStyle=gradTop; ctx.fillRect(0,0,CANVAS_WIDTH,spread);
        flashFrameCounterRef.current--;
    }
    
    // --- HUD OVERLAY ---
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 5;
    ctx.font = "bold 10px 'Courier New', Courier, monospace";

    // TOP LEFT (Global)
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillText(`COLLECTIVE GAMES: ${sharedAIData.gamesPlayed}`, 10, 15);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(`TOTAL BRICKS: ${sharedAIData.totalBricksDestroyed}`, 10, 28);
    
    // TOP RIGHT (Global)
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillText(`FASTEST WIN: ${sharedAIData.bestTime === Infinity ? 'N/A' : `${sharedAIData.bestTime.toFixed(2)}s`}`, CANVAS_WIDTH - 10, 15);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(`JACKPOTS HIT: ${sharedAIData.totalJackpotsHit}`, CANVAS_WIDTH - 10, 28);
    
    // --- Bottom HUD ---
    const y1 = CANVAS_HEIGHT - 41, y2 = CANVAS_HEIGHT - 30, y3 = CANVAS_HEIGHT - 19, y4 = CANVAS_HEIGHT - 8;

    let modeIndicator = '';
    let barColor = PADDLE_COLOR;

    if (agentMode === 'finisher') {
        modeIndicator = '🎯'; barColor = '#06b6d4'; // cyan-500
    } else if (agentMode === 'clutch') {
        modeIndicator = '😰'; barColor = '#ef4444'; // red-500
    } else if (rank === 1 && totalInstances > 1) {
        modeIndicator = '🏆'; barColor = '#facc15'; // yellow-400
    } else if (rank === totalInstances && totalInstances > 1) {
        modeIndicator = '🔥'; barColor = '#f97316'; // orange-500
    } else if (agentMode === 'grit') {
        modeIndicator = '💪'; barColor = '#8b5cf6'; // violet-500
    }
    
    // BOTTOM LEFT (Agent Performance)
    ctx.textAlign = "left";
    ctx.font = "bold 11px 'Courier New', Courier, monospace";
    ctx.fillStyle = rank === 1 ? '#facc15' : 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${modeIndicator} AGENT #${instanceId} | RANK #${rank}`.trim(), 10, y1);
    ctx.font = "10px 'Courier New', Courier, monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(`EFFICIENCY: ${efficiency.toFixed(3)} W/s`, 10, y2);
    ctx.fillText(`AVG WIN: ${averageWinTime > 0 ? `${averageWinTime.toFixed(1)}s` : 'N/A'}`, 10, y3);

    // BOTTOM RIGHT (Agent Growth & State)
    ctx.textAlign = "right";
    ctx.font = "bold 11px 'Courier New', Courier, monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(`LIVES: ${livesRef.current}`, CANVAS_WIDTH - 10, y1);
    ctx.font = "10px 'Courier New', Courier, monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(`SKILL: ${initialSkillLevel.toFixed(2)}`, CANVAS_WIDTH - 10, y2);
    ctx.fillText(`CAREER PROD: ${careerProductivity.toFixed(1)}%`, CANVAS_WIDTH - 10, y3);
    
    // Confidence Bar
    const MAX_CONFIDENCE = 2.0;
    const barWidth = 50;
    const barHeight = 4;
    const barX = CANVAS_WIDTH - 10 - barWidth;
    const barY = y4 - barHeight;
    const normalizedConfidence = Math.max(0, Math.min(1, (dynamicAggressionFactorRef.current - 0.5) / (MAX_CONFIDENCE - 0.5)));
    const currentBarWidth = barWidth * normalizedConfidence;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, currentBarWidth, barHeight);
    ctx.fillText(`CONF`, CANVAS_WIDTH - 15 - barWidth, y4 - 1);

    ctx.restore();
    ctx.restore();

    // --- Update Ball Position and Check Collisions for Next Frame ---
    if (!isWinning && !isLosing) {
      ballTrailRef.current.push({ x: ballRef.current.x, y: ballRef.current.y });
      if (ballTrailRef.current.length > BALL_TRAIL_LENGTH) ballTrailRef.current.shift();
      paddleTrailRef.current.push({ x: paddleRef.current.x, width: paddleRef.current.width });
      if (paddleTrailRef.current.length > PADDLE_TRAIL_LENGTH) paddleTrailRef.current.shift();
      ballRef.current.x += ballRef.current.dx;
      ballRef.current.y += ballRef.current.dy;
      // Apply friction and clamp ball speed
      ballRef.current.dx *= BALL_FRICTION;
      ballRef.current.dy *= BALL_FRICTION;
      const speed = Math.sqrt(ballRef.current.dx**2 + ballRef.current.dy**2);
      if (speed < MIN_BALL_SPEED && speed > 0) {
        const scale = MIN_BALL_SPEED / speed;
        ballRef.current.dx *= scale;
        ballRef.current.dy *= scale;
      }
      collisionDetection();
    }
  }, [
    collisionDetection, isActive, isAIEnabled, instanceId, initialStrategy, 
    isWinning, isLosing, gamesPlayed, initialSkillLevel, careerProductivity, 
    findBestTargetBrick, getDefensiveTargetX, runShotSimulations, projectTrajectory, 
    rank, totalInstances, sharedAIData, efficiency, averageWinTime
  ]);
  
  /**
   * useEffect for initializing a new game.
   * This is triggered when the `isActive` prop becomes true or when the component's `key` changes.
   * It resets all game state to start a fresh match.
   */
  useEffect(() => {
    if (!isActive) return;
    
    createBricks();
    createStars();
    resetBallAndPaddle();
    // Reset all refs and state for a new game
    scoreRef.current = 0;
    livesRef.current = initialLives;
    frameCounterRef.current = 0;
    lastBrickBreakFrameRef.current = 0;
    ballPositionHistoryRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    isStuckRef.current = false;
    productiveHitsRef.current = 0;
    nonProductiveHitsRef.current = 0;
    dynamicAggressionFactorRef.current = 1.0;
    jackpotsThisGameRef.current = 0;
    gameStartTimeRef.current = performance.now();
    setIsWinning(false);
    setIsLosing(false);
    
  }, [isActive, createBricks, resetBallAndPaddle, initialLives, initialStrategy, createStars]);
  
  /**
   * useEffect for managing the main game loop via requestAnimationFrame.
   * It starts the loop when the component is active and cancels it on cleanup.
   */
  useEffect(() => {
    if (!isActive) return;
    
    let animationFrameId: number;
    const render = () => {
        draw();
        animationFrameId = window.requestAnimationFrame(render);
    };
    render();
    
    return () => {
        window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className={`bg-zinc-900 rounded-lg ${className}`}
    />
  );
};

export default Game;