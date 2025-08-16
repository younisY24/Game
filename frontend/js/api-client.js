const API_BASE = 'https://time-jump-api.workers.dev';

export async function fetchLeaderboard() {
    try {
        // في الإنتاج: استخدم API حقيقي
        // هنا نستخدم بيانات مزيفة
        return [
            { id: 1, name: 'أحمد', score: 12500, avatar: 'assets/avatar1.png' },
            { id: 2, name: 'سارة', score: 11800, avatar: 'assets/avatar2.png' },
            { id: 3, name: 'محمد', score: 10250, avatar: 'assets/avatar3.png' },
            { id: 4, name: 'فاطمة', score: 9800, avatar: 'assets/avatar4.png' },
            { id: 5, name: 'خالد', score: 8750, avatar: 'assets/avatar5.png' }
        ];
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw new Error('فشل تحميل لوحة المتصدرين');
    }
}

export async function getPlayerProfile() {
    try {
        // في الإنتاج: استخدم API حقيقي
        const savedName = localStorage.getItem('playerName') || `لاعب_${Math.floor(Math.random()*1000)}`;
        const bestScore = parseInt(localStorage.getItem('bestScore') || '0');
        const crystals = parseInt(localStorage.getItem('crystals') || '0');
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        
        return {
            name: savedName,
            bestScore: bestScore,
            crystals: crystals,
            achievements: achievements,
            avatar: 'assets/avatar-default.png'
        };
    } catch (error) {
        console.error('Error loading profile:', error);
        return {
            name: 'لاعب جديد',
            bestScore: 0,
            crystals: 0,
            achievements: [],
            avatar: 'assets/avatar-default.png'
        };
    }
}

export async function updatePlayerName(newName) {
    localStorage.setItem('playerName', newName);
}

export async function saveGameScore(score, crystals) {
    const currentBest = parseInt(localStorage.getItem('bestScore') || '0');
    if (score > currentBest) {
        localStorage.setItem('bestScore', score);
    }
    
    const currentCrystals = parseInt(localStorage.getItem('crystals') || '0');
    localStorage.setItem('crystals', currentCrystals + crystals);
}
