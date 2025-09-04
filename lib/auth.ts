import api from "./api";

export interface SigninPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// ✅ POST /auth/signin
export const signin = async (payload: SigninPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/signin", payload);
  return response.data;
};

// ✅ POST /auth/signup
export const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/signup", payload);
  return response.data;
};

// ✅ GET /auth/me (Requires Authorization header via Axios interceptor)
export const getMe = async (): Promise<AuthResponse["user"]> => {
  const response = await api.get<{ success: boolean; user: AuthResponse["user"] }>("/auth/me");
  return response.data.user;
};
