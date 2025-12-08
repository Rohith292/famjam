import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdOutlineMale, MdOutlineFemale } from 'react-icons/md';
import familyService from '../../services/familyService';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import AddEditMemberForm from '../family/AddEditMemberForm';
import FamilyTreeCanvas from '../family/FamilyTreeCanvas';
import FamilyMemberCard from '../family/FamilyMemberCard';
import DeleteConfirmationModal from '../family/DeleteConfirmationModal';
import { useAuthStore } from '../../store/useAuthStore';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { processFamilyMembersForReactFlow } from '../../lib/treeDataProcessor';

function FamilyTreeContent({ shareId, isAuthenticated, ownerId, groupId }) {
    const navigate = useNavigate();
    const { isCheckingAuth, authUser } = useAuthStore();

    const [familyMap, setFamilyMap] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [isDeletingMember, setIsDeletingMember] = useState(false);

    // FIX: Updated customization colors to DaisyUI theme-aware hex codes
    const [customization, setCustomization] = useState({
        nodeColorMale: '#3abff8', // DaisyUI 'info' color
        nodeColorFemale: '#f472b6', // DaisyUI 'accent' color
        edgeColorParentChild: '#1d232a', // DaisyUI 'base-content' color
        edgeColorPartner: '#facc15', // DaisyUI 'warning' color
        edgeType: 'straight',
    });

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    console.log("--- FamilyTreeContent Render Cycle Start ---");
    console.log("isCheckingAuth:", isCheckingAuth);
    console.log("isLoading:", isLoading);
    console.log("isAuthenticated:", isAuthenticated);
    console.log("authUser?._id:", authUser?._id);

    const effectiveOwnerId = useMemo(() => {
        const id = ownerId || authUser?._id;
        console.log("Computed effectiveOwnerId:", id);
        return id;
    }, [ownerId, authUser]);

    const handleBackClick = useCallback(() => {
        if (groupId) {
            navigate(`/family-groups/${groupId}`);
        } else {
            navigate('/');
        }
    }, [groupId, navigate]);

    const handleMemberClick = useCallback(async (memberId) => {
        try {
            const params = shareId ? { shareId } : (ownerId ? { ownerId } : (groupId ? { groupId } : {}));
            const member = await familyService.getFamilyMember(memberId, params);
            if (member) {
                setSelectedMember(member);
                setIsDetailModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching member details:", error);
            toast.error(error.response?.data?.message || "Failed to load member details.");
        }
    }, [shareId, ownerId, groupId]);

    const onNodesChange = useCallback((changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const handleEditMember = useCallback((member) => {
        if (!canEdit) {
            toast.error("You do not have permission to edit this family member.");
            return;
        }
        setSelectedMember(member);
        setIsDetailModalOpen(false);
        setIsEditModalOpen(true);
    }, [canEdit]);

    const handleDeleteMember = useCallback((member) => {
        if (!canEdit) {
            toast.error("You do not have permission to delete this family member.");
            return;
        }
        setSelectedMember(member);
        setIsDetailModalOpen(false);
        setIsDeleteConfirmModalOpen(true);
    }, [canEdit]);

    const handleColorChange = useCallback((type, color) => {
        setCustomization(prev => ({ ...prev, [type]: color }));
    }, []);

    const handleEdgeTypeChange = useCallback((e) => {
        setCustomization(prev => ({ ...prev, edgeType: e.target.value }));
    }, []);

    const fetchMap = useCallback(async () => {
        const isPublicShareContext = !!shareId;
        const isCollaboratedMapContext = !!ownerId;
        const isGroupTreeContext = !!groupId;

        try {
            setIsLoading(true);
            setError(null);
            let data;
            let currentCanEdit = false;

            if (isPublicShareContext) {
                data = await familyService.getFamilyMap({ shareId });
                currentCanEdit = data.canEdit;
            } else if (isCollaboratedMapContext) {
                data = await familyService.getFamilyMap({ ownerId });
                currentCanEdit = data.canEdit;
            } else if (isGroupTreeContext) {
                data = await familyService.getFamilyMemberByGroup(groupId);
                currentCanEdit = true;
            } else {
                if (!isAuthenticated) {
                    setError("Authentication required to view your own map.");
                    setIsLoading(false);
                    setFamilyMap([]);
                    setCanEdit(false);
                    return;
                }
                data = await familyService.getFamilyMap({});
                currentCanEdit = data.canEdit;
            }

            const membersArray = Array.isArray(data) ? data : (data?.data || data?.familyMap || []);
            setFamilyMap(membersArray);
            setCanEdit(currentCanEdit);
            setError(null);
            console.log("fetchMap succeeded. New canEdit value:", currentCanEdit);
        } catch (err) {
            console.error("[FamilyTreeContent] Failed to fetch family map:", err);
            const status = err.response?.status;
            if (status === 403) {
                setError("Access denied for this group's family tree. You must be a member.");
            } else if (status === 401) {
                setError("Authentication required to view this map.");
            } else {
                setError(err.response?.data?.message || "Failed to load family map. Please try again.");
            }
            setFamilyMap([]);
            setCanEdit(false);
        } finally {
            setIsLoading(false);
        }
    }, [shareId, ownerId, groupId, isAuthenticated]);

    const confirmDeleteMember = useCallback(async () => {
        if (selectedMember) {
            setIsDeletingMember(true);
            try {
                const params = shareId ? { shareId } : (ownerId ? { ownerId } : (groupId ? { groupId } : {}));
                await familyService.deleteFamilyMember(selectedMember._id, params);
                toast.success(`${selectedMember.name} deleted successfully!`);
                fetchMap();
                setIsDeleteConfirmModalOpen(false);
                setSelectedMember(null);
            } catch (error) {
                console.error("Error deleting member:", error);
                toast.error(error.response?.data?.message || "Failed to delete member.");
            } finally {
                setIsDeletingMember(false);
            }
        }
    }, [selectedMember, shareId, ownerId, groupId, fetchMap]);

    useEffect(() => {
        if (isCheckingAuth) {
            setIsLoading(true);
            return;
        }

        if (!shareId && !ownerId && !groupId && !isAuthenticated) {
            setError("Authentication required to view your own map.");
            setIsLoading(false);
            setFamilyMap([]);
            setCanEdit(false);
            return;
        }

        fetchMap();
    }, [shareId, ownerId, groupId, isAuthenticated, isCheckingAuth, fetchMap]);

    useMemo(() => {
        if (familyMap && familyMap.length > 0) {
            const finalCustomization = {
                ...customization,
                maleIcon: <MdOutlineMale size={24} />,
                femaleIcon: <MdOutlineFemale size={24} />,
            };
            const { nodes: processedNodes, edges: processedEdges } = processFamilyMembersForReactFlow(
                familyMap,
                handleMemberClick,
                finalCustomization
            );
            setNodes(processedNodes);
            setEdges(processedEdges);
        } else {
            setNodes([]);
            setEdges([]);
        }
    }, [familyMap, customization, handleMemberClick]);

    if (isLoading || isCheckingAuth) {
        // FIX: Replaced hardcoded text colors with theme-aware classes
        return (
            <div className="p-8 text-center text-base-content/80 flex-1 flex flex-col items-center justify-center">
                {/* FIX: Replaced 'text-white' with 'text-base-content' */}
                <h2 className="text-2xl font-bold mb-4 text-base-content">Loading Family Tree...</h2>
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        // FIX: Replaced hardcoded text colors with theme-aware classes
        return (
            <div className="p-8 text-center text-error flex-1 flex flex-col items-center justify-center">
                {/* FIX: Replaced 'text-white' with 'text-base-content' */}
                <h2 className="text-2xl font-bold mb-4 text-base-content">Error!</h2>
                <p>{error}</p>
                {!shareId && !ownerId && !groupId && error !== "Authentication required to view your own map." && <p>Ensure your backend server is running and you are logged in.</p>}
            </div>
        );
    }

    // FIX: Replaced 'text-gray-300' with 'text-base-content'
    return (
        <div className="p-8 text-base-content flex-1 flex flex-col">
            {groupId && (
                <div className="flex flex-col items-center text-primary-content mb-4">
    <div className="w-full flex justify-start">
      <button
        onClick={handleBackClick}
        className="btn btn-primary text-success hover:text-success-content hover:bg-success gap-2"
      >
        <MdArrowBack className="h-5 w-5" /> Back to Group Details
      </button>
      <p className="mt-2 ml-60  justify-center text-center text-sm">
      Click here to go back to Family Groups details
    </p>
    </div>
    
            </div>
            )}


            <div className="flex justify-between items-center mb-6">
                {/* FIX: Replaced 'text-white' with 'text-base-content' */}
                <h2 className="text-3xl font-bold text-base-content">
                    {groupId ? "Group Family Tree" : (ownerId ? "Collaborated Family Tree" : "My Family Tree")}
                </h2>
                {(() => {
                    console.log("Add button render conditions:", { canEdit, effectiveOwnerId });
                    if (canEdit && effectiveOwnerId) {
                        return (
                            <button
                                className="btn btn-primary text-primary-content rounded-md shadow-lg hover:shadow-xl transition-all duration-200"
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Family Member
                            </button>
                        );
                    }
                    return null;
                })()}
            </div>

            <div className="flex flex-1 gap-6">
                <div className="flex-1">
                    {familyMap && familyMap.length > 0 ? (
                        <FamilyTreeCanvas
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            customization={customization}
                        />
                    ) : (
                        // FIX: Replaced hardcoded colors with theme-aware classes
                        <div className="text-center p-10 bg-base-200 rounded-lg h-full flex flex-col justify-center">
                            <p className="text-xl text-base-content/80">No family members found.</p>
                            {canEdit && (
                                <p className="text-md text-base-content/60 mt-2">
                                    Click "Add Family Member" to start building your tree!
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-base-200 p-4 rounded-lg shadow-xl text-sm space-y-3 w-72">
                    {/* FIX: Replaced hardcoded text colors with theme-aware classes */}
                    <h3 className="font-bold text-lg text-base-content mb-2">Customize Tree</h3>
                    <div>
                        <label className="block text-base-content mb-1">Male Node Color:</label>
                        <input
                            type="color"
                            value={customization.nodeColorMale}
                            onChange={(e) => handleColorChange('nodeColorMale', e.target.value)}
                            className="w-full h-8 rounded-md border-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-base-content mb-1">Female Node Color:</label>
                        <input
                            type="color"
                            value={customization.nodeColorFemale}
                            onChange={(e) => handleColorChange('nodeColorFemale', e.target.value)}
                            className="w-full h-8 rounded-md border-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-base-content mb-1">Parent-Child Edge Color:</label>
                        <input
                            type="color"
                            value={customization.edgeColorParentChild}
                            onChange={(e) => handleColorChange('edgeColorParentChild', e.target.value)}
                            className="w-full h-8 rounded-md border-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-base-content mb-1">Partner Edge Color:</label>
                        <input
                            type="color"
                            value={customization.edgeColorPartner}
                            onChange={(e) => handleColorChange('edgeColorPartner', e.target.value)}
                            className="w-full h-8 rounded-md border-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-base-content mb-1">Edge Type:</label>
                        <select
                            value={customization.edgeType}
                            onChange={handleEdgeTypeChange}
                            // FIX: Replaced hardcoded colors with theme-aware classes
                            className="w-full p-2 rounded-md bg-base-100 text-base-content border border-base-300"
                        >
                            <option value="straight">Straight</option>
                            <option value="step">Step</option>
                            <option value="bezier">Bezier</option>
                        </select>
                    </div>
                </div>
            </div>

            {canEdit && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Family Member">
                    <AddEditMemberForm
                        onClose={() => setIsAddModalOpen(false)}
                        onMemberAdded={fetchMap}
                        familyMap={familyMap}
                        canEdit={canEdit}
                        associatedGroup={groupId}
                        ownerId={effectiveOwnerId}
                    />
                </Modal>
            )}

            {canEdit && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${selectedMember?.name || 'Family Member'}`}>
                    <AddEditMemberForm
                        initialData={selectedMember}
                        onClose={() => setIsEditModalOpen(false)}
                        onMemberAdded={fetchMap}
                        familyMap={familyMap}
                        canEdit={canEdit}
                        associatedGroup={groupId}
                        ownerId={effectiveOwnerId}
                    />
                </Modal>
            )}

            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Family Member Details">
                {selectedMember && (
                    <FamilyMemberCard
                        member={selectedMember}
                        onEdit={handleEditMember}
                        onDelete={handleDeleteMember}
                        canEdit={canEdit}
                        familyMap={familyMap}
                        isOwner={selectedMember.createdBy === effectiveOwnerId}
                    />
                )}
            </Modal>

            <DeleteConfirmationModal
                isOpen={isDeleteConfirmModalOpen}
                onClose={() => setIsDeleteConfirmModalOpen(false)}
                memberName={selectedMember?.name}
                onConfirm={confirmDeleteMember}
                isDeleting={isDeletingMember}
            />
        </div>
    );
}

export default FamilyTreeContent;
