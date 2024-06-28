// components/shared/NewFeatureModal.tsx
import Modal from "@/components/shared/modal";
import { useState, Dispatch, SetStateAction } from "react";

const NewFeatureModal = ({
  showModal,
  setShowModal,
  addNewRequest,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  addNewRequest: (title: string, description: string) => void;
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleSubmit = () => {
    if (newTitle && newDescription) {
      addNewRequest(newTitle, newDescription);
      setShowModal(false);
      setNewTitle("");
      setNewDescription("");
    }
  };

  return (
    <Modal showModal={showModal} setShowModal={setShowModal}>
      <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
          <h3 className="font-display text-2xl font-bold">New Feature Request</h3>
          <p className="text-sm text-gray-500">
            Share your idea with us!
          </p>
        </div>

        <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
          <div className="mb-4">
            <label htmlFor="newTitle" className="block text-gray-700 font-semibold mb-2">
              Title
            </label>
            <input
              type="text"
              id="newTitle"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="newDescription" className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <textarea
              id="newDescription"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            ></textarea>
          </div>
          <button
            className="px-4 py-2 border-gray-400"
            onClick={handleSubmit}
          >
            <span className="w-full h-0.5 absolute bottom-0 group-active:bg-transparent left-0 bg-gray-100"></span>
            <span className="h-full w-0.5 absolute bottom-0 group-active:bg-transparent right-0 bg-gray-100"></span>
            Add Request
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NewFeatureModal;
