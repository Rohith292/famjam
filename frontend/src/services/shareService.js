import { axiosInstance } from '../lib/axios'; // Import your Axios API client instance

const shareService = {
  /**
   * Generates a new public read-only share link for the user's family map.
   * @returns {Promise<object>} - The generated share link object.
   */
  generateShareLink: async () => {
    try {
      // CHANGED: Sending an empty object as the request body
      const response = await axiosInstance.post('/share/generate-link', {});
      return response.data;
    } catch (error) {
      console.error("Error generating share link:", error);
      throw error;
    }
  },

  /**
   * Revokes an existing public share link.
   * @returns {Promise<object>} - Confirmation message.
   */
  revokeShareLink: async () => {
    try {
      const response = await axiosInstance.delete('/share/revoke-link');
      return response.data;
    } catch (error) {
      console.error("Error revoking share link:", error);
      throw error;
    }
  },

  /**
   * Invites a user to collaborate on the current user's family map.
   * @param {string} inviteeEmail - The email of the user to invite.
   * @param {string} role - The role for the invitee ('viewer' or 'contributor').
   * @returns {Promise<object>} - The new collaboration invitation object.
   */
  inviteCollaborator: async (inviteeEmail, role) => {
    try {
      const response = await axiosInstance.post('/share/collaborate/invite', { inviteeEmail, role });
      return response.data;
    } catch (error) {
      console.error("Error inviting collaborator:", error);
      throw error;
    }
  },

  /**
   * Fetches all collaborations relevant to the current user (as owner or as collaborator).
   * @returns {Promise<object>} - An object containing collaborations as owner and as collaborator.
   */
  getCollaborations: async () => {
    try {
      const response = await axiosInstance.get('/family/collaborations'); // This uses the family route, as per project report
      return response.data;
    } catch (error) {
      console.error("Error fetching collaborations:", error);
      throw error;
    }
  },

  /**
   * Allows the map owner to change a collaborator's role.
   * @param {string} collaborationId - The ID of the collaboration to update.
   * @param {string} newRole - The new role ('viewer' or 'contributor').
   * @returns {Promise<object>} - The updated collaboration object.
   */
  changeCollaboratorRole: async (collaborationId, newRole) => {
    try {
      const response = await axiosInstance.put('/share/collaborate/change-role', { collaborationId, newRole });
      return response.data;
    } catch (error) {
      console.error("Error changing collaborator role:", error);
      throw error;
    }
  },

  /**
   * Allows the map owner to remove a collaborator.
   * @param {string} collaboratorId - The ID of the collaborator to remove.
   * @returns {Promise<object>} - Confirmation message.
   */
  removeCollaborator: async (collaborationId) => { // Changed param name to collaborationId for consistency
    try {
      const response = await axiosInstance.delete(`/share/collaborate/remove/${collaborationId}`); // Use collaborationId in URL
      return response.data;
    } catch (error) {
      console.error("Error removing collaborator:", error);
      throw error;
    }
  },

  /**
   * Allows an invited user to accept a pending collaboration invitation.
   * @param {string} invitationId - The ID of the invitation to accept.
   * @returns {Promise<object>} - The accepted collaboration object.
   */
  acceptInvitation: async (invitationId) => {
    try {
      const response = await axiosInstance.put(`/share/collaborate/accept/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  },
   getShareLink: async () => { // NEW: Function to get the existing link
        try {
            const response = await axiosInstance.get('/share');
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    }
};

export default shareService;
