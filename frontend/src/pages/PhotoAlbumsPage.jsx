// frontend/src/pages/PhotoAlbumsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import albumService from '../services/albumService';
import Modal from '../components/common/Modal';
import CreateAlbumModal from '../components/albums/CreateAlbumModal';
import AlbumCard from '../components/albums/AlbumCard';
import { MdAddPhotoAlternate } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import EditAlbumModal from '../components/albums/EditAlbumModal';

function PhotoAlbumsPage() {
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);
    const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false);
    const [albumToEdit, setAlbumToEdit] = useState(null);
    const navigate = useNavigate();

    const fetchAlbums = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await albumService.getAlbums();
            setAlbums(data);
        } catch (err) {
            console.error("Error fetching albums:", err);
            setError(err.message || "Failed to load albums.");
            toast.error(err.message || "Failed to load albums.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    const handleAlbumCreated = () => {
        setIsCreateAlbumModalOpen(false);
        toast.success("Album created successfully!");
        fetchAlbums();
    };

    const handleAlbumDeleted = () => {
        toast.success("Album deleted successfully!");
        fetchAlbums();
    };

    const handleAlbumUpdated = (updatedAlbum) => {
        setIsEditAlbumModalOpen(false);
        toast.success("Album updated successfully!");
        fetchAlbums(); // Refresh the list (or update state directly for better UX)
        // Alternative for better UX:
        // setAlbums(albums.map(a => a._id === updatedAlbum._id ? updatedAlbum : a));
    };

    // NEW HANDLER: Opens the edit modal with the specific album
    const openEditModal = (album) => {
        setAlbumToEdit(album);
        setIsEditAlbumModalOpen(true);
    };

    const handleAlbumClick = (albumId) => {
        navigate(`/albums/${albumId}`);
    };

    if (isLoading) {
        return (
            // Replaced hardcoded text-gray-300 with theme-aware text-base-content
            <div className="p-8 text-center text-base-content flex-1 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-2">Loading photo albums...</p>
            </div>
        );
    }

    if (error) {
        return (
            // Replaced hardcoded text-red-400 with theme-aware text-error
            <div className="p-8 text-center text-error flex-1 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Error!</h2>
                <p>{error}</p>
                <p>Please try again or ensure your backend server is running.</p>
            </div>
        );
    }

    return (
        // Replaced hardcoded text-gray-300 with theme-aware text-base-content
        <div className="p-17 text-base-content flex-1 flex flex-col gap-3">
            <div className="flex justify-between gap-7 items-center mb-7">
                {/* Replaced hardcoded text-white with theme-aware text-base-content */}
                <h2 className="text-3xl font-bold text-base-content">Your Photo Albums</h2>
                <button
                    className="btn btn-primary text-primary-content rounded-md hover:shadow-xl transition-all duration-200 border-none focus:outline-none shadow-none"
                    onClick={() => setIsCreateAlbumModalOpen(true)}
                >
                    <MdAddPhotoAlternate className="h-5 w-5" />
                    Create New Album
                </button>
            </div>

            {albums.length === 0 ? (
                // Replaced hardcoded bg-gray-700 with theme-aware bg-base-200
                <div className="text-center p-10 bg-base-200 rounded-lg">
                    {/* Replaced hardcoded gray text colors with theme-aware text-base-content */}
                    <p className="text-xl text-base-content opacity-70">You haven't created any photo albums yet.</p>
                    <p className="text-md text-base-content opacity-50 mt-2">Click "Create New Album" to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map(album => (
                        <AlbumCard
                            key={album._id}
                            album={album}
                            onAlbumClick={handleAlbumClick}
                            onAlbumDeleted={handleAlbumDeleted}
                            onEditClick={() => openEditModal(album)}
                        />
                    ))}
                </div>
            )}

            <Modal
                isOpen={isCreateAlbumModalOpen}
                onClose={() => setIsCreateAlbumModalOpen(false)}
                title="Create New Photo Album"
            >
                <CreateAlbumModal
                    onAlbumCreated={handleAlbumCreated}
                    onClose={() => setIsCreateAlbumModalOpen(false)}
                />
            </Modal>

            {isEditAlbumModalOpen && albumToEdit && (
                <Modal
                    isOpen={isEditAlbumModalOpen}
                    onClose={() => setIsEditAlbumModalOpen(false)}
                    title={`Edit Album: "${albumToEdit.name}"`}
                >
                    <EditAlbumModal
                        album={albumToEdit}
                        onClose={() => setIsEditAlbumModalOpen(false)}
                        onAlbumUpdated={handleAlbumUpdated}
                    />
                </Modal>
            )}
        </div>
    );
}

export default PhotoAlbumsPage;
