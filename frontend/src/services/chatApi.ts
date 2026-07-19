/// <reference types="vite/client" />
import axios from "axios";
import type { ChatResponseDTO } from "../types";


const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3001"
});

export async function sendMessage(conversationId: string | null, message: string): Promise<ChatResponseDTO> {
  const response = await api.post<ChatResponseDTO>("/api/chat", {
    conversationId,
    message
  });
  return response.data;
}
