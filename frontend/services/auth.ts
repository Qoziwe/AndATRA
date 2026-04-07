import { api, unwrapApiResponse } from "@/services/api";
import type { AuthSession, AuthUser } from "@/services/authSession";

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

export const login = async (username: string, password: string): Promise<AuthSession> => {
  const response = await api.post("/api/auth/login", { username, password });
  const data = unwrapApiResponse<LoginResponse>(response);

  return {
    accessToken: data.access_token,
    user: data.user
  };
};

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get("/api/auth/me");
  const data = unwrapApiResponse<MeResponse>(response);
  return data.user;
};
