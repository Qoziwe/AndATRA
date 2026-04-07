import axios, { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { BACKEND_URL } from "@/constants/config";
import { clearAuthSession, getAccessToken } from "@/services/authSession";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json"
  }
});

const setAuthorizationHeader = (config: InternalAxiosRequestConfig, token: string) => {
  if (!token) {
    return;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    setAuthorizationHeader(config, token);
  }

  return config;
});

export const unwrapApiResponse = <T>(response: AxiosResponse<ApiEnvelope<T>>): T => {
  if (!response.data.success) {
    throw new Error(response.data.error ?? "Не удалось получить ответ от сервера.");
  }

  return response.data.data;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(
      new Error(
        error?.response?.data?.error ??
          error?.message ??
          "Не удалось получить ответ от сервера."
      )
    );
  }
);
