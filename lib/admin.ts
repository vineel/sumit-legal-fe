import api from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
 status: string;
}

export interface DashboardStatusData {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  adminUsers: number
  totalClauses: number
  totalTemplates: number
}


export interface SearchResult {
  // define the shape of your search result here
  id: string;
  name: string;
  email: string;
  role: string;
   status: string;
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

// Delete a user by ID
export const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/deleteUser/${userId}`);
  return response.data;
};
