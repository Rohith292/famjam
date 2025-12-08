// frontend/src/components/Sidebar.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineFamilyRestroom, MdShare, MdAnalytics, MdPhotoAlbum, MdGroups } from 'react-icons/md';

function Sidebar({ activeTab }) {
  const navigate = useNavigate();

  return (
    // FIX: Replaced `bg-gray-800` with `bg-base-300`
    // This background color will now change with the selected theme.
    <aside className="w-64 bg-base-300 p-5 shadow-lg rounded-tr-lg rounded-br-lg pt-26">
      <ul className="menu p-2 space-y-2">
        <li>
          <a
            className={`flex items-center gap-3 text-lg font-medium rounded-lg px-4 py-2 cursor-pointer
              ${activeTab === 'familyTree' ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'}`}
            onClick={() => navigate('/')}
          >
            <MdOutlineFamilyRestroom className="h-6 w-6" />
            My Family Tree
          </a>
        </li>
        <li>
          <a
            className={`flex items-center gap-3 text-lg font-medium rounded-lg px-4 py-2 cursor-pointer
              ${activeTab === 'sharing' ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'}`}
            onClick={() => navigate('/sharing')}
          >
            <MdShare className="h-6 w-6" />
            Sharing & Collaborators
          </a>
        </li>
        <li>
          <a
            className={`flex items-center gap-3 text-lg font-medium rounded-lg px-4 py-2 cursor-pointer
              ${activeTab === 'photoAlbums' ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'}`}
            onClick={() => navigate('/albums')}
          >
            <MdPhotoAlbum className="h-6 w-6" />
            Photo Albums
          </a>
        </li>
        <li>
          <a
            className={`flex items-center gap-3 text-lg font-medium rounded-lg px-4 py-2 cursor-pointer
              ${activeTab === 'familyGroups' ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'}`}
            onClick={() => navigate('/family-groups')}
          >
            <MdGroups className="h-6 w-6" />
            Family Groups
          </a>
        </li>
        <li>
          <a
            className={`flex items-center gap-3 text-lg font-medium rounded-lg px-4 py-2 cursor-pointer
              ${activeTab === 'analytics' ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'}`}
            onClick={() => navigate('/analytics')}
          >
            <MdAnalytics className="h-6 w-6" />
            FamBot
          </a>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
