"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/diagnostic/labels";
import type { Role } from "@/lib/diagnostic/types";

export function EmailCapture({
  token,
  emailCaptured,
  workshopRequested,
  checklist,
}: {
  token: string;
  emailCaptured: boolean;
  workshopRequested: boolean;
  checklist: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", name: "", role: "" as Role | "", phone: "", consentReport: false, consentMarketing: false, workshopRequested: false, notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ tier: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.consentReport) {
      setError("Please confirm you would like the report sent to this address.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/lead/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: form.email,
          name: form.name || undefined,
          role: form.role || undefined,
          phone: form.phone || undefined,
          consentReport: true,
          consentMarketing: form.consentMarketing,
          workshopRequested: form.workshopRequested,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save your details.");
      setDone({ tier: json.tier });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (emailCaptured || done) {
    return (
      <Card className="border-teal/40">
        <h2 className="text-xl font-semibold text-navy">Your detailed report is unlocked</h2>
        <p className="mt-1 text-sm text-muted">We emailed the PDF to you. You can also download it here and work through your checklist.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href={`/api/results/${token}/pdf`}>Download PDF report</Button>
        </div>
        <h3 className="mt-6 text-base font-semibold">Your preparation checklist</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {checklist.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-0.5 inline-block h-4 w-4 flex-none rounded border border-line" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-md bg-sand/60 p-4 text-sm">
          {workshopRequested || (done && form.workshopRequested) ? (
            <p>
              <span className="font-semibold">Workshop requested.</span> A licensed advisor will review your results before reaching out, so the conversation is specific to your answers.
            </p>
          ) : (
            <p>
              <span className="font-semibold">Want to go deeper?</span> A complimentary 45-minute workshop walks through these findings with a licensed advisor and the documents you choose to share. Reply to your report email to schedule one.
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-navy">Get the detailed report and your preparation checklist</h2>
      <p className="mt-1 text-sm text-muted">
        The results above are yours regardless. Entering a work email unlocks the PDF report and a checklist personalized to your answers.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Work email" required>
          <input type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Name">
          <input className={inputClass} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Role">
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="">Select…</option>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phone" hint="Optional">
          <input className={inputClass} maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Anything specific you want confirmed?" hint="Optional">
            <textarea className={inputClass} rows={2} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2 space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={form.consentReport} onChange={(e) => setForm({ ...form, consentReport: e.target.checked })} />
            <span>Send my PDF report and checklist to this email. (Required to unlock the report.)</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={form.workshopRequested} onChange={(e) => setForm({ ...form, workshopRequested: e.target.checked })} />
            <span>I would like to schedule a complimentary workshop to review these findings with a licensed advisor.</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={form.consentMarketing} onChange={(e) => setForm({ ...form, consentMarketing: e.target.checked })} />
            <span>I agree to receive occasional educational content about commercial insurance readiness. I can unsubscribe at any time.</span>
          </label>
        </div>
        {error ? (
          <p role="alert" className="sm:col-span-2 text-sm text-bad">
            {error}
          </p>
        ) : null}
        <div className="sm:col-span-2 flex items-center justify-between gap-4">
          <p className="text-xs text-muted">No quote request. No obligation. See the privacy page for exactly what is stored.</p>
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Unlock report"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
