import React, { useState } from "react";
import SidebarModal from "@/components/shared/SidebarModal"; // Import the new modal component
import NotesApp from "@/components/shared/NoteApp";
import RemindersApp from "@/components/shared/RemindersApp";

const Sidebar = () => {
  const [activeModal, setActiveModal] = useState<number | null>(null);

  const icons = [
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/7f618aee4a0f48868cf79f1cdc13fcbddfd5882dd3c76502182c302e2eed825b?", alt: "Menu icon 1", id: 1 },
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/d6ddfcf39c9f0b5b441436529edaa6f54369abf45443bddbdc05d5cae8a94705?", alt: "Menu icon 2", id: 2 },
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/95d65959906c87d0b1ee8ae5425b584ab3b9ef0f7adb87aa79d375b61fca8ff5?", alt: "Menu icon 3", id: 3 },
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/102b043dfdffc24be87c2eea3ca0a2ee0ba2ae333f3c8a86661eed0123779bab?", alt: "Menu icon 4", id: 4 },
  ];

  const handleModalOpen = (id: number) => {
    setActiveModal(id);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  return (
    <>
      <div className="fixed top-16 left-4 w-20 h-8/12 my-56 flex flex-col items-center py-8 space-y-12 bg-white bg-opacity-20 backdrop-blur-lg rounded-xl border border-white border-opacity-30 shadow-lg z-50">
        <div className="flex flex-col space-y-12">
          {icons.map((icon) => (
            <button key={icon.id} onClick={() => handleModalOpen(icon.id)}>
              <img
                loading="lazy"
                src={icon.src}
                className="w-10 h-10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                alt={icon.alt}
              />
            </button>
          ))}
        </div>
      </div>
      {activeModal === 1 && (
        <SidebarModal showModal={activeModal === 1} setShowModal={handleModalClose}>
          <NotesApp />
        </SidebarModal>
      )}
      {activeModal === 2 && (
        <SidebarModal showModal={activeModal === 2} setShowModal={handleModalClose}>
          <RemindersApp />
        </SidebarModal>
      )}
    </>
  );
};

export default Sidebar;
