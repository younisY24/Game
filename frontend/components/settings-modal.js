document.getElementById('settings-modal').innerHTML = `
    <div class="modal-overlay">
        <div class="modal-content">
            <h2>إعدادات اللعبة</h2>
            
            <div class="setting-item">
                <label>مستوى الصوت</label>
                <input type="range" id="volume" min="0" max="100" value="70">
            </div>
            
            <div class="setting-item">
                <label>الوضع الليلي</label>
                <input type="checkbox" id="dark-mode">
            </div>
            
            <div class="setting-item">
                <label>الوضع الكامل</label>
                <button id="fullscreen-btn">تفعيل</button>
            </div>
            
            <button id="close-settings" class="close-btn">إغلاق</button>
        </div>
    </div>
`;

// أحداث العناصر
document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').remove();
});

document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.getElementById('fullscreen-btn').textContent = 'إلغاء';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        document.getElementById('fullscreen-btn').textContent = 'تفعيل';
    }
});

document.getElementById('volume').addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    // في الإنتاج: ضبط صوت الموسيقى
    console.log(`Volume set to: ${volume}`);
});

document.getElementById('dark-mode').addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.style.background = 'linear-gradient(135deg, #0a0e2a, #1a1f3f, #0a0e2a)';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c)';
    }
});
