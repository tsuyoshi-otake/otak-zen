import { koiColors } from './config.js';

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

function calculateFoodAttraction(creature, foods) {
    let nearestDistance = Infinity;
    let attractionAngle = creature.angle;
    let attractionWeight = 0;

    foods.forEach(food => {
        const dx = food.x - creature.x;
        const dy = food.y - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300 && distance < nearestDistance) {
            nearestDistance = distance;
            attractionAngle = Math.atan2(dy, dx);
            
            if (creature.type === 'normal') {
                attractionWeight = 0.4 * (1 - distance / 300) * (1 - creature.personality * 0.3);
                if (distance < 30) {
                    attractionWeight = 0.8;
                }
            } else {
                attractionWeight = 0.5 * (1 - distance / 350) * creature.hungry;
                if (distance < 40) {
                    attractionWeight = 0.9;
                }
            }

            if (distance < 50) {
                creature.targetSpeed = distance < 20 ? 
                    creature.speed * 0.3 : 
                    creature.speed * (creature.type === 'koi' ? 
                        0.5 + ((distance - 20) / 30) * 0.3 : 
                        0.6 + ((distance - 20) / 30) * 0.2);
            } else {
                creature.targetSpeed = creature.speed;
            }
        }
    });

    return { angle: attractionAngle, weight: attractionWeight };
}

function handleMouseAvoidance(creature, mouseX, mouseY) {
    const dx = mouseX - creature.x;
    const dy = mouseY - creature.y;
    const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

    if (distanceToMouse < 150) {
        const avoidAngle = Math.atan2(-dy, -dx);
        const avoidWeight = 0.08 * (1 - distanceToMouse / 150);
        creature.targetAngle = creature.angle * (1 - avoidWeight) + avoidAngle * avoidWeight;
    }
}

function updateNormalCreature(creature, neighbors, attraction, wanderAngle) {
    let centerX = 0;
    let centerY = 0;
    let avgDirection = 0;
    let neighborCount = 0;

    // 近くの個体から群れの影響を計算
    neighbors.forEach(other => {
        if (creature === other) return;

        const dx = other.x - creature.x;
        const dy = other.y - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
            centerX += other.x;
            centerY += other.y;
            avgDirection += other.angle;
            neighborCount++;

            // 近すぎる場合は離れる
            if (distance < 25) {
                const repelAngle = Math.atan2(creature.y - other.y, creature.x - other.x);
                const repelWeight = 0.2 * (1 - distance / 25);
                creature.targetAngle = creature.angle * (1 - repelWeight) + repelAngle * repelWeight;
            }
        }
    });

    // 群れの影響を適用
    if (neighborCount > 0) {
        centerX /= neighborCount;
        centerY /= neighborCount;
        avgDirection /= neighborCount;

        const toCenterAngle = Math.atan2(centerY - creature.y, centerX - creature.x);
        const sizeInfluence = 1 - (creature.size - 2.5) / 2.5;
        const alignWeight = 0.3 * (1 - creature.personality * 0.3) * sizeInfluence;
        const cohesionWeight = 0.2 * (1 - creature.personality * 0.3) * sizeInfluence;

        const newTargetAngle = creature.targetAngle + 
            (avgDirection - creature.targetAngle) * alignWeight +
            (toCenterAngle - creature.targetAngle) * cohesionWeight;

        creature.targetAngle = newTargetAngle;
    }

    // 餌への引力
    if (attraction.weight > 0) {
        const foodPriority = 0.3 + creature.hungry * 0.3;
        creature.targetAngle = creature.targetAngle * (1 - foodPriority) + 
            attraction.angle * foodPriority;
    }

    // 個性による影響を追加
    creature.targetAngle += wanderAngle * (creature.personality * 0.15);
    creature.angle = creature.angle * creature.inertia + creature.targetAngle * (1 - creature.inertia);
}

function updateKoi(creature, deltaTime, attraction, wanderAngle, canvas) {
    creature.straightLineCounter += deltaTime * 60;

    if (creature.straightLineCounter >= creature.straightLineDuration) {
        const turnDirection = Math.random() > 0.5 ? 1 : -1;
        const currentDirection = Math.atan2(Math.sin(creature.angle), Math.cos(creature.angle));
        creature.targetAngle = currentDirection + 
            turnDirection * creature.directionChangeAmount * (0.5 + Math.random() * 0.5);

        creature.straightLineCounter = 0;
        creature.straightLineDuration = 200 + Math.floor(Math.random() * 400);
    }

    if (attraction.weight > 0) {
        creature.targetAngle = attraction.angle;
    }

    creature.angle = creature.angle * creature.inertia + 
        creature.targetAngle * (1 - creature.inertia);
    creature.angle += wanderAngle * 0.05;

    // 壁回避
    const wallMargin = 150;
    if (creature.x < wallMargin || 
        creature.x > canvas.width - wallMargin ||
        creature.y < wallMargin || 
        creature.y > canvas.height - wallMargin) {
        
        const centerAngle = Math.atan2(
            canvas.height/2 - creature.y, 
            canvas.width/2 - creature.x
        );
        creature.targetAngle = centerAngle;
    }
}

function updatePosition(creature, deltaTime) {
    const maxAcceleration = creature.type === 'koi' ? 0.03 : 0.05;
    const acceleration = Math.max(-maxAcceleration, Math.min(maxAcceleration, 
        (creature.targetSpeed - creature.currentSpeed) * 0.1));
    creature.currentSpeed = creature.currentSpeed + acceleration;

    creature.tailPhase += deltaTime * (creature.currentSpeed * 2 + 1);
    const turnFactor = Math.abs(creature.angle - creature.targetAngle) * 2;
    creature.tailAmplitude = Math.min(0.3, 
        creature.type === 'koi' ? 0.05 + turnFactor * 0.1 : 0.1 + turnFactor * 0.2);
    creature.tailAngle = Math.sin(creature.tailPhase) * creature.tailAmplitude;

    const actualSpeed = creature.currentSpeed || creature.speed;
    creature.x += Math.cos(creature.angle) * actualSpeed;
    creature.y += Math.sin(creature.angle) * actualSpeed;
}

function handleBoundaries(creature, canvas) {
    const margin = creature.type === 'koi' ? 80 : 50;
    
    if (creature.x < -margin) creature.x = canvas.width + margin;
    if (creature.x > canvas.width + margin) creature.x = -margin;
    if (creature.y < -margin) creature.y = canvas.height + margin;
    if (creature.y > canvas.height + margin) creature.y = -margin;
}