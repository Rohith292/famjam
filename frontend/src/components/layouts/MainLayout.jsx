// src/layouts/MainLayout.jsx
import React from 'react';
import Navbar from '../../components/Navbar'; // Adjust path if your Navbar is elsewhere
import Sidebar from '../../components/Sidebar'; // Assuming you have a Sidebar component

function MainLayout({ children }) { // `children` will be the page component rendered by React Router
    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            {/* Top Navbar */}
            <Navbar /> 

            {/* Main content area (below Navbar, next to Sidebar) */}
            <div className="flex flex-1"> {/* This div takes all remaining vertical space and is a horizontal flex container */}
                {/* Left Sidebar */}
                <Sidebar /> 

                {/* Page Content Area */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children} {/* This is where your routed page component (HomePage, PhotoAlbumsPage, etc.) will render */}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;