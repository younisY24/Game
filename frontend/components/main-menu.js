document.getElementById('main-menu').innerHTML = `
    <div class="menu-container">
        <h1 class="game-title">قفزة الزمن</h1>
        
        <div class="menu-buttons">
            <button id="play-btn">العب الآن</button>
            <button id="leaderboard-btn">لوحة المتصدرين</button>
            <button id="profile-btn">ملفي</button>
            <button id="settings-btn">الإعدادات</button>
        </div>
        
        <div class="daily-reward">
            <h3>مكافأة يومية</h3>
            <div class="reward-grid">
                <div class="reward-day active">
                    <span>1</span>
                    <p>100 كريستال</p>
                </div>
                <div class="reward-day">
                    <span>2</span>
                    <p>200 كريستال</p>
                </div>
                <div class="reward-day">
                    <span>3</span>
                    <p>300 كريستال</p>
                </div>
            </div>
            <button id="claim-reward">المطالبة</button>
        </div>
    </div>
`;

// أحداث الأزرار
document.getElementById('play-btn').addEventListener('click', () => {
    window.location.href = 'game.html';
});

document.getElementById('leaderboard-btn').addEventListener('click', () => {
    window.location.href = 'leaderboard.html';
});

document.getElementById('profile-btn').addEventListener('click', () => {
    window.location.href = 'profile.html';
});

document.getElementById('settings-btn').addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.innerHTML = `<div id="settings-modal"></div>`;
    document.body.appendChild(modal);
    
    import('./settings-modal.js');
});

document.getElementById('claim-reward').addEventListener('click', () => {
    alert('تم المطالبة بمكافأة 100 كريستال!');
    document.querySelector('.reward-day.active').classList.remove('active');
    document.querySelector('.reward-day:nth-child(2)').classList.add('active');
});
