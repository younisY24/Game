/**
 * مسارات المكافآت والتحديات
 * - المكافآت اليومية
 * - الإنجازات
 * - التحديات الأسبوعية
 */

import { getDBConnection } from '../utils/database.js';

// مكافآت الأيام
const DAILY_REWARDS = [
  { day: 1, crystals: 100, streakBonus: 0 },
  { day: 2, crystals: 200, streakBonus: 0 },
  { day: 3, crystals: 300, streakBonus: 0 },
  { day: 4, crystals: 400, streakBonus: 50 },
  { day: 5, crystals: 500, streakBonus: 100 },
  { day: 6, crystals: 600, streakBonus: 150 },
  { day: 7, crystals: 1000, streakBonus: 300 }
];

// تعريفات الإنجازات
const ACHIEVEMENTS = [
  {
    id: 'daily_streak',
    name: 'الالتزام اليومي',
    description: 'المطالبة بمكافأة يومية لمدة 7 أيام متتالية',
    icon: '📅',
    threshold: 7,
    reward: { crystals: 500 }
  },
  {
    id: 'ad_master',
    name: 'ساحر الإعلانات',
    description: 'مشاهدة 5 إعلانات',
    icon: '📺',
    threshold: 5,
    reward: { crystals: 200 }
  },
  {
    id: 'crystal_collector',
    name: 'جامع الكريستالات',
    description: 'جمع 1000 كريستال',
    icon: '💎',
    threshold: 1000,
    reward: { crystals: 500 }
  }
];

// جلب حالة المكافأة اليومية
export const getDailyRewardStatus = async (req, res) => {
  try {
    const { playerId } = req.params;
    const db = await getDBConnection();
    
    // جلب بيانات اللاعب
    const player = await db.prepare(`
      SELECT daily_reward_day, last_daily_reward, crystals, ad_views
      FROM players 
      WHERE id = ?
    `).bind(playerId).first();
    
    if (!player) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }
    
    // حساب حالة المكافأة
    const now = new Date();
    const lastReward = player.last_daily_reward 
      ? new Date(player.last_daily_reward) 
      : null;
    
    let canClaim = false;
    let resetStreak = false;
    let currentDay = player.daily_reward_day || 1;
    
    if (!lastReward) {
      // أول مكافأة
      canClaim = true;
    } else {
      const diffDays = Math.floor((now - lastReward) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 1) {
        canClaim = true;
        if (diffDays > 1) {
          resetStreak = true;
          currentDay = 1;
        }
      }
    }
    
    // التأكد من أن اليوم ضمن النطاق
    if (currentDay > DAILY_REWARDS.length) {
      currentDay = 1;
    }
    
    // الحصول على تفاصيل المكافأة
    const reward = DAILY_REWARDS.find(r => r.day === currentDay) || 
                  DAILY_REWARDS[0];
    
    res.json({
      canClaim,
      day: currentDay,
      resetStreak,
      reward: {
        crystals: reward.crystals,
        streakBonus: reward.streakBonus,
        total: reward.crystals + reward.streakBonus
      },
      lastClaimed: player.last_daily_reward,
      currentStreak: currentDay
    });
    
  } catch (error) {
    console.error('Daily reward status error:', error);
    res.status(500).json({ 
      error: 'فشل في جلب حالة المكافأة',
      details: error.message 
    });
  }
};

// المطالبة بمكافأة يومية
export const claimDailyReward = async (req, res) => {
  try {
    const { playerId } = req.params;
    const db = await getDBConnection();
    
    // جلب بيانات اللاعب
    const player = await db.prepare(`
      SELECT daily_reward_day, last_daily_reward, crystals
      FROM players 
      WHERE id = ?
    `).bind(playerId).first();
    
    if (!player) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }
    
    // التحقق من إمكانية المطالبة
    const now = new Date();
    const lastReward = player.last_daily_reward 
      ? new Date(player.last_daily_reward) 
      : null;
    
    if (lastReward) {
      const diffDays = Math.floor((now - lastReward) / (1000 * 60 * 60 * 24));
      if (diffDays < 1) {
        return res.status(400).json({ 
          error: 'لم يحن الوقت بعد',
          details: 'يمكنك المطالبة بمكافأة يومية واحدة' 
        });
      }
    }
    
    // تحديد اليوم الحالي
    let currentDay = player.daily_reward_day || 1;
    const reward = DAILY_REWARDS.find(r => r.day === currentDay) || 
                  DAILY_REWARDS[0];
    
    // حساب المكافأة مع مكافأة السلسلة
    const totalCrystals = reward.crystals + (reward.streakBonus || 0);
    
    // تحديث رصيد اللاعب
    const newCrystals = (player.crystals || 0) + totalCrystals;
    const nextDay = currentDay < DAILY_REWARDS.length ? currentDay + 1 : 1;
    
    // تحديث بيانات اللاعب
    await db.prepare(`
      UPDATE players 
      SET crystals = ?, 
          daily_reward_day = ?,
          last_daily_reward = datetime('now')
      WHERE id = ?
    `).bind(newCrystals, nextDay, playerId).run();
    
    // التحقق من إنجاز السلسلة اليومية
    let achievementUnlocked = null;
    if (currentDay === 7) {
      // تحقق من إنجاز السلسلة
      const achievement = ACHIEVEMENTS.find(a => a.id === 'daily_streak');
      achievementUnlocked = {
        id: achievement.id,
        name: achievement.name,
        reward: achievement.reward
      };
      
      // تحديث إنجازات اللاعب
      await db.prepare(`
        UPDATE players 
        SET achievements = json_insert(achievements, '$[#]', ?)
        WHERE id = ?
      `).bind(achievement.id, playerId).run();
      
      // منح مكافأة الإنجاز
      await db.prepare(`
        UPDATE players 
        SET crystals = crystals + ?
        WHERE id = ?
      `).bind(achievement.reward.crystals, playerId).run();
    }
    
    res.json({
      success: true,
      crystalsEarned: totalCrystals,
      totalCrystals: newCrystals,
      day: currentDay,
      nextDay,
      streakBonus: reward.streakBonus,
      achievementUnlocked
    });
    
  } catch (error) {
    console.error('Claim daily reward error:', error);
    res.status(500).json({ 
      error: 'فشل في المطالبة بالمكافأة',
      details: error.message 
    });
  }
};

// جلب الإنجازات
export const getAchievements = async (req, res) => {
  try {
    const { playerId } = req.params;
    const db = await getDBConnection();
    
    // جلب بيانات اللاعب
    const player = await db.prepare(`
      SELECT achievements, crystals, ad_views
      FROM players 
      WHERE id = ?
    `).bind(playerId).first();
    
    if (!player) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }
    
    // تحضير بيانات الإنجازات
    const playerAchievements = player.achievements 
      ? JSON.parse(player.achievements) 
      : [];
    
    const achievementsData = ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: playerAchievements.includes(achievement.id),
      progress: calculateAchievementProgress(
        player, 
        achievement
      )
    }));
    
    res.json({
      achievements: achievementsData,
      totalUnlocked: playerAchievements.length
    });
    
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ 
      error: 'فشل في جلب الإنجازات',
      details: error.message 
    });
  }
};

// حساب تقدم الإنجاز
function calculateAchievementProgress(player, achievement) {
  switch (achievement.id) {
    case 'daily_streak':
      // يتم حسابه في المطالبة اليومية
      return 0;
    case 'ad_master':
      return Math.min(1, (player.ad_views || 0) / achievement.threshold);
    case 'crystal_collector':
      return Math.min(1, (player.crystals || 0) / achievement.threshold);
    default:
      return 0;
  }
}

// تعيين مسارات المكافآت
export const setupRewardRoutes = (app) => {
  app.get('/api/rewards/daily/:playerId', getDailyRewardStatus);
  app.post('/api/rewards/daily/:playerId', claimDailyReward);
  app.get('/api/rewards/achievements/:playerId', getAchievements);
};
