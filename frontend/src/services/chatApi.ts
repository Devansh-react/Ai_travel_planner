import axios from "axios";
import type { ChatResponseDTO } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001"
});

export async function sendMessage(conversationId: string | null, message: string): Promise<ChatResponseDTO> {
  const response = await api.post<ChatResponseDTO>("/api/chat", {
    conversationId,
    message
  });
  return response.data;
}
