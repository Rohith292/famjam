// frontend/src/components/albums/EditAlbumModal.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import albumService from '../../services/albumService';
import { MdSave, MdCancel } from 'react-icons/md';

function EditAlbumModal({ album, onClose, onAlbumUpdated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Pre-populate form fields when the modal opens with the current album data
        if (album) {
            setName(album.name);
            setDescription(album.description || '');
        }
    }, [album]); // Re-run when the 'album' prop changes

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!name.trim()) {
            toast.error("Album name cannot be empty.");
            setIsLoading(false);
            return;
        }

        try {
            const updatedAlbum = await albumService.updateAlbum(album._id, { name, description });
            toast.success("Album updated successfully!");
            onAlbumUpdated(updatedAlbum); // Notify parent component (PhotoAlbumsPage) to refresh
            onClose(); // Close the modal
        } catch (error) {
            console.error("Error updating album:", error);
            toast.error(error.message || "Failed to update album.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4">
            <div className="form-control mb-4">
                <label className="label">
                    {/* Replaced hardcoded text-gray-300 with theme-aware text-base-content */}
                    <span className="label-text text-base-content">Album Name</span>
                </label>
                <input
                    type="text"
                    placeholder="Enter album name"
                    // Replaced hardcoded colors with theme-aware DaisyUI input classes
                    className="input input-bordered w-full focus:border-primary text-base-content"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
            <div className="form-control mb-6">
                <label className="label">
                    {/* Replaced hardcoded text-gray-300 with theme-aware text-base-content */}
                    <span className="label-text text-base-content">Description (Optional)</span>
                </label>
                <textarea
                    placeholder="Brief description of the album"
                    // Replaced hardcoded colors with theme-aware DaisyUI textarea classes
                    className="textarea textarea-bordered h-24 w-full focus:border-primary text-base-content"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                ></textarea>
            </div>
            <div className="modal-action flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline btn-secondary text-base-content"
                    disabled={isLoading}
                >
                    <MdCancel className="h-5 w-5 mr-1 text-base-content" /> Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="loading loading-spinner"></span>
                    ) : (
                        <MdSave className="h-5 w-5 mr-1" />
                    )}
                    Save Changes
                </button>
            </div>
        </form>
    );
}

export default EditAlbumModal;
