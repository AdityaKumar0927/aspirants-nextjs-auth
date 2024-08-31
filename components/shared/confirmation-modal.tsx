// components/shared/ConfirmationModal.tsx
import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-lg mb-4">{message}</h2>
        <div className="flex justify-end">
          <button className="px-4 py-2 mr-2 bg-red-500 text-white rounded" onClick={onConfirm}>
            Confirm
          </button>
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
