// frontend/src/pages/FamilyGroupsPage.jsx

import React, { useEffect, useState } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import useFamilyGroupStore from '../store/useFamilyGroupStore';
import CreateFamilyGroupModal from '../components/familyGroups/CreateFamilyGroupModal';
import FamilyGroupCard from '../components/familyGroups/FamilyGroupCard';
import { MdAdd } from 'react-icons/md';
import { Toaster } from 'react-hot-toast';
import FamilyGroupDetailsContent from '../components/familyGroups/FamilyGroupDetailsContent';
import FamilyTreeContent from '../components/familyGroups/FamilyTreeContent';
import { useAuthStore } from '../store/useAuthStore';

function FamilyGroupsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const isTreePath = useMatch("/family-groups/:groupId/tree");
  const authUser = useAuthStore((state) => state.authUser);

  const {
    myFamilyGroups,
    isLoadingGroups,
    groupsError,
    fetchMyFamilyGroups,
    myInvitations,
    fetchMyInvitations,
    acceptGroupInvitation,
    declineGroupInvitation, // <-- make sure you add this in your store
  } = useFamilyGroupStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!groupId) {
      fetchMyFamilyGroups();
      fetchMyInvitations(); // ✅ load invitations
    }
  }, [groupId, fetchMyFamilyGroups, fetchMyInvitations]);

  const handleCardClick = (id) => {
    navigate(`/family-groups/${id}`);
  };

  const handleAcceptInvite = async (token) => {
    try {
      await acceptGroupInvitation(token);
      await fetchMyFamilyGroups(); // refresh groups
      await fetchMyInvitations();  // refresh invites
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
  };

  const handleDeclineInvite = async (token) => {
    try {
      await declineGroupInvitation(token); // backend sets status = declined
      await fetchMyInvitations();
    } catch (err) {
      console.error("Failed to decline invitation:", err);
    }
  };

  // ✅ Normalize filters for owned vs joined groups
  const ownedGroups = myFamilyGroups.filter((group) =>
    group.members?.some(
      (m) =>
        (m._id === authUser?._id || m.user?._id === authUser?._id) &&
        m.role === "owner"
    )
  );

  const joinedGroups = myFamilyGroups.filter((group) =>
    group.members?.some(
      (m) =>
        (m._id === authUser?._id || m.user?._id === authUser?._id) &&
        m.role !== "owner"
    )
  );

  // Family tree path
  if (isTreePath && groupId) {
    return <FamilyTreeContent groupId={groupId} />;
  }

  // Group details path
  if (groupId) {
    return <FamilyGroupDetailsContent groupId={groupId} />;
  }

  // Loading
  if (isLoadingGroups) {
    return (
      <div className="p-8 text-center text-base-content flex-1 flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-2">Loading family groups...</p>
      </div>
    );
  }

  // Error
  if (groupsError) {
    return (
      <div className="p-8 text-center text-error flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-4">Error!</h2>
        <p>{groupsError}</p>
        <p>Please try again or ensure your backend server is running.</p>
        <button onClick={fetchMyFamilyGroups} className="btn btn-secondary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 text-base-content w-full">
      <Toaster />

      <div className="flex justify-between items-center mb-6 mt-4">
        <h2 className="text-3xl font-bold text-base-content">My Family Groups</h2>
        <button
          className="btn btn-primary text-primary-content rounded-md hover:shadow-xl transition-all duration-200 mt-4"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <MdAdd className="h-5 w-5" />
          Create New Group
        </button>
      </div>

      {/* ✅ Pending invitations */}
      {myInvitations && myInvitations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-base-content mb-3">Pending Invitations</h3>
          <ul className="space-y-3">
            {myInvitations.map((inv) => (
              <li
                key={inv._id}
                className="flex justify-between items-center p-4 bg-base-200 rounded-lg shadow"
              >
                <div>
                  <p className="font-medium text-base-content">
                    {inv.familyGroup?.name || "Unnamed Group"}
                  </p>
                  <p className="text-sm text-base-content opacity-70">
                    Invited by {inv.invitedBy?.fullName || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(inv.token)}
                    className="btn btn-primary btn-sm text-primary-content"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.token)}
                    className="btn btn-outline btn-sm text-error"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ Owned groups */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Owned Groups</h3>
        {ownedGroups.length === 0 ? (
          <p className="text-base opacity-70">You don’t own any groups yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ownedGroups.map((group) => (
              <FamilyGroupCard
                key={group._id}
                group={group}
                onClick={() => handleCardClick(group._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ Joined groups */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Joined Groups</h3>
        {joinedGroups.length === 0 ? (
          <p className="text-base opacity-70">You haven’t joined any groups yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {joinedGroups.map((group) => (
              <FamilyGroupCard
                key={group._id}
                group={group}
                onClick={() => handleCardClick(group._id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateFamilyGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={() => fetchMyFamilyGroups()}
      />
    </div>
  );
}

export default FamilyGroupsPage;
