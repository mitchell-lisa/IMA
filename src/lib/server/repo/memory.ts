import { randomUUID } from "node:crypto";
import type { AssessmentRecord, EventRecord, LeadListItem, LeadRecord, Repository } from "./types";

interface Store {
  assessments: Map<string, AssessmentRecord>;
  leads: Map<string, LeadRecord>;
  events: EventRecord[];
}

/**
 * In-memory repository for local development and tests. State survives hot
 * reloads via globalThis but is lost on process restart.
 */
export class MemoryRepository implements Repository {
  private store: Store;

  constructor(store?: Store) {
    const g = globalThis as unknown as { __marketReadyStore?: Store };
    if (!store) {
      g.__marketReadyStore ??= { assessments: new Map(), leads: new Map(), events: [] };
      store = g.__marketReadyStore;
    }
    this.store = store;
  }

  async createAssessment(input: Omit<AssessmentRecord, "id" | "createdAt" | "updatedAt">): Promise<AssessmentRecord> {
    const now = new Date().toISOString();
    const rec: AssessmentRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.store.assessments.set(rec.id, rec);
    return structuredClone(rec);
  }
  async getAssessment(id: string) {
    const r = this.store.assessments.get(id);
    return r ? structuredClone(r) : null;
  }
  async getAssessmentByToken(token: string) {
    for (const r of this.store.assessments.values()) if (r.resultsToken === token) return structuredClone(r);
    return null;
  }
  async updateAssessment(id: string, patch: Partial<AssessmentRecord>) {
    const r = this.store.assessments.get(id);
    if (!r) throw new Error("Assessment not found");
    const next = { ...r, ...patch, id, updatedAt: new Date().toISOString() };
    this.store.assessments.set(id, next);
    return structuredClone(next);
  }

  async createLead(input: Omit<LeadRecord, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const rec: LeadRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.store.leads.set(rec.id, rec);
    return structuredClone(rec);
  }
  async getLead(id: string) {
    const r = this.store.leads.get(id);
    return r ? structuredClone(r) : null;
  }
  async getLeadByAssessment(assessmentId: string) {
    for (const r of this.store.leads.values()) if (r.assessmentId === assessmentId) return structuredClone(r);
    return null;
  }
  async updateLead(id: string, patch: Partial<LeadRecord>) {
    const r = this.store.leads.get(id);
    if (!r) throw new Error("Lead not found");
    const next = { ...r, ...patch, id, updatedAt: new Date().toISOString() };
    this.store.leads.set(id, next);
    return structuredClone(next);
  }
  async listLeads(opts?: { limit?: number }): Promise<LeadListItem[]> {
    const items: LeadListItem[] = [];
    for (const lead of this.store.leads.values()) {
      const assessment = this.store.assessments.get(lead.assessmentId);
      if (assessment) items.push({ lead: structuredClone(lead), assessment: structuredClone(assessment) });
    }
    items.sort((a, b) => b.lead.createdAt.localeCompare(a.lead.createdAt));
    return items.slice(0, opts?.limit ?? 200);
  }

  async recordEvent(input: Omit<EventRecord, "id" | "createdAt">) {
    this.store.events.push({ ...input, id: randomUUID(), createdAt: new Date().toISOString() });
    if (this.store.events.length > 5000) this.store.events.splice(0, this.store.events.length - 5000);
  }
  async listEvents(assessmentId: string) {
    return this.store.events.filter((e) => e.assessmentId === assessmentId).map((e) => structuredClone(e));
  }
}
