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
      // Ensure we have an authenticated session before querying RLS-protected tables.
      // On native (Capacitor) startup, the session may not be restored yet on the
      // first render, causing RLS to silently deny the query.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.warn('fetchFamilyMembers: no active session yet, skipping');
        return [];
      }

      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('id, name, email, role, invited_at, created_at, updated_at, profile_id, family_id')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      const { data: invitationsData } = await supabase
        .from('family_invitations')
        .select('invitee_email, status, expires_at')
        .eq('family_id', familyId);

      const invitationsMap = new Map(
        (invitationsData || []).map(inv => [inv.invitee_email, inv])
      );
      const now = new Date();

      const allMembers: FamilyMember[] = (membersData || []).map(member => {
        const invitation = invitationsMap.get(member.email);
        let status: 'active' | 'pending' | 'expired' = 'active';
        if (!member.profile_id) {
          if (invitation) {
            status = new Date(invitation.expires_at) < now ? 'expired' : 'pending';
          } else {
            status = 'pending';
          }
        }
        return {
          id: member.id,
          profile_id: member.profile_id,
          name: member.name,
          email: member.email,
          role: (member.role as 'Parent' | 'Child') ?? 'Parent',
          invited_at: member.invited_at,
          created_at: member.created_at,
          updated_at: member.updated_at,
          status,
        };
      });

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
      // Don't surface a destructive toast — on native startup this can fire
      // repeatedly while the auth session is being restored. The UI will
      // simply show no members and recover on the next render.
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
