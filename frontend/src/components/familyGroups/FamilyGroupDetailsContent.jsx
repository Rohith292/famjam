// frontend/src/pages/FamilyGroupDetailsPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useFamilyGroupStore from "../../store/useFamilyGroupStore";
import {
  MdArrowBack,
  MdPersonAdd,
  MdEdit,
  MdDelete,
  MdGroup,
  MdAccountTree,
  MdEmail,
} from "react-icons/md";
import toast from "react-hot-toast";
import GroupPhotoAlbums from "../familyGroups/GroupPhotoAlbums";
import { useAuthStore } from "../../store/useAuthStore";

function FamilyGroupDetailsContent({ groupId }) {
  const navigate = useNavigate();
  const {
    currentFamilyGroup,
    isLoadingCurrentGroup,
    currentGroupError,
    fetchFamilyGroupById,
    inviteMemberToGroup,
    removeMemberFromGroup,
    updateFamilyGroup,
    deleteFamilyGroup,
    updateMemberRole,
  } = useFamilyGroupStore();

  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const authUser = useAuthStore((state) => state.authUser);

  useEffect(() => {
    if (groupId) fetchFamilyGroupById(groupId);
  }, [groupId, fetchFamilyGroupById]);

  // ------------------ HANDLERS ------------------
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return toast.error("Please enter an email to invite.");

    setIsInviting(true);
    try {
      await inviteMemberToGroup(groupId, inviteEmail);
      setInviteEmail("");
      toast.success("Invitation sent!");
    } catch (err) {
      console.error("Failed to invite member:", err);
      toast.error(err.message || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from the group?")) return;
    try {
      await removeMemberFromGroup(groupId, memberId);
      toast.success("Member removed.");
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast.error("Failed to remove member");
    }
  };

  const handleEditGroup = async () => {
    const newDescription = prompt(
      "Enter new description:",
      currentFamilyGroup.description
    );
    if (newDescription !== null) {
      try {
        await updateFamilyGroup(groupId, { description: newDescription });
        toast.success("Group updated");
      } catch (err) {
        console.error("Failed to update group:", err);
        toast.error("Update failed");
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !window.confirm(
        `Delete "${currentFamilyGroup.name}"? This cannot be undone.`
      )
    )
      return;
    try {
      await deleteFamilyGroup(groupId);
      navigate("/family-groups");
    } catch (err) {
      console.error("Failed to delete group:", err);
      toast.error("Delete failed");
    }
  };

  const navigateToGroupTree = () => navigate(`/family-groups/${groupId}/tree`);

  // ------------------ UI STATES ------------------
  if (isLoadingCurrentGroup) {
    return (
      <div className="p-8 text-center flex flex-col items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-2">Loading group details...</p>
      </div>
    );
  }

  if (currentGroupError) {
    return (
      <div className="p-8 text-center text-error min-h-[50vh] flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Error!</h2>
        <p>{currentGroupError}</p>
        <button
          onClick={() => fetchFamilyGroupById(groupId)}
          className="btn btn-secondary mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentFamilyGroup) {
    return (
      <div className="p-8 text-center min-h-[50vh] flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Group Not Found</h2>
        <p>
          The family group you are looking for does not exist or you do not have
          access.
        </p>
        <button
          onClick={() => navigate("/family-groups")}
          className="btn btn-primary mt-4"
        >
          Go to My Family Groups
        </button>
      </div>
    );
  }

  const amIGroupOwner = currentFamilyGroup.createdBy?._id === authUser?._id;

  // ------------------ MAIN RENDER ------------------
  return (
    <div className="p-8 w-full">
      {/* Back button */}
      <button
        onClick={() => navigate("/family-groups")}
        className="btn btn-ghost bg-primary text-primary-content hover:bg-opacity-40 mb-6 flex items-center gap-2"
      >
        <MdArrowBack className="h-5 w-5" /> Back to Groups
      </button>

      {/* Group header */}
      <div className="bg-base-200 p-6 rounded-lg shadow-xl mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-4xl font-bold flex items-center gap-3">
              <MdGroup className="h-8 w-8 text-primary" />
              {currentFamilyGroup.name}
            </h2>
            <p className="opacity-70 text-lg">
              {currentFamilyGroup.description || "No description provided."}
            </p>
          </div>
          {amIGroupOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleEditGroup}
                className="btn btn-sm btn-outline btn-info"
              >
                <MdEdit /> Edit
              </button>
              <button
                onClick={handleDeleteGroup}
                className="btn btn-sm btn-outline btn-error"
              >
                <MdDelete /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Invite Section (only owner can invite) */}
        {amIGroupOwner && (
          <div className="mt-8 p-4 bg-base-100 rounded-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <MdPersonAdd className="h-6 w-6" /> Invite New Member
            </h3>
            <form onSubmit={handleInviteSubmit} className="flex gap-3">
              <input
                type="email"
                placeholder="Enter member's email"
                className="input input-bordered flex-1"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={isInviting}
              />
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isInviting}
              >
                {isInviting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    {" "}
                    <MdPersonAdd /> Invite{" "}
                  </>
                )}
              </button>
            </form>

            {/* Pending Invitations */}
            {currentFamilyGroup.invitations?.filter(
              (inv) => inv.status === "pending"
            ).length > 0 && (
              <div className="mt-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <MdEmail className="h-5 w-5" /> Pending Invitations
                </h4>
                <ul className="list-disc list-inside opacity-80">
                  {currentFamilyGroup.invitations
                    .filter((inv) => inv.status === "pending")
                    .map((inv) => (
                      <li key={inv._id}>
                        {inv.email} (Invited by{" "}
                        {inv.invitedBy?.fullName || inv.invitedBy || "Unknown"})
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Members */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <MdGroup className="h-6 w-6" /> Members (
            {currentFamilyGroup.members?.length || 0})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {currentFamilyGroup.members?.length > 0 ? (
              currentFamilyGroup.members.map((member) => {
                const user = member.user || {};
                const isCreator =
                  user._id === currentFamilyGroup.createdBy?._id;

                return (
                  <div
                    key={member._id}
                    className="flex items-center bg-base-100 p-4 rounded-lg shadow"
                  >
                    <div className="avatar placeholder mr-3">
                      <div className="bg-secondary text-primary-content  text-center p-1 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-lg font-bold">
                          {user.fullName
                            ? user.fullName[0].toUpperCase()
                            : "?"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium">{user.fullName}</p>
                      <p className="text-sm opacity-70">{user.email}</p>
                      <p className="text-sm opacity-50">Role: {member.role}</p>
                    </div>

                    {/* Owner controls */}
                    {amIGroupOwner && !isCreator && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateMemberRole(groupId, user._id, e.target.value)
                          }
                          className="select select-bordered select-sm ml-2"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <button
                          onClick={() => handleRemoveMember(user._id)}
                          className="btn btn-circle btn-ghost btn-sm ml-2 text-error"
                          title="Remove member"
                        >
                          <MdDelete />
                        </button>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="opacity-70 col-span-full">
                No members yet. Invite some!
              </p>
            )}
          </div>
        </div>

        {/* Family Tree */}
        <div className="mt-8 bg-base-100 p-6 rounded-lg shadow">
          <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <MdAccountTree className="h-6 w-6 text-accent" /> Associated Family
            Tree
          </h3>
          <button onClick={navigateToGroupTree} className="btn btn-secondary">
            View Family Tree
          </button>
        </div>

        {/* Albums */}
        <GroupPhotoAlbums
          groupId={groupId}
          groupName={currentFamilyGroup.name}
        />
      </div>
    </div>
  );
}

export default FamilyGroupDetailsContent;
