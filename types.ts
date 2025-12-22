
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export type Language = 'en' | 'pt';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
}
