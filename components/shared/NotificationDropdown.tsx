"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import Popover from "@/components/shared/popover";

const NotificationDropdown = () => {
  const [openPopover, setOpenPopover] = useState(false);
  const notifications = [
    { id: 1, message: "New feature added!" },
    { id: 2, message: "Site maintenance scheduled." },
  ];

  return (
    <div className="relative inline-block text-left">
      <Popover
        content={
          <div className="w-full rounded-md bg-white p-2 sm:w-56">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="p-2 text-sm text-gray-700">
                  {notification.message}
                </div>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-700">No new notifications.</div>
            )}
          </div>
        }
        align="end"
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
      >
        <button
          onClick={() => setOpenPopover(!openPopover)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-all duration-75 hover:text-black focus:outline-none active:scale-95 sm:h-9 sm:w-9"
        >
          <FontAwesomeIcon icon={faBell} />
        </button>
      </Popover>
    </div>
  );
};

export default NotificationDropdown;
