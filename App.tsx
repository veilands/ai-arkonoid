

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Game from './components/Game';
import { GameStatus, AIStrategyData, StrategyPerformance, GameInstance } from './types';
import { 
    INITIAL_LIVES, 
    SIMULATION_GAME_COUNT, 
    LOSS_PENALTY_SECONDS, 
    STRATEGY_COLORS, 
    BRICK_COLUMN_COUNT,
    INITIAL_SKILL_LEVEL,
    SKILL_INCREASE_ON_WIN,
    SKILL_DECREASE_ON_LOSS,
    MIN_SKILL_LEVEL,
    MAX_SKILL_LEVEL,
    SKILL_INHERITANCE_CHANCE,
    CAREER_PRODUCTIVITY_INHERITANCE_THRESHOLD,
    SKILL_INHERITANCE_CHANCE_BOOST_FACTOR,
    POINTS_PER_BRICK
} from './constants';

const AI_DATA_KEY = 'arkanoidAIStrategyData';

const getSharedAIData = (): AIStrategyData => {
    try {
        const data = localStorage.getItem(AI_DATA_KEY);
        const parsed = data ? JSON.parse(data) : {};
        return {
            gamesPlayed: parsed.gamesPlayed || 0,
            gamesWon: parsed.gamesWon || 0,
            bestTime: parsed.bestTime || Infinity,
            strategyPerformance: parsed.strategyPerformance || {},
            totalBricksDestroyed: parsed.totalBricksDestroyed || 0,
            totalJackpotsHit: parsed.totalJackpotsHit || 0,
        };
    } catch (error) {
        console.error("Error reading AI strategy data:", error);
        return { gamesPlayed: 0, gamesWon: 0, bestTime: Infinity, strategyPerformance: {}, totalBricksDestroyed: 0, totalJackpotsHit: 0 };
    }
};

const saveSharedAIData = (aiData: AIStrategyData) => {
    try {
        localStorage.setItem(AI_DATA_KEY, JSON.stringify(aiData));
    } catch (error) {
        console.error("Error saving AI strategy data:", error);
    }
};

const App: React.FC = () => {
    const [gameInstances, setGameInstances] = useState<GameInstance[]>([]);
    const [sharedAIData, setSharedAIData] = useState<AIStrategyData>(getSharedAIData);

    const decideNextStrategy = useCallback((): number => {
        return Math.floor(Math.random() * BRICK_COLUMN_COUNT);
    }, []);

    const initializeInstances = useCallback(() => {
        const initialInstances: GameInstance[] = [];
        for (let i = 0; i < SIMULATION_GAME_COUNT; i++) {
            initialInstances.push({
                id: i,
                key: Date.now() + i,
                initialLives: INITIAL_LIVES,
                strategy: decideNextStrategy(),
                gamesPlayed: 0,
                gamesWon: 0,
                skillLevel: INITIAL_SKILL_LEVEL,
                careerProductivity: 50,
                totalProductiveHits: 0,
                totalNonProductiveHits: 0,
                totalWinTime: 0,
            });
        }
        setGameInstances(initialInstances);
    }, [decideNextStrategy]);

    useEffect(() => {
        initializeInstances();
    }, [initializeInstances]);
    
    const rankedInstances = useMemo(() => {
        const instancesWithPerf = gameInstances.map(inst => {
            const averageWinTime = inst.gamesWon > 0 ? inst.totalWinTime / inst.gamesWon : 0;
            const efficiency = (inst.gamesWon > 1 && inst.totalWinTime > 0) 
                ? (inst.gamesWon / inst.totalWinTime) 
                : 0;
            return { ...inst, averageWinTime, efficiency };
        });
        return instancesWithPerf.sort((a, b) => b.efficiency - a.efficiency);
    }, [gameInstances]);

    const handleGameEnd = useCallback((
        instanceId: number,
        result: 'win' | 'loss',
        score: number,
        time: number,
        strategy: number,
        remainingLives: number,
        gameProductivity: number,
        productiveHits: number,
        nonProductiveHits: number,
        jackpotsHit: number,
    ) => {
        setSharedAIData(prevData => {
            const newData = { ...prevData };
            newData.gamesPlayed++;
            newData.totalBricksDestroyed += score / POINTS_PER_BRICK;
            newData.totalJackpotsHit += jackpotsHit;

            if (result === 'win') {
                newData.bestTime = Math.min(newData.bestTime, time);
                newData.gamesWon++;
            }
            
            const effectiveTime = result === 'win' ? time : time + LOSS_PENALTY_SECONDS;
            const oldStats = newData.strategyPerformance[strategy] || { avgTime: 0, plays: 0, wins: 0 };
            const newPlays = oldStats.plays + 1;
            const newWins = result === 'win' ? oldStats.wins + 1 : oldStats.wins;
            const newAvgTime = oldStats.avgTime + (effectiveTime - oldStats.avgTime) / newPlays;
            newData.strategyPerformance[strategy] = {
                avgTime: newAvgTime,
                plays: newPlays,
                wins: newWins,
            };
            
            saveSharedAIData(newData);
            return newData;
        });
        
        setGameInstances(prevInstances => {
            const champ = rankedInstances.length > 0 ? rankedInstances[0] : null;
            const championSkill = champ ? champ.skillLevel : INITIAL_SKILL_LEVEL;

            return prevInstances.map(instance => {
                if (instance.id === instanceId) {
                    let nextInitialLives = INITIAL_LIVES; 
                    if (result === 'win') {
                        nextInitialLives = Math.min(INITIAL_LIVES + 1, remainingLives + 1);
                    }
                    
                    const newGamesWon = result === 'win' ? instance.gamesWon + 1 : instance.gamesWon;
                    const newTotalWinTime = result === 'win' ? instance.totalWinTime + time : instance.totalWinTime;
                    
                    const newTotalP = instance.totalProductiveHits + productiveHits;
                    const newTotalNP = instance.totalNonProductiveHits + nonProductiveHits;
                    const totalHits = newTotalP + newTotalNP;
                    const newCareerProductivity = totalHits > 0 ? (newTotalP / totalHits) * 100 : 50;

                    let newSkill = instance.skillLevel;
                    if (result === 'win') {
                        const productivityBonus = isNaN(gameProductivity) ? 0.5 : gameProductivity / 100;
                        newSkill += SKILL_INCREASE_ON_WIN * productivityBonus;
                    } else {
                        const safeProductivity = isNaN(gameProductivity) ? 0 : gameProductivity;
                        const productivityPenalty = (1 - safeProductivity / 100);
                        newSkill -= SKILL_DECREASE_ON_LOSS * (1 + productivityPenalty);
                    }

                    let inheritanceChance = SKILL_INHERITANCE_CHANCE;
                    if (newCareerProductivity < CAREER_PRODUCTIVITY_INHERITANCE_THRESHOLD) {
                        inheritanceChance *= SKILL_INHERITANCE_CHANCE_BOOST_FACTOR;
                    }
                    if (Math.random() < inheritanceChance && championSkill > newSkill && champ && instance.id !== champ.id) {
                        newSkill = championSkill;
                    }

                    newSkill = Math.max(MIN_SKILL_LEVEL, Math.min(MAX_SKILL_LEVEL, newSkill));

                    return {
                        ...instance,
                        key: Date.now() + instance.id,
                        initialLives: nextInitialLives,
                        strategy: decideNextStrategy(),
                        gamesPlayed: instance.gamesPlayed + 1,
                        gamesWon: newGamesWon,
                        skillLevel: newSkill,
                        careerProductivity: newCareerProductivity,
                        totalProductiveHits: newTotalP,
                        totalNonProductiveHits: newTotalNP,
                        totalWinTime: newTotalWinTime,
                    };
                }
                return instance;
            });
        });

    }, [decideNextStrategy, rankedInstances]);

    const RadialProgress = ({ percentage, color }: { percentage: number; color: string }) => {
        const radius = 38;
        const stroke = 5;
        const normalizedRadius = radius - stroke * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center h-24 w-24">
                <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                    <circle
                        stroke="#3f3f46"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        stroke={color}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, strokeLinecap: 'round' }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-bold" style={{ color }}>{percentage.toFixed(0)}<span className="text-sm">%</span></span>
                    <span className="text-xs text-zinc-400 -mt-1">PROD.</span>
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 font-mono text-zinc-300">
            <h1 className="text-4xl font-bold text-pink-500 mb-2 tracking-wider">Arkanoid AI Mission Control</h1>
            <p className="mb-6 text-zinc-400">An AI collective learning in parallel to master the game.</p>
            
            <div className="w-full max-w-[1250px] flex flex-col items-center gap-6">
                {rankedInstances.map((instance, index) => {
                    const rank = index + 1;
                    const isChampion = rank === 1;
                    const skillPercentage = ((instance.skillLevel - MIN_SKILL_LEVEL) / (MAX_SKILL_LEVEL - MIN_SKILL_LEVEL)) * 100;

                    return (
                        <div key={instance.key} className={`w-full max-w-4xl p-4 rounded-lg flex gap-4 items-center transition-all duration-500 ${isChampion ? 'bg-yellow-500/10' : 'bg-zinc-800/50'}`} style={{borderColor: isChampion ? '#facc15' : '#3f3f46', borderWidth: '1px'}}>
                           <div className="flex flex-col items-center justify-center w-24">
                                <span className={`text-4xl font-bold ${isChampion ? 'text-yellow-300' : 'text-zinc-500'}`}>#{rank}</span>
                                {isChampion && <span className="text-sm text-yellow-400">🏆 CHAMPION</span>}
                           </div>

                           <Game
                                instanceId={instance.id}
                                initialLives={instance.initialLives}
                                initialStrategy={instance.strategy}
                                onGameEnd={handleGameEnd}
                                isActive={true}
                                isAIEnabled={true}
                                gamesPlayed={instance.gamesPlayed}
                                initialSkillLevel={instance.skillLevel}
                                careerProductivity={instance.careerProductivity}
                                rank={rank}
                                totalInstances={rankedInstances.length}
                                sharedAIData={sharedAIData}
                                efficiency={instance.efficiency}
                                averageWinTime={instance.averageWinTime}
                                className="w-[400px] h-[300px] rounded-md"
                            />
                            
                            <div className="flex-1 flex flex-col justify-between h-[300px] p-2">
                                <div>
                                    <h3 className={`text-lg font-bold ${isChampion ? 'text-yellow-300' : 'text-white'}`}>
                                        AGENT PERFORMANCE: #{instance.id}
                                    </h3>
                                    <p className="text-xs text-zinc-400" style={{ color: STRATEGY_COLORS[instance.strategy] }}>
                                        Opening Bias: Column {instance.strategy}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <RadialProgress percentage={instance.careerProductivity} color={isChampion ? '#facc15' : '#ec4899'} />
                                    <div className="flex-1 flex flex-col gap-3">
                                        <div>
                                            <div className="flex justify-between items-center text-xs mb-1">
                                                <span className="text-zinc-400">SKILL LEVEL</span>
                                                <span className="font-bold text-white">{instance.skillLevel.toFixed(2)}</span>
                                            </div>
                                            <div className="w-full bg-zinc-700 h-2 rounded-full">
                                                <div 
                                                    className="bg-pink-500 h-2 rounded-full" 
                                                    style={{ width: `${skillPercentage}%`, backgroundColor: isChampion ? '#facc15' : '#ec4899' }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-center">
                                            <div>
                                                <span className="block text-2xl font-bold text-green-400">{instance.gamesWon}</span>
                                                <span className="block text-xs text-zinc-400">WINS</span>
                                            </div>
                                            <div>
                                                <span className="block text-2xl font-bold text-red-400">{instance.gamesPlayed - instance.gamesWon}</span>
                                                <span className="block text-xs text-zinc-400">LOSSES</span>
                                            </div>
                                            <div>
                                                <span className="block text-2xl font-bold text-cyan-400">
                                                    {instance.averageWinTime > 0 ? instance.averageWinTime.toFixed(1) : '-'}
                                                </span>
                                                <span className="block text-xs text-zinc-400">AVG. WIN (s)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center text-xs text-zinc-500 mt-2">
                                    {instance.gamesPlayed} Total Matches | Efficiency: {instance.efficiency.toFixed(3)} W/s
                                </div>
                           </div>
                        </div>
                    )
                })}
            </div>
        </main>
    );
};

export default App;
