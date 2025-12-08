// frontend/src/services/familyGroupService.js
import {axiosInstance}from "../lib/axios"; // Your Axios instance

const familyGroupService = {
    /**
     * Creates a new family group.
     * @param {object} groupData - { name: string, description?: string }
     * @returns {Promise<object>} The created family group object.
     */
    createFamilyGroup: async (groupData) => {
        try {
            const response = await axiosInstance.post('/family-groups', groupData);
            return response.data;
        } catch (error) {
            console.error("Error creating family group:", error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to create group.");
        }
    },

    /**
     * Gets all family groups the current user belongs to.
     * @returns {Promise<Array<object>>} An array of family group objects.
     */
    getMyFamilyGroups: async () => {
        try {
            const response = await axiosInstance.get('/family-groups/my');
            return response.data;
        } catch (error) {
            console.error("Error fetching user's family groups:", error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to fetch groups.");
        }
    },

    /**
     * Gets a specific family group by ID.
     * @param {string} groupId - The ID of the family group.
     * @returns {Promise<object>} The family group object.
     */
    getFamilyGroupById: async (groupId) => {
        try {
            const response = await axiosInstance.get(`/family-groups/${groupId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching family group ${groupId}:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to fetch group details.");
        }
    },

    /**
     * Sends an invitation to a member by email.
     * @param {string} groupId - The ID of the family group.
     * @param {string} email - The email of the user to invite.
     * @returns {Promise<object>} Response message and invitation token.
     */
    inviteMember: async (groupId, email) => {
        try {
            // Updated endpoint to match the backend route
            const response = await axiosInstance.post(`/family-groups/${groupId}/invite`, { email });
            return response.data;
        } catch (error) {
            console.error(`Error inviting member to group ${groupId}:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to send invitation.");
        }
    },

    /**
     * Accepts a family group invitation using a token.
     * @param {string} token - The invitation token.
     * @returns {Promise<object>} Response message and updated family group.
     */
    acceptInvitation: async (token) => {
        try {
            const response = await axiosInstance.post('/family-groups/invite/accept', { token });
            return response.data;
        } catch (error) {
             console.error(`Error accepting invitation:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to accept invitation.");
        }
    },

    /**
     * Updates an existing family group.
     * @param {string} groupId - The ID of the family group to update.
     * @param {object} updateData - { name?: string, description?: string }
     * @returns {Promise<object>} The updated family group object.
     */
    updateFamilyGroup: async (groupId, updateData) => {
        try {
            const response = await axiosInstance.put(`/family-groups/${groupId}`, updateData);
            return response.data;
        } catch (error) {
            console.error(`Error updating family group ${groupId}:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to update group.");
        }
    },

    // Removed the old addMemberToFamilyGroup function as it's replaced by the invitation system

    /**
     * Removes a member from a family group.
     * @param {string} groupId - The ID of the family group.
     * @param {string} memberId - The ID of the member to remove.
     * @returns {Promise<object>} Response message and updated family group.
     */
    removeMemberFromGroup: async (groupId, memberId) => {
        try {
            const response = await axiosInstance.put(`/family-groups/${groupId}/remove-member`, { memberId });
            return response.data;
        } catch (error) {
            console.error(`Error removing member from group ${groupId}:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to remove member.");
        }
    },

    /**
     * Deletes a family group.
     * @param {string} groupId - The ID of the family group to delete.
     * @returns {Promise<object>} Response message.
     */
    deleteFamilyGroup: async (groupId) => {
        try {
            const response = await axiosInstance.delete(`/family-groups/${groupId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting family group ${groupId}:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to delete group.");
        }
    },

        /**
     * Updates the role of a member in a family group.
     * @param {string} groupId - The ID of the family group.
     * @param {string} memberId - The ID of the member whose role is being updated.
     * @param {string} newRole - The new role to assign (e.g., "admin", "viewer").
     * @returns {Promise<object>} Response message and updated family group.
     */
    updateMemberRole: async (groupId, memberId, newRole) => {
        try {
            const response = await axiosInstance.put(`/family-groups/${groupId}/update-role`, {
                memberId,
                newRole,
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating member role in group ${groupId}:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to update member role.");
        }
    },
    getMyInvitations: async () => {
    try {
        const response = await axiosInstance.get('/family-groups/invitations/my');
        return response.data;
    } catch (error) {
        console.error("Error fetching invitations:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch invitations.");
    }
    },

    /**
     * declines a family group invitation using a token.
     * @param {string} token - The invitation token.
     * @returns {Promise<object>} Response message and updated family group.
     */
    declineInvitation: async (token) => {
        try {
            const response = await axiosInstance.post('/family-groups/invite/decline', { token });
            return response.data;
        } catch (error) {
             console.error(`Error declining invitation:`, error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to decline invitation.");
        }
    },

};

export default familyGroupService;
