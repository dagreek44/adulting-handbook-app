import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { badgeService, BadgeWithDefinition, BADGE_DEFINITIONS } from '@/services/BadgeService';
import { supabase } from '@/integrations/supabase/client';

export const useBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeWithDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    if (!user?.id) {
      setBadges(BADGE_DEFINITIONS.map(def => ({
        ...def,
        progress: 0,
        isUnlocked: false,
        unlockedAt: null
      })));
      setLoading(false);
      return;
    }

    try {
      const badgesWithProgress = await badgeService.getBadgesWithProgress(user.id);
      setBadges(badgesWithProgress);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateBadgesAfterTaskComplete = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch user's family_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.family_id) {
        console.error('Error fetching user family:', userError);
        return;
      }

      const familyId = userData.family_id;

      // Count total completed tasks
      const { count: totalCompleted } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('completed_by', user.id)
        .not('completed_date', 'is', null);

      // Count custom reminders created
      const { count: customReminders } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_custom', true);

      // Count family tasks completed (tasks where user_id != completed_by)
      const { data: familyTasks } = await supabase
        .from('user_tasks')
        .select('user_id, completed_by')
        .eq('completed_by', user.id)
        .not('completed_date', 'is', null);
      
      const familyTasksCompleted = familyTasks?.filter(t => t.user_id !== user.id).length || 0;

      // Calculate streak (simplified - count consecutive days with completions)
      const { data: completions } = await supabase
        .from('user_tasks')
        .select('completed_date')
        .eq('completed_by', user.id)
        .not('completed_date', 'is', null)
        .order('completed_date', { ascending: false });

      let currentStreak = 0;
      if (completions && completions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const uniqueDates = [...new Set(completions.map(c => c.completed_date))].sort().reverse();
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const completionDate = new Date(uniqueDates[i]);
          completionDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          if (completionDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
          } else if (i === 0 && completionDate.getTime() === new Date(today.setDate(today.getDate() - 1)).getTime()) {
            // Allow yesterday as start of streak
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Check for late tasks
      const { count: lateTasks } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('due_date', new Date().toISOString().split('T')[0])
        .eq('enabled', true)
        .is('completed_date', null);

      await badgeService.checkAndUpdateBadges(user.id, familyId, {
        totalCompleted: totalCompleted || 0,
        customRemindersCreated: customReminders || 0,
        familyTasksCompleted,
        currentStreak,
        hasZeroLateTasks: (lateTasks || 0) === 0
      });

      // Refresh badges
      await fetchBadges();
    } catch (error) {
      console.error('Error updating badges:', error);
    }
  }, [user?.id, fetchBadges]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    badges,
    loading,
    refreshBadges: fetchBadges,
    updateBadgesAfterTaskComplete
  };
};
