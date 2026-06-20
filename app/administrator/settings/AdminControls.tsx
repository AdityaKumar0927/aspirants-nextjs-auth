"use client";

import { useCallback, useEffect, useState } from "react";
import { Switch } from "@/components/admin/switch";
import { Input } from "@/components/admin/input";
import { Textarea } from "@/components/admin/textarea";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/ui/button";
import { Subheading } from "@/components/admin/heading";
import { Divider } from "@/components/admin/divider";
import { Text } from "@/components/admin/text";
import { Badge } from "@/components/admin/badge";
import { FEATURE_KEYS, type FeatureKey } from "@/lib/feature-keys";

// Plain Label/Description — NOT the Headless `@/components/admin/fieldset` ones,
// which throw "Label is not inside a relevant parent" when rendered outside a
// <Field>/<SwitchField>. These render anywhere; controls carry their own
// aria-label for accessibility.
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm/6 font-medium text-zinc-950 dark:text-white">{children}</div>;
}
function Description({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm/6 text-zinc-500 dark:text-zinc-400 ${className}`}>{children}</p>;
}

/**
 * The operational control panel. Self-fetches the live config + announcements
 * (the admin tree mounts no data provider) and saves each section independently
 * via PATCH /api/admin/app-config. Dangerous transitions get a 428 from the
 * server and are retried after an explicit confirmation, so a stolen tab can't
 * silently flip maintenance/read-only/registration.
 */

type Announcement = {
  id: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  dismissible: boolean;
  active: boolean;
  audience: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

type Config = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceAllowIps: string[];
  readOnlyMode: boolean;
  registrationOpen: boolean;
  features: Partial<Record<FeatureKey, boolean>>;
  aiFallbackForced: boolean;
  globalRateLimit: number;
  globalRateWindowSec: number;
  perUserRateLimit: number;
  perUserRateWindowSec: number;
  signupThrottleLimit: number;
  signupThrottleWindowSec: number;
  emailDomainBlocklist: string[];
  ipBanList: string[];
  captchaEnabled: boolean;
  freeQuestionsPerDay: number;
  freePdfUploadsPerMonth: number;
  trialDays: number;
  promoCodesEnabled: boolean;
  pricingVisible: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMin: number;
  adminAllowlist: string[];
  sessionsValidFrom: string | null;
  verboseLogging: boolean;
  adminErrorVisibility: boolean;
  impersonationEnabled: boolean;
};

type SectionId =
  | "kill"
  | "features"
  | "rate"
  | "business"
  | "security"
  | "support";

type Status = "idle" | "saving" | "saved" | "error";

const lines = (arr: string[]) => arr.join("\n");
const parseLines = (s: string) =>
  Array.from(new Set(s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean)));

export function AdminControls() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loadError, setLoadError] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<{
    keys: (keyof Config)[];
    section: SectionId;
    message: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [c, a] = await Promise.all([
          fetch("/api/admin/app-config").then((r) => (r.ok ? r.json() : Promise.reject())),
          fetch("/api/admin/announcements").then((r) => (r.ok ? r.json() : { announcements: [] })),
        ]);
        if (!alive) return;
        setConfig(c.config);
        setAnnouncements(a.announcements ?? []);
      } catch {
        if (alive) setLoadError("Couldn't load settings.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const set = useCallback(<K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  }, []);

  const setFeature = useCallback((key: FeatureKey, on: boolean) => {
    setConfig((c) => (c ? { ...c, features: { ...c.features, [key]: on } } : c));
  }, []);

  // Save a section (a subset of keys). On a 428 the server is asking for an
  // explicit confirmation; surface the modal and let the user retry.
  const save = useCallback(
    async (section: SectionId, keys: (keyof Config)[], confirm = false) => {
      if (!config) return;
      setStatus((s) => ({ ...s, [section]: "saving" }));
      setErrors((e) => ({ ...e, [section]: "" }));
      const body: Record<string, unknown> = { confirm };
      for (const k of keys) body[k] = config[k];
      try {
        const res = await fetch("/api/admin/app-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 428) {
          setConfirmState({ keys, section, message: data.message || "Confirm this change?" });
          setStatus((s) => ({ ...s, [section]: "idle" }));
          return;
        }
        if (!res.ok) throw new Error(data.error || "Couldn't save");
        if (data.config) setConfig(data.config);
        setStatus((s) => ({ ...s, [section]: "saved" }));
      } catch (e) {
        setErrors((er) => ({ ...er, [section]: e instanceof Error ? e.message : "Couldn't save" }));
        setStatus((s) => ({ ...s, [section]: "error" }));
      }
    },
    [config]
  );

  if (loadError) return <Text className="text-redpen">{loadError}</Text>;
  if (!config) return <Text>Loading controls…</Text>;

  return (
    <div className="space-y-10">
      <KillSwitches config={config} set={set} setFeature={setFeature} save={save} status={status} errors={errors} />
      <Divider soft />
      <RateLimits config={config} set={set} save={save} status={status} errors={errors} />
      <Divider soft />
      <Announcements list={announcements} setList={setAnnouncements} />
      <Divider soft />
      <BusinessRules config={config} set={set} save={save} status={status} errors={errors} />
      <Divider soft />
      <Security config={config} set={set} save={save} status={status} errors={errors} />
      <Divider soft />
      <SupportDebug config={config} set={set} save={save} status={status} errors={errors} />

      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => {
            const { section, keys } = confirmState;
            setConfirmState(null);
            void save(section, keys, true);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared field building blocks
// ---------------------------------------------------------------------------

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-1">
      <div className="min-w-0">
        <Label>{label}</Label>
        {description && <Description>{description}</Description>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
  color,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: "red" | "amber" | "green";
}) {
  return (
    <Row label={label} description={description}>
      <Switch aria-label={label} checked={value} onChange={onChange} color={color} />
    </Row>
  );
}

function NumberField({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 1_000_000,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {description && <Description>{description}</Description>}
      <Input
        type="number"
        aria-label={label}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Math.floor(Number(e.target.value) || 0))))}
      />
    </div>
  );
}

function ListField({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  // Keep a local RAW text buffer so typing (incl. newlines) is smooth, but push
  // the parsed array up on every keystroke — so a Save click never reads stale
  // state even if the field wasn't blurred first. Re-sync the buffer when the
  // upstream value changes (e.g. after the server echoes the saved config).
  const [raw, setRaw] = useState(lines(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setRaw(lines(value));
  }, [value, editing]);

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {description && <Description>{description}</Description>}
      <Textarea
        rows={3}
        aria-label={label}
        placeholder={placeholder}
        value={raw}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(parseLines(e.target.value));
        }}
        className="font-mono text-xs"
      />
    </div>
  );
}

function SaveBar({
  section,
  onSave,
  status,
  error,
}: {
  section: SectionId;
  onSave: () => void;
  status: Record<string, Status>;
  error?: string;
}) {
  const st = status[section] ?? "idle";
  return (
    <div className="mt-4 flex items-center gap-3">
      <Button type="button" onClick={onSave} disabled={st === "saving"}>
        {st === "saving" ? "Saving…" : "Save"}
      </Button>
      {st === "saved" && <span className="text-sm text-st-answered">Saved.</span>}
      {st === "error" && <span className="text-sm text-redpen">{error || "Couldn't save."}</span>}
    </div>
  );
}

function SectionShell({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      <div className="space-y-1">
        <Subheading>{title}</Subheading>
        <Text>{blurb}</Text>
      </div>
      <div>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

type SaveFn = (section: SectionId, keys: (keyof Config)[], confirm?: boolean) => void;
type SetFn = <K extends keyof Config>(key: K, value: Config[K]) => void;

function KillSwitches({
  config,
  set,
  setFeature,
  save,
  status,
  errors,
}: {
  config: Config;
  set: SetFn;
  setFeature: (key: FeatureKey, on: boolean) => void;
  save: SaveFn;
  status: Record<string, Status>;
  errors: Record<string, string>;
}) {
  return (
    <>
      <SectionShell
        title="Kill switches"
        blurb="Site-wide brakes for an incident. Maintenance and read-only need a confirmation; admins always bypass maintenance, and so do the allow-listed IPs."
      >
        <div className="space-y-4">
          <Toggle
            label="Maintenance mode"
            description="Park everyone (except admins / allow-listed IPs) on a maintenance screen."
            value={config.maintenanceMode}
            onChange={(v) => set("maintenanceMode", v)}
            color="red"
          />
          <div className="space-y-1">
            <Label>Maintenance message</Label>
            <Input
              aria-label="Maintenance message"
              value={config.maintenanceMessage}
              maxLength={500}
              onChange={(e) => set("maintenanceMessage", e.target.value)}
            />
          </div>
          <ListField
            label="Maintenance IP allowlist"
            description="IPs that bypass maintenance — your office / VPN, one per line."
            value={config.maintenanceAllowIps}
            onChange={(v) => set("maintenanceAllowIps", v)}
            placeholder="203.0.113.7"
          />
          <Toggle
            label="Read-only mode"
            description="Users can browse, but writes are blocked. A lifesaver during migrations."
            value={config.readOnlyMode}
            onChange={(v) => set("readOnlyMode", v)}
            color="amber"
          />
          <Toggle
            label="Registration open"
            description="Turn signups off during an abuse wave or a botched launch."
            value={config.registrationOpen}
            onChange={(v) => set("registrationOpen", v)}
            color="green"
          />
        </div>
        <SaveBar
          section="kill"
          status={status}
          error={errors.kill}
          onSave={() =>
            save("kill", [
              "maintenanceMode",
              "maintenanceMessage",
              "maintenanceAllowIps",
              "readOnlyMode",
              "registrationOpen",
            ])
          }
        />
      </SectionShell>

      <SectionShell
        title="Feature flags"
        blurb="Flip individual features off independently — when a provider has an outage you switch the feature off (or force fallback) instead of shipping a hotfix."
      >
        <div className="space-y-4">
          {FEATURE_KEYS.map((f) => (
            <Toggle
              key={f.key}
              label={f.label}
              description={f.description}
              value={config.features[f.key] !== false}
              onChange={(v) => setFeature(f.key, v)}
            />
          ))}
          <Toggle
            label="Force AI fallback"
            description="Skip the primary AI provider and use the fallback chain (e.g. during a Gemini outage)."
            value={config.aiFallbackForced}
            onChange={(v) => set("aiFallbackForced", v)}
            color="amber"
          />
        </div>
        <SaveBar
          section="features"
          status={status}
          error={errors.features}
          onSave={() => save("features", ["features", "aiFallbackForced"])}
        />
      </SectionShell>
    </>
  );
}

function RateLimits({
  config,
  set,
  save,
  status,
  errors,
}: {
  config: Config;
  set: SetFn;
  save: SaveFn;
  status: Record<string, Status>;
  errors: Record<string, string>;
}) {
  return (
    <SectionShell
      title="Rate limits & abuse"
      blurb="Request brakes and signup-flood defenses. Set a limit to 0 to disable that tier. The signup throttle is a global cap on new accounts per window."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Global / IP" description="requests" value={config.globalRateLimit} onChange={(v) => set("globalRateLimit", v)} />
          <NumberField label="Window (sec)" value={config.globalRateWindowSec} min={1} max={86400} onChange={(v) => set("globalRateWindowSec", v)} />
          <NumberField label="Per user" description="requests" value={config.perUserRateLimit} onChange={(v) => set("perUserRateLimit", v)} />
          <NumberField label="Window (sec)" value={config.perUserRateWindowSec} min={1} max={86400} onChange={(v) => set("perUserRateWindowSec", v)} />
          <NumberField label="Signup throttle" description="new accts / window" value={config.signupThrottleLimit} onChange={(v) => set("signupThrottleLimit", v)} />
          <NumberField label="Window (sec)" value={config.signupThrottleWindowSec} min={1} max={604800} onChange={(v) => set("signupThrottleWindowSec", v)} />
        </div>
        <ListField
          label="Email-domain blocklist"
          description="Block new signups from these domains (disposable-email floods). One per line."
          value={config.emailDomainBlocklist}
          onChange={(v) => set("emailDomainBlocklist", v)}
          placeholder="mailinator.com"
        />
        <ListField
          label="IP ban list"
          description="Blocked at the edge for page requests. One per line."
          value={config.ipBanList}
          onChange={(v) => set("ipBanList", v)}
          placeholder="203.0.113.66"
        />
        <Toggle
          label="CAPTCHA"
          description="Exposed to client surfaces (off normally, flip on under attack)."
          value={config.captchaEnabled}
          onChange={(v) => set("captchaEnabled", v)}
        />
      </div>
      <SaveBar
        section="rate"
        status={status}
        error={errors.rate}
        onSave={() =>
          save("rate", [
            "globalRateLimit",
            "globalRateWindowSec",
            "perUserRateLimit",
            "perUserRateWindowSec",
            "signupThrottleLimit",
            "signupThrottleWindowSec",
            "emailDomainBlocklist",
            "ipBanList",
            "captchaEnabled",
          ])
        }
      />
    </SectionShell>
  );
}

function BusinessRules({
  config,
  set,
  save,
  status,
  errors,
}: {
  config: Config;
  set: SetFn;
  save: SaveFn;
  status: Record<string, Status>;
  errors: Record<string, string>;
}) {
  return (
    <SectionShell
      title="Business rules"
      blurb="Free-tier caps and commerce flags. Pricing visibility and promo codes apply once a billing system is wired; the daily caps apply once usage metering lands. Stored and audited now."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Free questions / day" description="0 = unlimited" value={config.freeQuestionsPerDay} onChange={(v) => set("freeQuestionsPerDay", v)} />
          <NumberField label="Free PDFs / month" description="0 = unlimited" value={config.freePdfUploadsPerMonth} onChange={(v) => set("freePdfUploadsPerMonth", v)} />
          <NumberField label="Trial length (days)" value={config.trialDays} min={0} max={3650} onChange={(v) => set("trialDays", v)} />
        </div>
        <Toggle label="Promo codes" description="Enable promo-code redemption." value={config.promoCodesEnabled} onChange={(v) => set("promoCodesEnabled", v)} />
        <Toggle label="Pricing visible" description="Show prices publicly." value={config.pricingVisible} onChange={(v) => set("pricingVisible", v)} />
      </div>
      <SaveBar
        section="business"
        status={status}
        error={errors.business}
        onSave={() =>
          save("business", ["freeQuestionsPerDay", "freePdfUploadsPerMonth", "trialDays", "promoCodesEnabled", "pricingVisible"])
        }
      />
    </SectionShell>
  );
}

function Security({
  config,
  set,
  save,
  status,
  errors,
}: {
  config: Config;
  set: SetFn;
  save: SaveFn;
  status: Record<string, Status>;
  errors: Record<string, string>;
}) {
  return (
    <SectionShell
      title="Security"
      blurb="Session and admin controls. Force-logout signs everyone out (including you) — your re-login mints a fresh session."
    >
      <div className="space-y-4">
        <Toggle
          label="Require email verification"
          description="Block sign-ins from providers that don't assert a verified email."
          value={config.requireEmailVerification}
          onChange={(v) => set("requireEmailVerification", v)}
        />
        <NumberField
          label="Idle session timeout (min)"
          description="0 = use the auth default. Signs out inactive sessions."
          value={config.sessionTimeoutMin}
          min={0}
          max={525600}
          onChange={(v) => set("sessionTimeoutMin", v)}
        />
        <ListField
          label="Admin email allowlist"
          description="Optional: emails permitted to wield admin. Empty = role alone governs. One per line."
          value={config.adminAllowlist}
          onChange={(v) => set("adminAllowlist", v)}
          placeholder="you@example.com"
        />
        <SaveBar
          section="security"
          status={status}
          error={errors.security}
          onSave={() => save("security", ["requireEmailVerification", "sessionTimeoutMin", "adminAllowlist"])}
        />
        <Divider soft className="my-2" />
        <ForceLogout />
      </div>
    </SectionShell>
  );
}

function SupportDebug({
  config,
  set,
  save,
  status,
  errors,
}: {
  config: Config;
  set: SetFn;
  save: SaveFn;
  status: Record<string, Status>;
  errors: Record<string, string>;
}) {
  return (
    <SectionShell
      title="Support & debug"
      blurb="Support tooling and diagnostics. Impersonation is super-admin only, time-boxed, fully audited, and can never perform admin actions."
    >
      <div className="space-y-4">
        <Toggle label="Verbose logging" description="Extra server-side diagnostics." value={config.verboseLogging} onChange={(v) => set("verboseLogging", v)} />
        <Toggle
          label="Admin error visibility"
          description="Surface stack traces to admins in-app."
          value={config.adminErrorVisibility}
          onChange={(v) => set("adminErrorVisibility", v)}
        />
        <Toggle
          label="Impersonation enabled"
          description="Master switch for 'act as user' support impersonation."
          value={config.impersonationEnabled}
          onChange={(v) => set("impersonationEnabled", v)}
        />
        <SaveBar
          section="support"
          status={status}
          error={errors.support}
          onSave={() => save("support", ["verboseLogging", "adminErrorVisibility", "impersonationEnabled"])}
        />
        <Divider soft className="my-2" />
        <Impersonate enabled={config.impersonationEnabled} />
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Announcements (own CRUD)
// ---------------------------------------------------------------------------

function Announcements({
  list,
  setList,
}: {
  list: Announcement[];
  setList: React.Dispatch<React.SetStateAction<Announcement[]>>;
}) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<Announcement["type"]>("INFO");
  const [audience, setAudience] = useState("ALL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!message.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type, audience }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't create");
      setList((l) => [data.announcement, ...l]);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    const res = await fetch(`/api/admin/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !a.active }),
    });
    if (res.ok) setList((l) => l.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)));
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setList((l) => l.filter((x) => x.id !== id));
  };

  return (
    <SectionShell
      title="Announcements"
      blurb="Sitewide banner: text + type, dismissible, optionally targeted to a tier. Covers 'exam tomorrow' notices and '2am maintenance' without touching code."
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>New banner</Label>
          <Textarea aria-label="New banner message" rows={2} value={message} maxLength={400} placeholder="Message shown to users…" onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select aria-label="Banner type" value={type} onChange={(e) => setType(e.target.value as Announcement["type"])}>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </Select>
          <Select aria-label="Banner audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="ALL">Everyone</option>
            <option value="FREE">Free tier</option>
            <option value="PREMIUM">Premium</option>
            <option value="INSTITUTION">Institution</option>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={create} disabled={busy || !message.trim()}>
            {busy ? "Posting…" : "Post banner"}
          </Button>
          {error && <span className="text-sm text-redpen">{error}</span>}
        </div>

        {list.length > 0 && (
          <ul className="mt-2 divide-y divide-zinc-950/5 dark:divide-white/10">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge color={a.type === "CRITICAL" ? "red" : a.type === "WARNING" ? "amber" : a.type === "SUCCESS" ? "green" : "zinc"}>
                      {a.type.toLowerCase()}
                    </Badge>
                    {!a.active && <Badge color="zinc">paused</Badge>}
                    {a.audience !== "ALL" && <Badge color="blue">{a.audience.toLowerCase()}</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-pencil">{a.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => toggleActive(a)}>
                    {a.active ? "Pause" : "Resume"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => remove(a.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Destructive actions
// ---------------------------------------------------------------------------

function ForceLogout() {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const PHRASE = "LOG OUT EVERYONE";

  const run = async () => {
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/admin/sessions/logout-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't run");
      setStatus("saved");
      setOpen(false);
      setPhrase("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't run");
      setStatus("error");
    }
  };

  return (
    <div>
      <Label>Force-logout all sessions</Label>
      <Description>Breach break-glass: signs out every user, including you.</Description>
      {!open ? (
        <Button type="button" variant="destructive" className="mt-2" onClick={() => setOpen(true)}>
          Nuke all sessions
        </Button>
      ) : (
        <div className="mt-2 space-y-2 rounded-lg border border-redpen/30 p-3">
          <Description>
            Type <span className="font-mono font-semibold">{PHRASE}</span> to confirm.
          </Description>
          <Input aria-label="Confirmation phrase" value={phrase} onChange={(e) => setPhrase(e.target.value)} />
          <div className="flex items-center gap-2">
            <Button type="button" variant="destructive" disabled={phrase !== PHRASE || status === "saving"} onClick={run}>
              {status === "saving" ? "Working…" : "Confirm"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setPhrase(""); }}>
              Cancel
            </Button>
            {status === "saved" && <span className="text-sm text-st-answered">Done.</span>}
            {status === "error" && <span className="text-sm text-redpen">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Impersonate({ enabled }: { enabled: boolean }) {
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const start = async () => {
    if (!target.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: target.trim(), confirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't start");
      // Reload so the impersonation overlay + banner take effect everywhere.
      window.location.href = "/";
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't start");
      setBusy(false);
    }
  };

  return (
    <div>
      <Label>Impersonate a user</Label>
      <Description>Super-admin only, time-boxed (30 min), audited. Blocked from all admin actions.</Description>
      <div className="mt-2 flex items-center gap-2">
        <Input
          aria-label="User id or email to impersonate"
          value={target}
          disabled={!enabled}
          placeholder="user id or email"
          onChange={(e) => setTarget(e.target.value)}
        />
        <Button type="button" disabled={!enabled || busy || !target.trim()} onClick={start}>
          {busy ? "Starting…" : "Start"}
        </Button>
      </div>
      {!enabled && <Description className="mt-1">Enable impersonation above first.</Description>}
      {msg && <span className="mt-1 block text-sm text-redpen">{msg}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm modal (step-up for dangerous transitions)
// ---------------------------------------------------------------------------

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
        <Subheading>Confirm change</Subheading>
        <Text className="mt-2">{message}</Text>
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Yes, proceed
          </Button>
        </div>
      </div>
    </div>
  );
}
