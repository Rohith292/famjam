import React, { useEffect } from 'react';
import { MdMale, MdFemale, MdTransgender, MdOutlineQuestionMark } from 'react-icons/md';
import { FaBirthdayCake, FaCalendarTimes, FaStickyNote } from 'react-icons/fa';
import toast from 'react-hot-toast';

function FamilyMemberCard({ member, onEdit, onDelete, familyMap, canEdit, isOwner }) {
  console.log("[FamilyMemberCard] Received canEdit prop:", canEdit);
  console.log("[FamilyMemberCard] Received isOwner prop:", isOwner);

  useEffect(() => {
    if (canEdit && member && !isOwner) {
      console.log("DEBUG: Edit/Delete buttons visible for non-owner (canEdit is TRUE). This is expected for 'contributor' collaborators.");
    } else if (canEdit && !member) {
      toast.error("DEBUG: canEdit is TRUE but no member data available.");
    }
  }, [canEdit, member, isOwner]);

  if (!member) {
    // FIX: Replaced 'text-gray-400' with a theme-aware class for subtle text
    return (
      <div className="text-center p-4 text-base-content/80">
        <p>No family member selected.</p>
      </div>
    );
  }

  const memberMap = new Map();
  const memberNameMap = new Map();
  if (familyMap && Array.isArray(familyMap)) {
    familyMap.forEach(fm => {
      memberMap.set(fm._id, fm);
      memberNameMap.set(fm._id, fm.name);
    });
  }

  const getGenderIcon = (gender) => {
    switch (gender) {
      // FIX: Replaced 'text-blue-400' with 'text-info'
      case 'Male':
        return <MdMale className="text-info" />;
      // FIX: Replaced 'text-pink-400' with 'text-accent'
      case 'Female':
        return <MdFemale className="text-accent" />;
      // FIX: Replaced 'text-purple-400' with 'text-secondary'
      case 'Other':
        return <MdTransgender className="text-secondary" />;
      // FIX: Replaced 'text-gray-500' with a theme-aware class for subtle text
      default:
        return <MdOutlineQuestionMark className="text-base-content/60" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getParentsDisplay = (member) => {
    const parents = [];
    if (member.parentId) {
      const parent1 = memberMap.get(member.parentId);
      if (parent1) {
        parents.push(parent1.name);
        if (parent1.partners && Array.isArray(parent1.partners)) {
          parent1.partners.forEach(partnerId => {
            if (partnerId !== member.parentId && memberMap.has(partnerId)) {
              parents.push(memberNameMap.get(partnerId));
            }
          });
        }
      } else {
        parents.push('Unknown Parent');
      }
    }

    if (parents.length === 0) return 'N/A';
    return parents.join(' & ');
  };

  const getPartnerNames = (partnerIds) => {
    if (!partnerIds || partnerIds.length === 0) return 'N/A';
    return partnerIds.map(id => memberNameMap.get(id) || 'Unknown Partner').join(', ');
  };

  const defaultNodeProfilePic = "https://placehold.co/100x100/334155/cbd5e1?text=No+Image";

  // FIX: Replaced 'bg-gray-700' and 'text-gray-200'
  return (
    <div className="bg-base-200 p-6 rounded-lg shadow-lg text-base-content">
      <div className="flex items-center justify-between mb-4">
        {/* FIX: Replaced 'text-white' with 'text-base-content' */}
        <h3 className="text-2xl font-bold text-base-content flex items-center gap-2">
          {getGenderIcon(member.gender)}
          {member.name}
        </h3>
        {canEdit && (
          <div className="flex gap-2">
            {/* These buttons already use semantic DaisyUI classes */}
            <button
              onClick={() => onEdit(member)}
              className="btn btn-sm btn-info text-info-content rounded-md"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(member)}
              className="btn btn-sm btn-error text-error-content rounded-md"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-4">
        <img
          src={member.photoURL || defaultNodeProfilePic}
          alt={`${member.name}'s profile`}
          // FIX: Replaced 'border-gray-400' with 'border-base-300'
          className="w-24 h-24 rounded-full object-cover border-2 hover:w-80 hover:h-80 border-base-300 shadow-md"
          onError={(e) => { e.target.src = defaultNodeProfilePic; }}
        />
      </div>

      <div className="space-y-3 text-lg">
        {/* FIX: Replaced 'text-gray-300' with 'text-base-content' */}
        <p><span className="font-semibold text-base-content">Relation:</span> {member.relation || 'N/A'}</p>
        <p className="flex items-center gap-2">
          {/* FIX: Replaced 'text-yellow-400' with 'text-warning' */}
          <FaBirthdayCake className="text-warning" />
          {/* FIX: Replaced 'text-gray-300' */}
          <span className="font-semibold text-base-content">Born:</span> {formatDate(member.dateOfBirth)}
        </p>
        {member.deathDate && (
          <p className="flex items-center gap-2">
            {/* FIX: Replaced 'text-red-400' with 'text-error' */}
            <FaCalendarTimes className="text-error" />
            {/* FIX: Replaced 'text-gray-300' */}
            <span className="font-semibold text-base-content">Died:</span> {formatDate(member.deathDate)}
          </p>
        )}
        {/* FIX: Replaced 'text-gray-300' */}
        <p><span className="font-semibold text-base-content">Parents:</span> {getParentsDisplay(member)}</p>

        {member.partners && member.partners.length > 0 && (
          // FIX: Replaced 'text-gray-300'
          <p><span className="font-semibold text-base-content">Partners:</span> {getPartnerNames(member.partners)}</p>
        )}
        {member.notes && (
          <p className="flex items-start gap-2">
            {/* FIX: Replaced 'text-green-400' with 'text-success' */}
            <FaStickyNote className="text-success mt-1" />
            {/* FIX: Replaced 'text-gray-300' */}
            <span className="font-semibold text-base-content">Notes:</span> <span className="flex-1">{member.notes}</span>
          </p>
        )}
        

        {/* FIX: Replaced 'text-gray-500' and 'text-white' */}
        <p className="text-sm text-base-content/60 mt-2"> can the current User edit this card ? <span className="font-bold text-base-content">{String(canEdit)}</span></p>
        {/* FIX: Replaced 'text-gray-500' and 'text-white' */}
        <p className="text-sm text-base-content/60 mt-2">is the user the owner of the map ? <span className="font-bold text-base-content">{String(isOwner)}</span></p>
      </div>
    </div>
  );
}

export default FamilyMemberCard;
