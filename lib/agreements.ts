import api from "./api"; // your axios instance

// --- Types ---
export type AgreementStatus = "draft" | "in-progress" | "resolved" | "exported" | "invited" | "accepted" | "signed" | "rejected";

export interface Agreement {
  _id: string;
  userid: string;
  partyAName?: string;
  partyBUserId?: string | null;
  partyBEmail?: string | null;
  templateId: string | { _id: string; templatename: string };
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
  partyASignature?: string;
  partyBSignature?: string;
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
  console.log("=== CREATE AGREEMENT API CALL ===")
  console.log("API URL:", `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/createagreement`)
  console.log("Payload:", payload)
  console.log("Token exists:", !!token)
  
  try {
    const response = await api.post("/agreement/createagreement", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Create agreement response:", response.data)
    return response.data;
  } catch (error: any) {
    console.error("❌ Create agreement error:", error)
    console.error("Error response:", error.response?.data)
    throw error
  }
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

// --- Update Single Clause Preference ---
export async function updateSingleClausePreference(
  token: string,
  agreementId: string,
  clauseId: string,
  preferences: {
    partyAPreference?: string;
    partyBPreference?: string;
  }
): Promise<{ message: string; agreement: Agreement }> {
  const response = await api.put(`/agreement/${agreementId}/clauses`, { 
    clauses: clauseId,
    ...preferences 
  }, {
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

// --- Download Agreement PDF (Admin) ---
export async function downloadAgreementPDF(
  token: string,
  agreementId: string
): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/${agreementId}/download-pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agreement-${agreementId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

// --- Generate Agreement PDF (Regular Users) ---
export async function generateAgreementPDF(
  token: string,
  agreementId: string
): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/${agreementId}/generate-pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agreement-${agreementId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}


// --- Delete Agreement --- REMOVED - delete functionality disabled
// export async function deleteAgreement(
//   token: string,
//   agreementId: string
// ): Promise<{ message: string; agreementId: string }> {
//   // Function removed - delete functionality disabled
// }

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
  console.log("=== GET AGREEMENT BY ID API CALL ===")
  console.log("API URL:", `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/agreementbyid/${id}`)
  console.log("Token exists:", !!token)
  console.log("Agreement ID:", id)
  
  try {
    const response = await api.get(`/agreement/agreementbyid/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Get agreement by ID response:", response.data)
    return response.data;
  } catch (error: any) {
    console.error("❌ Get agreement by ID error:", error)
    console.error("Error response:", error.response?.data)
    throw error
  }
}

// --- Send Invite ---
export async function sendInvite(
  token: string,
  agreementId: string,
  inviteeEmail: string
): Promise<{ message: string; inviteLink: string; inviteeName: string }> {
  console.log("=== SEND INVITE API CALL ===")
  console.log("Base URL:", process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  console.log("Full URL:", `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/agreement/send`)
  console.log("Payload:", { agreementId, inviteeEmail })
  console.log("Headers:", { Authorization: `Bearer ${token}` })
  
  try {
    const response = await api.post("/agreement/send", {
      agreementId,
      inviteeEmail
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("API Response:", response.data)
    return response.data;
  } catch (error: any) {
    console.error("API Error:", error)
    console.error("Error response:", error.response?.data)
    console.error("Error status:", error.response?.status)
    console.error("Error message:", error.message)
    throw error
  }
}

// --- Get AI Clause Suggestions ---
export async function getAIClauseSuggestions(token: string, agreementId: string): Promise<{
  success: boolean;
  suggestions: string;
  agreementInfo: {
    templateName: string;
    templateDescription: string;
    partyA: string;
    partyB: string;
    totalClauses: number;
  };
  clauseSummary: Array<{
    name: string;
    status: string;
    partyAPreference: string;
    partyBPreference: string;
  }>;
}> {
  try {
    const response = await api.get(`/admin/agreement/${agreementId}/clause-suggestions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting AI clause suggestions:', error);
    throw error;
  }
}