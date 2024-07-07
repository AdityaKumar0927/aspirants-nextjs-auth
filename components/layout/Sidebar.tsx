import React, { useState } from "react";
import SidebarModal from "@/components/shared/SidebarModal";
import NotesApp from "@/components/shared/NoteApp";
import RemindersApp from "@/components/shared/RemindersApp";
import { StickyNote, CalendarCheck, LayoutDashboard, Settings } from "lucide-react"; // Import the relevant icons

const Sidebar = () => {
  const [activeModal, setActiveModal] = useState<number | null>(null);

  const icons = [
    { component: StickyNote, alt: "Notes", id: 1 },
    { component: CalendarCheck, alt: "Reminders", id: 2 },
    { component: LayoutDashboard, alt: "Dashboard", id: 3 },
    { component: Settings, alt: "Settings", id: 4 },
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
              <icon.component
                className="w-10 h-10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={icon.alt}
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
