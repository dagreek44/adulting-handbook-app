
import { useState } from 'react';
import { X, Plus, Users, Mail, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

interface FamilyMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: FamilyMember[];
  onUpdateMembers: (members: FamilyMember[]) => void;
}

const FamilyMembersModal = ({ isOpen, onClose, familyMembers, onUpdateMembers }: FamilyMembersModalProps) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '' });
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

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
      const { error } = await supabase
        .from('family_invitations')
        .insert({
          inviter_id: user.id,
          invitee_email: inviteData.email,
          family_id: userProfile.family_id,
          status: 'pending'
        });

      if (error) throw error;

      setInviteData({ name: '', email: '' });
      setShowInviteForm(false);
      
      toast({
        title: "Invitation Sent! 📧",
        description: `${inviteData.name} has been invited to join your family. They'll join when they create their account.`,
        duration: 5000,
      });

      // Refresh family members list to potentially show updated pending invitations
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = (memberId: string) => {
    const updatedMembers = familyMembers.filter(member => member.id !== memberId);
    onUpdateMembers(updatedMembers);
    
    toast({
      title: "Member Removed",
      description: "Family member has been removed from your household.",
      duration: 3000,
    });
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
          {/* Current Members */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Current Members</h3>
            <div className="space-y-2">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      member.role === 'Admin' ? 'bg-sage/20 text-sage' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  {member.role !== 'Admin' && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite Form */}
          {showInviteForm ? (
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
          ) : (
            <button
              onClick={() => setShowInviteForm(true)}
              className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Invite Family Member
            </button>
          )}

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
