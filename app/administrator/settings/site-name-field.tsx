"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/admin/input";
import { Button } from "@/components/admin/button";

/**
 * The one functional control on the admin settings page: read + rename the site.
 * GETs the current name, PATCHes /api/admin/site-config (after which every server
 * surface reads the new name on its next request), and shows inline status — no
 * Toaster needed (the admin tree doesn't mount one).
 */
export function SiteNameField() {
  const [name, setName] = useState("");
  const [initial, setInitial] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/site-config")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => {
        if (!alive) return;
        setName(d.name);
        setInitial(d.name);
        setStatus("idle");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  const trimmed = name.trim();
  const dirty = trimmed.length > 0 && trimmed !== initial;

  async function save() {
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save");
      setInitial(data.name);
      setName(data.name);
      setStatus("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <Input
        aria-label="Site name"
        name="name"
        value={name}
        maxLength={50}
        disabled={status === "loading" || status === "saving"}
        onChange={(e) => {
          setName(e.target.value);
          if (status === "saved" || status === "error") setStatus("idle");
        }}
      />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={!dirty || status === "saving" || status === "loading"}>
          {status === "saving" ? "Saving…" : "Save name"}
        </Button>
        {status === "loading" && <span className="text-sm text-pencil">Loading…</span>}
        {status === "saved" && <span className="text-sm text-st-answered">Saved — now live across the site.</span>}
        {status === "error" && <span className="text-sm text-redpen">{error || "Couldn't save."}</span>}
      </div>
    </div>
  );
}
