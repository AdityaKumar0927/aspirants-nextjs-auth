import { GRIEVANCE_OFFICER_EMAIL } from "@/lib/constants";
import SuspendedActions from "./suspended-actions";

/**
 * Shown to any user whose role is "suspended". The middleware redirects every
 * other route here until an administrator restores their account.
 */
export default function SuspendedPage() {
  return (
    <div className="paper-sheet w-full max-w-md p-8 text-center">
      <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
        Access restricted
      </p>
      <h1 className="type-display mt-2 text-2xl text-ink">Your account is suspended</h1>
      <p className="mt-3 text-sm text-pencil">
        Access has been paused, usually because of activity that broke our
        community or moderation rules. If you think this is a mistake, get in
        touch and we&rsquo;ll review it.
      </p>
      <a
        href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`}
        className="mt-5 inline-block text-sm text-ballpoint underline"
      >
        {GRIEVANCE_OFFICER_EMAIL}
      </a>
      <SuspendedActions />
    </div>
  );
}
