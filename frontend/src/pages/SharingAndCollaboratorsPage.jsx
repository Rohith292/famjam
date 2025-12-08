import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import shareService from '../services/shareService';
import collaborationService from '../services/collaborationService';
import familyService from '../services/familyService';
import UserList from '../components/sharing/UserList';

import { MdContentCopy, MdLink, MdPersonAdd, MdDelete, MdCheckCircle, MdOutlineCancel } from 'react-icons/md'; // Icons

function SharingAndCollaboratorsPage() {
    const authUser = useAuthStore((state) => state.authUser);

    const [publicShareLink, setPublicShareLink] = useState(null);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [isRevokingLink, setIsRevokingLink] = useState(false);

    const [collaborationsAsOwner, setCollaborationsAsOwner] = useState([]);
    const [collaborationsAsCollaborator, setCollaborationsAsCollaborator] = useState([]);
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [inviteeRole, setInviteeRole] = useState('viewer'); // Default role for new invitations
    const [isInviting, setIsInviting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showUserList, setShowUserList] = useState(false);


    // --- Data Fetching ---
    const fetchAllSharingData = useCallback(async () => {
        if (!authUser) {
            setIsLoadingData(false);
            setPublicShareLink(null);
            setCollaborationsAsOwner([]);
            setCollaborationsAsCollaborator([]);
            return;
        }

        setIsLoadingData(true);
        try {
            // Fetch public share link
            const shareLinkData = await shareService.getShareLink();
            setPublicShareLink(shareLinkData.link || null);

            // Fetch all collaboration data (as owner and as collaborator)
            const collabData = await familyService.getCollaborations();
            setCollaborationsAsOwner(collabData.asOwner || []);
            setCollaborationsAsCollaborator(collabData.asCollaborator || []);
        } catch (error) {
            console.error("Error fetching all sharing data:", error);
            toast.error(error.message || "Failed to load sharing and collaboration data.");
        } finally {
            setIsLoadingData(false);
        }
    }, [authUser]);

    useEffect(() => {
        fetchAllSharingData();
    }, [fetchAllSharingData]);

    // --- Public Share Link Handlers ---
    const handleGeneratePublicLink = async () => {
        setIsGeneratingLink(true);
        try {
            const response = await shareService.generateShareLink();
            setPublicShareLink(response.link);
            toast.success("Public share link generated!");
        } catch (error) {
            console.error("Error generating public share link:", error);
            toast.error(error.response?.data?.message || "Failed to generate share link.");
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const handleRevokePublicLink = async () => {
        setIsRevokingLink(true);
        try {
            await shareService.revokeShareLink();
            setPublicShareLink(null);
            toast.success("Public share link revoked!");
        } catch (error) {
            console.error("Error revoking public share link:", error);
            toast.error(error.response?.data?.message || "Failed to revoke share link.");
        } finally {
            setIsRevokingLink(false);
        }
    };

    const copyToClipboard = (text) => {
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => toast.success("Link copied to clipboard!"))
                .catch(() => toast.error("Failed to copy link."));
        }
    };

    // --- Collaborator Invitation and Management Handlers ---

    const handleInviteCollaborator = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            await collaborationService.inviteCollaborator(inviteeEmail, inviteeRole);
            setInviteeEmail('');
            setInviteeRole('viewer');
            toast.success(`Invitation sent to ${inviteeEmail} as ${inviteeRole}!`);
            fetchAllSharingData(); // Refresh all data after sending invite
        } catch (error) {
            console.error("Error inviting collaborator:", error);
            toast.error(error.response?.data?.message || "Invitation has been already sent to the user. Please wait untill the collaborator accepts his role or cancel his invitation!");
        } finally {
            setIsInviting(false);
        }
    };

    const handleChangeCollaboratorRole = async (collaborationId, newRole, memberName) => {
        if (window.confirm(`Are you sure you want to change ${memberName}'s role to ${newRole}?`)) {
            try {
                await toast.promise(
                    collaborationService.updateCollaboratorRole(collaborationId, newRole),
                    {
                        loading: 'Updating role...',
                        success: 'Role updated successfully!',
                        error: (err) => err.response?.data?.message || 'Failed to update role.',
                    }
                );
                fetchAllSharingData(); // Refresh list
            } catch (error) {
                // Error handled by toast.promise
            }
        }
    };

    // NEW HANDLER: Manages revoking active access or deleting revoked/declined records
    const handleCollaboratorAction = async (collaborationId, currentStatus, memberName) => {
        let actionType = '';
        let confirmMessage = '';
        let serviceCallPromise = null;

        if (currentStatus === 'accepted') {
            actionType = 'revoke';
            confirmMessage = `Are you sure you want to revoke ${memberName}'s access? They will no longer be able to view or edit your map.`;
            serviceCallPromise = collaborationService.revokeCollaboratorAccess(collaborationId);
        } else if (currentStatus === 'revoked' || currentStatus === 'declined'||currentStatus==='cancelled') {
            actionType = 'delete';
            confirmMessage = `Are you sure you want to completely remove the record of ${memberName}'s collaboration? This cannot be undone. You will be able to invite them again later.`;
            serviceCallPromise = collaborationService.deleteCollaborationRecord(collaborationId);
        } else if (currentStatus === 'pending') {
            actionType = 'cancel_invite';
            confirmMessage = `Are you sure you want to cancel the pending invitation for ${memberName}?`;
            serviceCallPromise = collaborationService.cancelInvitation(collaborationId);
        }
        else {
            toast.error("Invalid action for this collaboration status.");
            return;
        }

        if (window.confirm(confirmMessage)) {
            try {
                await toast.promise(
                    serviceCallPromise,
                    {
                        loading: `${actionType === 'revoke' ? 'Revoking access' : actionType === 'delete' ? 'Removing record' : 'Cancelling invitation'}...`,
                        success: `${actionType === 'revoke' ? 'Access revoked!' : actionType === 'delete' ? 'Collaboration record removed!' : 'Invitation cancelled!'}`,
                        error: (err) => err.response?.data?.message || `Failed to ${actionType} access.`,
                    }
                );
                fetchAllSharingData();
            } catch (error) {
                // Error handled by toast.promise
            }
        }
    };

    const handleAcceptInvitation = async (invitationId, ownerName) => {
        try {
            await toast.promise(
                collaborationService.acceptInvitation(invitationId),
                {
                    loading: 'Accepting invitation...',
                    success: `Accepted invitation from ${ownerName}!`,
                    error: (err) => err.response?.data?.message || 'Failed to accept invitation.',
                }
            );
            fetchAllSharingData();
        } catch (error) {
            // Error handled by toast.promise
        }
    };

    const handleDeclineInvitation = async (invitationId, ownerName) => {
        if (window.confirm(`Are you sure you want to decline the invitation from ${ownerName}?`)) {
            try {
                await toast.promise(
                    collaborationService.declineInvitation(invitationId),
                    {
                        loading: 'Declining invitation...',
                        success: `Declined invitation from ${ownerName}!`,
                        error: (err) => err.response?.data?.message || 'Failed to decline invitation.',
                    }
                );
                fetchAllSharingData();
            } catch (error) {
                // Error handled by toast.promise
            }
        }
    };


    if (isLoadingData) {
        return (
            <div className="p-8 text-center text-base-content">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-2">Loading sharing and collaboration data...</p>
            </div>
        );
    }

    return (
        <div className="p-8 text-base-content">
            <h2 className="text-3xl font-bold mb-6">Share & Collaborate</h2>

            {/* Public Share Link Section */}
            <div className="card bg-base-200 shadow-xl mb-8">
                <div className="card-body">
                    <h3 className="card-title mb-4 flex items-center gap-2">
                        <MdLink className="h-6 w-6" /> Public Share Link (Read-Only)
                    </h3>
                    {publicShareLink ? (
                        <div>
                            <p className="mb-2 text-base-content">Share this link for read-only access to your family map:</p>
                            <div className="form-control mb-4">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={publicShareLink}
                                        readOnly
                                        className="input input-bordered w-full bg-base-300 text-base-content cursor-text"
                                    />
                                    <button
                                        className="btn btn-square btn-primary text-primary-content"
                                        onClick={() => copyToClipboard(publicShareLink)}
                                        aria-label="Copy link"
                                    >
                                        <MdContentCopy className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="card-actions justify-end">
                                <button
                                    className="btn btn-error text-error-content"
                                    onClick={handleRevokePublicLink}
                                    disabled={isRevokingLink}
                                >
                                    {isRevokingLink ? <span className="loading loading-spinner"></span> : <MdOutlineCancel className="h-5 w-5" />}
                                    {isRevokingLink ? 'Revoking...' : 'Revoke Link'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card-actions justify-end">
                            <p className="mb-4 text-base-content">No public share link active.</p>
                            <button
                                className="btn btn-success text-success-content"
                                onClick={handleGeneratePublicLink}
                                disabled={isGeneratingLink}
                            >
                                {isGeneratingLink ? <span className="loading loading-spinner"></span> : <MdLink className="h-5 w-5" />}
                                {isGeneratingLink ? 'Generating...' : 'Generate Public Link'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Collaborator Section */}
            <div className="card bg-base-200 shadow-xl mb-8">
  <div className="card-body">
    <h3 className="card-title mb-4 flex items-center gap-2">
      <MdPersonAdd className="h-6 w-6" /> Invite Collaborator
    </h3>

    <form onSubmit={handleInviteCollaborator} className="space-y-4">
      {/* Email Input */}
      <div>
        <label htmlFor="inviteeEmail" className="label">
          <span className="label-text text-base-content">Invitee Email</span>
        </label>
        <input
          type="email"
          id="inviteeEmail"
          value={inviteeEmail}
          onChange={(e) => setInviteeEmail(e.target.value)}
          className="input input-bordered w-full bg-base-300 text-base-content placeholder-gray-500"
          placeholder="collaborator@example.com"
          required
        />
      </div>

      {/* Role Selection */}
      <div>
        <label htmlFor="inviteeRole" className="label">
          <span className="label-text text-base-content">Role</span>
        </label>
        <select
          id="inviteeRole"
          value={inviteeRole}
          onChange={(e) => setInviteeRole(e.target.value)}
          className="select select-bordered w-full bg-base-300 text-base-content"
        >
          <option value="viewer">Viewer (Read-Only)</option>
          <option value="contributor">Contributor (Read & Edit)</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="card-actions justify-end">
        <button
          type="submit"
          className="btn btn-primary text-primary-content"
          disabled={isInviting}
        >
          {isInviting ? <span className="loading loading-spinner"></span> : 'Send Invitation'}
        </button>
      </div>
    </form>

    {/* Toggle Section */}
<div className="mt-6 flex items-center justify-between flex-wrap gap-2">
  <p className="text-sm text-base-content">
    Click to view all registered users. You can search and filter them in the list below.
  </p>
  <button
    onClick={() => setShowUserList(!showUserList)}
    className="btn btn-primary text-primary-content"
  >
    {showUserList ? 'Hide All Users' : 'View All Users'}
  </button>
</div>

{/* User List Component */}
{showUserList && (
  <UserList onSelectUser={(email) => setInviteeEmail(email)} />
)}

  </div>
            </div>


            {/* Collaborations as Owner Section */}
            <div className="card bg-base-200 shadow-xl mb-8">
                <div className="card-body">
                    <h3 className="card-title">Collaborators on My Map</h3>
                    {collaborationsAsOwner.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table w-full text-base-content">
                                <thead>
                                    <tr>
                                        <th>Collaborator</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collaborationsAsOwner.map((collab) => (
                                        <tr key={collab._id}>
                                            <td>{collab.collaboratorId?.username || collab.collaboratorId?.email || 'Unknown User'}</td>
                                            <td>
                                                <select
                                                    value={collab.role}
                                                    onChange={(e) => handleChangeCollaboratorRole(collab._id, e.target.value, collab.collaboratorId?.username || collab.collaboratorId?.email || 'this collaborator')}
                                                    className="select select-sm bg-base-300 text-base-content"
                                                    disabled={collab.status !== 'accepted'}
                                                >
                                                    <option value="viewer">Viewer</option>
                                                    <option value="contributor">Contributor</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className={`badge ${collab.status === 'accepted' ? 'badge-success' : collab.status === 'pending' ? 'badge-warning' : 'badge-error'} text-white`}>
                                                    {collab.status}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {collab.status === 'accepted' && (
                                                        <button
                                                            className="btn btn-warning btn-sm text-warning-content"
                                                            onClick={() => handleCollaboratorAction(collab._id, collab.status, collab.collaboratorId?.username || collab.collaboratorId?.email || 'this collaborator')}
                                                        >
                                                            <MdDelete className="h-5 w-5" /> Revoke
                                                        </button>
                                                    )}
                                                    {(collab.status === 'revoked' || collab.status === 'declined'|| collab.status==='cancelled') && (
                                                        <button
                                                            className="btn btn-error btn-sm text-error-content"
                                                            onClick={() => handleCollaboratorAction(collab._id, collab.status, collab.collaboratorId?.username || collab.collaboratorId?.email || 'this collaborator')}
                                                        >
                                                            <MdDelete className="h-5 w-5" /> Delete Record
                                                        </button>
                                                    )}
                                                    {collab.status === 'pending' && (
                                                        <button
                                                            className="btn btn-error btn-sm text-error-content"
                                                            onClick={() => handleCollaboratorAction(collab._id, collab.status, collab.collaboratorId?.username || collab.collaboratorId?.email || 'this collaborator')}
                                                        >
                                                            <MdOutlineCancel className="h-5 w-5" /> Cancel Invite
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-base-content">No active or pending collaborators on your family map.</p>
                    )}
                </div>
            </div>

            {/* Collaborations as Collaborator Section */}
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                    <h3 className="card-title">Maps Shared With Me</h3>
                    {collaborationsAsCollaborator.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table w-full text-base-content">
                                <thead>
                                    <tr>
                                        <th>Map Owner</th>
                                        <th>Your Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collaborationsAsCollaborator.map((collab) => (
                                        <tr key={collab._id}>
                                            <td>{collab.familyMapOwnerId?.username || collab.familyMapOwnerId?.email || 'Unknown Owner'}</td>
                                            <td>{collab.role}</td>
                                            <td>
                                                <div className={`badge ${collab.status === 'accepted' ? 'badge-success' : collab.status === 'pending' ? 'badge-warning' : 'badge-error'} text-white`}>
                                                    {collab.status}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {collab.status === 'pending' && (
                                                        <>
                                                            <button
                                                                className="btn btn-success btn-sm text-success-content"
                                                                onClick={() => handleAcceptInvitation(collab._id, collab.familyMapOwnerId?.username || collab.familyMapOwnerId?.email || 'owner')}
                                                            >
                                                                <MdCheckCircle className="h-5 w-5" /> Accept
                                                            </button>
                                                            <button
                                                                className="btn btn-error btn-sm text-error-content"
                                                                onClick={() => handleDeclineInvitation(collab._id, collab.familyMapOwnerId?.username || collab.familyMapOwnerId?.email || 'owner')}
                                                            >
                                                                <MdOutlineCancel className="h-5 w-5" /> Decline
                                                            </button>
                                                        </>
                                                    )}
                                                    {collab.status === 'accepted' && (
                                                        <a
                                                            href={`/map/${collab.familyMapOwnerId?._id}`}
                                                            className="btn btn-info btn-sm text-info-content"
                                                        >
                                                            View Map
                                                        </a>
                                                    )}
                                                    {(collab.status === 'revoked' || collab.status === 'declined') && (
                                                        <button
                                                            className="btn btn-error btn-sm text-error-content"
                                                            onClick={() => handleCollaboratorAction(collab._id, collab.status, collab.familyMapOwnerId?.username || collab.familyMapOwnerId?.email || 'this owner')}
                                                        >
                                                            <MdDelete className="h-5 w-5" /> Delete Record
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-base-content">No family maps have been shared with you yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SharingAndCollaboratorsPage;