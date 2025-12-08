// frontend/src/pages/AlbumDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import albumService from '../services/albumService';
import Modal from '../components/common/Modal';
import UploadImageModal from '../components/albums/UploadImageModal';
import ImageCard from '../components/albums/ImageCard'; 
import { MdUpload, MdArrowBack } from 'react-icons/md';

function AlbumDetailsPage() {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const fetchAlbumDetailsAndImages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedAlbum = await albumService.getAlbumById(albumId);
            setAlbum(fetchedAlbum);
            const fetchedImages = await albumService.getImagesInAlbum(albumId);
            setImages(fetchedImages);
        } catch (err) {
            console.error("Error fetching album details or images:", err);
            setError(err.message || "Failed to load album details.");
            toast.error(err.message || "Failed to load album details.");
            if (err.message && (err.message.includes("Album not found") || err.message.includes("not authorized"))) {
                setTimeout(() => navigate('/albums'), 2000); 
            }
        } finally {
            setIsLoading(false);
        }
    }, [albumId, navigate]);

    useEffect(() => {
        fetchAlbumDetailsAndImages();
    }, [fetchAlbumDetailsAndImages]);

    const handleImagesUploaded = () => {
        setIsUploadImageModalOpen(false);
        toast.success("Images uploaded successfully!");
        fetchAlbumDetailsAndImages();
    };

    const handleImageDeleted = () => {
        toast.success("Image deleted successfully!");
        fetchAlbumDetailsAndImages();
    };

    const handleImageCardClick = (image) => {
        setSelectedImage(image);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-base-content flex-1 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-2">Loading album and images...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-error flex-1 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Error!</h2>
                <p>{error}</p>
                <p>Please check the album ID or your permissions.</p>
                <button
                    onClick={() => navigate('/albums')}
                    className="btn btn-secondary mt-4"
                >
                    <MdArrowBack /> Go to Photo Albums
                </button>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="p-8 text-center text-base-content flex-1 flex items-center justify-center">
                <p>Album not found or not accessible.</p>
                <button
                    onClick={() => navigate('/albums')}
                    className="btn btn-secondary mt-4"
                >
                    <MdArrowBack /> Go to Photo Albums
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 text-base-content flex-1 flex flex-col">
            {/* TOP HEADER ROW: Back button and Upload button */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/albums')}
                    // Removed hardcoded text-gray-400, relying on btn-ghost for theme-aware color
                    className="btn btn-primary  gap-2"
                    title="Back to Albums"
                >
                    <MdArrowBack className="h-6 w-6" />
                    <span className="hidden sm:inline">Back to Albums</span>
                </button>
                <button
                    className="btn btn-primary text-primary-content rounded-md hover:shadow-xl transition-all duration-200 shadow-none"
                    onClick={() => setIsUploadImageModalOpen(true)}
                >
                    <MdUpload className="h-5 w-5" />
                    Upload Images
                </button>
            </div>

            {/* SECOND HEADER ROW: Album name and description with clear labels */}
            <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-base-content flex items-center gap-2">
                    {/* Replaced hardcoded text-gray-500 with theme-aware text-base-content opacity */}
                    <span className="text-lg font-semibold text-base-content opacity-70">Album Name:</span>
                    <span>{album.name}</span>
                </h2>
                <p className="text-lg text-base-content opacity-70 mt-2 flex items-center gap-2">
                    {/* Replaced hardcoded text-gray-500 with theme-aware text-base-content opacity */}
                    <span className="font-semibold text-base-content opacity-70">Album Description:</span>
                    <span>{album.description || "No description provided."}</span>
                </p>
            </div>

            {/* Images Grid or Placeholder */}
            {images.length === 0 ? (
                <div 
                    // Replaced hardcoded bg-gray-800 with theme-aware bg-base-200
                    className="text-center p-10 bg-base-200 rounded-lg shadow-lg"
                >
                    {/* Replaced hardcoded gray text colors with theme-aware text-base-content */}
                    <p className="text-xl text-base-content opacity-70">There are no images in this album yet.</p>
                    <p className="text-md text-base-content opacity-50 mt-2">Click "Upload Images" to add some!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map(image => (
                        <ImageCard
                            key={image._id}
                            image={image}
                            albumId={albumId}
                            onImageDeleted={handleImageDeleted}
                            onImageClick={handleImageCardClick}
                        />
                    ))}
                </div>
            )}

            {/* Upload Image Modal */}
            <Modal
                isOpen={isUploadImageModalOpen}
                onClose={() => setIsUploadImageModalOpen(false)}
                title={`Upload Images to "${album.name}"`}
            >
                <UploadImageModal
                    albumId={albumId}
                    onImagesUploaded={handleImagesUploaded}
                    onClose={() => setIsUploadImageModalOpen(false)}
                />
            </Modal>

            {/* Lightbox Modal */}
            {selectedImage && (
                <Modal
                    isOpen={!!selectedImage}
                    onClose={closeImageModal}
                    title={selectedImage.filename}
                    size="max-w-4xl"
                >
                    <div className="flex justify-center items-center p-4">
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.filename}
                            className="max-w-full max-h-[80vh] object-contain"
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default AlbumDetailsPage;
