// frontend/src/services/albumService.js
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast'; // We'll add a toast for createAlbum success

const albumService = {
    // MODIFIED: createAlbum now accepts a single albumData object
    createAlbum: async (albumData) => {
        try {
            const response = await axiosInstance.post('/albums', albumData);
            toast.success('Album created successfully!'); // Added a success toast
            return response.data.album;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            throw message;
        }
    },

    getAlbums: async () => {
        try {
            const response = await axiosInstance.get('/albums');
            return response.data.albums;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // NEW: Function to get albums by family group ID
    // This corresponds to the new backend route we created.
    getAlbumsByFamilyGroup: async (groupId) => {
        try {
            const response = await axiosInstance.get(`/albums/group/${groupId}`);
            return response.data.albums;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            throw message;
        }
    },

    // ... (rest of your existing functions remain unchanged) ...
    getAlbumById: async (albumId) => {
        try {
            const response = await axiosInstance.get(`/albums/${albumId}`);
            return response.data.album;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    updateAlbum: async (albumId, albumData) => {
        try {
            const response = await axiosInstance.put(`/albums/${albumId}`, albumData);
            return response.data;
        } catch (error) {
            console.error("Error updating album:", error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Failed to update album.");
        }
    },

    deleteAlbum: async (albumId) => {
        try {
            const response = await axiosInstance.delete(`/albums/${albumId}`);
            return response.data.message;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    uploadImagesToAlbum: async (albumId, files) => {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });

            const response = await axiosInstance.post(`/albums/${albumId}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    getImagesInAlbum: async (albumId) => {
        try {
            const response = await axiosInstance.get(`/albums/${albumId}/images`);
            return response.data.images;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    deleteImageFromAlbum: async (albumId, imageId) => {
        try {
            const response = await axiosInstance.delete(`/albums/${albumId}/images/${imageId}`);
            return response.data.message;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },
};

export default albumService;