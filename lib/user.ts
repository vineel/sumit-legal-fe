import api from "./api";
import { Clause } from "./clause";

export interface UpdateUserPayload {
  name?: string;
  status?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  photo?: File;
  signature?: File;
  file?: File;
}


export interface Agreement {
  _id: string;
  status: string;
  effectiveDate: string;
  termDuration: string;
  jurisdiction: string;
  signedDate: string;

}


export interface Template {
  _id: string;
  userid: string;
  templatename: string;
  description?: string;
  clauses?: string[] | Clause[]; // Can be IDs or populated clause objects
  isCustom?: boolean;
  active: boolean;
  version: string;
  createdby: string;
  templatefile: string; // URL to S3 file
  createdAt: string;
  updatedAt: string;
}
// ✅ Update user profile (with optional files)
export async function updateUser(payload: UpdateUserPayload): Promise<{ message: string; user: any }> {
  const formData = new FormData();

  // Text fields
  if (payload.name) formData.append("name", payload.name);
  if (payload.status) formData.append("status", payload.status);

  if (payload.street) formData.append("street", payload.street);
  if (payload.city) formData.append("city", payload.city);
  if (payload.state) formData.append("state", payload.state);
  if (payload.postalCode) formData.append("postalCode", payload.postalCode);
  if (payload.country) formData.append("country", payload.country);

  // Files
  if (payload.photo) formData.append("photo", payload.photo);
  if (payload.signature) formData.append("signature", payload.signature);
  if (payload.file) formData.append("file", payload.file);

  const { data } = await api.put("/user/update", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}


export async function getAgreements(token: string): Promise<Agreement[]> {
  const response = await api.get("/user/agreements", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

 export async function getAgreementById(token: string, id: string): Promise<Agreement> {
  try {
    const response = await api.get(`/agreement/agreementbyid/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching agreement ${id}:`, error);
    throw new Error("Failed to fetch agreement by ID.");
  }
}



// ✅ Get all templates for logged-in user
export async function getTemplates(token: string): Promise<Template[]> {
  try {
    const response = await api.get("/user/templates", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw new Error("Failed to fetch templates.");
  }
}


export async function getTemplateById(token: string, id: string): Promise<Template> {
  try {
    const response = await api.get(`/api/admin/template/single/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    throw new Error("Failed to fetch template.");
  }
}

 
 
