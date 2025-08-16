const achievementsList = [
    { id: 'newbie', name: 'المبتدئ', description: 'الوصول إلى 500 نقطة', icon: '⭐', unlocked: false },
    { id: 'jumper', name: 'القافز المحترف', description: 'جمع 50 كريستال', icon: '💎', unlocked: false },
    { id: 'time_master', name: 'سيد الزمن', description: 'استخدام إيقاف الزمن 10 مرات', icon: '⏳', unlocked: false },
    { id: 'speed_runner', name: 'عابر السرعة', description: 'الوصول إلى 5000 نقطة', icon: '⚡', unlocked: false }
];

export function loadAchievements(unlockedAchievements = []) {
    const container = document.getElementById('achievements-list');
    
    // تحميل الإنجازات المفتوحة من الـ API
    const unlockedSet = new Set(unlockedAchievements);
    
    container.innerHTML = achievementsList.map(achievement => `
        <div class="achievement-card ${unlockedSet.has(achievement.id) ? 'unlocked' : ''}">
            <div class="icon">${unlockedSet.has(achievement.id) ? achievement.icon : '❓'}</div>
            <div>
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
            </div>
        </div>
    `).join('');
}

export function checkAchievements(score, crystals, timeFreezeUses) {
    const unlocked = [];
    
    if (score >= 500 && !localStorage.getItem('achievement_newbie')) {
        unlocked.push('newbie');
        localStorage.setItem('achievement_newbie', 'true');
    }
    
    if (crystals >= 50 && !localStorage.getItem('achievement_jumper')) {
        unlocked.push('jumper');
        localStorage.setItem('achievement_jumper', 'true');
    }
    
    if (timeFreezeUses >= 10 && !localStorage.getItem('achievement_time_master')) {
        unlocked.push('time_master');
        localStorage.setItem('achievement_time_master', 'true');
    }
    
    if (score >= 5000 && !localStorage.getItem('achievement_speed_runner')) {
        unlocked.push('speed_runner');
        localStorage.setItem('achievement_speed_runner', 'true');
    }
    
    return unlocked;
}
