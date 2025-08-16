let timeFreezeCooldown = 0;
let futureJumpCooldown = 0;
let isTimeFrozen = false;
let timeFreezeDuration = 0;

export function handlePowerUps(player, deltaTime) {
    if (isTimeFrozen) {
        timeFreezeDuration += deltaTime;
        if (timeFreezeDuration >= 2000) {
            isTimeFrozen = false;
            player.isFrozen = false;
            document.querySelector('.freeze-effect').style.display = 'none';
        }
    }
    
    // تحديث Cooldowns
    if (timeFreezeCooldown > 0) {
        timeFreezeCooldown -= deltaTime;
    }
    
    if (futureJumpCooldown > 0) {
        futureJumpCooldown -= deltaTime;
    }
}

export function activateTimeFreeze() {
    if (timeFreezeCooldown <= 0) {
        isTimeFrozen = true;
        timeFreezeDuration = 0;
        document.querySelector('.freeze-effect').style.display = 'block';
        document.getElementById('freeze-btn').classList.add('active');
        setTimeout(() => {
            document.getElementById('freeze-btn').classList.remove('active');
        }, 2000);
        timeFreezeCooldown = 5000;
        return true;
    }
    return false;
}

export function activateFutureJump() {
    if (futureJumpCooldown <= 0) {
        // تقفز 3 ثوانٍ للأمام (مكافأة 300 نقطة)
        document.getElementById('jump-btn').classList.add('active');
        setTimeout(() => {
            document.getElementById('jump-btn').classList.remove('active');
        }, 1000);
        futureJumpCooldown = 8000;
        return true;
    }
    return false;
}

// تحديث عرض Cooldown
export function updatePowerUpUI() {
    const freezeBtn = document.getElementById('freeze-btn');
    const jumpBtn = document.getElementById('jump-btn');
    
    if (timeFreezeCooldown > 0) {
        freezeBtn.innerHTML = `إيقاف الزمن<br>${Math.ceil(timeFreezeCooldown/1000)}`;
        freezeBtn.disabled = true;
    } else {
        freezeBtn.innerHTML = 'إيقاف الزمن';
        freezeBtn.disabled = false;
    }
    
    if (futureJumpCooldown > 0) {
        jumpBtn.innerHTML = `قفزة المستقبل<br>${Math.ceil(futureJumpCooldown/1000)}`;
        jumpBtn.disabled = true;
    } else {
        jumpBtn.innerHTML = 'قفزة المستقبل';
        jumpBtn.disabled = false;
    }
}
