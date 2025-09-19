import api from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

export interface DashboardStatusData {
  totalUsers: number
  approvedUsers: number
  pendingUsers: number
  rejectedUsers: number
  adminUsers: number
  totalClauses: number
  totalTemplates: number
  totalAgreements: number
}


export interface SearchResult {
  // define the shape of your search result here
  id: string;
  name: string;
  email: string;
  role: string;
   status: string;
}

export interface TemplateUsageStat {
  templateId: string;
  templatename: string;
  usageCount: number;
}

export interface TemplateStatsData {
  totalTemplates: number;
  activeTemplates: number;
  totalUsage: number;
  usageStats: TemplateUsageStat[];
}

export const searchUsers = async (query: string): Promise<SearchResult[]> => {
  const response = await api.get<SearchResult[]>(`/admin/search`, {
    params: { query }
  });
  return response.data;
};

// Fetch all users
export const fetchAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/admin/allusers");
  return response.data;
};

// Fetch dashboard status
export const fetchDashboardStatus = async (): Promise<DashboardStatusData> => {
  const response = await api.get<DashboardStatusData>("/admin/dashboardstatus");
  return response.data;
};

// Update a user by ID with partial updates (e.g., role, name, email)
export const updateUser = async (
  userId: string,
  updateData: Partial<Omit<User, "id">>
): Promise<User> => {
  const response = await api.put<User>(`/admin/updateuser/${userId}`, updateData);
  return response.data;
};



export const fetchTemplateStats = async (): Promise<TemplateStatsData> => {
  const response = await api.get<TemplateStatsData>("/admin/template/template-stats");
  return response.data;
};


export const downloadTemplate = async (id: string): Promise<string> => {
  const res = await api.get(`/api/admin/template/download/${id}`);
  return res.data.url; // presigned URL
};

export const allactivitylogs = async (): Promise<any> => {
  const res = await api.get(`/admin/allactivitylogs`);
  return res.data; // probably an object, not string
};

// Get all users for admin management
export const getAllUsers = async (token: string): Promise<{ users: User[] }> => {
  const response = await api.get<{ users: User[] }>("/admin/users", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Approve user
export const approveUser = async (token: string, userId: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/admin/approve-user/${userId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Reject user
export const rejectUser = async (token: string, userId: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/admin/reject-user/${userId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};


// Delete user (updated to use token)
export const deleteUser = async (token: string, userId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin/deleteUser/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

 
