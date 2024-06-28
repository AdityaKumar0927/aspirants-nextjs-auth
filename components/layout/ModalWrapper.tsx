// components/shared/ModalWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import WorkInProgressModal from "@/components/layout/WorkInProgressModal";

const ModalWrapper = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <WorkInProgressModal showModal={showModal} setShowModal={setShowModal} />
  );
};

export default ModalWrapper;
