/**
 * Chat API client for AI assistant.
 */
import { api } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  query: string;
  threat_id?: string;
  prevention_plan_id?: string;
  chat_history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  threat_id?: string;
  prevention_plan_id?: string;
}

/**
 * Send a chat message to the AI assistant.
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  return api.post<ChatResponse>('/api/chat', request);
}

