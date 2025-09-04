import api from "./api"; 

export interface Template {
  _id: string;
  userid: string;
  templatename: string;
  description?: string;
  active: boolean;
  version: string;
  templatefile: string;
  createdAt: string;
  updatedAt: string;
  clauseUsageCount?: number;  
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