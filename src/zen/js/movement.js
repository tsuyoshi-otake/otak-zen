// 位置の更新処理
export function updatePosition(creature, deltaTime) {
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

// 画面端の処理
export function handleBoundaries(creature, canvas) {
    const margin = creature.type === 'koi' ? 80 : 50;
    
    if (creature.x < -margin) creature.x = canvas.width + margin;
    if (creature.x > canvas.width + margin) creature.x = -margin;
    if (creature.y < -margin) creature.y = canvas.height + margin;
    if (creature.y > canvas.height + margin) creature.y = -margin;
}