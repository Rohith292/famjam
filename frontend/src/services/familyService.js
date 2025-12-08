//import { getFamilyMemberByGroup } from '../../../backend/src/controllers/family.controller';
import { axiosInstance } from '../lib/axios'; // Import your Axios API client instance

const familyService = {
  /**
   * Fetches the entire family map for the current user.
   * Can also fetch a map via shareId or ownerId for public/collaborated access.
   * @param {object} params - Optional: { shareId: string } or { ownerId: string }
   * @returns {Promise<object>} - The family map data.
   */
  getFamilyMap: async (params = {}) => {
    try {
      console.log("Fetching family map from URL:", axiosInstance.defaults.baseURL + '/family/map'); // DEBUG LOG
      const response = await axiosInstance.get('/family/map', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching family map:", error);
      throw error; // Re-throw to be handled by the component
    }
  },

  /**
   * Fetches details for a specific family member.
   * @param {string} id - The ID of the family member.
   * @param {object} params - Optional: { shareId: string } for public access.
   * @returns {Promise<object>} - The family member data.
   */
  getFamilyMember: async (id, params = {}) => {
    try {
      console.log("Fetching family member from URL:", axiosInstance.defaults.baseURL + `/family/${id}`); // DEBUG LOG
      const response = await axiosInstance.get(`/family/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching family member ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adds a new family member.
   * @param {object} memberData - The data for the new family member.
   * @returns {Promise<object>} - The newly created family member data.
   */
  addFamilyMember: async (memberData) => {
    try {
      // ADD THIS DEBUG LOG
      console.log("Adding family member to URL:", axiosInstance.defaults.baseURL + '/family/add');
      console.log("Data being sent:", memberData);

      const response = await axiosInstance.post('/family/add', memberData);
      return response.data;
    } catch (error) {
      console.error("Error adding family member:", error);
      throw error;
    }
  },

  /**
   * Updates an existing family member.
   * @param {string} id - The ID of the family member to update.
   * @param {object} memberData - The updated data for the family member.
   * @returns {Promise<object>} - The updated family member data.
   */
  updateFamilyMember: async (id, memberData) => {
    try {
      console.log("Updating family member to URL:", axiosInstance.defaults.baseURL + `/family/${id}`); // DEBUG LOG
      const response = await axiosInstance.put(`/family/${id}`, memberData);
      return response.data;
    } catch (error) {
      console.error(`Error updating family member ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a family member.
   * @param {string} id - The ID of the family member to delete.
   * @returns {Promise<object>} - Confirmation message.
   */
  deleteFamilyMember: async (id) => {
    try {
      console.log("Deleting family member from URL:", axiosInstance.defaults.baseURL + `/family/${id}`); // DEBUG LOG
      const response = await axiosInstance.delete(`/family/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting family member ${id}:`, error);
      throw error;
    }
  },
  getCollaborations: async () => {
                try {
                    const response = await axiosInstance.get('/family/collaborations');
                    return response.data;
                } catch (error) {
                    throw error.response?.data?.message || error.message;
                }
            },
 getFamilyMemberByGroup: async (groupId) => { // This is the correct method name
    try {
      // The URL generated here must match your backend route for fetching group members
      console.log("Fetching family members for group from URL:", axiosInstance.defaults.baseURL + `/family/group/${groupId}`); // ADD THIS DEBUG LOG
      const response = await axiosInstance.get(`/family/group/${groupId}`); // THIS IS THE CALL
      return response.data;
    } catch (error) {
      console.error(`Error fetching family members for group ${groupId}:`, error);
      throw error;
    }
  }
};

export default familyService;
