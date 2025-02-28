// 餌への引力の計算
export function calculateFoodAttraction(creature, foods) {
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

// マウスからの回避
export function handleMouseAvoidance(creature, mouseX, mouseY) {
    const dx = mouseX - creature.x;
    const dy = mouseY - creature.y;
    const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

    if (distanceToMouse < 150) {
        const avoidAngle = Math.atan2(-dy, -dx);
        const avoidWeight = 0.08 * (1 - distanceToMouse / 150);
        creature.targetAngle = creature.angle * (1 - avoidWeight) + avoidAngle * avoidWeight;
    }
}