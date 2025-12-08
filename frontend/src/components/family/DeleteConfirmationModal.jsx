import React from 'react';
import Modal from '../common/Modal';

function DeleteConfirmationModal({ isOpen, onClose, memberName, onConfirm, isDeleting }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Deletion"
    >
      {/* FIX: Replaced 'text-gray-300' with 'text-base-content' */}
      <div className="p-4 text-center text-base-content">
        {/* FIX: Replaced 'text-white' with 'text-base-content' for a theme-aware highlight */}
        <p className="mb-4 text-lg">Are you sure you want to delete <span className="font-bold text-base-content">{memberName}</span>?</p>
        {/* FIX: Replaced 'text-red-400' with 'text-error' for semantic warning */}
        <p className="text-sm text-error mb-6">This action cannot be undone.</p>
        <div className="flex justify-center gap-4">
          {/* FIX: Replaced 'text-gray-400' and 'hover:text-white' with theme-aware classes */}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-base-content/70 hover:text-base-content"
            disabled={isDeleting}
          >
            Cancel
          </button>
          {/* This button already uses semantic DaisyUI classes, so it's correct */}
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-error text-error-content"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;
