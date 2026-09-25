import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User as UserIcon,
  Plus,
  Trash2,
  Send,
  Copy,
  Check,
  MessageSquare,
  ChevronRight,
  PanelLeftClose,
  PanelLeft
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

  const isFI = user?.role === 'FINANCIAL_INSTITUTION' || user?.role === 'ADMIN';

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
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

    const isFirstMessage = currentChat.messages.length === 0;
    const updatedTitle = isFirstMessage
      ? text.trim().length > 28
        ? `${text.trim().slice(0, 28)}...`
        : text.trim()
      : currentChat.title;

    const updatedMessages = [...currentChat.messages, userMsg];

    const updatedConversations = conversations.map((c) =>
      c.id === activeChatId
        ? { ...c, title: updatedTitle, messages: updatedMessages }
        : c
    );

    saveConversations(updatedConversations);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = currentChat.messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text.trim(),
          history: historyPayload,
          context: {
            activeSmeName: user?.business?.businessName || activeSme?.name,
            activeSmeSector: user?.business?.businessType || activeSme?.sector,
            institutionName: user?.financialInstitution?.institutionName,
            representativeName: user?.financialInstitution?.representativeName,
            activeSmeRevenue: activeSme?.monthlyData ? activeSme.monthlyData.reduce((sum, d) => sum + d.revenue, 0) : undefined,
            activeSmeCreditScore: activeSme?.healthScore
          }
        })
      });

      if (res.success && res.data && res.data.reply) {
        const botReply: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const finalConversations = conversations.map((c) =>
          c.id === activeChatId
            ? { ...c, title: updatedTitle, messages: [...updatedMessages, botReply] }
            : c
        );

        saveConversations(finalConversations);
      } else {
        throw new Error('Received unexpected response format');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to connect to AI Assistant. Please check connection and try again.';
      const errorReply: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `**Error:** ${message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalConversations = conversations.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...updatedMessages, errorReply] }
          : c
      );

      saveConversations(finalConversations);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Starter Prompts for Empty Chat State
  const starterPrompts = isFI
    ? [
        { title: 'Assess SME Credit Risk', prompt: 'What key credit risk metrics should I evaluate for a growing retail SME in Kigali?' },
        { title: 'Structure Working Capital Loan', prompt: 'Help me draft qualification criteria and repayment terms for an inventory-backed credit line.' },
        { title: 'Portfolio NPL Strategies', prompt: 'What monitoring practices best assist credit officers in maintaining an NPL ratio below 3%?' },
        { title: 'Evaluate Loan Application', prompt: 'Provide a structured underwriting rubric to assess an SME applying for 5,000,000 RWF working capital.' }
      ]
    : [
        { title: 'Improve My Credit Score', prompt: 'What specific financial and inventory practices will increase my business credit score on Elevata?' },
        { title: 'Calculate Loan Affordability', prompt: 'If my monthly sales are 4,200,000 RWF with 28% profit margin, what loan amount can I comfortably repay over 12 months?' },
        { title: 'Optimize Inventory & Costs', prompt: 'What strategies can I use to reduce dead inventory and cut unnecessary operating expenses?' },
        { title: 'Find Active Grants & Loans', prompt: 'What funding opportunities, grants, or equipment financing programs are best suited for growing Rwandan SMEs?' }
      ];

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#f3f2f0] font-sans -m-3 md:-m-6 overflow-hidden">
      {/* =========================================================================
          LEFT SIDEBAR: Conversation History & New Chat (ChatGPT Style)
      ========================================================================== */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden z-20`}
      >
        {/* Top: New Chat Button */}
        <div className="p-3.5 border-b border-gray-100 flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">
            Past Conversations
          </p>

          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-4 text-center">No conversation history yet.</p>
          ) : (
            conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                  chat.id === activeChatId
                    ? 'bg-[#eaf2ff] text-[#004182] font-bold border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      chat.id === activeChatId ? 'text-[#0a66c2]' : 'text-slate-400'
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
            ))
          )}
        </div>

        {/* Bottom Sidebar User Summary */}
        <div className="p-3 border-t border-gray-200 bg-slate-50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#057642] text-white flex items-center justify-center text-xs font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-900 truncate">
              {isFI ? 'Banker Copilot' : 'SME Copilot'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">Powered by OpenAI</p>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CHAT WORKSPACE (ChatGPT Style)
      ========================================================================== */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-blue-100 px-4 flex items-center justify-between bg-gradient-to-r from-white to-blue-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {activeConversation?.title || 'New Conversation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition text-xs font-semibold flex items-center gap-1.5"
              title="Start a new chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 select-text space-y-6">
          {currentMessages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 py-8">
              <div className="w-12 h-12 rounded-2xl bg-[#eaf2ff] border border-blue-200 flex items-center justify-center text-[#0a66c2] shadow-sm">
                <Bot className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {isFI ? 'Elevata Banker AI Intelligence' : 'Elevata SME Virtual Copilot'}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
                  {isFI
                    ? 'Ask any question regarding SME credit risk, underwriting benchmarks, or loan product structuring.'
                    : 'Ask any question regarding your credit score, loan affordability, inventory management, or funding opportunities.'}
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                {starterPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-[#eaf2ff] hover:border-blue-200 transition text-left group flex items-start justify-between gap-2 shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#004182]">{item.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.prompt}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0a66c2] shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message List */
            <div className="max-w-3xl mx-auto space-y-6">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#057642] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group text-xs md:text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#0a66c2] text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</p>
                    ) : (
                      <div className="relative">
                        <ElevataMarkdown content={msg.content} />
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-md"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    <span
                      className={`block text-[10px] mt-2 text-right ${
                        msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3.5 items-center">
                  <div className="w-8 h-8 rounded-xl bg-[#057642] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="text-xs text-slate-500 font-medium pl-1">Analyzing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Box (ChatGPT Style) */}
        <div className="p-4 md:p-5 bg-white border-t border-gray-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative flex items-center border border-gray-200 focus-within:border-[#0a66c2] focus-within:ring-1 focus-within:ring-[#0a66c2] rounded-2xl bg-white px-4 py-2 transition shadow-sm">
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
                placeholder={
                  isFI
                    ? 'Message Elevata Banker Copilot...'
                    : 'Message Elevata SME Copilot...'
                }
                disabled={loading}
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 py-1.5 pr-10 max-h-40"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="absolute right-3 p-2 bg-[#0a66c2] hover:bg-[#004182] disabled:bg-slate-200 text-white rounded-xl transition shrink-0 flex items-center justify-center disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Elevata AI provides financial and operational insights. Verify key lending parameters with official documentation.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
