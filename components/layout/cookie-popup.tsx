// components/CookiePopup.tsx
"use client";

import { useEffect, useState } from "react";

const CookiePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Check for cookie consent in local storage or cookies
  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  // Handle Accept button click
  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  // Handle Reject button click
  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
  };

  // Handle Close button click
  const handleClose = () => {
    setIsVisible(false);
  };

  // Handle Preferences button click
  const handlePreferences = () => {
    // Open preferences modal or handle accordingly
    console.log("Preferences clicked");
  };

  // Do not render if the user has already accepted or rejected cookies
  if (!isVisible) return null;

  return (
    <section className="z-[1000] fixed max-w-md p-4 mx-auto bg-white border border-gray-200 dark:bg-gray-800 left-12 bottom-16 dark:border-gray-700 rounded-2xl">
      <h2 className="font-semibold text-gray-800 dark:text-white">🍪 We use cookies!</h2>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        Hi, this website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it. The latter will be set only after consent.{" "}
        <a href="#" className="font-medium text-gray-700 underline transition-colors duration-300 dark:hover:text-blue-400 dark:text-white hover:text-blue-500">
          Let me choose
        </a>.
      </p>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        Closing this modal default settings will be saved.
      </p>
      <div className="grid grid-cols-2 gap-4 mt-4 shrink-0">
        <button
          onClick={handleAccept}
          className="text-xs bg-gray-900 font-medium rounded-lg hover:bg-gray-700 text-white px-4 py-2.5 duration-300 transition-colors focus:outline-none"
        >
          Accept all
        </button>
        <button
          onClick={handleReject}
          className="text-xs border text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 font-medium rounded-lg px-4 py-2.5 duration-300 transition-colors focus:outline-none"
        >
          Reject all
        </button>
        <button
          onClick={handlePreferences}
          className="text-xs border text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 font-medium rounded-lg px-4 py-2.5 duration-300 transition-colors focus:outline-none"
        >
          Preferences
        </button>
        <button
          onClick={handleClose}
          className="text-xs border text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 font-medium rounded-lg px-4 py-2.5 duration-300 transition-colors focus:outline-none"
        >
          Close
        </button>
      </div>
    </section>
  );
};

export default CookiePopup;
