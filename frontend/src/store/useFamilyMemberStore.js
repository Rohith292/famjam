// frontend/src/store/useFamilyTreeStore.js
import { create } from 'zustand';
import familyService from '../services/familyService'; // Make sure this path is correct

const useFamilyMemberStore = create((set) => ({
    familyMembersInGroup: [], // Renamed to match usage in FamilyGroupDetailsPage
    isLoadingMembers: false,
    membersError: null,

    // This is the key function to inspect!
    fetchFamilyMembersForGroup: async (groupId) => {
        set({ isLoadingMembers: true, membersError: null });
        console.log(`[useFamilyTreeStore] Attempting to fetch members for group ID: ${groupId}`); // Frontend Debug 1

        try {
            // THIS IS THE LINE THAT MATTERS MOST:
            const members = await familyService.getFamilyMemberByGroup(groupId); // <-- Is this calling the correct service method?

            console.log(`[useFamilyTreeStore] Successfully fetched ${members.length} members for group ${groupId}.`); // Frontend Debug 2
            set({ familyMembersInGroup: members, isLoadingMembers: false });
        } catch (error) {
            console.error(`[useFamilyTreeStore] Error fetching family members for group ${groupId}:`, error); // Frontend Debug 3
            set({ membersError: error.message || "Failed to fetch family members for group.", isLoadingMembers: false });
        }
    },

    // ... other family tree related actions (like add, edit, delete family members)
}));

export default useFamilyMemberStore;