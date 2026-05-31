import { create } from 'zustand';

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  apiId?: string;
  status: string;
  createdAt?: string;
  created_at: string;
  updatedAt?: string;
  updated_at?: string;
}

interface SupportTicketsState {
  tickets: SupportTicket[];
  setTickets: (tickets: SupportTicket[]) => void;
}

export const useSupportTicketsStore = create<SupportTicketsState>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets })
}));
