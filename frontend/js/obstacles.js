export function createObstacle(obstacles, gameWidth, gameHeight) {
    // 70% عقبات عادية، 30% قدرات
    if (Math.random() < 0.7) {
        obstacles.push({
            x: gameWidth,
            y: gameHeight - 80 - 50,
            width: 50,
            height: 50,
            speed: 3,
            draw(ctx) {
                ctx.fillStyle = '#d62828';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        });
    } else {
        createPowerUp(obstacles, gameWidth, gameHeight);
    }
}

export function createPowerUp(powerUps, gameWidth, gameHeight) {
    powerUps.push({
        x: gameWidth,
        y: gameHeight - 80 - 40,
        width: 40,
        height: 40,
        type: Math.random() > 0.5 ? 'crystal' : 'energy',
        draw(ctx) {
            if (this.type === 'crystal') {
                ctx.fillStyle = '#4cc9f0';
            } else {
                ctx.fillStyle = '#fcbf49';
            }
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 20, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

export function updateObstacles(obstacles, gameSpeed) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // إزالة العقبات التي خرجت من الشاشة
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

export function updatePowerUps(powerUps, gameSpeed) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].x -= gameSpeed;
        
        // إزالة القدرات التي خرجت من الشاشة
        if (powerUps[i].x + powerUps[i].width < 0) {
            powerUps.splice(i, 1);
        }
    }
}
