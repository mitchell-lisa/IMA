"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui";

const DISPOSITIONS = ["new", "reviewing", "contacted", "workshop_scheduled", "workshop_completed", "opportunity", "not_a_fit", "unresponsive", "do_not_contact"] as const;

export function LeadReviewForm({
  leadId,
  initial,
  crmSyncStatus,
  emailStatus,
}: {
  leadId: string;
  initial: { disposition: string; followUpOwner: string; reviewNotes: string; licensedReviewCompleted: boolean };
  crmSyncStatus: string;
  emailStatus: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/producer/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposition: form.disposition,
          followUpOwner: form.followUpOwner || undefined,
          reviewNotes: form.reviewNotes || undefined,
          licensedReviewCompleted: form.licensedReviewCompleted,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setMsg("Saved.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function retrySync() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/producer/leads/${leadId}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      setMsg(`CRM sync: ${json.crmSyncStatus}`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Disposition">
        <select className={inputClass} value={form.disposition} onChange={(e) => setForm({ ...form, disposition: e.target.value })}>
          {DISPOSITIONS.map((d) => (
            <option key={d} value={d}>
              {d.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Follow-up owner">
        <input className={inputClass} maxLength={120} value={form.followUpOwner} onChange={(e) => setForm({ ...form, followUpOwner: e.target.value })} />
      </Field>
      <Field label="Review notes" hint="Internal. Never shown to the prospect.">
        <textarea className={inputClass} rows={5} maxLength={4000} value={form.reviewNotes} onChange={(e) => setForm({ ...form, reviewNotes: e.target.value })} />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={form.licensedReviewCompleted} onChange={(e) => setForm({ ...form, licensedReviewCompleted: e.target.checked })} />
        <span>Licensed professional has reviewed this lead and the findings above.</span>
      </label>
      <div className="flex items-center justify-between gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save review"}
        </Button>
        <Button variant="secondary" onClick={retrySync} disabled={busy}>
          Re-send to CRM
        </Button>
      </div>
      <p className="text-xs text-muted">
        CRM sync: {crmSyncStatus} · Prospect email: {emailStatus}
      </p>
      {msg ? <p className="text-xs text-navy">{msg}</p> : null}
    </form>
  );
}
