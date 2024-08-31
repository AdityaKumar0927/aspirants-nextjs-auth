"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // Import useSession from next-auth

const CookiePopup = () => {
  const { data: session } = useSession(); // Check for user's session
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState<Record<string, boolean>>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Check for cookie consent in local storage or cookies and if the user is not signed in
  useEffect(() => {
    if (!session) { // Show popup only if the user is not signed in
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) {
        setIsVisible(true);
      }
    }
  }, [session]);

  // Handle Accept all button click
  const handleAccept = () => {
    localStorage.setItem(
      "cookieConsent",
      JSON.stringify({ accepted: true, preferences: cookiePreferences })
    );
    setIsVisible(false);
  };

  // Handle Reject all button click
  const handleReject = () => {
    localStorage.setItem(
      "cookieConsent",
      JSON.stringify({ accepted: false, preferences: cookiePreferences })
    );
    setIsVisible(false);
  };

  // Handle Close button click
  const handleClose = () => {
    setIsVisible(false);
  };

  // Handle Preferences button click
  const handlePreferences = () => {
    setShowPreferences(true);
  };

  // Save preferences and close modal
  const handleSavePreferences = () => {
    localStorage.setItem(
      "cookieConsent",
      JSON.stringify({ accepted: true, preferences: cookiePreferences })
    );
    setShowPreferences(false);
    setIsVisible(false);
  };

  // Handle change in preferences
  const handlePreferenceChange = (type: keyof typeof cookiePreferences) => {
    setCookiePreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Do not render if the user has already accepted or rejected cookies or if the user is signed in
  if (!isVisible || session) return null;

  return (
    <>
      {/* Cookie Popup */}
      <section className="z-[1000] fixed max-w-md p-4 mx-auto bg-white border border-gray-200 dark:bg-gray-800 left-12 bottom-16 dark:border-gray-700 rounded-2xl">
        <h2 className="font-semibold text-gray-800 dark:text-white">🍪 We use cookies!</h2>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Hi, this website uses essential cookies to ensure its proper operation and tracking
          cookies to understand how you interact with it. The latter will be set only after
          consent.{" "}
          <a
            href="#"
            className="font-medium text-gray-700 underline transition-colors duration-300 dark:hover:text-blue-400 dark:text-white hover:text-blue-500"
          >
            Let me choose
          </a>
          .
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

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center backdrop-blur-md">
          <div className="bg-white p-6 rounded-lg shadow-md w-11/12 max-w-lg">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Cookie Preferences</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose which cookies you want to accept. You can always change these settings later.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Essential Cookies</span>
                <input
                  type="checkbox"
                  checked={cookiePreferences.essential}
                  disabled
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Analytics Cookies</span>
                <input
                  type="checkbox"
                  checked={cookiePreferences.analytics}
                  onChange={() => handlePreferenceChange("analytics")}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Marketing Cookies</span>
                <input
                  type="checkbox"
                  checked={cookiePreferences.marketing}
                  onChange={() => handlePreferenceChange("marketing")}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookiePopup;
