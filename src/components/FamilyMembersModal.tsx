
import { useState, useEffect } from 'react';
import { X, Plus, Users, Mail, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'Parent' | 'Child';
  status: 'active' | 'pending' | 'expired';
}

interface FamilyMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: FamilyMember[];
  onUpdateMembers: (members: FamilyMember[]) => void;
}

const FamilyMembersModal = ({ isOpen, onClose, familyMembers, onUpdateMembers }: FamilyMembersModalProps) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Parent' as 'Parent' | 'Child' });
  const [isInviting, setIsInviting] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { fetchFamilyMembers } = useSupabaseData();

  // Check if current user is parent
  useEffect(() => {
    const checkParentStatus = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'parent' });
      
      if (!error && data) {
        setIsParent(data);
      }
    };
    
    checkParentStatus();
  }, [user]);

  const handleInvite = async () => {
    if (!inviteData.name.trim() || !inviteData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both name and email.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id || !userProfile?.family_id) {
      toast({
        title: "Error",
        description: "Unable to send invitation. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);

    try {
      // Check if user already exists with this email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, family_id')
        .eq('email', inviteData.email)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.family_id === userProfile.family_id) {
          toast({
            title: "Already a Family Member",
            description: "This person is already part of your family.",
            variant: "destructive",
          });
          setIsInviting(false);
          return;
        } else {
          toast({
            title: "User Already Registered",
            description: "This person already has an account with a different family.",
            variant: "destructive",
          });
          setIsInviting(false);
          return;
        }
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('family_invitations')
        .select('id, status')
        .eq('invitee_email', inviteData.email)
        .eq('family_id', userProfile.family_id)
        .maybeSingle();

      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          toast({
            title: "Invitation Already Sent",
            description: "An invitation has already been sent to this email.",
            variant: "destructive",
          });
          setIsInviting(false);
          return;
        }
      }

      // Create family invitation
      const { error: invitationError } = await supabase
        .from('family_invitations')
        .insert({
          inviter_id: user.id,
          invitee_email: inviteData.email,
          family_id: userProfile.family_id,
          status: 'pending'
        });

      if (invitationError) {
        console.error('Invitation error:', invitationError);
        throw new Error(`Failed to create invitation: ${invitationError.message || 'Unknown error'}`);
      }

      // Also create a pending family member entry with the role
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          name: inviteData.name,
          email: inviteData.email,
          role: inviteData.role,
          profile_id: null,
          family_id: userProfile.family_id
        });

      if (memberError) {
        console.error('Family member error:', memberError);
        throw new Error(`Failed to add family member: ${memberError.message || 'Unknown error'}`);
      }

      // Send invitation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-family-invitation', {
          body: {
            to: inviteData.email,
            name: inviteData.name,
            inviterName: `${userProfile.first_name} ${userProfile.last_name}`,
            role: inviteData.role
          }
        });
        
        if (emailError) {
          console.error('Email sending error:', emailError);
          // Don't throw - invitation was created successfully, email is optional
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue - invitation was created successfully
      }

      setInviteData({ name: '', email: '', role: 'Parent' });
      setShowInviteForm(false);
      
      toast({
        title: "Invitation Sent! 📧",
        description: `${inviteData.name} has been invited to join your family. They'll join when they create their account.`,
        duration: 5000,
      });

      // Refresh family members data to show the new pending invitation
      await fetchFamilyMembers();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string, memberStatus: string) => {
    if (!isParent) {
      toast({
        title: "Permission Denied",
        description: "Only parents can remove family members.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (memberStatus === 'pending' || memberStatus === 'expired') {
        // Cancel pending invitation and remove family member entry
        const memberToRemove = familyMembers.find(m => m.id === memberId);
        
        if (memberToRemove) {
          // Delete from family_invitations
          await supabase
            .from('family_invitations')
            .delete()
            .eq('invitee_email', memberToRemove.email);
          
          // Delete from family_members
          const { error } = await supabase
            .from('family_members')
            .delete()
            .eq('id', memberId);

          if (error) throw error;
        }

        toast({
          title: "Invitation Cancelled",
          description: "The invitation has been cancelled.",
          duration: 3000,
        });
      } else {
        // Remove active family member from family_members table
        const { error } = await supabase
          .from('family_members')
          .delete()
          .eq('id', memberId);

        if (error) throw error;
        
        toast({
          title: "Member Removed",
          description: "Family member has been removed from your household.",
          duration: 3000,
        });
      }
      
      // Refresh the family members list
      await fetchFamilyMembers();
      onClose();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
            <Users className="w-6 h-6 mr-2 text-sage" />
            Family Members
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Active Members */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Active Members</h3>
            <div className="space-y-2">
              {familyMembers.filter(member => member.status === 'active').map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                      {member.role}
                    </span>
                  </div>
                  {isParent && (
                    <button
                      onClick={() => removeMember(member.id, member.status)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations */}
          {familyMembers.filter(member => member.status === 'pending' || member.status === 'expired').length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Pending Invitations</h3>
              <div className="space-y-2">
                {familyMembers.filter(member => member.status === 'pending' || member.status === 'expired').map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-gray-800">{member.email}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        member.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {member.status === 'pending' ? 'Invitation Sent' : 'Expired'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeMember(member.id, member.status)}
                      className="text-red-500 hover:text-red-700"
                      title="Cancel invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Form */}
          {isParent && showInviteForm ? (
            <div className="bg-sage/10 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-800">Invite Family Member</h3>
              <Input
                placeholder="Full Name"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
              <Select 
                value={inviteData.role} 
                onValueChange={(value: 'Parent' | 'Child') => setInviteData({ ...inviteData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <button
                  onClick={handleInvite}
                  disabled={isInviting}
                  className="bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isParent ? (
            <button
              onClick={() => setShowInviteForm(true)}
              className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Invite Family Member
            </button>
          ) : null}

          <div className="bg-blue-soft/10 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Family Benefits</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Share reminders across family members</li>
              <li>• Assign tasks to specific people</li>
              <li>• Track household maintenance together</li>
              <li>• Coordinate schedules and responsibilities</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyMembersModal;
