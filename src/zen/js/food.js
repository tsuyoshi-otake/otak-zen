const FOOD_BATCH_SIZE = 20;
const MAX_FOOD_COUNT = 240;
const MAX_EATING_DISTANCE = 20;

export function addFoodBurst(foods, x, y) {
    const overflow = Math.max(0, foods.length + FOOD_BATCH_SIZE - MAX_FOOD_COUNT);
    if (overflow > 0) {
        foods.splice(0, overflow);
    }

    for (let i = 0; i < FOOD_BATCH_SIZE; i++) {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;

        foods.push({
            x: x + offsetX,
            y: y + offsetY,
            size: 1 + Math.random() * 2.5,
            lifespan: 800 + Math.floor(Math.random() * 500),
            age: 0,
            eaten: false
        });
    }
}

export function updateFoods(foods, creatureIndex) {
    let writeIndex = 0;

    for (const food of foods) {
        food.age++;

        if (food.age > food.lifespan || isFoodEaten(food, creatureIndex)) {
            continue;
        }

        foods[writeIndex] = food;
        writeIndex++;
    }

    foods.length = writeIndex;
}

function isFoodEaten(food, creatureIndex) {
    const candidates = creatureIndex.queryCircle(food.x, food.y, MAX_EATING_DISTANCE);

    for (const creature of candidates) {
        const dx = food.x - creature.x;
        const dy = food.y - creature.y;
        const eatingDistance = creature.type === 'koi' ? creature.size * 2 : creature.size;

        if (dx * dx + dy * dy < eatingDistance * eatingDistance) {
            return true;
        }
    }

    return false;
}
