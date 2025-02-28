import { defaultSettings } from './config.js';
import { createSmallCreature, createKoi, updateCreature } from './creatures.js';
import { drawCreature, drawParameters, drawFood, fadeScreen } from './animation.js';

// キャンバスの初期化
const canvas = document.getElementById('zenCanvas');
const ctx = canvas.getContext('2d');

// 状態管理
let lastTime = Date.now();
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let mousePresent = false;
let showParameters = false;
const creatures = [];
const foods = [];

// キャンバスのリサイズ処理
function resizeCanvas() {
    canvas.width = Math.floor(window.innerWidth);
    canvas.height = Math.floor(window.innerHeight);
}

// イベントリスナーの設定
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
}

// 餌の作成
function createFood(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (let i = 0; i < 20; i++) {
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

// 生き物の初期化
function initializeCreatures() {
    const settings = window.otakZen || defaultSettings;
    
    // 小さな生き物の作成
    for (let i = 0; i < settings.smallCreatureCount; i++) {
        creatures.push(createSmallCreature(canvas.width, canvas.height));
    }
    
    // 錦鯉の作成
    for (let i = 0; i < settings.koiCount; i++) {
        creatures.push(createKoi(canvas.width, canvas.height));
    }
}

// 餌の更新
function updateFoods() {
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        food.age++;
        
        // 古くなった餌を削除
        if (food.age > food.lifespan) {
            foods.splice(i, 1);
            continue;
        }
        
        // 食べられた判定
        let isEaten = false;
        for (const creature of creatures) {
            const dx = food.x - creature.x;
            const dy = food.y - creature.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const eatingDistance = creature.type === 'koi' ? creature.size * 2 : creature.size;
            if (distance < eatingDistance) {
                isEaten = true;
                break;
            }
        }
        
        if (isEaten) {
            foods.splice(i, 1);
        }
    }
}

// メインのアニメーションループ
function animate() {
    fadeScreen(ctx, canvas);
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // 餌の更新と描画
    updateFoods();
    foods.forEach(food => drawFood(ctx, food));
    
    // 通常の生き物を集める（群れの計算用）
    const normalCreatures = creatures.filter(c => c.type === 'normal');
    
    // 生き物の更新と描画
    creatures.forEach(creature => {
        updateCreature(creature, deltaTime, mouseX, mouseY, mousePresent, foods, normalCreatures, canvas);
        drawCreature(ctx, creature);
        
        if (showParameters) {
            drawParameters(ctx, creature);
        }
    });
    
    requestAnimationFrame(animate);
}

// アプリケーションの初期化
function initialize() {
    resizeCanvas();
    setupEventListeners();
    initializeCreatures();
    animate();
}

// VSCodeからのメッセージハンドラー
window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'updateCounts') {
        creatures.length = 0;
        
        for (let i = 0; i < message.smallCreatureCount; i++) {
            creatures.push(createSmallCreature(canvas.width, canvas.height));
        }
        
        for (let i = 0; i < message.koiCount; i++) {
            creatures.push(createKoi(canvas.width, canvas.height));
        }
    }
});

// アプリケーションの開始
initialize();