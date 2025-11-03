import { supabase } from '@/integrations/supabase/client';

export const acceptPendingInvitations = async (userId: string, userEmail: string) => {
  try {
    console.log('Checking for pending invitations for:', userEmail);
    
    // Check for pending invitations for this email
    const { data: invitations, error: invitationError } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('invitee_email', userEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (invitationError) {
      console.error('Error fetching invitations:', invitationError);
      return;
    }

    if (!invitations || invitations.length === 0) {
      console.log('No pending invitations found');
      return;
    }

    // Take the first pending invitation
    const invitation = invitations[0];
    console.log('Found pending invitation:', invitation);

    // Update user's family_id to match the invitation's family_id
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ family_id: invitation.family_id })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user family:', userUpdateError);
      return;
    }

    console.log('Updated user family_id to:', invitation.family_id);

    // Update the family_members entry to link it to the user profile
    const { error: memberUpdateError } = await supabase
      .from('family_members')
      .update({ profile_id: userId })
      .eq('email', userEmail)
      .eq('family_id', invitation.family_id);

    if (memberUpdateError) {
      console.error('Error updating family member:', memberUpdateError);
    }

    // Mark invitation as accepted
    const { error: invitationUpdateError } = await supabase
      .from('family_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (invitationUpdateError) {
      console.error('Error updating invitation status:', invitationUpdateError);
    }

    console.log('Successfully accepted family invitation');
    return true;
  } catch (error) {
    console.error('Error accepting pending invitations:', error);
    return false;
  }
};
