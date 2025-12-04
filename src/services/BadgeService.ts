import { supabase } from '@/integrations/supabase/client';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  category: 'starter' | 'completion' | 'streak';
  maxProgress: number;
  icon: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Starter Badges
  {
    key: 'getting_started',
    name: 'Getting Started',
    description: 'Complete your first reminder',
    category: 'starter',
    maxProgress: 1,
    icon: 'rocket'
  },
  {
    key: 'habit_explorer',
    name: 'Habit Explorer',
    description: 'Create your first custom reminder',
    category: 'starter',
    maxProgress: 1,
    icon: 'compass'
  },
  {
    key: 'family_helper',
    name: 'Family Helper',
    description: 'Complete a task assigned to someone else in the family',
    category: 'starter',
    maxProgress: 1,
    icon: 'users'
  },
  // Task Completion Badges
  {
    key: 'consistency_champ',
    name: 'Consistency Champ',
    description: '10 tasks completed',
    category: 'completion',
    maxProgress: 10,
    icon: 'medal'
  },
  {
    key: 'dedicated_doer',
    name: 'Dedicated Doer',
    description: '25 tasks completed',
    category: 'completion',
    maxProgress: 25,
    icon: 'award'
  },
  {
    key: 'adulting_pro',
    name: 'Adulting Pro',
    description: '50 tasks completed',
    category: 'completion',
    maxProgress: 50,
    icon: 'star'
  },
  {
    key: 'household_hero',
    name: 'Household Hero',
    description: '100 tasks completed',
    category: 'completion',
    maxProgress: 100,
    icon: 'crown'
  },
  // Streak Badges
  {
    key: 'one_day_wonder',
    name: 'One-Day Wonder',
    description: '1-day streak',
    category: 'streak',
    maxProgress: 1,
    icon: 'zap'
  },
  {
    key: 'weekly_warrior',
    name: 'Weekly Warrior',
    description: '7-day streak',
    category: 'streak',
    maxProgress: 7,
    icon: 'flame'
  },
  {
    key: 'monthly_master',
    name: 'Monthly Master',
    description: '30-day streak',
    category: 'streak',
    maxProgress: 30,
    icon: 'calendar'
  },
  {
    key: 'never_forgetter',
    name: 'Never Forgetter',
    description: 'Maintain a streak with zero late tasks',
    category: 'streak',
    maxProgress: 1,
    icon: 'brain'
  }
];

export interface UserBadge {
  id: string;
  user_id: string;
  family_id: string;
  badge_key: string;
  progress: number;
  max_progress: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

export interface BadgeWithDefinition extends BadgeDefinition {
  progress: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

class BadgeService {
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }

    return (data || []) as UserBadge[];
  }

  async getBadgesWithProgress(userId: string): Promise<BadgeWithDefinition[]> {
    const userBadges = await this.getUserBadges(userId);
    const badgeMap = new Map(userBadges.map(b => [b.badge_key, b]));

    return BADGE_DEFINITIONS.map(def => {
      const userBadge = badgeMap.get(def.key);
      return {
        ...def,
        progress: userBadge?.progress || 0,
        isUnlocked: userBadge?.is_unlocked || false,
        unlockedAt: userBadge?.unlocked_at || null
      };
    });
  }

  async updateBadgeProgress(
    userId: string,
    familyId: string,
    badgeKey: string,
    progress: number
  ): Promise<void> {
    const definition = BADGE_DEFINITIONS.find(d => d.key === badgeKey);
    if (!definition) return;

    const { error } = await supabase.rpc('update_badge_progress', {
      p_user_id: userId,
      p_family_id: familyId,
      p_badge_key: badgeKey,
      p_progress: Math.min(progress, definition.maxProgress),
      p_max_progress: definition.maxProgress
    });

    if (error) {
      console.error('Error updating badge progress:', error);
    }
  }

  async checkAndUpdateBadges(
    userId: string,
    familyId: string,
    stats: {
      totalCompleted: number;
      customRemindersCreated: number;
      familyTasksCompleted: number;
      currentStreak: number;
      hasZeroLateTasks: boolean;
    }
  ): Promise<void> {
    // Starter badges
    if (stats.totalCompleted >= 1) {
      await this.updateBadgeProgress(userId, familyId, 'getting_started', 1);
    }
    if (stats.customRemindersCreated >= 1) {
      await this.updateBadgeProgress(userId, familyId, 'habit_explorer', 1);
    }
    if (stats.familyTasksCompleted >= 1) {
      await this.updateBadgeProgress(userId, familyId, 'family_helper', 1);
    }

    // Completion badges
    await this.updateBadgeProgress(userId, familyId, 'consistency_champ', stats.totalCompleted);
    await this.updateBadgeProgress(userId, familyId, 'dedicated_doer', stats.totalCompleted);
    await this.updateBadgeProgress(userId, familyId, 'adulting_pro', stats.totalCompleted);
    await this.updateBadgeProgress(userId, familyId, 'household_hero', stats.totalCompleted);

    // Streak badges
    if (stats.currentStreak >= 1) {
      await this.updateBadgeProgress(userId, familyId, 'one_day_wonder', 1);
    }
    await this.updateBadgeProgress(userId, familyId, 'weekly_warrior', stats.currentStreak);
    await this.updateBadgeProgress(userId, familyId, 'monthly_master', stats.currentStreak);
    if (stats.hasZeroLateTasks && stats.currentStreak >= 7) {
      await this.updateBadgeProgress(userId, familyId, 'never_forgetter', 1);
    }
  }
}

export const badgeService = new BadgeService();
