import { supabase } from '@/integrations/supabase/client';

export interface FriendGroup {
  id: string;
  name: string;
  created_by: string;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface FriendGroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  invited_by: string | null;
  created_at: string;
}

export class FriendGroupService {
  static async getUserGroups(): Promise<FriendGroup[]> {
    const { data, error } = await supabase
      .from('friend_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as FriendGroup[];
  }

  static async getGroupMembers(groupId: string): Promise<FriendGroupMember[]> {
    const { data, error } = await supabase
      .from('friend_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as FriendGroupMember[];
  }

  static async createGroup(name: string, userId: string, userName: string, userEmail: string): Promise<FriendGroup> {
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('friend_groups')
      .insert({ name, created_by: userId })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add the creator as an active member
    const { error: memberError } = await supabase
      .from('friend_group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        email: userEmail,
        name: userName,
        role: 'creator',
        status: 'active',
        invited_by: userId,
      });

    if (memberError) throw memberError;

    return group as FriendGroup;
  }

  static async inviteMember(groupId: string, inviterId: string, email: string, name: string): Promise<void> {
    // Create pending member entry
    const { error: memberError } = await supabase
      .from('friend_group_members')
      .insert({
        group_id: groupId,
        user_id: null,
        email,
        name,
        role: 'member',
        status: 'pending',
        invited_by: inviterId,
      });

    if (memberError) throw memberError;

    // Create invitation record
    const { error: invError } = await supabase
      .from('friend_group_invitations')
      .insert({
        group_id: groupId,
        inviter_id: inviterId,
        invitee_email: email,
        status: 'pending',
      });

    if (invError) throw invError;
  }

  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_group_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  static async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  }

  static async acceptPendingInvitations(email: string): Promise<void> {
    const { error } = await supabase.rpc('accept_friend_group_invitation', {
      p_invitation_email: email,
    });

    if (error) {
      console.error('Error accepting friend group invitations:', error);
    }
  }
}
