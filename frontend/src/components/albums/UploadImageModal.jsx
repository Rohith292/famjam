// frontend/src/components/albums/UploadImageModal.jsx
import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import albumService from '../../services/albumService';
import { MdOutlineImage, MdClose } from 'react-icons/md';

function UploadImageModal({ albumId, onImagesUploaded, onClose }) {
    const [files, setFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));

        setFiles(prevFiles => [...prevFiles, ...imageFiles]);

        const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    };

    const handleRemoveFile = (indexToRemove) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        setPreviewUrls(prevUrls => {
            const newUrls = prevUrls.filter((_, index) => index !== indexToRemove);
            URL.revokeObjectURL(prevUrls[indexToRemove]);
            return newUrls;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (files.length === 0) {
            toast.error("Please select at least one image to upload.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await albumService.uploadImagesToAlbum(albumId, files);

            if (response.failed && response.failed.length > 0) {
                toast.error(`Some images failed to upload: ${response.failed.map(f => f.filename).join(', ')}`);
            } else {
                toast.success(response.message || "Images uploaded successfully!");
            }
            onImagesUploaded();
            onClose();
        } catch (error) {
            console.error("Failed to upload images:", error);
            toast.error(error.message || "Failed to upload images.");
        } finally {
            setIsLoading(false);
            setFiles([]);
            setPreviewUrls([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
            <div className="form-control">
                <label className="label">
                    {/* Replaced hardcoded text-gray-300 with theme-aware text-base-content */}
                    <span className="label-text text-base-content">Select Images:</span>
                </label>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    // Replaced hardcoded colors with DaisyUI's theme-aware file-input class
                    className="file-input file-input-bordered w-full focus:border-primary text-accent-content"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isLoading}
                />
            </div>

            {previewUrls.length > 0 && (
                <div 
                    // Replaced hardcoded gray colors with theme-aware base colors
                    className="mt-4 border border-base-300 rounded-lg p-3 bg-base-100"
                >
                    <h3 
                        // Replaced hardcoded text-gray-200 with theme-aware text-base-content
                        className="text-lg font-semibold text-base-content mb-3"
                    >
                        Selected Images ({files.length}):
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {previewUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-base-300">
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    // Replaced hardcoded colors with DaisyUI's btn-error class
                                    className="absolute top-1 right-1 btn btn-xs btn-error btn-circle text-error-content hover:bg-error-focus transition-colors"
                                    title="Remove image"
                                    disabled={isLoading}
                                >
                                    <MdClose className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 mt-4 text-base-content">
                <button
                    type="button"
                    // Replaced hardcoded gray colors with theme-aware btn-ghost
                    className="btn btn-ghost"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary text-primary-content"
                    disabled={isLoading || files.length === 0}
                >
                    {isLoading ? (
                        <>
                            <span className="loading loading-spinner loading-sm text-accent-content"></span>
                            Uploading...
                        </>
                    ) : (
                        `Upload ${files.length > 0 ? `(${files.length})` : ''} Images`
                    )}
                </button>
            </div>
        </form>
    );
}

export default UploadImageModal;
