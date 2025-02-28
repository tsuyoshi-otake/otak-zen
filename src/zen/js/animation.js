// 生き物の描画関数
export function drawCreature(ctx, creature) {
    const tx = creature.type === 'normal' ? Math.round(creature.x) : creature.x;
    const ty = creature.type === 'normal' ? Math.round(creature.y) : creature.y;
    
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(creature.angle);

    const bodyLength = creature.size * 4;
    const bodyHeight = creature.size * 1.2;

    if (creature.type === 'normal') {
        drawNormalCreature(ctx, creature, bodyLength, bodyHeight);
    } else if (creature.type === 'koi') {
        drawKoi(ctx, creature, bodyLength, bodyHeight);
    }

    ctx.restore();

    // 水の動きを表現する軌跡
    drawWaterTrail(ctx, creature, bodyLength);
}

function drawNormalCreature(ctx, creature, bodyLength, bodyHeight) {
    const brightness = (creature.color.main === '#FFFFFF') ? 
        255 : 240 + Math.floor(creature.colorShift * 15);
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, 255)`;

    ctx.beginPath();
    ctx.moveTo(bodyLength/2, 0);

    // 上側の曲線
    ctx.quadraticCurveTo(
        bodyLength/6, -bodyHeight/2,
        -bodyLength/2, bodyHeight/4 * Math.sin(creature.tailAngle)
    );

    // 下側の曲線
    ctx.quadraticCurveTo(
        bodyLength/6, bodyHeight/2,
        bodyLength/2, -bodyHeight/4 * Math.sin(creature.tailAngle)
    );

    ctx.fill();
}

function drawKoi(ctx, creature, bodyLength, bodyHeight) {
    const thirdLength = bodyLength / 3;
    const bendFactor = Math.sin(creature.tailAngle) * 
        (1 + Math.abs(creature.angle - creature.targetAngle) * 2);

    // 頭部
    ctx.fillStyle = creature.color.head;
    ctx.beginPath();
    ctx.moveTo(bodyLength/2, 0);
    ctx.quadraticCurveTo(
        bodyLength/6, -bodyHeight/2,
        bodyLength/2 - thirdLength, -bodyHeight/4 + bendFactor * bodyHeight/6
    );
    ctx.quadraticCurveTo(
        bodyLength/6 + bendFactor * bodyLength/8, bodyHeight/2,
        bodyLength/2, 0
    );
    ctx.fill();

    // 中央部
    ctx.fillStyle = creature.color.middle;
    ctx.beginPath();
    ctx.moveTo(bodyLength/2 - thirdLength, -bodyHeight/4);
    ctx.lineTo(bodyLength/2 - thirdLength, bodyHeight/4);
    ctx.lineTo(bodyLength/2 - 2*thirdLength, bodyHeight/3);
    ctx.lineTo(bodyLength/2 - 2*thirdLength, -bodyHeight/3);
    ctx.closePath();
    ctx.fill();

    // 尾部
    ctx.fillStyle = creature.color.tail;
    ctx.beginPath();
    const tailOffset = bodyHeight/2 * Math.sin(creature.tailAngle);
    ctx.moveTo(bodyLength/2 - 2*thirdLength, -bodyHeight/3 + tailOffset);
    ctx.lineTo(bodyLength/2 - 2*thirdLength, bodyHeight/3 + tailOffset);
    ctx.lineTo(-bodyLength/2, tailOffset * 1.5);
    ctx.closePath();
    ctx.fill();
}

function drawWaterTrail(ctx, creature, bodyLength) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    
    for(let i = 1; i <= 2; i++) {
        const trailSize = creature.size * 0.25;
        const offsetX = Math.cos(creature.angle + Math.PI) * (bodyLength/2 + i * 4);
        const offsetY = Math.sin(creature.angle + Math.PI) * (bodyLength/2 + i * 4);
        
        ctx.beginPath();
        ctx.arc(
            creature.x + offsetX,
            creature.y + offsetY,
            trailSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// パラメータ表示
export function drawParameters(ctx, creature) {
    ctx.save();
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    const x = creature.x + 15;
    let y = creature.y - 15;
    const params = [
        `Size: ${creature.size.toFixed(2)}`,
        `Speed: ${creature.speed.toFixed(2)}`,
        `WRate: ${creature.wanderRate.toFixed(3)}`,
        `WRange: ${creature.wanderRange.toFixed(3)}`
    ];

    if (creature.type === 'normal') {
        params.push(`Personality: ${creature.personality.toFixed(2)}`);
    }

    params.forEach(param => {
        ctx.fillText(param, x, y);
        y += 12;
    });

    ctx.restore();
}

// 餌の描画
export function drawFood(ctx, food) {
    const alpha = Math.max(0, 1 - food.age / food.lifespan);
    ctx.fillStyle = `rgba(80, 80, 85, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
    ctx.fill();
}

// 画面のフェードエフェクト
export function fadeScreen(ctx, canvas) {
    ctx.fillStyle = 'rgba(30, 31, 28, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}