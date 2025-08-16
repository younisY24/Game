export function showAd(onReward) {
    // في الإنتاج: استخدم Google Ad Manager
    // هنا نستخدم محاكاة للإعلان
    
    const adOverlay = document.createElement('div');
    adOverlay.style.position = 'fixed';
    adOverlay.style.top = '0';
    adOverlay.style.left = '0';
    adOverlay.style.width = '100%';
    adOverlay.style.height = '100%';
    adOverlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
    adOverlay.style.zIndex = '100';
    adOverlay.style.display = 'flex';
    adOverlay.style.flexDirection = 'column';
    adOverlay.style.alignItems = 'center';
    adOverlay.style.justifyContent = 'center';
    adOverlay.style.color = 'white';
    
    adOverlay.innerHTML = `
        <h2>مشاهدة إعلان</h2>
        <div class="ad-content" style="width: 80%; max-width: 400px; height: 250px; background: #333; margin: 20px 0; border-radius: 10px; overflow: hidden;">
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                محتوى إعلاني
            </div>
        </div>
        <p>سيتم إغلاق الإعلان بعد <span id="countdown">5</span> ثواني...</p>
    `;
    
    document.body.appendChild(adOverlay);
    
    let countdown = 5;
    const countdownEl = adOverlay.querySelector('#countdown');
    
    const timer = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(timer);
            document.body.removeChild(adOverlay);
            onReward();
        }
    }, 1000);
    
    // زر إغلاق مبكر (للتجربة)
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'إغلاق الآن (للاختبار)';
    closeBtn.style.marginTop = '15px';
    closeBtn.onclick = () => {
        clearInterval(timer);
        document.body.removeChild(adOverlay);
        onReward();
    };
    adOverlay.appendChild(closeBtn);
}
