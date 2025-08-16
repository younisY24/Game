document.getElementById('game-hud-container').innerHTML = `
    <div class="hud">
        <div class="score-display">الدرجة: <span id="score">0</span></div>
        <div class="time-display">الوقت: <span id="time">0</span>s</div>
        <div class="power-controls">
            <button id="freeze-btn">إيقاف الزمن</button>
            <button id="jump-btn">قفزة المستقبل</button>
        </div>
    </div>
    <div class="freeze-effect"></div>
`;

// تحديث عرض القدرات بشكل دوري
setInterval(() => {
    if (typeof updatePowerUpUI === 'function') {
        updatePowerUpUI();
    }
}, 1000);
