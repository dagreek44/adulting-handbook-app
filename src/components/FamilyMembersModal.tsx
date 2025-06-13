
import { useState } from 'react';
import { X, Plus, Users, Mail, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleInvite = () => {
    if (!inviteData.name.trim() || !inviteData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both name and email.",
        variant: "destructive",
      });
      return;
    }

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: inviteData.name,
      email: inviteData.email,
      role: 'Member'
    };

    onUpdateMembers([...familyMembers, newMember]);
    setInviteData({ name: '', email: '' });
    setShowInviteForm(false);
    
    toast({
      title: "Invitation Sent! 📧",
      description: `${inviteData.name} has been invited to join your family.`,
      duration: 3000,
    });
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
                  className="bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
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
