import api from "./api"; // your axios instance

// --- Types ---
export type AgreementStatus = "draft" | "in-progress" | "resolved" | "exported";

export interface Agreement {
  _id: string;
  userid: string;
  partyAName?: string;
  partyBUserId?: string | null;
  partyBEmail?: string | null;
  templateId: string;
  clauses: {
    clauseId: string;
    partyAPreference: string;
    partyBPreference: string;
  }[];
  status?: AgreementStatus;
  effectiveDate: string;
  termDuration?: string;
  jurisdiction?: string;
  signedDate?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Create Agreement ---
interface CreateAgreementPayload {
  templateId: string;
  clauses: string[]; // clause IDs
  partyBUserId?: string;
  partyBEmail?: string;
  effectiveDate: string;
  termDuration?: string;
  jurisdiction?: string;
  signedDate?: string;
}

export async function createAgreement(
  token: string,
  payload: CreateAgreementPayload
): Promise<{ message: string; agreement: Agreement; inviteLink?: string }> {
  const response = await api.post("/agreement/createagreement", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// --- Update Agreement Status ---
export async function updateAgreementStatus(
  token: string,
  agreementId: string,
  status: string
): Promise<{ message: string; agreement: Agreement }> {
  const response = await api.put(`/agreement/${agreementId}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// --- Update Clause Preferences ---
export async function updateClausePreferences(
  token: string,
  agreementId: string,
  clauses: Array<{
    clauseId: string;
    partyAPreference?: string;
    partyBPreference?: string;
  }>
): Promise<{ message: string; agreement: Agreement }> {
  const response = await api.put(`/agreement/${agreementId}/clauses`, { clauses }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// --- Send Chat Message ---
export async function sendChatMessage(
  token: string,
  agreementId: string,
  message: string,
  senderRole: 'partyA' | 'partyB'
): Promise<{ message: string; chatMessage: any }> {
  const response = await api.post(`/agreement/chat/send`, {
    agreementId,
    message,
    senderRole
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// --- Get Chat Messages ---
export async function getChatMessages(
  token: string,
  agreementId: string
): Promise<{ messages: any[] }> {
  const response = await api.get(`/agreement/chat/${agreementId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// --- Download Agreement PDF ---
export async function downloadAgreementPDF(
  token: string,
  agreementId: string
): Promise<string> {
  const response = await api.get(`/agreement/${agreementId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.downloadUrl;
}

// --- Accept Invitation ---
export async function acceptInvitation(
  token: string,
  inviteToken: string
): Promise<{ message: string; agreement: Agreement }> {
  const response = await api.post(`/agreement/accept/${inviteToken}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// --- Get All Agreements ---
export async function getAgreements(token: string): Promise<Agreement[]> {
  const response = await api.get("/agreement/allagrements", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// --- Get Agreement by ID ---
export async function getAgreementById(
  token: string,
  id: string
): Promise<Agreement> {
  const response = await api.get(`/agreement/agreementbyid/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
