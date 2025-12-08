// frontend/src/components/albums/CreateAlbumModal.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import albumService from '../../services/albumService';

// MODIFIED: Added a new prop `sharedWithGroups`
function CreateAlbumModal({ onAlbumCreated, onClose, sharedWithGroups = [] }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!name.trim()) {
            toast.error("Album name cannot be empty.");
            setIsLoading(false);
            return;
        }

        try {
            // MODIFIED: Now we pass a single object with all properties
            await albumService.createAlbum({
                name: name.trim(),
                description: description.trim(),
                sharedWithGroups, // This is the new property
            });
            onAlbumCreated();
            onClose();
            toast.success('Album created successfully!');
        } catch (error) {
            console.error("Failed to create album:", error);
            toast.error(error.message || "Failed to create album.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
            <div>
                <label htmlFor="albumName" className="label">
                    {/* Replaced hardcoded text-gray-300 with theme-aware text-base-content */}
                    <span className="label-text text-base-content">Album Name:</span>
                </label>
                <input
                    id="albumName"
                    type="text"
                    placeholder="Enter album name"
                    // Replaced hardcoded colors with theme-aware DaisyUI input classes
                    className="input input-bordered w-full focus:border-primary text-base-content"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                />
            </div>
            <div>
                <label htmlFor="albumDescription" className="label">
                    {/* Replaced hardcoded text-gray-300 with theme-aware text-base-content */}
                    <span className="label-text text-base-content">Description (Optional):</span>
                </label>
                <textarea
                    id="albumDescription"
                    placeholder="Describe your album"
                    // Replaced hardcoded colors with theme-aware DaisyUI textarea classes
                    className="textarea textarea-bordered w-full focus:border-primary text-base-content"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                ></textarea>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button
                    type="button"
                    // Replaced hardcoded colors with theme-aware btn-ghost
                    className="btn btn-ghost text-base-content"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary text-primary-content"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Creating...
                        </>
                    ) : (
                        "Create Album"
                    )}
                </button>
            </div>
        </form>
    );
}

export default CreateAlbumModal;
