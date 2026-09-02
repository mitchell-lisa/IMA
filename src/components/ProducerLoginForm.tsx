"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui";

export function ProducerLoginForm({ mode }: { mode: "supabase" | "passcode" | "none" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/producer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passcode: passcode || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Sign-in failed");
      if (json.redirect) {
        router.push(json.redirect);
        router.refresh();
      } else setMessage(json.message ?? "Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Work email" required>
        <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {mode === "passcode" ? (
        <Field label="Passcode" required>
          <input type="password" required className={inputClass} value={passcode} onChange={(e) => setPasscode(e.target.value)} />
        </Field>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-good">{message}</p> : null}
      <Button type="submit" disabled={busy || mode === "none"}>
        {busy ? "Signing in…" : mode === "supabase" ? "Send sign-in link" : "Sign in"}
      </Button>
    </form>
  );
}
