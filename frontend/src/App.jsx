// frontend/src/App.jsx

import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Loader } from "lucide-react";

// Import your pages/components
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

// The following imports were not used in the original code, but are kept for reference if needed elsewhere.
// import AlbumDetailsPage from "./pages/AlbumDetailsPage";
// import PhotoAlbumsPage from "./pages/PhotoAlbumsPage";
// import FamilyGroupDetailsPage from "./components/familyGroups/FamilyGroupDetailsContent";
// import FamilyGroupsPage from "./pages/FamilyGroupsPage";
// import GroupAlbumDetailsPage from "./pages/GroupAlbumDetailsPage";

// Import stores
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const App = () => {
    const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
    const { theme } = useThemeStore();

    useEffect(() => {
        // CRITICAL FIX: Always run the auth check on app load.
        checkAuth();
    }, [checkAuth]);

    // NEW FIX: This useEffect will run whenever the 'theme' state changes.
    // It correctly applies the selected DaisyUI theme to the root <html> tag,
    // ensuring the theme is applied globally across the entire application.
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Show a global loader while checking authentication status.
    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="size-10 animate-spin" />
            </div>
        );
    }

    const isAuthenticated = !!authUser;

    return (
        // The data-theme attribute is no longer needed on this div.
        // The useEffect hook above handles setting it on the <html> tag.
        <div className="h-screen flex flex-col ">
            <Navbar />
            <div className="flex-1 flex">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
                    <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />

                    {/* Authenticated Routes */}
                    <Route path="/" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    <Route path="/albums" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    <Route path="/albums/:albumId" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    <Route path="/family-groups" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    <Route path="/family-groups/:groupId" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    
                    {/* NEW ROUTE: Added to handle the new GroupAlbumDetailsPage */}
                    <Route 
                        path="/family-groups/:groupId/albums/:albumId" 
                        element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} 
                    />
                    
                    {/* Other authenticated routes already present */}
                    <Route path="/sharing" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    <Route path="/analytics" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    <Route path="/share/:uniqueShareId" element={<HomePage isAuthenticated={isAuthenticated} />} />
                    <Route path="/map/:mapId" element={<HomePage isAuthenticated={isAuthenticated} />} />
                    <Route path="/family-groups/:groupId/tree" element={authUser ? <HomePage isAuthenticated={isAuthenticated} /> : <Navigate to="/login" />} />
                    <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
                    <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />

                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
            <Toaster />
        </div>
    );
};

export default App;
