import api from "./api";

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
  description: ReactNode;
  title: ReactNode;
  _id: string;
  status: string;
  effectiveDate: string;
  termDuration: string;
  jurisdiction: string;
  signedDate: string;

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


// Function to fetch all agreements
export async function getAgreements(token: string): Promise<Agreement[]> {
  try {
    const response = await api.get("/allagrements", {
      headers: {
        Authorization: `Bearer ${token}`, // Attach the JWT token to the request
      },
    });
    return response.data; // Return the agreements list
  } catch (error) {
    console.error("Error fetching agreements:", error);
    throw new Error("Failed to fetch agreements.");
  }
}


 
