import api from "./api"; 

export interface Clause {
  _id: string;
  name: string;
  category: string;
  description?: string;
  required: boolean;
  status: "active" | "inactive";
  variants: {
    name: string;
    riskLevel: "low" | "medium" | "high";
    legalText: string;
    status: "active" | "inactive";
    version: number;
  }[];
}

export interface ClauseVariant {
  variant_label: string;
  text: string;
}

export interface ClauseType {
  clause_name: string;
  variants: ClauseVariant[];
}

export interface GlobalQuestion {
  question: string;
  required: boolean;
}

export interface Template {
  clauseIds: never[];
  _id: string;
  userid: string;
  templatename: string;
  agreement_type?: string; // Added for new structure
  description?: string;
  category?: string; // Added for new structure
  active: boolean;
  version: string;
  templatefile: string;
  createdAt: string;
  updatedAt: string;
  clauseUsageCount?: number;
  isCustom?: boolean;
  clauses?: ClauseType[]; // Updated to new structure
  global_questions?: GlobalQuestion[]; // Added for global questions
  usageCount?: number; // Added for stats
  clauseCount?: number; // Added for stats
}

// Add new template (with file upload)
export const addTemplate = async (formData: FormData): Promise<Template> => {
  const response = await api.post<Template>("/admin/template/addtemplate", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

// Get all templates for the current user
export const getAllTemplates = async (): Promise<Template[]> => {
  const response = await api.get<Template[]>("/admin/template/alltemplates");
  return response.data;
};

// Update template (also supports file upload)
export const updateTemplate = async (id: string, formData: FormData): Promise<Template> => {
  const response = await api.put<Template>(`/admin/template/update/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

// Delete template
export const deleteTemplate = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin/template/delete/${id}`);
  return response.data;
};


export const downloadTemplate = async (id: string): Promise<string> => {
  const res = await api.get(`/admin/template/download/${id}`);
  return res.data.url; // presigned URL
};


 
export const getTemplateById = async (id: string): Promise<Template> => {
  const response = await api.get<Template>(`/admin/template/single/${id}`);
  return response.data;
};

// Get templates for admin management
export const getTemplates = async (token: string): Promise<{ templates: Template[] }> => {
  const response = await api.get<{ templates: Template[] }>("/admin/templates", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Create template
export const createTemplate = async (token: string, templateData: {
  templatename: string;
  description: string;
  category: string;
  clauses: ClauseType[];
  global_questions: GlobalQuestion[];
}): Promise<{ message: string; template: Template }> => {
  const response = await api.post<{ message: string; template: Template }>("/admin/templates", templateData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Update template (admin version)
export const updateAdminTemplate = async (token: string, templateId: string, templateData: {
  templatename: string;
  description: string;
  category: string;
  clauses: ClauseType[];
  global_questions: GlobalQuestion[];
}): Promise<{ message: string; template: Template }> => {
  const response = await api.put<{ message: string; template: Template }>(`/admin/templates/${templateId}`, templateData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Delete template (admin version)
export const deleteAdminTemplate = async (token: string, templateId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin/templates/${templateId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};