// frontend/src/components/familyGroups/CreateFamilyGroupModal.jsx
import React, { useState } from 'react';
import useFamilyGroupStore from '../../store/useFamilyGroupStore'; // Your new Zustand store
import Modal from '../common/Modal'; // Assuming you have a reusable Modal component
import { MdAdd } from 'react-icons/md'; // For an icon on the button
import toast from 'react-hot-toast'; // Import toast for user-friendly notifications

function CreateFamilyGroupModal({ isOpen, onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const { createFamilyGroup, isLoadingGroups } = useFamilyGroupStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            // Replace disruptive alert() with a user-friendly toast notification
            toast.error('Group name cannot be empty.');
            return;
        }

        try {
            await createFamilyGroup({ name: groupName, description: groupDescription.trim() });
            setGroupName(''); // Clear form
            setGroupDescription('');
            onClose(); // Close the modal on success
            onGroupCreated(); // Notify parent to re-fetch groups
            toast.success("Family group created successfully!");
        } catch (error) {
            // Error is already handled by toast in the store, but you can add more here if needed
            console.error('Failed to create family group in component:', error);
            toast.error(error.message || "Failed to create group.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Family Group">
            {/* Replaced hardcoded bg-gray-700 with theme-aware bg-base-200 */}
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 bg-base-200 rounded-lg">
                <div>
                    {/* Replaced hardcoded text-gray-300 with theme-aware text-base-content opacity */}
                    <label htmlFor="groupName" className="block text-sm font-medium text-base-content opacity-70 mb-1">
                        Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="groupName"
                        // Replaced hardcoded bg-gray-800, text-gray-100, and placeholder-gray-500
                        // with theme-aware input classes
                        className="input input-bordered w-full"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g., The Johnsons Family"
                        required
                        disabled={isLoadingGroups}
                    />
                </div>
                <div>
                    {/* Replaced hardcoded text-gray-300 with theme-aware text-base-content opacity */}
                    <label htmlFor="groupDescription" className="block text-sm font-medium text-base-content opacity-70 mb-1">
                        Description (Optional)
                    </label>
                    <textarea
                        id="groupDescription"
                        // Replaced hardcoded bg-gray-800, text-gray-100, and placeholder-gray-500
                        // with theme-aware input classes
                        className="textarea textarea-bordered w-full"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        placeholder="A short description of this group..."
                        rows="3"
                        disabled={isLoadingGroups}
                    />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        // Replaced hardcoded gray text with btn-ghost and theme-aware hover effect
                        className="btn btn-ghost"
                        onClick={onClose}
                        disabled={isLoadingGroups}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary text-primary-content"
                        disabled={isLoadingGroups}
                    >
                        {isLoadingGroups ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            <>
                                <MdAdd className="h-5 w-5" />
                                Create Group
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default CreateFamilyGroupModal;
