import React, { useState, useEffect, useRef } from 'react';
import familyService from '../../services/familyService';
import toast from 'react-hot-toast';

function AddEditMemberForm({ onClose, onMemberAdded, initialData = null, familyMap, canEdit = true, associatedGroup = null, ownerId = null }) {
    console.log("[AddEditMemberForm] Component Rendered. canEdit prop:", canEdit, "associatedGroup prop:", associatedGroup);

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        relation: initialData?.relation || '',
        gender: initialData?.gender || '',
        birthDate: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
        deathDate: initialData?.deathDate ? new Date(initialData.deathDate).toISOString().split('T')[0] : '',
        parentId: initialData?.parentId?._id || initialData?.parentId || '',
        partners: initialData?.partners?.map(p => p._id || p) || [],
        notes: initialData?.notes || '',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allFamilyMembers, setAllFamilyMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [membersError, setMembersError] = useState(null);
    const hasFetchedMembers = useRef(false);

    useEffect(() => {
        if (!canEdit) {
            setLoadingMembers(false);
            setAllFamilyMembers([]);
            return;
        }

        if (familyMap && Array.isArray(familyMap) && familyMap.length > 0) {
            setAllFamilyMembers(familyMap);
            setLoadingMembers(false);
            return;
        }

        if (!hasFetchedMembers.current) {
            const fetchAllMembers = async () => {
                try {
                    setLoadingMembers(true);
                    const data = await familyService.getFamilyMap();
                    const membersArray = Array.isArray(data) ? data : (data?.data || data?.familyMap || []);
                    setAllFamilyMembers(membersArray);
                    hasFetchedMembers.current = true;
                } catch (err) {
                    console.error("[AddEditMemberForm] Error fetching all family members for form:", err);
                    setMembersError("Could not load family members for selection.");
                    setAllFamilyMembers([]);
                } finally {
                    setLoadingMembers(false);
                }
            };
            fetchAllMembers();
        }
    }, [canEdit, familyMap]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleMultiSelectChange = (e) => {
        const { options } = e.target;
        const selectedValues = Array.from(options)
            .filter(option => option.selected)
            .map(option => option.value);
        setFormData((prevData) => ({ ...prevData, partners: selectedValues }));
    };
    
    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error("Name is required.");
            return false;
        }
        if (!formData.relation.trim()) {
            toast.error("Relation is required.");
            return false;
        }
        if (!formData.gender.trim()) {
            toast.error("Gender is required.");
            return false;
        }
        if (associatedGroup && !associatedGroup.trim()) {
            toast.error("Associated group ID is required.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!canEdit) {
            toast.error("You do not have permission to edit this family map.");
            return;
        }

        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('relation', formData.relation);
        formDataToSend.append('gender', formData.gender);
        formDataToSend.append('dateOfBirth', formData.birthDate);
        if (formData.deathDate) {
            formDataToSend.append('deathDate', formData.deathDate);
        }
        if (formData.parentId) {
            formDataToSend.append('parentId', formData.parentId);
        }
        if (formData.partners && formData.partners.length > 0) {
            formData.partners.forEach(partner => formDataToSend.append('partners[]', partner));
        }
        if (formData.notes) {
            formDataToSend.append('notes', formData.notes);
        }
        
        if (selectedFile) {
            formDataToSend.append('profileImage', selectedFile);
        }
        if (associatedGroup) {
            formDataToSend.append('associatedGroup', associatedGroup);
        } else if (ownerId) {
            formDataToSend.append('owner', ownerId);
        } else {
            console.error("No group or owner ID provided for family member creation.");
            toast.error("Could not determine the family map to add to.");
            setIsSubmitting(false);
            return;
        }
        console.log("[AddEditMemberForm] Submitting form. Owner ID received:", ownerId);

        try {
            let response;
            if (initialData) {
                response = await familyService.updateFamilyMember(initialData._id, formDataToSend);
                toast.success('Family member updated successfully!');
            } else {
                response = await familyService.addFamilyMember(formDataToSend);
                toast.success('Family member added successfully!');
            }
            onMemberAdded(response);
            onClose();
        } catch (error) {
            console.error('Error submitting family member form:', error);
            toast.error(error.response?.data?.message || 'Failed to save family member.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingMembers) {
        // FIX: Replaced `text-gray-300` with `text-base-content`
        return (
            <div className="text-center p-4 text-base-content">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="mt-2">Loading family members for selection...</p>
            </div>
        );
    }

    if (membersError) {
        // FIX: Replaced `text-red-400` with `text-error`
        return (
            <div className="text-center p-4 text-error">
                <p>{membersError}</p>
            </div>
        );
    }

    return (
        // FIX: Replaced `text-gray-300` with `text-base-content`
        <form onSubmit={handleSubmit} className="space-y-4 text-base-content">
            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="name" className="block text-sm font-medium text-base-content mb-1">Name</label>
                {/* FIX: Replaced `bg-gray-700`, `text-white`, and `placeholder-gray-500` */}
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-base-200 text-base-content placeholder-base-content/50 rounded-md"
                    required
                    disabled={!canEdit}
                />
            </div>
            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="relation" className="block text-sm font-medium text-base-content mb-1">Relation (e.g., Self, Father, Mother, Child)</label>
                {/* FIX: Replaced `bg-gray-700`, `text-white`, and `placeholder-gray-500` */}
                <input
                    type="text"
                    id="relation"
                    name="relation"
                    value={formData.relation}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-base-200 text-base-content placeholder-base-content/50 rounded-md"
                    required
                    disabled={!canEdit}
                />
                {/* FIX: Replaced `text-gray-500` */}
                <p className="text-xs text-base-content/60 mt-1">Describe the relation to the map owner (e.g., "Self", "Father", "Mother", "Spouse", "Son", "Daughter").</p>
            </div>
            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="gender" className="block text-sm font-medium text-base-content mb-1">Gender</label>
                {/* FIX: Replaced `bg-gray-700` and `text-white` */}
                <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="select select-bordered w-full bg-base-200 text-base-content rounded-md"
                    required
                    disabled={!canEdit}
                >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                </select>
            </div>
            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="birthDate" className="block text-sm font-medium text-base-content mb-1">Birth Date</label>
                {/* FIX: Replaced `bg-gray-700`, `text-white`, and `placeholder-gray-500` */}
                <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-base-200 text-base-content placeholder-base-content/50 rounded-md"
                    disabled={!canEdit}
                />
            </div>
            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="deathDate" className="block text-sm font-medium text-base-content mb-1">Death Date (Optional)</label>
                {/* FIX: Replaced `bg-gray-700`, `text-white`, and `placeholder-gray-500` */}
                <input
                    type="date"
                    id="deathDate"
                    name="deathDate"
                    value={formData.deathDate}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-base-200 text-base-content placeholder-base-content/50 rounded-md"
                    disabled={!canEdit}
                />
            </div>

            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="parentId" className="block text-sm font-medium text-base-content mb-1">Parent (Optional)</label>
                {/* FIX: Replaced `bg-gray-700` and `text-white` */}
                <select
                    id="parentId"
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleSelectChange}
                    className="select select-bordered w-full bg-base-200 text-base-content rounded-md"
                    disabled={!canEdit}
                >
                    <option value="">No Parent / Unknown</option>
                    {allFamilyMembers.map(member => (
                        <option key={member._id} value={member._id}>
                            {member.name} ({member.relation})
                        </option>
                    ))}
                </select>
                {/* FIX: Replaced `text-gray-500` */}
                <p className="text-xs text-base-content/60 mt-1">Select an existing family member as the parent.</p>
            </div>

            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="partners" className="block text-sm font-medium text-base-content mb-1">Partners (Optional)</label>
                {/* FIX: Replaced `bg-gray-700` and `text-white` */}
                <select
                    id="partners"
                    name="partners"
                    multiple
                    value={formData.partners}
                    onChange={handleMultiSelectChange}
                    className="select select-bordered w-full bg-base-200 text-base-content rounded-md h-auto min-h-[4rem]"
                    disabled={!canEdit}
                >
                    {allFamilyMembers.map(member => (
                        <option key={member._id} value={member._id}>
                            {member.name} ({member.relation})
                        </option>
                    ))}
                </select>
                {/* FIX: Replaced `text-gray-500` */}
                <p className="text-xs text-base-content/60 mt-1">Select one or more existing family members as partners (hold Ctrl/Cmd to select multiple).</p>
            </div>

            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="profileImage" className="block text-sm font-medium text-base-content mb-1">Profile Picture (Optional)</label>
                {/* FIX: Replaced `bg-gray-700` and `text-white` */}
                <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input file-input-bordered w-full bg-base-200 text-base-content file-input-primary rounded-md"
                    disabled={!canEdit}
                />
                {/* FIX: Replaced `text-gray-500` */}
                <p className="text-xs text-base-content/60 mt-1">Upload a profile picture for this family member.</p>
                {initialData?.photoURL && !selectedFile && (
                    // FIX: Replaced `text-gray-400`
                    <div className="mt-2 text-sm font-medium text-base-content flex items-center gap-2">
                        Current Image: <img src={initialData.photoURL} alt="Current profile" className="w-10 h-10 rounded-full object-cover" />
                    </div>
                )}
                {selectedFile && (
                    // FIX: Replaced `text-gray-400` and `text-white`
                    <div className="mt-2 text-sm font-medium text-base-content flex items-center gap-2">
                        Selected: <span className="font-semibold text-base-content">{selectedFile.name}</span>
                    </div>
                )}
            </div>

            <div>
                {/* FIX: Replaced `text-gray-400` */}
                <label htmlFor="notes" className="block text-sm font-medium text-base-content mb-1">Notes (Optional)</label>
                {/* FIX: Replaced `bg-gray-700`, `text-white`, and `placeholder-gray-500` */}
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full bg-base-200 text-base-content placeholder-base-content/50 rounded-md"
                    placeholder="Any additional notes about this family member"
                    rows="3"
                    disabled={!canEdit}
                ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {/* FIX: Replaced `text-gray-400` and `hover:text-white` */}
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-ghost text-base-content/70 hover:text-base-content"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                {canEdit && (
                    
                    <button
                        type="submit"
                        className="btn btn-primary text-primary-content"
                        disabled={isSubmitting || !canEdit}
                    >
                        {isSubmitting ? 'Saving...' : (initialData ? 'Update Member' : 'Add Member')}
                    </button>
                )}
            </div>
        </form>
    );
}

export default AddEditMemberForm;
