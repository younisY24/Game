document.getElementById('shop-modal').innerHTML = `
    <div class="modal-overlay">
        <div class="modal-content shop-content">
            <h2>متجر التطويرات</h2>
            
            <div class="shop-items">
                <div class="shop-item" data-cost="500">
                    <img src="assets/skin1.png" alt="الشكل 1">
                    <h3>الشكل الافتراضي</h3>
                    <p>مجاني</p>
                </div>
                <div class="shop-item" data-cost="1000">
                    <img src="assets/skin2.png" alt="الشكل 2">
                    <h3>النجم الساطع</h3>
                    <p>1000 كريستال</p>
                </div>
                <div class="shop-item" data-cost="1500">
                    <img src="assets/skin3.png" alt="الشكل 3">
                    <h3>الوحش الزمني</h3>
                    <p>1500 كريستال</p>
                </div>
            </div>
            
            <div class="player-balance">
                رصيدك: <span id="player-crystals">0</span> كريستال
            </div>
            
            <button id="close-shop" class="close-btn">إغلاق</button>
        </div>
    </div>
`;

// تحميل رصيد اللاعب
async function loadPlayerBalance() {
    try {
        const profile = await getPlayerProfile();
        document.getElementById('player-crystals').textContent = 
            profile.crystals.toLocaleString();
    } catch (error) {
        console.error('Error loading balance:', error);
    }
}

// أحداث العناصر
document.getElementById('close-shop').addEventListener('click', () => {
    document.getElementById('shop-modal').remove();
});

document.querySelectorAll('.shop-item').forEach(item => {
    item.addEventListener('click', () => {
        const cost = parseInt(item.dataset.cost);
        const balance = parseInt(document.getElementById('player-crystals').textContent.replace(/,/g, ''));
        
        if (cost === 0 || balance >= cost) {
            alert('تم شراء الشكل الجديد!');
            // في الإنتاج: حفظ التغيير في الـ API
            document.getElementById('player-crystals').textContent = 
                (balance - cost).toLocaleString();
        } else {
            alert('رصيد غير كافي!');
        }
    });
});

loadPlayerBalance();
