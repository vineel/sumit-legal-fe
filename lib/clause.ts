import api from "./api";

// Existing interfaces
export interface ClausePayload {
  name: string;
  category: string;
  description: string;
  required?: boolean;
  status?: "active" | "inactive";
}

export interface Clause extends ClausePayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
  variants: ClauseVariant[]; // Added variants array
}

export interface ClauseVariant {
  _id: string;
  name: string;
  riskLevel: "low" | "medium" | "high";
  legalText: string;
  status: "active" | "inactive";
  version: number;
}

export interface Pagination {
  totalClauses: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

// ✅ Create a new clause
export async function createClause(payload: ClausePayload): Promise<Clause> {
  const { data } = await api.post("/admin/clause/addclause", payload);
  return data;
}

// ✅ Get all clauses
export async function getClauses(page: number = 1, limit: number = 10): Promise<{ clauses: Clause[], pagination: Pagination }> {
  // Send the page and limit as query parameters
  const { data } = await api.get("/admin/clause/getall", {
    params: { page, limit },
  });
  
  // Return the clauses along with pagination metadata
  return data;
}

// ✅ Update a clause
export async function updateClause(id: string, payload: Partial<ClausePayload>): Promise<Clause> {
  const { data } = await api.put(`/admin/clause/updateclause/${id}`, payload);
  return data;
}

// ✅ Delete a clause
export async function deleteClause(id: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/admin/clause/deletecaluse/${id}`);
  return data;
}

// New APIs for Clause Variants

// ✅ Create a new clause variant
export async function createClauseVariant(clauseId: string, variantPayload: Omit<ClauseVariant, "_id">): Promise<Clause> {
  const { data } = await api.post("/admin/clause/addvariant", { clauseId, ...variantPayload });
  return data;
}

// ✅ Get all variants for a specific clause
export async function getClauseVariants(clauseId: string): Promise<ClauseVariant[]> {
  const { data } = await api.get(`/admin/clause/${clauseId}/variants`);
  return data;
}

// ✅ Update a specific clause variant
export async function updateClauseVariant(clauseId: string, variantId: string, variantPayload: Partial<ClauseVariant>): Promise<Clause> {
  const { data } = await api.put(`/admin/clause/updatevariant`, { clauseId, variantId, ...variantPayload });
  return data;
}

// ✅ Delete a specific clause variant
export async function deleteClauseVariant(variantId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/admin/clause/variant/${variantId}`);
  return data;
}
