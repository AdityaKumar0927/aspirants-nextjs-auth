import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch, faCircle, faChevronDown, faCheck, faTimesCircle, faStream } from '@fortawesome/free-solid-svg-icons';
import Popover from '@/components/shared/popover';

const StatusDropdown = () => {
  const [selectedStatus, setSelectedStatus] = useState("Backlog");
  const [openPopover, setOpenPopover] = useState(false);

  const statuses = [
    { name: "Backlog", icon: faCircleNotch, color: "text-gray-500" },
    { name: "Todo", icon: faCircle, color: "text-gray-400" },
    { name: "In Progress", icon: faCircle, color: "text-yellow-500" },
    { name: "In Review", icon: faCircle, color: "text-green-500" },
    { name: "Done", icon: faCircle, color: "text-blue-500" },
    { name: "Canceled", icon: faTimesCircle, color: "text-gray-500" },
    { name: "Duplicate", icon: faTimesCircle, color: "text-gray-500" },
  ];

  return (
    <Popover
      content={
        <div className="w-full bg-white rounded-md p-2">
          {statuses.map((status, index) => (
            <div
              key={index}
              className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${selectedStatus === status.name ? "bg-gray-100" : ""}`}
              onClick={() => {
                setSelectedStatus(status.name);
                setOpenPopover(false);
              }}
            >
              <FontAwesomeIcon icon={status.icon} className={`${status.color} mr-2`} />
              <span className="flex-1">{status.name}</span>
              {selectedStatus === status.name && <FontAwesomeIcon icon={faCheck} className="text-black" />}
              <span className="ml-2 text-gray-400">{index + 1}</span>
            </div>
          ))}
        </div>
      }
      align="start"
      openPopover={openPopover}
      setOpenPopover={setOpenPopover}
    >
      <button
        className="flex items-center px-3 py-1 bg-gray-100 rounded-full text-gray-600"
        onClick={() => setOpenPopover(!openPopover)}
      >
        <FontAwesomeIcon icon={faStream} className="mr-2" />
        {selectedStatus}
        <FontAwesomeIcon icon={faChevronDown} className="ml-2 text-gray-500" />
      </button>
    </Popover>
  );
};

export default StatusDropdown;
