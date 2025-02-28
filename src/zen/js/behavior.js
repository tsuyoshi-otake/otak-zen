// 群れ行動の更新ロジック
export function updateGroupBehavior(creature, centerX, centerY, avgDirection) {
    const toCenterAngle = Math.atan2(centerY - creature.y, centerX - creature.x);
    const sizeInfluence = 1 - (creature.size - 2.5) / 2.5;
    const alignWeight = 0.4 * (1 - creature.personality * 0.3) * sizeInfluence;
    const cohesionWeight = 0.3 * (1 - creature.personality * 0.3) * sizeInfluence;

    const newTargetAngle = creature.targetAngle + 
        (avgDirection - creature.targetAngle) * alignWeight +
        (toCenterAngle - creature.targetAngle) * cohesionWeight;

    creature.targetAngle = newTargetAngle;
    creature.angle = creature.angle * creature.inertia + 
        creature.targetAngle * (1 - creature.inertia);
}

// 通常の生き物の行動更新
export function updateNormalCreature(creature, neighbors, attraction, wanderAngle) {
    let avgDirection = 0;
    const groupCenters = {};
    const groupMembers = {};
    
    // 近くの個体を距離でソートするための配列
    const nearbyCreatures = [];

    neighbors.forEach(other => {
        if (creature === other) return;
        const dx = other.x - creature.x;
        const dy = other.y - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 群れの影響範囲を拡大
        if (distance < 150) {
            nearbyCreatures.push({
                creature: other,
                distance: distance
            });
        }
    });

    // 距離でソートして最も近い20個体のみを考慮
    nearbyCreatures.sort((a, b) => a.distance - b.distance);
    const maxNeighbors = Math.min(20, nearbyCreatures.length);
    
    // 近接する個体からの反発力を計算
    let repelX = 0;
    let repelY = 0;
    nearbyCreatures.forEach(({creature: other, distance}) => {
        // サイズに基づく最小距離を計算
        const minDistance = (creature.size + other.size) * 5;
        const repelRange = Math.max(50, minDistance);

        if (distance < repelRange) {
            const dx = creature.x - other.x;
            const dy = creature.y - other.y;
            const repelStrength = Math.pow(1 - distance / repelRange, 2);
            
            let effectiveDistance = distance;
            if (distance < minDistance) {
                effectiveDistance = distance * 0.5; // 近すぎる場合は反発力を強める
            }
            
            repelX += dx * repelStrength / effectiveDistance;
            repelY += dy * repelStrength / effectiveDistance;
        }
    });
    
    const repelAngle = Math.atan2(repelY, repelX);
    const repelMagnitude = Math.sqrt(repelX * repelX + repelY * repelY);
    
    // リーダー選出とグループ分割のロジック
    if (!creature.isLeader) {
        creature.splitTimer -= 1;
        if (creature.splitTimer <= 0 && Math.random() < 0.001) {
            creature.isLeader = true;
            creature.groupId = creature.groupId === 1 ? 2 : 1;
            creature.splitTimer = 3600; // リセット
        }
    }

    // 最も近い個体から順に影響を計算
    for (let i = 0; i < maxNeighbors; i++) {
        const {creature: other, distance} = nearbyCreatures[i];
        
        // 群れごとの中心を計算
        if (!groupCenters[other.groupId]) {
            groupCenters[other.groupId] = { x: 0, y: 0, count: 0 };
            groupMembers[other.groupId] = [];
        }
        groupCenters[other.groupId].x += other.x;
        groupCenters[other.groupId].y += other.y;
        groupCenters[other.groupId].count++;
        groupMembers[other.groupId].push(other);

        if (other.groupId === creature.groupId) {
            avgDirection += other.angle;
        }
    }

    // 群れの再集合ロジック
    const groups = Object.keys(groupCenters);
    if (groups.length > 1) {
        // 数値として処理するために変換
        const numericGroups = groups.map(Number);
        
        numericGroups.forEach(groupId => {
            const center = groupCenters[groupId];
            center.x /= center.count;
            center.y /= center.count;
        });

        // 2つの群れが十分近づいたら再集合
        if (groupCenters[1] && groupCenters[2]) {
            const dx = groupCenters[1].x - groupCenters[2].x;
            const dy = groupCenters[1].y - groupCenters[2].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                // 全てのメンバーを群れ1に統合
                if (groupMembers[2]) {
                    groupMembers[2].forEach(member => {
                        member.groupId = 1;
                        member.isLeader = false;
                        member.splitTimer = 3600;
                    });
                }
            }
        }
    }

    if (maxNeighbors > 0) {
        // 同じ群れのリーダーを探す
        const leader = nearbyCreatures.find(n => 
            n.creature.groupId === creature.groupId && n.creature.isLeader
        )?.creature;

        if (leader) {
            // リーダーへの追従
            const toLeaderAngle = Math.atan2(leader.y - creature.y, leader.x - creature.x);
            creature.targetAngle = creature.targetAngle * (1 - creature.leaderInfluence) + 
                toLeaderAngle * creature.leaderInfluence;
        } else {
            // 通常の群れ行動
            const myGroup = groupCenters[creature.groupId];
            if (myGroup && myGroup.count > 0) {
                const centerX = myGroup.x / myGroup.count;
                const centerY = myGroup.y / myGroup.count;
                
                // 反発力と群れの結合力を組み合わせる
                if (repelMagnitude > 0) {
                    const repelWeight = Math.min(0.9, repelMagnitude);
                    const cohesionWeight = 0.2 * (1 - repelWeight);
                    
                    const toCenterAngle = Math.atan2(centerY - creature.y, centerX - creature.x);
                    creature.targetAngle = creature.targetAngle * 0.2 +
                        repelAngle * repelWeight +
                        toCenterAngle * cohesionWeight +
                        (avgDirection / maxNeighbors) * 0.1;
                    
                    // 近接時は速度を落とす
                    creature.targetSpeed = creature.speed * (0.5 + (1 - repelWeight) * 0.5);
                } else {
                    updateGroupBehavior(creature, centerX, centerY, avgDirection / maxNeighbors);
                }
            }
        }
    } else if (attraction.weight > 0) {
        const foodPriority = 0.3 + creature.hungry * 0.3;
        creature.targetAngle = creature.targetAngle * (1 - foodPriority) + 
            attraction.angle * foodPriority;
    }

    // 個性による影響を減少
    creature.targetAngle += wanderAngle * (creature.personality * 0.15);
    creature.angle = creature.angle * creature.inertia + creature.targetAngle * (1 - creature.inertia);
}

// 錦鯉の行動更新
export function updateKoi(creature, deltaTime, attraction, wanderAngle, canvas) {
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