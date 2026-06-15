"use client";

import { useState } from "react";
import AnimatedModal from "@/components/shared/AnimatedModal";
import StatsWithSession from "./StatsWithSession";
import { Chart } from "@/components/desk/icons";

/* The props for Bar (unchanged) */
interface BarProps {
  userId: string | null;
}

export default function Bar({ userId }: BarProps) {
  const [showDashboardModal, setShowDashboardModal] = useState(false);

  const items = [
    {
      key: "performance",
      label: "Performance",
      icon: Chart,
      onClick: () => setShowDashboardModal(true),
    },
  ];

  return (
    <>
      {/* Floating quick-actions pill. theme-desk scopes the tokens (it does NOT
          paint a background) so the pill looks identical on the landing page and
          the in-app themed pages, with no full-width band. */}
      <div className="theme-desk pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-rule bg-paper/95 p-1.5 shadow-[0_4px_20px_-8px_rgba(30,39,73,0.28)] backdrop-blur">
          {items.map((item, i) => (
            <div key={item.key} className="flex items-center">
              {i > 0 && <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-rule" />}
              <button
                type="button"
                onClick={item.onClick}
                className="group flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium tracking-tight text-pencil transition-all hover:bg-secondary hover:text-ink active:translate-y-px"
              >
                <span className="text-ballpoint transition-colors group-hover:text-ballpoint">
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* The performance dashboard modal. Wrapped in `theme-desk` because
          AnimatedModal portals out of this subtree — on the landing page there's
          no themed ancestor, so the scope here keeps the modal styled consistently. */}
      <AnimatedModal showModal={showDashboardModal} setShowModal={setShowDashboardModal}>
        <div className="theme-desk">
          <StatsWithSession />
        </div>
      </AnimatedModal>
    </>
  );
}
