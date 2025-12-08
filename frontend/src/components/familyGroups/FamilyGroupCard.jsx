// frontend/src/components/familyGroups/FamilyGroupCard.jsx

import React from 'react';
import { MdGroup, MdArrowForward } from 'react-icons/md';

function FamilyGroupCard({ group, onClick, isPendingInvite = false, onAcceptInvite }) {
    return (
        <div
            className={`card bg-base-200 shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${
                isPendingInvite ? "opacity-80 border-2 border-warning" : "cursor-pointer hover:shadow-2xl hover:scale-105"
            }`}
            onClick={() => !isPendingInvite && onClick(group._id)}
        >
            <div className="card-body p-6">
                <div className="flex items-center mb-4">
                    <MdGroup className="text-primary text-3xl mr-3" />
                    <h3 className="card-title text-xl text-base-content truncate">
                        {group.name}
                    </h3>
                </div>

                <p className="text-base-content opacity-70 text-sm mb-4 line-clamp-2">
                    {group.description || 'No description provided.'}
                </p>

                <div className="flex justify-between items-center text-base-content opacity-70 text-xs">
                    <span>Members: {group.members ? group.members.length : '...'}</span>

                    {isPendingInvite ? (
                        <button
                            className="btn btn-warning btn-sm text-warning-content"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAcceptInvite();
                            }}
                        >
                            Accept Invite
                        </button>
                    ) : (
                        <button className="btn btn-ghost btn-sm">
                            View Details <MdArrowForward className="ml-1" />
                        </button>
                    )}
                </div>

                {isPendingInvite && (
                    <p className="text-warning text-xs mt-2">Pending Invitation</p>
                )}
            </div>
        </div>
    );
}

export default FamilyGroupCard;
