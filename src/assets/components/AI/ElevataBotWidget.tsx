import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function ElevataBotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is not logged in or is currently on the AI bot page, hide the button
  if (!user || location.pathname === '/ai-bot') {
    return null;
  }

  const isFI = user?.role === 'FINANCIAL_INSTITUTION' || user?.role === 'ADMIN';

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto select-none">
      <button
        onClick={() => navigate('/ai-bot')}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] text-white font-semibold text-xs transition-all hover:scale-105 active:scale-95 border ${
          isFI
            ? 'bg-slate-900 hover:bg-slate-800 border-slate-700'
            : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500'
        }`}
        title="Open Elevata AI Copilot"
      >
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <span>Elevata AI Copilot</span>
        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-white/20 text-white">
          {isFI ? 'Banker' : 'SME'}
        </span>
      </button>
    </div>
  );
}
