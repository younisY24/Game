export function updateHUD(score) {
    document.getElementById('score').textContent = score.toLocaleString();
    document.getElementById('time').textContent = Math.floor(score / 100);
    
    // تحديث عرض القدرات
    if (typeof updatePowerUpUI === 'function') {
        updatePowerUpUI();
    }
}

export function showDeathScreen(score) {
    document.getElementById('final-score').textContent = score.toLocaleString();
    document.getElementById('death-overlay').style.display = 'flex';
}
