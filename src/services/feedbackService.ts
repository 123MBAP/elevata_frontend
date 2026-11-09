// frontend/src/services/feedbackService.ts
import { apiRequest } from '../lib/api';

export type FeedbackCategory =
  | 'Credit & Financing'
  | 'Underwriting & Applications'
  | 'Platform & Usability'
  | 'Accounting & Ledger'
  | 'KYC & Verification'
  | 'Virtual Academy'
  | 'Feature Suggestion'
  | 'General Inquiry';

export type FeedbackPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type FeedbackStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type SenderRole = 'BUSINESS' | 'FINANCIAL_INSTITUTION' | 'ADMIN';

export interface FeedbackMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: SenderRole;
  senderOrgName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string; // ISO string
}

export interface FeedbackTicket {
  id: string; // e.g. "FB-1001"
  dbId?: string;
  ticketNumber?: string;
  subject: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderRole: 'BUSINESS' | 'FINANCIAL_INSTITUTION';
  organizationName: string;
  organizationSector?: string;
  createdAt: string;
  updatedAt: string;
  messages: FeedbackMessage[];
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  assignedAdmin?: string;
}

const STORAGE_KEY = 'elevata_feedback_tickets_live';
const OLD_MOCK_STORAGE_KEY = 'elevata_feedback_tickets_v1';
const BROADCAST_CHANNEL_NAME = 'elevata_feedback_channel';

class FeedbackService {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(tickets: FeedbackTicket[]) => void> = [];
  private pollingTimer: any = null;
  private isFetching = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(OLD_MOCK_STORAGE_KEY);
      } catch (e) {}

      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = () => {
            this.notifyListeners();
          };
        } catch (e) {
          console.warn('BroadcastChannel not supported:', e);
        }
      }
    }
  }

  public subscribe(listener: (tickets: FeedbackTicket[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const freshTickets = this.getTickets();
    this.listeners.forEach(l => {
      try {
        l(freshTickets);
      } catch (e) {
        console.error('Error in feedback listener:', e);
      }
    });
  }

  private broadcastChange() {
    this.notifyListeners();
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'FEEDBACK_UPDATED', timestamp: Date.now() });
      } catch (e) {}
    }
  }

  /**
   * Reads tickets from local cache for instant UI rendering
   */
  public getTickets(): FeedbackTicket[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse cached feedback tickets:', e);
      return [];
    }
  }

  /**
   * Updates local cache and notifies all tabs
   */
  public saveTickets(tickets: FeedbackTicket[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      this.broadcastChange();
    } catch (e) {
      console.error('Failed to cache feedback tickets:', e);
    }
  }

  /**
   * Fetches latest tickets from PostgreSQL DB via backend API
   */
  public async fetchTickets(): Promise<FeedbackTicket[]> {
    if (this.isFetching) return this.getTickets();
    this.isFetching = true;

    try {
      const response = await apiRequest('/feedback');
      if (response && response.success && Array.isArray(response.data)) {
        this.saveTickets(response.data);
        return response.data;
      }
      return this.getTickets();
    } catch (err) {
      console.warn('Could not fetch feedback tickets from backend, using local cache:', err);
      return this.getTickets();
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Start periodic background poll for live chat updates
   */
  public startPolling(intervalMs = 4000) {
    if (this.pollingTimer) return;
    this.fetchTickets();
    this.pollingTimer = setInterval(() => {
      this.fetchTickets();
    }, intervalMs);
  }

  /**
   * Stop background polling
   */
  public stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  public getTicketById(id: string): FeedbackTicket | null {
    const tickets = this.getTickets();
    return tickets.find(t => t.id === id || t.dbId === id) || null;
  }

  /**
   * Create ticket in Database and update local cache
   */
  public async createTicket(params: {
    subject: string;
    category: FeedbackCategory;
    priority: FeedbackPriority;
    senderId: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    senderRole: 'BUSINESS' | 'FINANCIAL_INSTITUTION';
    organizationName: string;
    organizationSector?: string;
    initialMessage: string;
  }): Promise<FeedbackTicket> {
    try {
      const response = await apiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(params)
      });

      if (response && response.success && response.data) {
        const newTicket = response.data;
        const current = this.getTickets();
        const updated = [newTicket, ...current.filter(t => t.id !== newTicket.id)];
        this.saveTickets(updated);
        return newTicket;
      }
    } catch (err) {
      console.warn('Backend API save failed, creating local fallback:', err);
    }

    // Local fallback if backend is unreachable
    const fallbackId = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const fallbackTicket: FeedbackTicket = {
      id: fallbackId,
      subject: params.subject.trim(),
      category: params.category,
      priority: params.priority,
      status: 'Open',
      senderId: params.senderId,
      senderName: params.senderName,
      senderEmail: params.senderEmail,
      senderPhone: params.senderPhone,
      senderRole: params.senderRole,
      organizationName: params.organizationName,
      organizationSector: params.organizationSector || 'General',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: params.senderId,
          senderName: params.senderName,
          senderRole: params.senderRole,
          senderOrgName: params.organizationName,
          content: params.initialMessage.trim(),
          createdAt: now
        }
      ],
      unreadByAdmin: true,
      unreadByUser: false
    };

    const updated = [fallbackTicket, ...this.getTickets()];
    this.saveTickets(updated);
    return fallbackTicket;
  }

  /**
   * Add message to ticket in Database and update local cache
   */
  public async addMessage(
    ticketId: string,
    messageData: {
      senderId: string;
      senderName: string;
      senderRole: SenderRole;
      senderOrgName: string;
      content: string;
    }
  ): Promise<FeedbackTicket | null> {
    try {
      const response = await apiRequest(`/feedback/${encodeURIComponent(ticketId)}/messages`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });

      if (response && response.success && response.data) {
        const updatedTicket = response.data;
        const current = this.getTickets();
        const index = current.findIndex(t => t.id === ticketId || t.dbId === ticketId);
        if (index !== -1) {
          current[index] = updatedTicket;
        } else {
          current.unshift(updatedTicket);
        }
        this.saveTickets(current);
        return updatedTicket;
      }
    } catch (err) {
      console.warn('Backend API addMessage failed, using local update:', err);
    }

    // Local fallback update
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId || t.dbId === ticketId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const newMsg: FeedbackMessage = {
      id: `msg-${Date.now()}`,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderRole: messageData.senderRole,
      senderOrgName: messageData.senderOrgName,
      content: messageData.content.trim(),
      createdAt: now
    };

    const ticket = tickets[index];
    const isFromAdmin = messageData.senderRole === 'ADMIN';

    const updatedTicket: FeedbackTicket = {
      ...ticket,
      updatedAt: now,
      messages: [...ticket.messages, newMsg],
      unreadByAdmin: !isFromAdmin,
      unreadByUser: isFromAdmin,
      status:
        ticket.status === 'Resolved' || ticket.status === 'Closed'
          ? isFromAdmin
            ? ticket.status
            : 'In Progress'
          : ticket.status
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  }

  /**
   * Update status in Database
   */
  public async updateStatus(ticketId: string, status: FeedbackStatus): Promise<FeedbackTicket | null> {
    try {
      const response = await apiRequest(`/feedback/${encodeURIComponent(ticketId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      if (response && response.success && response.data) {
        const updated = response.data;
        const current = this.getTickets();
        const index = current.findIndex(t => t.id === ticketId || t.dbId === ticketId);
        if (index !== -1) {
          current[index] = updated;
          this.saveTickets(current);
        }
        return updated;
      }
    } catch (err) {
      console.warn('Backend updateStatus failed, using local:', err);
    }

    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId || t.dbId === ticketId);
    if (index === -1) return null;

    tickets[index] = {
      ...tickets[index],
      status,
      updatedAt: new Date().toISOString()
    };
    this.saveTickets(tickets);
    return tickets[index];
  }

  /**
   * Update priority in Database
   */
  public async updatePriority(ticketId: string, priority: FeedbackPriority): Promise<FeedbackTicket | null> {
    try {
      const response = await apiRequest(`/feedback/${encodeURIComponent(ticketId)}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority })
      });

      if (response && response.success && response.data) {
        const updated = response.data;
        const current = this.getTickets();
        const index = current.findIndex(t => t.id === ticketId || t.dbId === ticketId);
        if (index !== -1) {
          current[index] = updated;
          this.saveTickets(current);
        }
        return updated;
      }
    } catch (err) {
      console.warn('Backend updatePriority failed, using local:', err);
    }

    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId || t.dbId === ticketId);
    if (index === -1) return null;

    tickets[index] = {
      ...tickets[index],
      priority,
      updatedAt: new Date().toISOString()
    };
    this.saveTickets(tickets);
    return tickets[index];
  }

  /**
   * Mark ticket as read in Database
   */
  public async markAsRead(ticketId: string, role: SenderRole) {
    try {
      await apiRequest(`/feedback/${encodeURIComponent(ticketId)}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
    } catch (e) {}

    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId || t.dbId === ticketId);
    if (index === -1) return;

    if (role === 'ADMIN') {
      tickets[index].unreadByAdmin = false;
    } else {
      tickets[index].unreadByUser = false;
    }
    this.saveTickets(tickets);
  }

  public clearAllTickets() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      this.broadcastChange();
    }
  }
}

export const feedbackService = new FeedbackService();
