"use client";

import { useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import T from "@/components/i18n/T"

const SUPPORT_EMAIL = "aspirants.contact@gmail.com";
// Set NEXT_PUBLIC_TURNSTILE_SITE_KEY (free, from Cloudflare) to show the CAPTCHA.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const TOPICS = [
  "General question",
  "Report a problem with a question",
  "Partnership",
  "Volunteer/Moderator",
  "Other",
] as const;

const labelClass =
  "type-data block text-[11px] uppercase tracking-[0.14em] text-pencil";
const fieldClass =
  "mt-2 min-h-11 border-rule bg-secondary text-ink placeholder:text-pencil focus-visible:ring-ballpoint";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Honeypot value + Turnstile token (when present) are read straight from the
    // form DOM — Turnstile's implicit render injects "cf-turnstile-response".
    const fd = new FormData(e.currentTarget);
    const company = (fd.get("company") as string) || "";
    const turnstileToken = (fd.get("cf-turnstile-response") as string) || undefined;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, company, turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Something went wrong.");
      }
      setSent(true);
      toast({ variant: "success", title: "Message sent", description: "We’ll get back to you soon." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn’t send your message",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="paper-sheet p-6">
        <h2 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          Message sent
        </h2>
        <p className="mt-3 text-sm text-ink">
          Thanks for reaching out — we’ve received your message and will reply to the email you
          gave us. You can also write to us directly at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="type-data text-ballpoint underline"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5 min-h-11 border-rule text-ink"
          onClick={() => {
            setSent(false);
            setName("");
            setEmail("");
            setMessage("");
          }}
        >
          <T k="auto.contactContactForm.writeAnotherMessage" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="paper-sheet p-6">
      <h2 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
        <T k="auto.contactContactForm.sendUsAMessage" />
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            <T k="auto.contactContactForm.name" />
          </label>
          <Input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClass}>
            <T k="auto.contactContactForm.email" />
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-topic" className={labelClass}>
          <T k="auto.contactContactForm.topic" />
        </label>
        <select
          id="contact-topic"
          name="topic"
          value={topic}
          onChange={(e) =>
            setTopic(e.target.value as (typeof TOPICS)[number])
          }
          className="mt-2 flex min-h-11 w-full rounded-md border border-rule bg-secondary px-3 py-2 text-sm text-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ballpoint"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className={labelClass}>
          <T k="auto.contactContactForm.message" />
        </label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          placeholder="Tell us what's on your mind."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 min-h-32 border-rule bg-secondary text-ink placeholder:text-pencil focus-visible:ring-ballpoint focus-visible:ring-offset-0"
        />
      </div>

      {/* Honeypot: hidden from people; bots that fill it get dropped server-side. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {/* Cloudflare Turnstile (free CAPTCHA) — renders only when configured. */}
      {TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
            strategy="afterInteractive"
          />
          <div
            className="cf-turnstile mt-6"
            data-sitekey={TURNSTILE_SITE_KEY}
            data-theme="auto"
          />
        </>
      )}

      <Button type="submit" disabled={submitting} className="mt-6 min-h-11 px-6">
        {submitting ? "Sending…" : <T k="auto.contactContactForm.sendMessage" />}
      </Button>
    </form>
  );
}
