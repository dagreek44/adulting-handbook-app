import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// =============================================================================
// Shared types — kept here for backward compatibility with existing imports.
// `SupabaseReminder` represents a user's active task as displayed in the UI;
// historically it was a row from the `reminders` table, but the actual data
// source today is `user_tasks` (via ReminderContext). The shape is preserved
// so existing components (RemindersView, ReminderEditMode, etc.) compile.
// =============================================================================

export interface SupabaseReminder {
  id: string;
  title: string;
  description: string;
  frequency: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  due_date: string | null;
  video_url: string | null;
  instructions: string[];
  tools: any[];
  supplies: any[];
  enabled: boolean;
  is_custom: boolean;
  assignees: string[];
  created_at: string;
  updated_at: string;
  isPastDue?: boolean;
  assignedToNames?: string[];
  family_id?: string | null;
  main_category?: string;
  subcategory?: string;
}

export interface UserTask {
  id: string;
  reminder_id: string;
  completed_date: string | null;
  family_id: string;
  enabled: boolean;
  due_date: string;
  frequency: string;
  frequency_days: number;
  reminder_type: string;
  created_at: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  video_url: string | null;
  instructions: string[];
  tools: any[];
  supplies: any[];
  assignees: string[];
  is_custom: boolean;
  updated_at: string;
  isPastDue?: boolean;
  assignedToNames?: string[];
  assigneeUsername?: string;
  last_completed: string | null;
  next_due: string;
  status: string;
}

export interface CompletedTask {
  id: string;
  reminder_id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  completed_date: string;
  created_at: string;
  completed_by?: string | null;
  completed_by_name?: string;
}

export interface FamilyMember {
  id: string;
  profile_id: string | null;
  name: string;
  email: string;
  role: 'Parent' | 'Child';
  invited_at: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'pending' | 'expired';
}

// =============================================================================
// useSupabaseData — slimmed to family members only.
// All other data flows (reminders, user tasks, completed, badges) live in
// dedicated services: ReminderContext, useBadges, ReminderService, etc.
// =============================================================================

export const useSupabaseData = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFamilyMembers = useCallback(async (): Promise<FamilyMember[]> => {
    const familyId = userProfile?.family_id;
    if (!familyId) {
      setFamilyMembers([]);
      return [];
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.warn('fetchFamilyMembers: no active session yet, skipping');
        return [];
      }

      // Active members: users in this family + their role
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, created_at, updated_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (usersError) throw usersError;

      const userIds = (usersData || []).map(u => u.id);
      let rolesByUser = new Map<string, 'Parent' | 'Child'>();
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        rolesByUser = new Map(
          (rolesData || []).map(r => [
            r.user_id,
            (r.role === 'child' ? 'Child' : 'Parent') as 'Parent' | 'Child',
          ])
        );
      }

      const activeMembers: FamilyMember[] = (usersData || []).map(u => ({
        id: u.id,
        profile_id: u.id,
        name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
        email: u.email,
        role: rolesByUser.get(u.id) ?? 'Parent',
        invited_at: u.created_at,
        created_at: u.created_at,
        updated_at: u.updated_at,
        status: 'active',
      }));

      // Pending invitations: not yet signed up
      const { data: invitationsData } = await supabase
        .from('family_invitations')
        .select('id, invitee_email, status, expires_at, created_at, role')
        .eq('family_id', familyId)
        .eq('status', 'pending');

      const now = new Date();
      const pendingMembers: FamilyMember[] = (invitationsData || []).map(inv => ({
        id: inv.id,
        profile_id: null,
        name: inv.invitee_email,
        email: inv.invitee_email,
        role: ((inv as any).role === 'Child' ? 'Child' : 'Parent') as 'Parent' | 'Child',
        invited_at: inv.created_at,
        created_at: inv.created_at,
        updated_at: inv.created_at,
        status: new Date(inv.expires_at) < now ? 'expired' : 'pending',
      }));

      const allMembers = [...activeMembers, ...pendingMembers];
      setFamilyMembers(allMembers);
      return allMembers;
    } catch (error: any) {
      console.error('Error fetching family members:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        familyId,
      });
      return [];
    }
  }, [userProfile?.family_id]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFamilyMembers().finally(() => setLoading(false));
  }, [user, userProfile?.family_id, fetchFamilyMembers]);

  return {
    familyMembers,
    loading,
    fetchFamilyMembers,
  };
};
