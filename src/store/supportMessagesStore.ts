import { create } from 'zustand';

export interface SupportMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  attachments?: any[];
}

interface SupportMessagesState {
  messages: SupportMessage[];
  setMessages: (messages: SupportMessage[]) => void;
}

export const useSupportMessagesStore = create<SupportMessagesState>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages })
}));
