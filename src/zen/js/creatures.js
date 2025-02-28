import { koiColors } from './config.js';
import { updateNormalCreature, updateKoi } from './behavior.js';
import { updatePosition, handleBoundaries } from './movement.js';
import { calculateFoodAttraction, handleMouseAvoidance } from './interaction.js';

// 小さな生き物の作成
export function createSmallCreature(canvasWidth, canvasHeight) {
    const size = 2.5 + Math.random() * 2.5;
    
    return {
        x: canvasWidth / 2 + (Math.random() - 0.5) * 300,
        y: canvasHeight / 2 + (Math.random() - 0.5) * 300,
        angle: Math.random() * Math.PI * 2,
        tailAngle: 0,
        tailPhase: Math.random() * Math.PI * 2,
        tailAmplitude: 0.1,
        acceleration: 0,
        targetAngle: Math.random() * Math.PI * 2,
        speed: 1.0 + Math.random() * 0.8 + (4 - size) * 0.2,
        inertia: 0.95,
        currentSpeed: 0,
        targetSpeed: 1.0,
        size: size,
        turnSpeed: 0.005 + Math.random() * 0.01,
        colorShift: Math.random() * 0.4,
        wanderPhase: Math.random() * Math.PI * 2,
        wanderRate: 0.01 + Math.random() * 0.015,
        wanderRange: 0.05 + Math.random() * 0.1,
        personality: Math.random(),
        hungry: 0.5 + Math.random() * 0.5,
        groupId: 1,
        isLeader: false,
        splitTimer: 3600, // 60fps × 60秒
        leaderInfluence: 0.6 + Math.random() * 0.2,
        type: 'normal',
        color: {
            main: '#FFFFFF',
            pattern: '#FFFFFF'
        }
    };
}

// 錦鯉の作成
export function createKoi(canvasWidth, canvasHeight) {
    const size = (3 + Math.random() * 2) * 1.5;
    const initialAngle = Math.random() * Math.PI * 2;
    
    return {
        x: canvasWidth / 2 + (Math.random() - 0.5) * 300,
        y: canvasHeight / 2 + (Math.random() - 0.5) * 300,
        angle: initialAngle,
        tailAngle: 0,
        tailPhase: Math.random() * Math.PI * 2,
        tailAmplitude: 0.05,
        acceleration: 0,
        targetAngle: initialAngle,
        speed: 0.8 + Math.random() * 0.6,
        currentSpeed: 0,
        targetSpeed: 0.8,
        size: size * 0.8,
        turnSpeed: 0.002 + Math.random() * 0.005,
        wanderPhase: Math.random() * Math.PI * 2,
        wanderRate: 0.01 + Math.random() * 0.01,
        wanderRange: 0.03 + Math.random() * 0.04,
        hungry: 0.7 + Math.random() * 0.3,
        straightLineCounter: 0,
        straightLineDuration: 300 + Math.floor(Math.random() * 600),
        directionChangeAmount: 0.1 + Math.random() * 0.1,
        inertia: 0.98,
        type: 'koi',
        color: koiColors[Math.floor(Math.random() * koiColors.length)]
    };
}

// 生き物の更新ロジック
export function updateCreature(creature, deltaTime, mouseX, mouseY, mousePresent, foods, neighbors, canvas) {
    // ワンダリング効果
    creature.wanderPhase += creature.wanderRate;
    const wanderAngle = Math.sin(creature.wanderPhase) * creature.wanderRange;

    // 餌への引力の計算
    const attraction = calculateFoodAttraction(creature, foods);

    // マウスからの回避
    if (mousePresent) {
        handleMouseAvoidance(creature, mouseX, mouseY);
    }

    // タイプに応じた更新
    if (creature.type === 'normal') {
        updateNormalCreature(creature, neighbors, attraction, wanderAngle);
    } else if (creature.type === 'koi') {
        updateKoi(creature, deltaTime, attraction, wanderAngle, canvas);
    }

    // 位置の更新
    updatePosition(creature, deltaTime);

    // 画面端の処理
    handleBoundaries(creature, canvas);
}