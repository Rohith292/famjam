// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useMatch } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SharingAndCollaboratorsPage from './SharingAndCollaboratorsPage';
import FamilyGroupsPage from './FamilyGroupsPage';
import FamilyGroupDetailsContent from '../components/familyGroups/FamilyGroupDetailsContent';
import FamilyTreeContent from '../components/familyGroups/FamilyTreeContent';
import PhotoAlbumsPage from './PhotoAlbumsPage';
import AlbumDetailsPage from './AlbumDetailsPage';
import GroupAlbumDetailsPage from './GroupAlbumDetailsPage';
import AnalyticsChatbot from './AnalyticsChatbot';

// Placeholder for ViewAnalyticsContent
const ViewAnalyticsContent = () => (
    // FIX: Replaced 'text-gray-300' with a theme-aware class
    <div className="p-8 text-center text-base-content/80">
        {/* FIX: Explicitly set heading color for prominence */}
        <h2 className="text-2xl font-bold mb-4 text-base-content">View Analytics</h2>
        <p>This section will display your personalized contact frequency analytics.</p>
        <p>Coming soon: ML-powered insights into your most frequently accessed family members!</p>
    </div>
);

// Main HomePage component that manages tabs and renders content
const HomePage = ({ isAuthenticated }) => {
    // Destructure all URL parameters
    const { uniqueShareId, mapId, groupId: urlGroupId, albumId: urlAlbumId } = useParams();
    const location = useLocation();
    
    // Use useMatch for robust path checks
    const isFamilyGroupsPage = useMatch("/family-groups");
    const isFamilyGroupDetailsPage = useMatch("/family-groups/:groupId");
    const isGroupTreePage = useMatch("/family-groups/:groupId/tree");
    const isPhotoAlbumsPage = useMatch("/albums");
    const isPhotoAlbumDetailsPage = useMatch("/albums/:albumId");
    const isGroupAlbumDetailsPage = useMatch("/family-groups/:groupId/albums/:albumId");
    const isSharePath = location.pathname.startsWith('/share/');
    const isMapPath = location.pathname.startsWith('/map/');
    
    // Determine initial activeTab based on the current URL
    const getActiveTabFromPath = () => {
        if (isPhotoAlbumsPage || isPhotoAlbumDetailsPage) return 'photoAlbums';
        if (isFamilyGroupsPage || isFamilyGroupDetailsPage || isGroupTreePage||isGroupAlbumDetailsPage) return 'familyGroups';
        if (location.pathname === '/sharing') return 'sharing';
        if (location.pathname === '/analytics') return 'analytics';
        // Default to 'familyTree' for home or other non-matching paths
        return 'familyTree';
    };

    // Initialize state with the value from the URL
    const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
    
    // Sync activeTab state with URL changes
    useEffect(() => {
        setActiveTab(getActiveTabFromPath());
    }, [location.pathname]); // Re-run effect whenever the URL changes

    const renderContent = () => {
        // --- URL-based rendering (HIGHEST PRIORITY) ---
        if (isGroupAlbumDetailsPage) {
            return <GroupAlbumDetailsPage />;
        }
        if (isPhotoAlbumDetailsPage) {
            return <AlbumDetailsPage albumId={urlAlbumId} />;
        }
        if (isPhotoAlbumsPage) {
            return <PhotoAlbumsPage />;
        }
        if (isGroupTreePage) {
            return <FamilyTreeContent groupId={urlGroupId} isAuthenticated={isAuthenticated} />;
        }
        if (isFamilyGroupDetailsPage) {
            return <FamilyGroupDetailsContent groupId={urlGroupId} />;
        }
        if (isSharePath) {
            return <FamilyTreeContent shareId={uniqueShareId} isAuthenticated={isAuthenticated} />;
        }
        if (isMapPath && mapId) {
            return <FamilyTreeContent ownerId={mapId} isAuthenticated={isAuthenticated} />;
        }
        
        // --- State-based rendering (FALLBACK) ---
        // This only runs if none of the specific URL matches above were found.
        switch (activeTab) {
            case 'familyTree':
                return <FamilyTreeContent isAuthenticated={isAuthenticated} />;
            case 'sharing':
                return <SharingAndCollaboratorsPage />;
            case 'analytics':
                return <AnalyticsChatbot />;
            case 'photoAlbums':
                return <PhotoAlbumsPage />;
            case 'familyGroups':
                return <FamilyGroupsPage />;
            default:
                return <FamilyTreeContent isAuthenticated={isAuthenticated} />;
        }
    };

    return (
        <div className="flex flex-1">
            {/* Conditional sidebar rendering - Corrected for PhotoAlbumsPage */}
            {!(isGroupTreePage || isSharePath || isMapPath || isPhotoAlbumDetailsPage) && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
            {/* FIX: Replaced 'bg-gray-900' with 'bg-base-100' for a theme-aware background */}
            <main className="flex-1 p-8 overflow-auto bg-base-100 flex flex-col mt-4">
                {renderContent()}
            </main>
        </div>
    );
};

export default HomePage;
