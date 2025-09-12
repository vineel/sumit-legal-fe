// User
export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "pending" | "inactive";
  photo?: { url: string };
  signature?: { url: string };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

// Auth
export interface AuthResponse {
  token: string;
  user: User;
}

// Agreement
export interface Agreement {
  _id: string;
  userid: string;
  partyBUserId?: string;
  templateId: {
    _id: string;
    templatename: string;
    description?: string;
  };
  clauses: {
    _id: string;
    title: string;
    description: string;
  }[];
  effectiveDate: string;
  termDuration?: string;
  jurisdiction?: string;
  signedDate?: string;
  status: "draft" | "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}
