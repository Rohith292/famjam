// frontend/src/store/useFamilyGroupStore.js
import { create } from 'zustand';
import familyGroupService from '../services/familyGroupService';
import toast from 'react-hot-toast';

const useFamilyGroupStore = create((set, get) => ({
    // State for all groups the user is a member of
    myFamilyGroups: [],
    isLoadingGroups: false,
    groupsError: null,

    // State for a currently viewed group (e.g., when viewing group details)
    currentFamilyGroup: null, // Renamed for consistency with backend
    isLoadingCurrentGroup: false,
    currentGroupError: null,

    /**
     * Fetches all family groups the authenticated user belongs to.
     */
    fetchMyFamilyGroups: async () => {
        set({ isLoadingGroups: true, groupsError: null });
        try {
            const groups = await familyGroupService.getMyFamilyGroups();
            set({ myFamilyGroups: groups, isLoadingGroups: false });
        } catch (error) {
            set({ groupsError: error.message, isLoadingGroups: false });
            toast.error(error.message);
        }
    },

    /**
     * Fetches details for a specific family group.
     * @param {string} groupId - The ID of the group to fetch.
     */
    fetchFamilyGroupById: async (groupId) => {
        set({ isLoadingCurrentGroup: true, currentGroupError: null, currentFamilyGroup: null }); // Added currentFamilyGroup: null
        try {
            const group = await familyGroupService.getFamilyGroupById(groupId);
            set({ currentFamilyGroup: group, isLoadingCurrentGroup: false });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch group details.';
            set({ currentGroupError: errorMessage, isLoadingCurrentGroup: false }); // Corrected state update
            toast.error(errorMessage);
        }
    },

    /**
     * Creates a new family group.
     * @param {object} groupData - { name, description }
     */
    createFamilyGroup: async (groupData) => {
        set({ isLoadingGroups: true, groupsError: null });
        try {
            const newGroup = await familyGroupService.createFamilyGroup(groupData);
            set((state) => ({
                myFamilyGroups: [...state.myFamilyGroups, newGroup],
                isLoadingGroups: false
            }));
            toast.success('Family group created successfully!');
            return newGroup;
        } catch (error) {
            set({ groupsError: error.message, isLoadingGroups: false });
            toast.error(error.message);
            throw error;
        }
    },

    /**
     * Sends an invitation to a member to join a group.
     * @param {string} groupId - ID of the group.
     * @param {string} email - Email of the user to invite.
     */
    inviteMemberToGroup: async (groupId, email) => {
        set({ currentGroupError: null }); // Use current group error state for invitation
        try {
            // The backend now returns a success message and token, not the updated group
            await familyGroupService.inviteMember(groupId, email);
             // Re-fetch the group to update the invitations list in the UI
            get().fetchFamilyGroupById(groupId);
            toast.success(`Invitation sent to ${email}!`);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to send invitation.';
            set({ currentGroupError: errorMessage });
            toast.error(errorMessage);
            throw error;
        }
    },

    /**
     * Accepts a family group invitation.
     * @param {string} token - The invitation token.
     */
    acceptGroupInvitation: async (token) => {
         set({ isLoadingGroups: true, groupsError: null }); // Use groups loading state for accepting
        try {
            const response = await familyGroupService.acceptInvitation(token);
            // After accepting, re-fetch the user's groups to update the list
            await get().fetchMyFamilyGroups();
            toast.success(response.message || 'Invitation accepted successfully!');
            // Optionally, you could return the group details if the backend sends them
            return response.familyGroup;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to accept invitation.';
            set({ groupsError: errorMessage, isLoadingGroups: false });
            toast.error(errorMessage);
            throw error;
        }finally{
            set({
                isLoadingGroups:false
            });
        }
    },

    /**
     * Updates an existing family group.
     * @param {string} groupId - ID of the group to update.
     * @param {object} updateData - { name?, description? }
     */
    updateFamilyGroup: async (groupId, updateData) => {
        set({ isLoadingCurrentGroup: true, currentGroupError: null });
        try {
            const updatedGroup = await familyGroupService.updateFamilyGroup(groupId, updateData);
            set((state) => ({
                myFamilyGroups: state.myFamilyGroups.map(group =>
                    group._id === updatedGroup._id ? updatedGroup : group
                ),
                currentFamilyGroup: state.currentFamilyGroup?._id === updatedGroup._id ? updatedGroup : state.currentFamilyGroup,
                isLoadingCurrentGroup: false
            }));
            toast.success('Family group updated successfully!');
            return updatedGroup;
        } catch (error) {
            set({ currentGroupError: error.message, isLoadingCurrentGroup: false });
            toast.error(error.message);
            throw error;
        }
    },

    /**
     * Removes a member from a family group.
     * @param {string} groupId - ID of the group.
     * @param {string} memberId - ID of the member to remove.
     */
    removeMemberFromGroup: async (groupId, memberId) => {
        set({ isLoadingCurrentGroup: true, currentGroupError: null });
        try {
            const response = await familyGroupService.removeMemberFromGroup(groupId, memberId);
            set((state) => ({
                currentFamilyGroup: response.familyGroup, // Backend returns updated group
                isLoadingCurrentGroup: false
            }));
            toast.success(response.message || 'Member removed successfully!');
            return response.familyGroup;
        } catch (error) {
            set({ currentGroupError: error.message, isLoadingCurrentGroup: false });
            toast.error(error.message);
            throw error;
        }
    },

    /**
     * Deletes a family group.
     * @param {string} groupId - ID of the group to delete.
     */
    deleteFamilyGroup: async (groupId) => {
        set({ isLoadingGroups: true, groupsError: null });
        try {
            const response = await familyGroupService.deleteFamilyGroup(groupId);
            set((state) => ({
                myFamilyGroups: state.myFamilyGroups.filter(group => group._id !== groupId),
                isLoadingGroups: false,
                currentFamilyGroup: state.currentFamilyGroup?._id === groupId ? null : state.currentFamilyGroup
            }));
            toast.success(response.message || 'Family group deleted successfully!');
        } catch (error) {
            set({ groupsError: error.message, isLoadingGroups: false });
            toast.error(error.message);
            throw error;
        }
    },
        /**
     * Updates the role of a member in a family group.
     * @param {string} groupId - ID of the group.
     * @param {string} memberId - ID of the member.
     * @param {string} newRole - New role to assign.
     */
    updateMemberRole: async (groupId, memberId, newRole) => {
        set({ isLoadingCurrentGroup: true, currentGroupError: null });
        try {
            const response = await familyGroupService.updateMemberRole(groupId, memberId, newRole);
            console.log("[updateMemberRole] backend response:", response);
            set((state) => ({
                currentFamilyGroup: response.familyGroup, // Backend returns updated group
                isLoadingCurrentGroup: false
            }));
            toast.success(response.message || 'Member role updated successfully!');
            return response.familyGroup;
        } catch (error) {
            set({ currentGroupError: error.message, isLoadingCurrentGroup: false });
            toast.error(error.message);
            throw error;
        }
    },
    myInvitations: [],
    isLoadingInvitations: false,
    invitationsError: null,

    fetchMyInvitations: async () => {
    set({ isLoadingInvitations: true, invitationsError: null });
    try {
        const invitations = await familyGroupService.getMyInvitations();
        set({ myInvitations: invitations, isLoadingInvitations: false });
    } catch (error) {
        set({ invitationsError: error.message, isLoadingInvitations: false });
        toast.error(error.message);
    }
    },

    /**
     * declines a family group invitation.
     * @param {string} token - The invitation token.
     */
    declineGroupInvitation: async (token) => {
         set({ isLoadingGroups: true, groupsError: null }); // Use groups loading state for accepting
        try {
            const response = await familyGroupService.declineInvitation(token);
            // After accepting, re-fetch the user's groups to update the list
            await get().fetchMyInvitations();
            toast.success(response.message || 'Invitation declined successfully!');
            // Optionally, you could return the group details if the backend sends them
            return response.familyGroup;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to decline invitation.';
            set({ groupsError: errorMessage, isLoadingGroups: false });
            toast.error(errorMessage);
            throw error;
        }finally{
            set({
                isLoadingGroups:false
            });
        }
    },


    // Helper to clear current group state when navigating away
    clearCurrentGroup: () => set({ currentFamilyGroup: null, currentGroupError: null, isLoadingCurrentGroup: false }),
}));

export default useFamilyGroupStore;
