import { useState, useEffect } from 'react';
import { X, Plus, Users, Mail, Trash2, UserPlus, ChevronRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FriendGroupService, FriendGroup, FriendGroupMember } from '@/services/FriendGroupService';

interface FriendGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendGroupsModal = ({ isOpen, onClose }: FriendGroupsModalProps) => {
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FriendGroup | null>(null);
  const [members, setMembers] = useState<FriendGroupMember[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteData, setInviteData] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (isOpen && user?.id) {
      loadGroups();
      // Accept any pending invitations
      if (user.email) {
        FriendGroupService.acceptPendingInvitations(user.email).then(() => loadGroups());
      }
    }
  }, [isOpen, user?.id]);

  const loadGroups = async () => {
    try {
      const data = await FriendGroupService.getUserGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadMembers = async (groupId: string) => {
    try {
      const data = await FriendGroupService.getGroupMembers(groupId);
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleSelectGroup = async (group: FriendGroup) => {
    setSelectedGroup(group);
    await loadMembers(group.id);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user?.id) return;
    setIsLoading(true);
    try {
      const userName = userProfile?.first_name
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
        : user.email?.split('@')[0] || 'User';
      
      await FriendGroupService.createGroup(newGroupName.trim(), user.id, userName, user.email || '');
      await loadGroups();
      setNewGroupName('');
      setShowCreateForm(false);
      toast({ title: "Group Created! 🎉", description: `"${newGroupName}" has been created.` });
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({ title: "Error", description: error.message || "Failed to create group.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteData.name.trim() || !inviteData.email.trim() || !selectedGroup || !user?.id) return;
    setIsLoading(true);
    try {
      await FriendGroupService.inviteMember(selectedGroup.id, user.id, inviteData.email, inviteData.name);
      await loadMembers(selectedGroup.id);
      setInviteData({ name: '', email: '' });
      setShowInviteForm(false);
      toast({ title: "Invitation Sent! 📧", description: `${inviteData.name} has been invited to ${selectedGroup.name}.` });
    } catch (error: any) {
      console.error('Error inviting member:', error);
      const msg = error.message?.includes('limit') ? 'Group member limit reached (max 10).' : error.message || 'Failed to invite member.';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (member: FriendGroupMember) => {
    try {
      await FriendGroupService.removeMember(member.id);
      await loadMembers(selectedGroup!.id);
      toast({ title: "Member Removed", description: `${member.name} has been removed from the group.` });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
    }
  };

  const handleDeleteGroup = async (group: FriendGroup) => {
    try {
      await FriendGroupService.deleteGroup(group.id);
      setSelectedGroup(null);
      await loadGroups();
      toast({ title: "Group Deleted", description: `"${group.name}" has been deleted.` });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({ title: "Error", description: "Failed to delete group.", variant: "destructive" });
    }
  };

  const isCreator = (group: FriendGroup) => group.created_by === user?.id;

  const renderGroupList = () => (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No friend groups yet. Create one to get started!</p>
      ) : (
        <div className="space-y-2">
          {groups.map(group => (
            <div key={group.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <button onClick={() => handleSelectGroup(group)} className="flex-1 text-left">
                <p className="font-medium text-gray-800">{group.name}</p>
                <p className="text-xs text-gray-500">{isCreator(group) ? 'Created by you' : 'Member'}</p>
              </button>
              <div className="flex items-center gap-2">
                {isCreator(group) && (
                  <button onClick={() => handleDeleteGroup(group)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm ? (
        <div className="bg-sage/10 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-gray-800">Create Friend Group</h3>
          <Input
            placeholder="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div className="flex space-x-2">
            <Button onClick={handleCreateGroup} disabled={isLoading || !newGroupName.trim()} className="bg-sage hover:bg-sage/90">
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Friend Group
        </button>
      )}
    </div>
  );

  const renderGroupDetail = () => (
    <div className="space-y-4">
      <button onClick={() => { setSelectedGroup(null); setShowInviteForm(false); }} className="flex items-center text-sage hover:text-sage/80">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to groups
      </button>

      <h3 className="font-semibold text-gray-800 text-lg">{selectedGroup?.name}</h3>

      {/* Active members */}
      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Members</h4>
        <div className="space-y-2">
          {members.filter(m => m.status === 'active').map(member => (
            <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{member.role}</span>
              </div>
              {isCreator(selectedGroup!) && member.user_id !== user?.id && (
                <button onClick={() => handleRemoveMember(member)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {members.filter(m => m.status === 'pending').length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Pending</h4>
          <div className="space-y-2">
            {members.filter(m => m.status === 'pending').map(member => (
              <div key={member.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-gray-800">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800">Pending</span>
                </div>
                {isCreator(selectedGroup!) && (
                  <button onClick={() => handleRemoveMember(member)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      {isCreator(selectedGroup!) && (
        showInviteForm ? (
          <div className="bg-sage/10 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-gray-800">Invite Member</h3>
            <Input placeholder="Full Name" value={inviteData.name} onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })} />
            <Input type="email" placeholder="Email Address" value={inviteData.email} onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} />
            <div className="flex space-x-2">
              <Button onClick={handleInviteMember} disabled={isLoading || !inviteData.name.trim() || !inviteData.email.trim()} className="bg-sage hover:bg-sage/90">
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Invite'}
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInviteForm(true)}
            className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors flex items-center justify-center"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Invite Member
          </button>
        )
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
            <Users className="w-6 h-6 mr-2 text-sage" />
            Friend Groups
          </DialogTitle>
        </DialogHeader>
        {selectedGroup ? renderGroupDetail() : renderGroupList()}
      </DialogContent>
    </Dialog>
  );
};

export default FriendGroupsModal;
