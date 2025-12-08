// frontend/src/components/familyGroups/GroupPhotoAlbums.jsx

import React, { useEffect, useState } from 'react';
import { MdPhotoAlbum, MdAdd } from 'react-icons/md';
import albumService from '../../services/albumService';
import AlbumCard from '../albums/AlbumCard';
import Modal from '../common/Modal';
import CreateAlbumModal from '../albums/CreateAlbumModal';
import EditAlbumModal from '../albums/EditAlbumModal'; // Import the new EditAlbumModal
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function GroupPhotoAlbums({ groupId, groupName }) {
    const navigate = useNavigate(); // Add useNavigate hook
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);
    const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false); // New state for edit modal
    const [albumToEdit, setAlbumToEdit] = useState(null); // New state to hold album to edit

    const fetchGroupAlbums = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await albumService.getAlbumsByFamilyGroup(groupId);
            setAlbums(data || []);
        } catch (err) {
            console.error("Failed to fetch group albums:", err);
            setError(err.message || "Failed to load albums for this group.");
            toast.error(err.message || "Failed to load albums.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupAlbums();
    }, [groupId]);

    const handleAlbumCreated = () => {
        setIsCreateAlbumModalOpen(false);
        toast.success("Album created successfully!");
        fetchGroupAlbums();
    };

    const handleAlbumUpdated = () => {
        setIsEditAlbumModalOpen(false);
        toast.success("Album updated successfully!");
        fetchGroupAlbums();
    };

    const handleAlbumDeleted = () => {
        fetchGroupAlbums();
    };

    const handleEditClick = (album) => {
        setAlbumToEdit(album);
        setIsEditAlbumModalOpen(true);
    };

    const handleAlbumClick = (albumId) => {
        // Navigate to the new group album details page
        navigate(`/family-groups/${groupId}/albums/${albumId}`);
    };


    return (
        // Replaced hardcoded bg-gray-800 with theme-aware bg-base-200
        <div className="mt-8 bg-base-200 p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
                {/* Replaced hardcoded text-white with theme-aware text-base-content */}
                <h3 className="text-2xl font-semibold text-base-content flex items-center gap-2">
                    <MdPhotoAlbum className="h-6 w-6 text-info" /> Photo Albums for "{groupName}"
                </h3>
                <button
                    className="btn btn-primary text-primary-content rounded-md"
                    onClick={() => setIsCreateAlbumModalOpen(true)}
                >
                    <MdAdd className="h-5 w-5" />
                    Create Album
                </button>
            </div>

            {isLoading && (
                // Replaced hardcoded text-gray-400 with theme-aware text-base-content opacity
                <div className="p-4 text-base-content opacity-70 text-center flex items-center justify-center">
                    <span className="loading loading-spinner loading-sm mr-2"></span> Loading albums...
                </div>
            )}

            {error && (
                // Replaced hardcoded text-red-400 with theme-aware text-error
                <div className="p-4 text-error">Error loading albums: {error}</div>
            )}

            {!isLoading && !error && albums.length === 0 && (
                // Replaced hardcoded bg-gray-700, text-gray-400, and text-gray-500
                // with theme-aware classes
                <div className="text-center p-6 bg-base-100 rounded-lg">
                    <p className="text-xl text-base-content opacity-70">No albums have been created for this group yet.</p>
                    <p className="text-md text-base-content opacity-50 mt-2">Create the first one to get started!</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                {albums.map(album => (
                    <AlbumCard
                        key={album._id}
                        album={album}
                        onAlbumDeleted={handleAlbumDeleted}
                        onEditClick={handleEditClick} // Pass the edit handler
                        onAlbumClick={handleAlbumClick} // Pass the click handler for navigation
                    />
                ))}
            </div>

            {/* Create Album Modal */}
            <Modal
                isOpen={isCreateAlbumModalOpen}
                onClose={() => setIsCreateAlbumModalOpen(false)}
                title={`Create New Album for "${groupName}"`}
            >
                <CreateAlbumModal
                    onAlbumCreated={handleAlbumCreated}
                    sharedWithGroups={[groupId]}
                    onClose={() => setIsCreateAlbumModalOpen(false)}
                />
            </Modal>

            {/* Edit Album Modal */}
            <Modal
                isOpen={isEditAlbumModalOpen}
                onClose={() => setIsEditAlbumModalOpen(false)}
                title={`Edit Album: "${albumToEdit?.name}"`}
            >
                {albumToEdit && (
                    <EditAlbumModal
                        album={albumToEdit}
                        onClose={() => setIsEditAlbumModalOpen(false)}
                        onAlbumUpdated={handleAlbumUpdated}
                    />
                )}
            </Modal>

        </div>
    );
}

export default GroupPhotoAlbums;
