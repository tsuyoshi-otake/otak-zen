import { koiColors } from './config.js';

/**
 * 小さな生き物の作成
 * @param {number} canvasWidth - キャンバスの幅
 * @param {number} canvasHeight - キャンバスの高さ
 * @returns {Object} 生成された生き物オブジェクト
 */
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

/**
 * 錦鯉の作成
 * @param {number} canvasWidth - キャンバスの幅
 * @param {number} canvasHeight - キャンバスの高さ
 * @returns {Object} 生成された錦鯉オブジェクト
 */
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

/**
 * 生き物の更新ロジック
 * @param {Object} creature - 更新する生き物
 * @param {number} deltaTime - 前回の更新からの経過時間
 * @param {number} mouseX - マウスのX座標
 * @param {number} mouseY - マウスのY座標
 * @param {boolean} mousePresent - マウスが存在するかどうか
 * @param {Array} foods - 餌のリスト
 * @param {Array} neighbors - 周辺の他の生き物
 * @param {Object} canvas - キャンバス要素
 */
export function updateCreature(creature, deltaTime, mouseX, mouseY, mousePresent, foods, neighbors, canvas) {
    // ワンダリング効果
    creature.wanderPhase += creature.wanderRate * deltaTime * 60;
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

/**
 * 餌への引力を計算
 * @param {Object} creature - 生き物
 * @param {Array} foods - 餌のリスト
 * @returns {Object} 引力の角度と重み
 */
function calculateFoodAttraction(creature, foods) {
    let nearestDistance = Infinity;
    let attractionAngle = creature.angle;
    let attractionWeight = 0;

    foods.forEach(food => {
        const dx = food.x - creature.x;
        const dy = food.y - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 通常の生き物と錦鯉で感知範囲を変える
        const detectionRange = creature.type === 'koi' ? 350 : 300;

        if (distance < detectionRange && distance < nearestDistance) {
            nearestDistance = distance;
            attractionAngle = Math.atan2(dy, dx);
            
            if (creature.type === 'normal') {
                attractionWeight = 0.4 * (1 - distance / detectionRange) * (1 - creature.personality * 0.3);
                if (distance < 30) {
                    attractionWeight = 0.8;
                }
            } else {
                attractionWeight = 0.5 * (1 - distance / detectionRange) * creature.hungry;
                if (distance < 40) {
                    attractionWeight = 0.9;
                }
            }

            // 餌に近いときの速度調整
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

/**
 * マウスからの回避行動
 * @param {Object} creature - 生き物
 * @param {number} mouseX - マウスのX座標
 * @param {number} mouseY - マウスのY座標
 */
function handleMouseAvoidance(creature, mouseX, mouseY) {
    const dx = mouseX - creature.x;
    const dy = mouseY - creature.y;
    const distanceToMouse = Math.sqrt(dx * dx + dy * dy);
    
    // 生き物のタイプに応じて回避感度を変える
    const avoidRadius = creature.type === 'koi' ? 180 : 150;
    const avoidStrength = creature.type === 'koi' ? 0.1 : 0.08;

    if (distanceToMouse < avoidRadius) {
        const avoidAngle = Math.atan2(-dy, -dx);
        const avoidWeight = avoidStrength * (1 - distanceToMouse / avoidRadius);
        creature.targetAngle = creature.angle * (1 - avoidWeight) + avoidAngle * avoidWeight;
        
        // マウスに近すぎる場合は加速
        if (distanceToMouse < avoidRadius / 2) {
            creature.targetSpeed = creature.speed * 1.2;
        }
    }
}

/**
 * 通常の生き物の更新
 * @param {Object} creature - 生き物
 * @param {Array} neighbors - 周辺の他の生き物
 * @param {Object} attraction - 餌への引力情報
 * @param {number} wanderAngle - ランダムな動きの角度
 */
function updateNormalCreature(creature, neighbors, attraction, wanderAngle) {
    let centerX = 0;
    let centerY = 0;
    let avgDirection = 0;
    let neighborCount = 0;

    // 近くの個体から群れの影響を計算
    neighbors.forEach(other => {
        if (creature === other) {
            return;
        }

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
    
    // 角度の更新（慣性を考慮）
    const angleDiff = normalizeAngle(creature.targetAngle - creature.angle);
    const turnAmount = Math.min(Math.abs(angleDiff), creature.turnSpeed * (1 + creature.personality)) * Math.sign(angleDiff);
    creature.angle = normalizeAngle(creature.angle + turnAmount);
}

/**
 * 錦鯉の更新
 * @param {Object} creature - 生き物
 * @param {number} deltaTime - 前回の更新からの経過時間
 * @param {Object} attraction - 餌への引力情報
 * @param {number} wanderAngle - ランダムな動きの角度
 * @param {Object} canvas - キャンバス要素
 */
function updateKoi(creature, deltaTime, attraction, wanderAngle, canvas) {
    creature.straightLineCounter += deltaTime * 60;

    // 一定時間後に方向転換
    if (creature.straightLineCounter >= creature.straightLineDuration) {
        const turnDirection = Math.random() > 0.5 ? 1 : -1;
        const currentDirection = Math.atan2(Math.sin(creature.angle), Math.cos(creature.angle));
        creature.targetAngle = currentDirection + 
            turnDirection * creature.directionChangeAmount * (0.5 + Math.random() * 0.5);

        creature.straightLineCounter = 0;
        creature.straightLineDuration = 200 + Math.floor(Math.random() * 400);
        
        // 時々大きく方向転換
        if (Math.random() < 0.3) {
            creature.targetAngle = Math.random() * Math.PI * 2;
        }
    }

    // 餌に引き寄せられる
    if (attraction.weight > 0) {
        const hungerInfluence = 0.2 + creature.hungry * 0.8;
        creature.targetAngle = creature.angle * (1 - attraction.weight * hungerInfluence) +
            attraction.angle * (attraction.weight * hungerInfluence);
        
        // 餌に近いとき特別な動き
        if (attraction.weight > 0.7) {
            creature.tailAmplitude = Math.min(0.3, creature.tailAmplitude + 0.01);
        }
    }

    // 角度の緩やかな更新
    const angleDiff = normalizeAngle(creature.targetAngle - creature.angle);
    const turnAmount = Math.min(Math.abs(angleDiff), creature.turnSpeed * 1.5) * Math.sign(angleDiff);
    creature.angle = normalizeAngle(creature.angle + turnAmount);
    
    // わずかなランダム性を追加
    creature.angle += wanderAngle * 0.05;

    // 壁回避の改善
    const wallMargin = 150;
    const edgeWeight = 0.1;
    
    if (creature.x < wallMargin) {
        const turnAngle = 0;  // 右向き
        creature.targetAngle = creature.angle * (1 - edgeWeight) + turnAngle * edgeWeight;
    } else if (creature.x > canvas.width - wallMargin) {
        const turnAngle = Math.PI; // 左向き
        creature.targetAngle = creature.angle * (1 - edgeWeight) + turnAngle * edgeWeight;
    }
    
    if (creature.y < wallMargin) {
        const turnAngle = Math.PI / 2;  // 下向き
        creature.targetAngle = creature.angle * (1 - edgeWeight) + turnAngle * edgeWeight;
    } else if (creature.y > canvas.height - wallMargin) {
        const turnAngle = -Math.PI / 2;  // 上向き
        creature.targetAngle = creature.angle * (1 - edgeWeight) + turnAngle * edgeWeight;
    }
}

/**
 * 生き物の位置更新
 * @param {Object} creature - 生き物
 * @param {number} deltaTime - 前回の更新からの経過時間
 */
function updatePosition(creature, deltaTime) {
    const maxAcceleration = creature.type === 'koi' ? 0.03 : 0.05;
    const acceleration = Math.max(-maxAcceleration, Math.min(maxAcceleration, 
        (creature.targetSpeed - creature.currentSpeed) * 0.1));
    creature.currentSpeed = creature.currentSpeed + acceleration;

    // 尾の動き
    const tailSpeed = creature.type === 'koi' ? 2 : 3;
    creature.tailPhase += deltaTime * (creature.currentSpeed * tailSpeed + 1);
    const turnFactor = Math.abs(normalizeAngle(creature.angle - creature.targetAngle)) * 2;
    
    // 生き物のタイプに基づく尾の振幅調整
    if (creature.type === 'koi') {
        creature.tailAmplitude = Math.min(0.3, 0.05 + turnFactor * 0.1 + creature.currentSpeed * 0.1);
    } else {
        creature.tailAmplitude = Math.min(0.3, 0.1 + turnFactor * 0.2);
    }
    
    creature.tailAngle = Math.sin(creature.tailPhase) * creature.tailAmplitude;

    // 動きの更新
    const actualSpeed = (creature.currentSpeed || creature.speed) * deltaTime * 60;
    creature.x += Math.cos(creature.angle) * actualSpeed;
    creature.y += Math.sin(creature.angle) * actualSpeed;
}

/**
 * 画面の境界処理
 * @param {Object} creature - 生き物
 * @param {Object} canvas - キャンバス要素
 */
function handleBoundaries(creature, canvas) {
    const margin = creature.type === 'koi' ? 80 : 50;
    
    if (creature.x < -margin) {
        creature.x = canvas.width + margin;
    }
    if (creature.x > canvas.width + margin) {
        creature.x = -margin;
    }
    if (creature.y < -margin) {
        creature.y = canvas.height + margin;
    }
    if (creature.y > canvas.height + margin) {
        creature.y = -margin;
    }
}

/**
 * 角度の正規化（-π〜πの範囲に）
 * @param {number} angle - 正規化する角度
 * @returns {number} 正規化された角度
 */
function normalizeAngle(angle) {
    while (angle > Math.PI) {
        angle -= Math.PI * 2;
    }
    while (angle < -Math.PI) {
        angle += Math.PI * 2;
    }
    return angle;
}