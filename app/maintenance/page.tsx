import { getAppConfig } from "@/lib/app-config";
import { getSiteName } from "@/lib/site-config";

/**
 * The maintenance screen. Non-admins are parked here while maintenance mode is
 * on (by the edge middleware and/or the public-layout gate). Admins and
 * allow-listed IPs bypass it, so this page is only ever seen by everyone else.
 * Rendered as plain TEXT (the admin-set message is never injected as HTML).
 */
export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const [config, siteName] = await Promise.all([getAppConfig(), getSiteName()]);
  return (
    <div className="paper-sheet w-full max-w-md p-6 text-center sm:p-8">
      <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">{siteName}</p>
      <h1 className="type-display mt-2 text-2xl text-ink">Down for maintenance</h1>
      <p className="mt-3 text-sm text-pencil">{config.maintenanceMessage}</p>
      <p className="mt-5 text-xs text-pencil">
        Are you an admin?{" "}
        <a href="/api/auth/signin" className="text-ballpoint underline">
          Sign in
        </a>{" "}
        to bypass.
      </p>
    </div>
  );
}
