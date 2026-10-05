import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Building2,
  Landmark,
  ShieldCheck,
  User,
  Clock,
  ArrowLeft,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  feedbackService,
  FeedbackTicket,
  SenderRole
} from '../services/feedbackService';

export default function FeedbackPage() {
  const { user } = useAuth();
  const { activeSme } = useApp();

  const isAdmin = user?.role === 'ADMIN';

  // Tickets state
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Chat text input state
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load and subscribe to database tickets with live sync
  useEffect(() => {
    // Initial fetch from PostgreSQL database
    feedbackService.fetchTickets().then((data) => {
      const safeData = Array.isArray(data) ? data : [];
      setTickets(safeData);
      if (safeData.length > 0) {
        setSelectedTicketId((prev) => (prev ? prev : safeData[0].id));
      }
    });

    // Start background live polling (every 4 seconds)
    feedbackService.startPolling(4000);

    const unsubscribe = feedbackService.subscribe((updated) => {
      const fresh = Array.isArray(updated) ? updated : feedbackService.getTickets();
      setTickets(Array.isArray(fresh) ? fresh : []);
    });

    return () => {
      unsubscribe();
      feedbackService.stopPolling();
    };
  }, []);

  // For Admin: filtered list of all user feedback threads
  const filteredTickets = useMemo(() => {
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    if (!searchQuery.trim()) return safeTickets;

    const q = searchQuery.toLowerCase();
    return safeTickets.filter((t) => {
      const matchesOrg = (t.organizationName || '').toLowerCase().includes(q);
      const matchesSender = (t.senderName || '').toLowerCase().includes(q);
      const matchesSubject = (t.subject || '').toLowerCase().includes(q);
      const matchesMsg = (t.messages || []).some((m) =>
        (m.content || '').toLowerCase().includes(q)
      );
      return matchesOrg || matchesSender || matchesSubject || matchesMsg;
    });
  }, [tickets, searchQuery]);

  // For User (SME or Financial Institution): find their thread with Admin
  const userThread = useMemo(() => {
    if (isAdmin) return null;
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    return (
      safeTickets.find(
        (t) =>
          (user?.id && t.senderId === user.id) ||
          (user?.email && t.senderEmail === user.email)
      ) ||
      (safeTickets.length > 0 ? safeTickets[0] : null)
    );
  }, [tickets, isAdmin, user?.id, user?.email]);

  // Active ticket being viewed
  const currentTicket = useMemo(() => {
    if (isAdmin) {
      const safeTickets = Array.isArray(tickets) ? tickets : [];
      return safeTickets.find((t) => t.id === selectedTicketId) || null;
    }
    return userThread;
  }, [isAdmin, tickets, selectedTicketId, userThread]);

  // Auto-scroll chat to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [currentTicket?.id, currentTicket?.messages?.length]);

  // Mark ticket as read when active
  useEffect(() => {
    if (currentTicket) {
      const role: SenderRole = isAdmin ? 'ADMIN' : (user?.role as SenderRole) || 'BUSINESS';
      feedbackService.markAsRead(currentTicket.id, role);
    }
  }, [currentTicket?.id, isAdmin, user?.role]);

  // Formatted date helper
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Sending message (Both User -> Admin and Admin -> User)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = textInput.trim();
    if (!cleanText || isSending) return;

    setIsSending(true);

    try {
      if (isAdmin) {
        // Admin replying to the active user thread
        if (!currentTicket) return;
        await feedbackService.addMessage(currentTicket.id, {
          senderId: user?.id || 'admin-user',
          senderName: user?.name || 'Elevata Admin Officer',
          senderRole: 'ADMIN',
          senderOrgName: 'Elevata Platform Administration',
          content: cleanText
        });
      } else {
        // SME or Financial Institution sending feedback directly to Admin
        const role = (user?.role as 'BUSINESS' | 'FINANCIAL_INSTITUTION') || 'BUSINESS';
        const senderOrg =
          role === 'BUSINESS'
            ? activeSme?.name || user?.business?.businessName || 'Business Entity'
            : user?.financialInstitution?.institutionName || 'Financial Institution';

        const senderName =
          role === 'BUSINESS'
            ? user?.business?.ownerName || activeSme?.ownerName || user?.name || 'Business Owner'
            : user?.financialInstitution?.representativeName || user?.name || 'Institutional Officer';

        if (userThread) {
          // Append to existing thread with Admin
          await feedbackService.addMessage(userThread.id, {
            senderId: user?.id || 'user-sender',
            senderName,
            senderRole: role,
            senderOrgName: senderOrg,
            content: cleanText
          });
        } else {
          // Create new direct feedback thread to Admin
          const newTicket = await feedbackService.createTicket({
            subject: cleanText.length > 50 ? cleanText.slice(0, 47) + '...' : cleanText,
            category: 'General Inquiry',
            priority: 'Medium',
            senderId: user?.id || 'user-sender',
            senderName,
            senderEmail: user?.email || 'user@elevata.rw',
            senderPhone: user?.phone || '',
            senderRole: role,
            organizationName: senderOrg,
            organizationSector:
              role === 'BUSINESS'
                ? activeSme?.sector || user?.business?.businessType || 'General SME'
                : user?.financialInstitution?.category || 'Financial Services',
            initialMessage: cleanText
          });
          setSelectedTicketId(newTicket.id);
        }
      }

      setTextInput('');
    } finally {
      setIsSending(false);
      setTimeout(() => scrollToBottom(true), 50);
    }
  };

  // =========================================================================
  // VIEW 1: USER PERSPECTIVE (SME or Financial Institution)
  // Direct full-width channel to Admin: only messages and text input
  // =========================================================================
  if (!isAdmin) {
    const isBusiness = user?.role === 'BUSINESS';
    const entityName = isBusiness
      ? activeSme?.name || user?.business?.businessName || 'Business'
      : user?.financialInstitution?.institutionName || 'Financial Institution';

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Simple Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Elevata Admin Feedback & Support
              </h1>
              <p className="text-xs text-slate-500">
                Direct channel from {entityName} to the Elevata Platform Administrator team.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Admin Desk Online
          </span>
        </div>

        {/* Chat Window */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
            {(!currentTicket || currentTicket.messages.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0284c7] mb-3">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Send Feedback to Administrator
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
                  Have questions regarding your loan requests, financial records, platform features, or issues? Type your feedback below to reach the Admin team directly.
                </p>
              </div>
            ) : (
              currentTicket.messages.map((message) => {
                const isFromAdmin = message.senderRole === 'ADMIN';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                      !isFromAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${
                        isFromAdmin
                          ? 'bg-slate-900 text-sky-400 border border-slate-700'
                          : 'bg-[#0284c7] text-white'
                      }`}
                    >
                      {isFromAdmin ? (
                        <ShieldCheck className="w-4 h-4 text-sky-300" />
                      ) : isBusiness ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <Landmark className="w-4 h-4" />
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div className="space-y-1">
                      <div
                        className={`flex items-center gap-2 text-[11px] ${
                          !isFromAdmin ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span className="font-bold text-slate-700">
                          {isFromAdmin ? 'Elevata Administrator' : message.senderName}
                        </span>
                        <span className="text-slate-400">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          !isFromAdmin
                            ? 'bg-[#0284c7] text-white rounded-tr-none'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Simple Text Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <textarea
              rows={2}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message or feedback to the Administrator... (Press Enter to send)"
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white resize-none transition-all"
            />

            <button
              type="submit"
              disabled={!textInput.trim() || isSending}
              className="px-5 py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-sky-900/20 transition-all h-[52px] cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ADMINISTRATOR PERSPECTIVE (Elevata Admin)
  // Inbox of user feedback on left, active chat and reply text input on right
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Clean Admin Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-sky-400 shadow-md border border-slate-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              User Feedbacks & Inquiries
            </h1>
            <p className="text-xs text-slate-500">
              Review feedbacks from SMEs and Financial Institutions and reply directly.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          {tickets.length} Active Feedback {tickets.length === 1 ? 'Thread' : 'Threads'}
        </span>
      </div>

      {/* Two Column Layout: Inbox Directory (Left) and Active Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Feedbacks Inbox */}
        <div
          className={`lg:col-span-4 space-y-3 ${
            mobileDetailOpen ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Simple Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] transition-all shadow-sm"
            />
          </div>

          {/* User Feedback List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No user feedback yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Incoming messages from SMEs and Financial Institutions will appear here.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = ticket.id === currentTicket?.id;
                const lastMsg = ticket.messages[ticket.messages.length - 1];
                const isSme = ticket.senderRole === 'BUSINESS';

                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setMobileDetailOpen(true);
                    }}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-150 border relative ${
                      isSelected
                        ? 'bg-sky-50/70 border-[#0284c7] ring-2 ring-[#0284c7]/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {ticket.unreadByAdmin && (
                      <span
                        title="New message from user"
                        className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#0284c7] ring-4 ring-sky-100 animate-pulse"
                      />
                    )}

                    {/* Sender Identity */}
                    <div className="flex items-center gap-2 mb-1">
                      {isSme ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          <Building2 className="w-3 h-3" />
                          SME
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <Landmark className="w-3 h-3" />
                          Financial Inst.
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {ticket.organizationName}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">
                      {ticket.senderName}
                    </div>

                    {/* Last message preview */}
                    {lastMsg && (
                      <p className="text-xs text-slate-600 line-clamp-1 mt-1.5 font-normal">
                        <span className="font-semibold text-slate-700">
                          {lastMsg.senderRole === 'ADMIN' ? 'You: ' : ''}
                        </span>
                        {lastMsg.content}
                      </p>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{formatDate(ticket.updatedAt)}</span>
                      <span>{formatTime(ticket.updatedAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat & Reply Console */}
        <div
          className={`lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden ${
            mobileDetailOpen ? 'block' : 'hidden lg:flex'
          }`}
        >
          {currentTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileDetailOpen(false)}
                    className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                    {currentTicket.senderRole === 'BUSINESS' ? (
                      <Building2 className="w-5 h-5 text-sky-600" />
                    ) : (
                      <Landmark className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900">
                        {currentTicket.organizationName}
                      </h2>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {currentTicket.senderRole === 'BUSINESS' ? 'SME' : 'Financial Institution'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 text-slate-600">
                        <User className="w-3 h-3" />
                        {currentTicket.senderName}
                      </span>
                      {currentTicket.senderEmail && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Mail className="w-3 h-3" />
                            {currentTicket.senderEmail}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
                {currentTicket.messages.map((message) => {
                  const isAdminMsg = message.senderRole === 'ADMIN';

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                        isAdminMsg ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${
                          isAdminMsg
                            ? 'bg-slate-900 text-sky-400 border border-slate-700'
                            : 'bg-[#0284c7] text-white'
                        }`}
                      >
                        {isAdminMsg ? (
                          <ShieldCheck className="w-4 h-4 text-sky-300" />
                        ) : currentTicket.senderRole === 'BUSINESS' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <Landmark className="w-4 h-4" />
                        )}
                      </div>

                      {/* Bubble Content */}
                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-2 text-[11px] ${
                            isAdminMsg ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="font-bold text-slate-700">
                            {isAdminMsg ? 'Elevata Admin (You)' : message.senderName}
                          </span>
                          <span className="text-slate-400">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>

                        <div
                          className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isAdminMsg
                              ? 'bg-gradient-to-br from-slate-900 to-[#1e293b] text-white rounded-tr-none'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Only Text Input for Admin Reply */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <textarea
                  rows={2}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Type your reply to ${currentTicket.organizationName}... (Press Enter to send)`}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white resize-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim() || isSending}
                  className="px-5 py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-sky-900/20 transition-all h-[52px] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-sm">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No Feedback Selected
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Select a user feedback thread on the left to review their inquiry and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
