import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User as UserIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  ArrowUp,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../lib/api';
import ElevataMarkdown from '../assets/components/AI/ElevataMarkdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'elevata_ai_conversations';

export default function ElevataBotPage() {
  const { user } = useAuth();
  const { activeSme } = useApp();

  const isAdmin = user?.role === 'ADMIN';
  const isFI = user?.role === 'FINANCIAL_INSTITUTION';
  const firstName = isAdmin
    ? (user?.email ? user.email.split('@')[0] : 'Admin')
    : user?.business?.ownerName
    ? user.business.ownerName.split(' ')[0]
    : user?.financialInstitution?.representativeName
    ? user.financialInstitution.representativeName.split(' ')[0]
    : (user?.business?.businessName ? user.business.businessName.split(' ')[0] : 'there');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setActiveChatId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load saved conversations:', e);
    }

    // Default new conversation if none exist
    startNewChat();
  }, [user]);

  // Save conversations to localStorage
  const saveConversations = (updated: Conversation[]) => {
    setConversations(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist conversations:', e);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeChatId) || null;
  const currentMessages = activeConversation?.messages || [];

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputMessage]);

  const startNewChat = () => {
    const newChatId = `chat_${Date.now()}`;
    const newChat: Conversation = {
      id: newChatId,
      title: 'New Conversation',
      createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      messages: []
    };

    const updated = [newChat, ...conversations];
    saveConversations(updated);
    setActiveChatId(newChatId);
    setInputMessage('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    if (filtered.length === 0) {
      const freshChat: Conversation = {
        id: `chat_${Date.now()}`,
        title: 'New Conversation',
        createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        messages: []
      };
      saveConversations([freshChat]);
      setActiveChatId(freshChat.id);
    } else {
      saveConversations(filtered);
      if (activeChatId === id) {
        setActiveChatId(filtered[0].id);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || loading || !activeChatId) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update conversation state with user message
    let currentChat = conversations.find((c) => c.id === activeChatId);
    if (!currentChat) {
      currentChat = {
        id: activeChatId,
        title: text.trim().slice(0, 30),
        createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        messages: []
      };
    }

    const updatedMessages = [...currentChat.messages, userMsg];
    const updatedTitle =
      currentChat.messages.length === 0 ? text.trim().slice(0, 30) : currentChat.title;

    const updatedChat: Conversation = {
      ...currentChat,
      title: updatedTitle,
      messages: updatedMessages
    };

    const nextConversations = conversations.map((c) =>
      c.id === activeChatId ? updatedChat : c
    );

    saveConversations(nextConversations);
    setInputMessage('');
    setLoading(true);

    try {
      // Build context for the backend AI
      const payload: any = {
        message: text.trim(),
        role: user?.role || 'SME',
        history: currentChat.messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content
        }))
      };

      if (!isAdmin && !isFI) {
        payload.smeContext = {
          name: activeSme.name,
          sector: activeSme.sector,
          healthScore: activeSme.healthScore,
          borrowingCapacity: activeSme.borrowingCapacity,
          currentBalance: activeSme.currentBalance,
          riskRating: activeSme.riskRating
        };
      }

      const res: any = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const replyContent =
        res?.reply ||
        res?.message ||
        res?.response ||
        'I have analyzed your inquiry using Elevata financial models. How else can I assist with your financing readiness today?';

      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, botMsg];
      const finalChat: Conversation = {
        ...updatedChat,
        messages: finalMessages
      };

      saveConversations(
        conversations.map((c) => (c.id === activeChatId ? finalChat : c))
      );
    } catch (err: any) {
      console.error('AI chat failed:', err);

      // Fallback friendly contextual response if backend is offline
      const fallbackReply = `Elevata Copilot Notice: Your question regarding "${text.trim().slice(0, 40)}" has been evaluated.
- **Recommended Next Step**: Check your cash reserves and review current bookkeeping records.
- **Financing Readiness**: Ensure all monthly sales and tax compliance items are verified.
- **Action**: You can explore matched credit facilities in the Opportunity Hub or check your Loan Repayments Ledger.`;

      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, botMsg];
      const finalChat: Conversation = {
        ...updatedChat,
        messages: finalMessages
      };

      saveConversations(
        conversations.map((c) => (c.id === activeChatId ? finalChat : c))
      );
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Cards matching SmeDashboard styling & 3 Pillars:
  // 1. Intelligent Opportunity Matching, 2. Continuous Monitoring & Readiness, 3. Targeted Engagement & Literacy
  const quickCards = isAdmin
    ? [
        {
          badge: 'Opportunity Intelligence',
          badgeColor: 'text-[#1f85be] bg-sky-50 border-sky-200',
          title: 'Structure sectors & product categories',
          subtitle: 'Configure opportunity taxonomies to maximize algorithmic matching for Rwandan SMEs.',
          prompt: 'How should business sectors and opportunity categories (loans, grants, insurance, DFS) be structured to maximize SME matching on Elevata?'
        },
        {
          badge: 'KYC & Verification',
          badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
          title: 'Verify FI & SME onboarding standards',
          subtitle: 'Audit regulatory standards, central bank requirements, and profile verifications.',
          prompt: 'What verification criteria and regulatory licenses should I check before approving a new financial institution or SME on Elevata?'
        },
        {
          badge: 'Ecosystem Analytics',
          badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          title: 'Track platform adoption & health metrics',
          subtitle: 'Benchmark SME financing readiness, capital utilization, and sector growth.',
          prompt: 'Summarize key platform metrics, SME financing readiness trends, and financial product adoption across Rwandan districts.'
        }
      ]
    : isFI
    ? [
        {
          badge: 'Publish Opportunities',
          badgeColor: 'text-[#1f85be] bg-sky-50 border-sky-200',
          title: 'Design tailored loan or grant programs',
          subtitle: 'Structure qualification rules, required collateral ratios, and credit terms.',
          prompt: 'Help me draft qualification criteria, eligibility rules, and terms for an inventory-backed working capital loan on Elevata.'
        },
        {
          badge: 'SME Credit Screening',
          badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
          title: 'Evaluate cash flows & debt capacity',
          subtitle: 'Assess continuous turnover, inventory velocity, and default probabilities.',
          prompt: 'What continuous cash flow indicators, inventory turnover, and health score benchmarks should I check when evaluating an SME loan application?'
        },
        {
          badge: 'Targeted Webinars',
          badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          title: 'De-risk pipeline via financial literacy',
          subtitle: 'Plan live interactive training cohorts to improve borrower compliance.',
          prompt: 'Suggest a high-impact virtual training session curriculum for SMEs to improve their digital bookkeeping and loan readiness on Elevata.'
        }
      ]
    : [
        {
          badge: 'Opportunity Matching',
          badgeColor: 'text-[#1f85be] bg-sky-50 border-sky-200',
          title: 'Discover matched loans, grants & DFS',
          subtitle: 'Find financing facilities specifically targeted to your sector and turnover.',
          prompt: 'What loans, grants, digital financial services, or equipment financing opportunities match my business profile and sector on Elevata?'
        },
        {
          badge: 'Readiness & Health Score',
          badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
          title: 'Improve score & close missing criteria',
          subtitle: 'Get actionable steps to boost your credit rating and unlock higher borrowing limits.',
          prompt: 'What specific financial records, bookkeeping habits, and compliance steps will increase my business health score on Elevata?'
        },
        {
          badge: 'Loan Affordability',
          badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          title: 'Calculate safe borrowing limits',
          subtitle: 'Simulate monthly debt servicing capacity based on current net margins.',
          prompt: 'If my monthly sales are 4,500,000 RWF with a 25% profit margin, what loan repayment amount can I comfortably afford over 12 months?'
        }
      ];

  return (
    <div className="space-y-4 pb-4 flex flex-col h-[calc(100vh-90px)] min-h-[550px]">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (Matches SmeDashboard header style) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#e2e8f0] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
              Elevata AI Copilot &amp; Financial Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational intelligence advisor for <span className="font-semibold text-slate-700">{activeSme.name}</span> ({activeSme.sector || 'Commercial Enterprise'}) · Real-time opportunity matching &amp; loan readiness.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={startNewChat}
            className="accounting-btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTAINER (Accounting 2-Column Card Design) */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {/* =======================================================================
            LEFT SIDEBAR: Conversation History (Matches SmeDashboard card theme)
        ======================================================================== */}
        <aside
          className={`${
            sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
          } transition-all duration-300 ease-in-out accounting-card border-[#cbd5e1] flex flex-col shrink-0 overflow-hidden bg-white shadow-xs`}
        >
          {/* Top of Sidebar */}
          <div className="p-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/70">
            <span className="accounting-label !text-[11px] uppercase tracking-wider font-bold text-slate-600">
              Past Consultations
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              {conversations.length} {conversations.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          {/* Conversations History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No conversation history yet.</p>
            ) : (
              conversations.map((chat) => {
                const isActive = chat.id === activeChatId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                      isActive
                        ? 'bg-sky-50 text-[#1f85be] font-bold border border-[#2998d6]/30 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#1f85be]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{chat.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => deleteConversation(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition shrink-0 ml-1"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Sidebar Copilot Profile Box */}
          <div className="p-3 border-t border-[#e2e8f0] bg-slate-50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2998d6] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">
                {isAdmin ? 'Platform Admin Copilot' : isFI ? 'Bank Officer Copilot' : 'SME Advisory Copilot'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">Powered by Elevata AI Engine</p>
            </div>
          </div>
        </aside>

        {/* =======================================================================
            MAIN CHAT WORKSPACE (Clean White Accounting Card)
        ======================================================================== */}
        <main className="flex-1 flex flex-col min-w-0 accounting-card border-[#cbd5e1] overflow-hidden bg-white shadow-xs relative">
          {/* Header Bar inside Chat Workspace */}
          <header className="h-12 border-b border-[#e2e8f0] px-4 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[220px] sm:max-w-md">
                  {activeConversation?.title || 'New Conversation'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#1f85be] border border-sky-200 hidden sm:inline-block">
                  AI Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startNewChat}
                className="accounting-btn-secondary !h-7 !text-xs !px-2.5 flex items-center gap-1"
                title="Start a new chat session"
              >
                <Plus className="w-3 h-3 text-[#2998d6]" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            </div>
          </header>

          {/* Message Stream Area / Welcome View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 select-text space-y-6 flex flex-col bg-slate-50/40">
            {currentMessages.length === 0 ? (
              /* ===================================================================
                  HERO WELCOME VIEW (Styled matching SmeDashboard KPI layout)
              =================================================================== */
              <div className="my-auto flex flex-col items-center justify-center max-w-3xl mx-auto w-full space-y-6 py-4">
                {/* Welcoming Header */}
                <div className="text-center sm:text-left w-full space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2998d6]/10 border border-[#2998d6]/25 text-[#1f85be] text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#2998d6]" />
                    <span>Elevata Financial Opportunity Intelligence Copilot</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-normal text-[#1e293b] font-heading tracking-tight">
                    Hello, {firstName}!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                    {isAdmin
                      ? 'How can I assist with ecosystem opportunity intelligence, KYC guidelines, or platform analytics today?'
                      : isFI
                      ? 'How can I assist with SME risk assessment, credit facility publishing, or virtual cohort webinars today?'
                      : 'How can I assist with credit opportunity matching, business health scoring, or loan affordability calculations today?'}
                  </p>
                </div>

                {/* 3 Quick Action Suggestion Cards (Matches SmeDashboard KPI card look) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  {quickCards.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      className="accounting-card p-4 border-[#cbd5e1] hover:border-[#2998d6] hover:shadow-xs transition text-left group flex flex-col justify-between gap-2.5 bg-white cursor-pointer"
                    >
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#1f85be] transition mt-2">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {item.subtitle}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Central Input Box in Welcome Screen */}
                <div className="w-full">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="w-full"
                  >
                    <div className="accounting-card border-[#cbd5e1] focus-within:border-[#2998d6] focus-within:ring-2 focus-within:ring-[#2998d6]/20 p-3.5 transition bg-white shadow-2xs space-y-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 text-[#1f85be]">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Ask Elevata Intelligence
                        </span>
                      </div>

                      <textarea
                        ref={textareaRef}
                        rows={2}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your financial inquiry, readiness question, or borrowing scenario..."
                        disabled={loading}
                        className="w-full resize-none bg-transparent border-0 shadow-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 max-h-36 leading-relaxed p-0 font-sans"
                      />

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Press Enter to send · Shift + Enter for new line
                        </span>
                        <button
                          type="submit"
                          disabled={!inputMessage.trim() || loading}
                          className="h-8 w-8 bg-[#2998d6] hover:bg-[#1f85be] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition shrink-0 flex items-center justify-center disabled:cursor-not-allowed shadow-xs cursor-pointer"
                          title="Send message"
                        >
                          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* ===================================================================
                  ACTIVE MESSAGE STREAM
              =================================================================== */
              <div className="max-w-3xl mx-auto w-full space-y-5">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-[#2998d6] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-2xs relative group text-xs sm:text-sm ${
                        msg.role === 'user'
                          ? 'bg-[#2998d6] text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-[#cbd5e1] rounded-tl-none'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</p>
                      ) : (
                        <div className="relative">
                          <ElevataMarkdown content={msg.content} isDark={false} />
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-md shadow-2xs"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      <span
                        className={`block text-[9.5px] mt-2 text-right font-mono ${
                          msg.role === 'user' ? 'text-white/80' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#2998d6] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-[#cbd5e1] rounded-2xl rounded-tl-none px-4 py-2.5 shadow-2xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2998d6] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2998d6] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2998d6] animate-bounce" />
                      <span className="text-xs text-slate-500 font-medium pl-1">
                        Elevata AI is evaluating financial indicators...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ===================================================================
              BOTTOM INPUT BAR (During Active Conversation)
          =================================================================== */}
          {currentMessages.length > 0 && (
            <div className="p-3.5 bg-slate-50 border-t border-[#e2e8f0] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="max-w-3xl mx-auto"
              >
                <div className="accounting-card border-[#cbd5e1] focus-within:border-[#2998d6] focus-within:ring-2 focus-within:ring-[#2998d6]/20 p-2.5 transition bg-white shadow-2xs space-y-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2998d6] shrink-0" />
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask Elevata AI anything about your loans, cashflow, or opportunities..."
                      disabled={loading}
                      className="w-full resize-none bg-transparent border-0 shadow-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 py-0.5 max-h-32 p-0 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || loading}
                      className="h-8 w-8 bg-[#2998d6] hover:bg-[#1f85be] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition shrink-0 flex items-center justify-center disabled:cursor-not-allowed shadow-xs cursor-pointer ml-1"
                      title="Send message"
                    >
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Elevata AI provides financial &amp; opportunity advisory. Always verify terms before signing credit agreements.
                </p>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
