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
  Paperclip,
  ArrowUp
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
  const firstName = user?.business?.ownerName
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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
            activeSmeExpenses: activeSme?.monthlyData ? activeSme.monthlyData.reduce((sum, d) => sum + d.expenses, 0) : undefined,
            activeSmeBalance: activeSme?.currentBalance,
            activeSmeInventoryValue: activeSme?.inventoryItems
              ? activeSme.inventoryItems.reduce((sum, item) => sum + (item.stockLevel * item.unitPrice), 0)
              : undefined,
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

  // Quick Action Cards matching mockup style
  const quickCards = isFI
    ? [
        {
          badge: 'Credit Assessment',
          badgeStyle: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/80',
          subtitle: 'Evaluate SME risk & debt capacity',
          prompt: 'What key credit risk metrics should I evaluate for a growing retail SME in Kigali?'
        },
        {
          badge: 'Suggestions',
          badgeStyle: 'text-rose-400 bg-rose-950/70 border-rose-800/80',
          subtitle: 'Help with loan structuring ideas',
          prompt: 'Help me draft qualification criteria and repayment terms for an inventory-backed credit line.'
        },
        {
          badge: 'Portfolio Health',
          badgeStyle: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80',
          subtitle: 'Maintain low NPL loan ratios',
          prompt: 'What monitoring practices best assist credit officers in maintaining an NPL ratio below 3%?'
        }
      ]
    : [
        {
          badge: 'Content Help',
          badgeStyle: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/80',
          subtitle: 'Help with reports & tax ledger',
          prompt: 'How do I organize my monthly cash inflows and operating expenses for tax compliance?'
        },
        {
          badge: 'Suggestions',
          badgeStyle: 'text-rose-400 bg-rose-950/70 border-rose-800/80',
          subtitle: 'Improve SME health score',
          prompt: 'What specific financial and inventory practices will increase my business health score on Elevata?'
        },
        {
          badge: 'Job Application',
          badgeStyle: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80',
          subtitle: 'Apply for grants & loan capital',
          prompt: 'If my monthly sales are 4,200,000 RWF with 28% profit margin, what loan amount can I comfortably repay?'
        }
      ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputMessage((prev) => `${prev} [Attached file: ${file.name}] `);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#0c121e] text-slate-100 font-sans -m-3 md:-m-6 overflow-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* =========================================================================
          LEFT SIDEBAR: Conversation History
      ========================================================================== */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out bg-[#0f172a] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden z-20`}
      >
        {/* Top: New Chat Button */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold transition shadow-sm"
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
            <p className="text-xs text-slate-500 px-3 py-4 text-center">No conversation history yet.</p>
          ) : (
            conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                  chat.id === activeChatId
                    ? 'bg-[#1e293b] text-teal-300 font-bold border border-teal-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      chat.id === activeChatId ? 'text-teal-400' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{chat.title}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => deleteConversation(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition shrink-0 ml-1"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Sidebar User Summary */}
        <div className="p-3 border-t border-slate-800 bg-[#0b111e] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0f766e] text-white flex items-center justify-center text-xs font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">
              {isFI ? 'Banker Copilot' : 'SME Copilot'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">Powered by Elevata AI</p>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CHAT WORKSPACE
      ========================================================================== */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0c121e] relative h-full">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between bg-[#0f172a]/60 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-md">
                {activeConversation?.title || 'New Conversation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Message Stream Area / Welcome View */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 select-text space-y-6 flex flex-col">
          {currentMessages.length === 0 ? (
            /* =====================================================================
                HERO EMPTY STATE (Redesigned matching screenshot)
            ===================================================================== */
            <div className="my-auto flex flex-col items-center justify-center max-w-3xl mx-auto w-full space-y-8 py-6">
              {/* Heading */}
              <div className="text-left w-full space-y-1">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  Hey! {firstName}
                </h1>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-300">
                  What can I help with?
                </h2>
              </div>

              {/* 3 Quick Action Cards matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {quickCards.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-4 rounded-2xl bg-[#141d2b] hover:bg-[#182334] border border-slate-800/90 hover:border-slate-700 transition text-left group flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${item.badgeStyle}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 group-hover:text-slate-200 transition line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </button>
                ))}
              </div>

              {/* Central Input Box in Hero view */}
              <div className="w-full">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="w-full"
                >
                  <div className="relative rounded-2xl bg-[#141d2b] border border-slate-800 focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20 p-4 transition shadow-lg space-y-3">
                    {/* Top Sparkles Icon */}
                    <div className="flex items-center text-teal-400">
                      <Sparkles className="w-4 h-4" />
                    </div>

                    {/* Textarea */}
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
                      placeholder="Ask me anything......"
                      disabled={loading}
                      className="ai-chat-textarea w-full resize-none !bg-transparent !border-0 !shadow-none !outline-none text-sm text-slate-100 placeholder:text-slate-500 max-h-40 leading-relaxed !min-h-0 !p-0"
                      style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                    />

                    {/* Bottom toolbar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 border border-slate-700/70 transition"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span>Attach file</span>
                      </button>

                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || loading}
                        className="h-9 w-9 bg-[#0d9488] hover:bg-[#14b8a6] disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition shrink-0 flex items-center justify-center disabled:cursor-not-allowed shadow-md shadow-teal-950/50"
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
            /* Active Message List */
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#0f766e] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group text-xs md:text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#0f766e] text-white rounded-tr-none'
                        : 'bg-[#141d2b] text-slate-100 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</p>
                    ) : (
                      <div className="relative">
                        <ElevataMarkdown content={msg.content} />
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded-md"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    <span className="block text-[10px] mt-2 text-right text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-teal-300 flex items-center justify-center shrink-0 shadow-sm mt-0.5 border border-slate-700">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3.5 items-center">
                  <div className="w-8 h-8 rounded-xl bg-[#0f766e] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#141d2b] border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                    <span className="text-xs text-slate-400 font-medium pl-1">Elevata AI is analyzing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Box during active conversation */}
        {currentMessages.length > 0 && (
          <div className="p-4 md:p-5 bg-[#0b111e] border-t border-slate-800/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-3xl mx-auto"
            >
              <div className="relative rounded-2xl bg-[#141d2b] border border-slate-800 focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20 p-3 transition shadow-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
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
                    placeholder="Ask me anything......"
                    disabled={loading}
                    className="ai-chat-textarea w-full resize-none !bg-transparent !border-0 !shadow-none !outline-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 py-1 max-h-36 !min-h-0 !p-0"
                    style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-[11px] font-semibold text-slate-300 border border-slate-700/60 transition"
                  >
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span>Attach file</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="h-8 w-8 bg-[#0d9488] hover:bg-[#14b8a6] disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition shrink-0 flex items-center justify-center disabled:cursor-not-allowed shadow-md shadow-teal-950/50"
                    title="Send message"
                  >
                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2">
                Elevata AI provides financial and operational insights. Always verify critical lending metrics.
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

