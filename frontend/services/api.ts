import axios, { type AxiosResponse } from "axios";
import { BACKEND_URL } from "@/constants/config";

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

export const unwrapApiResponse = <T>(response: AxiosResponse<ApiEnvelope<T>>): T => {
  if (!response.data.success) {
    throw new Error(response.data.error ?? "Не удалось получить ответ от сервера.");
  }

  return response.data.data;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(
      new Error(
        error?.response?.data?.error ??
          error?.message ??
          "Не удалось получить ответ от сервера."
      )
    );
  }
);
