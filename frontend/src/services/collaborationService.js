import {axiosInstance} from "../lib/axios";

const collaborationService = {
    // Send an invitation
    inviteCollaborator: async (email, role) => {
        try {
            const response = await axiosInstance.post('/collaboration/invite', { email, role });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Get all collaborations related to the current user (as owner or as collaborator)
    // This will likely be handled by an existing family/map service, but for completeness,
    // if you had a direct endpoint to fetch this, it would go here.
    // For now, we'll rely on the /api/family/collaborations endpoint if it exists,
    // or just fetch from the SharingAndCollaboratorsPage.jsx directly.
    // Let's assume for now that getCollaborations is handled via familyService or directly in component.

    // Accept an invitation
    acceptInvitation: async (invitationId) => {
        try {
            const response = await axiosInstance.put(`/collaboration/${invitationId}/accept`);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Decline an invitation
    declineInvitation: async (invitationId) => {
        try {
            const response = await axiosInstance.put(`/collaboration/${invitationId}/decline`);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Update a collaborator's role (owner action)
    updateCollaboratorRole: async (collaborationId, newRole) => {
        try {
            const response = await axiosInstance.put(`/collaboration/${collaborationId}/role`, { role: newRole });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Revoke a collaborator's access (owner action)
    revokeCollaboratorAccess: async (collaborationId) => {
        try {
            // Note: This endpoint should set the status to 'revoked' if it's currently 'accepted'.
            // If it's already 'revoked', calling this might just confirm its state or do nothing.
            const response = await axiosInstance.delete(`/collaboration/${collaborationId}/revoke`); // Assuming a PUT to update status
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // NEW: Deletes the collaboration record entirely from the database
    deleteCollaborationRecord: async (collaborationId) => {
        try {
            const response = await axiosInstance.delete(`/collaboration/${collaborationId}`); // Assuming a DELETE to remove the record
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    //method to fetch all the users
    getAllUsers: async () => {
        try {
            const response = await axiosInstance.get(`/users/all`); // Adjust endpoint if needed
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    //user action to cancel an invitation only if not accepted by collaborator
    cancelInvitation:async(invitationId)=>{
        try{
            const response=await axiosInstance.put(`collaboration/${invitationId}/cancel`);
            return response.data;
        } catch(error){
            throw error.response?.data?.message || error.message;
        }
    }
};

export default collaborationService;
