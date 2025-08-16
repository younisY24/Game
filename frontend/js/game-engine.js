import Player from './player.js';
import { createObstacle, updateObstacles } from './obstacles.js';
import { handlePowerUps, activateTimeFreeze, activateFutureJump } from './power-ups.js';
import { checkCollisions } from './physics.js';
import { updateHUD, showDeathScreen } from './ui-manager.js';
import { playBackgroundMusic, playSound } from './audio-manager.js';
import { showAd } from './ads-integration.js';

// إعدادات اللعبة
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
let gameSpeed = 3;
let score = 0;
let isGameOver = false;
let animationId;
let lastObstacleTime = 0;

// عناصر اللعبة
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const player = new Player(GAME_WIDTH, GAME_HEIGHT);
const obstacles = [];
const powerUps = [];

// بدء اللعبة
function initGame() {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // بدء الموسيقى
    playBackgroundMusic();
    
    // بدء الحلقة الرئيسية
    gameLoop(0);
}

// الحلقة الرئيسية
function gameLoop(timestamp) {
    if (isGameOver) return;
    
    // حساب الفارق الزمني
    const deltaTime = timestamp - lastObstacleTime;
    
    // تحديث العناصر
    updateHUD(score);
    updateObstacles(obstacles, gameSpeed);
    updatePowerUps(powerUps, gameSpeed);
    player.update();
    
    // إنشاء عقبات جديدة
    if (deltaTime > 1500) {
        createObstacle(obstacles, GAME_WIDTH, GAME_HEIGHT);
        lastObstacleTime = timestamp;
    }
    
    // التحقق من الاصطدامات
    if (checkCollisions(player, obstacles, powerUps)) {
        handleGameOver();
        return;
    }
    
    // رسم العناصر
    drawGame();
    
    // زيادة الصعوبة تدريجياً
    score++;
    if (score % 500 === 0) {
        gameSpeed += 0.5;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// رسم العناصر
function drawGame() {
    // خلفية اللعبة
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // رسم الأرض
    ctx.fillStyle = '#4a4e69';
    ctx.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
    
    // رسم اللاعب
    player.draw(ctx);
    
    // رسم العقبات
    obstacles.forEach(obstacle => {
        obstacle.draw(ctx);
    });
    
    // رسم القدرات
    powerUps.forEach(powerUp => {
        powerUp.draw(ctx);
    });
}

// معالجة نهاية اللعبة
function handleGameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    
    // عرض شاشة الموت
    showDeathScreen(score);
    
    // إعداد أحداث الأزرار
    document.getElementById('watch-ad-btn').onclick = () => {
        showAd(() => {
            document.getElementById('death-overlay').style.display = 'none';
            resetGame();
            playSound('continue');
        });
    };
    
    document.getElementById('restart-btn').onclick = () => {
        document.getElementById('death-overlay').style.display = 'none';
        resetGame();
    };
}

// إعادة تعيين اللعبة
function resetGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = 3;
    obstacles.length = 0;
    powerUps.length = 0;
    player.reset();
    lastObstacleTime = 0;
    gameLoop(0);
}

// التعامل مع مفاتيح القدرات
document.getElementById('freeze-btn').addEventListener('click', () => {
    if (activateTimeFreeze()) {
        playSound('powerup');
    }
});

document.getElementById('jump-btn').addEventListener('click', () => {
    if (activateFutureJump()) {
        playSound('powerup');
        score += 300; // مكافأة القفزة
    }
});

// بدء اللعبة عند التحميل
window.addEventListener('load', initGame);
