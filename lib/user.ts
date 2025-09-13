import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  photo?: {
    url: string;
  };
  signature?: {
    url: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Get user profile
export async function getUserProfile(token: string): Promise<{ user: User }> {
  try {
    const response = await api.get('/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
  }
}

// Update user profile
export async function updateUserProfile(
  token: string,
  userData: UpdateUserData
): Promise<{ message: string; user: User }> {
  try {
    const formData = new FormData();
    
    // Add text fields to form data
    if (userData.name) formData.append('name', userData.name);
    if (userData.street) formData.append('street', userData.street);
    if (userData.city) formData.append('city', userData.city);
    if (userData.state) formData.append('state', userData.state);
    if (userData.postalCode) formData.append('postalCode', userData.postalCode);
    if (userData.country) formData.append('country', userData.country);

    const response = await api.put('/user/update', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to update user profile');
  }
}

// Upload signature
export async function uploadSignature(
  token: string,
  signatureFile: File
): Promise<{ message: string; signatureUrl: string; user: User }> {
  try {
    const formData = new FormData();
    formData.append('signature', signatureFile);

    const response = await api.post('/user/upload-signature', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error uploading signature:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload signature');
  }
}

// Upload profile photo
export async function uploadProfilePhoto(
  token: string,
  photoFile: File
): Promise<{ message: string; user: User }> {
  try {
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await api.put('/user/update', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload profile photo');
  }
}