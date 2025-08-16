export function checkCollisions(player, obstacles, powerUps) {
    // التحقق من اصطدام اللاعب بالعقبات
    for (const obstacle of obstacles) {
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            return true; // اصطدام
        }
    }
    
    // التحقق من جمع القدرات
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (
            player.x < powerUps[i].x + powerUps[i].width &&
            player.x + player.width > powerUps[i].x &&
            player.y < powerUps[i].y + powerUps[i].height &&
            player.y + player.height > powerUps[i].y
        ) {
            // جمع القدرة
            if (powerUps[i].type === 'crystal') {
                // زيادة النقاط
                window.score += 50;
            } else {
                // شحن طاقة القفزة
                window.futureJumpCooldown = Math.max(0, window.futureJumpCooldown - 2000);
            }
            powerUps.splice(i, 1);
        }
    }
    
    return false; // لا اصطدام
}
