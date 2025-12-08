import React from 'react';
import { MdClose } from 'react-icons/md';

// A simple reusable Modal component
function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* FIX: Replaced 'bg-gray-800' with 'bg-base-100' for a theme-aware background */}
      <div className="bg-base-100 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        {/* FIX: Replaced 'border-gray-700' with 'border-base-300' for a theme-aware border */}
        <div className="flex justify-between items-center p-5 border-b border-base-300">
          {/* FIX: Replaced 'text-white' with 'text-base-content' for a theme-aware title color */}
          <h3 className="text-xl font-semibold text-base-content">{title}</h3>
          {/* FIX: Replaced 'text-gray-400' and 'hover:text-white' with theme-aware classes */}
          <button
            onClick={onClose}
            className="text-base-content/70 hover:text-base-content transition-colors duration-200"
            aria-label="Close"
          >
            <MdClose className="h-6 w-6" />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
