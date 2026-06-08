import { defaultSettings } from './config.js';
import { createSmallCreature, createKoi, updateCreature } from './creatures.js';
import { drawCreature, drawParameters, drawFood, fadeScreen } from './animation.js';
import { SpatialIndex } from './spatialIndex.js';
import { addFoodBurst, updateFoods } from './food.js';

const canvas = document.getElementById('zenCanvas');
const ctx = canvas.getContext('2d');
const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

let lastTime = performance.now();
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let mousePresent = false;
let showParameters = false;
let animationFrameId = 0;
let isRunning = false;

const creatures = [];
const foods = [];
const creatureIndex = new SpatialIndex(96);
const normalCreatureIndex = new SpatialIndex(96);
const foodIndex = new SpatialIndex(128);

function resizeCanvas() {
    canvas.width = Math.floor(window.innerWidth);
    canvas.height = Math.floor(window.innerHeight);
}

function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        mousePresent = true;
    });

    canvas.addEventListener('mouseout', () => {
        mousePresent = false;
    });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            showParameters = !showParameters;
        }
    });

    canvas.addEventListener('click', createFood);
    window.addEventListener('pagehide', stopAnimation);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });
}

function createFood(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addFoodBurst(foods, x, y);
}

function initializeCreatures() {
    applyCreatureCounts(window.otakZen || defaultSettings);
}

function applyCreatureCounts(settings) {
    const smallCreatureCount = getSafeCount(settings.smallCreatureCount, defaultSettings.smallCreatureCount, 1, 100);
    const koiCount = getSafeCount(settings.koiCount, defaultSettings.koiCount, 1, 20);

    creatures.length = 0;

    for (let i = 0; i < smallCreatureCount; i++) {
        creatures.push(createSmallCreature(canvas.width, canvas.height));
    }

    for (let i = 0; i < koiCount; i++) {
        creatures.push(createKoi(canvas.width, canvas.height));
    }
}

function getSafeCount(value, defaultValue, min, max) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
        return defaultValue;
    }

    return Math.min(max, Math.max(min, Math.floor(numberValue)));
}

function animate() {
    fadeScreen(ctx, canvas);

    const currentTime = performance.now();
    const deltaTime = Math.min(0.05, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    rebuildCreatureIndexes();
    updateFoods(foods, creatureIndex);
    rebuildFoodIndex();

    for (const food of foods) {
        drawFood(ctx, food);
    }

    for (const creature of creatures) {
        const detectionRange = creature.type === 'koi' ? 350 : 300;
        const nearbyFoods = foodIndex.queryCircle(creature.x, creature.y, detectionRange);
        const nearbyCreatures = creature.type === 'normal'
            ? normalCreatureIndex.queryCircle(creature.x, creature.y, 100)
            : [];

        updateCreature(creature, deltaTime, mouseX, mouseY, mousePresent, nearbyFoods, nearbyCreatures, canvas);
        drawCreature(ctx, creature);

        if (showParameters) {
            drawParameters(ctx, creature);
        }
    }

    if (isRunning) {
        animationFrameId = requestAnimationFrame(animate);
    }
}

function rebuildCreatureIndexes() {
    creatureIndex.clear();
    normalCreatureIndex.clear();

    for (const creature of creatures) {
        creatureIndex.insert(creature);
        if (creature.type === 'normal') {
            normalCreatureIndex.insert(creature);
        }
    }
}

function rebuildFoodIndex() {
    foodIndex.clear();

    for (const food of foods) {
        foodIndex.insert(food);
    }
}

function startAnimation() {
    if (isRunning) {
        return;
    }

    isRunning = true;
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
}

function stopAnimation() {
    if (!isRunning) {
        return;
    }

    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
}

function initialize() {
    resizeCanvas();
    setupEventListeners();
    initializeCreatures();
    startAnimation();
    notifyReady();
}

window.addEventListener('message', event => {
    const message = event.data;
    if (message && message.command === 'updateCounts') {
        applyCreatureCounts(message);
    }
});

function notifyReady() {
    if (vscodeApi) {
        vscodeApi.postMessage({ command: 'ready' });
    }
}

initialize();
