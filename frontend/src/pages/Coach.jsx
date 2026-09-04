import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Bot, Send, User, Trophy, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Coach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const { data: gamification } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => (await api.get('/coach/gamification')).data.data
  });

  // CHAT HISTORY LOAD KARO
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: async () => (await api.get('/coach/history')).data.data,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const loadedMessages = data.map((msg, index) => ({
          id: index,
          role: msg.role,
          content: msg.message
        }));
        setMessages(loadedMessages);
      } else {
        // Pehli baar open kiya
        setMessages([{
          id: 1,
          role: 'assistant',
          content: `Hello ${user?.name}, I'm your AI Wealth Coach. How can I optimize your capital today?`
        }]);
      }
    }
  });

  // History load hone ke baad messages set karo
  useEffect(() => {
    if (historyData) {
      if (historyData.length > 0) {
        const loadedMessages = historyData.map((msg, index) => ({
          id: index,
          role: msg.role,
          content: msg.message
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([{
          id: 1,
          role: 'assistant',
          content: `Hello ${user?.name}, I'm your AI Wealth Coach. How can I optimize your capital today?`
        }]);
      }
    }
  }, [historyData]);

  const chatMutation = useMutation({
    mutationFn: async (message) => await api.post('/coach/chat', { message }),
    onSuccess: (res) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: res.data.data
      }]);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: "SYSTEM FAILURE: Connection broken."
      }]);
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: userMsg
    }]);
    setInput('');
    chatMutation.mutate(userMsg);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  return (
    <div className="absolute inset-x-0 inset-y-0 flex flex-col gap-4 animate-fade-in p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-[28px] font-bebas tracking-[4px] text-engraved-gold flex items-center shadow-gold-text">
            AI WEALTH COACH <Bot className="w-6 h-6 ml-3 text-[var(--color-champagne-gold)] opacity-80" />
          </h1>
          <p className="text-[#888] font-mono text-[10px] tracking-[0.2em] uppercase mt-1">Real-time deep learning insight engine</p>
        </div>

        <div className="flex items-center gap-4 bg-pvd-plate px-5 py-3 rounded-xl plate-border shadow-plate">
          <div className="flex items-center text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#00C853] drop-shadow-[0_0_8px_rgba(0,200,83,0.3)]">
            <Flame className="w-4 h-4 mr-1.5" />
            {gamification?.currentStreak || 0} Week Streak
          </div>
          <div className="w-px h-5 bg-[#333]"></div>
          <div className="flex items-center text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-engraved-gold">
            <Trophy className="w-4 h-4 mr-1.5" />
            {gamification?.badge || 'OPERATOR'}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-cotes-de-geneve plate-border shadow-plate rounded-2xl flex flex-col overflow-hidden relative z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.02)] to-black/60 pointer-events-none rounded-2xl"></div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#050505]/80 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent shadow-recessed relative z-10">

          {/* Loading State */}
          {historyLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#555] font-mono text-sm">
                LOADING CHAT HISTORY...
              </p>
            </div>
          )}

          {messages.map((m, index) => (
            <div key={index} className={cn("flex items-start max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                m.role === 'user' ? "bg-[#111] border-[var(--color-champagne-gold)] text-[var(--color-champagne-gold)] ml-4 shadow-[0_0_8px_rgba(212,175,55,0.3)]" : "bg-[#0a0a0a] border-[#444] text-[#888] mr-4 shadow-sm"
              )}>
                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={cn(
                "px-5 py-4 rounded-xl text-[14px] font-mono leading-relaxed tracking-wide",
                m.role === 'user' ? "bg-[#161208] border border-[rgba(212,175,55,0.3)] text-white shadow-sm" : "bg-[#111] border border-[#333] text-[#ddd] shadow-sm"
              )}>
                {m.content}
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex items-center max-w-[85%] animate-fade-in relative z-10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#0a0a0a] border border-[#444] text-[var(--color-champagne-gold)] mr-4 shadow-[0_0_8px_rgba(212,175,55,0.2)]">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="px-5 py-4 bg-[#111] border border-[#333] rounded-xl flex items-center space-x-2">
                <div className="w-2 h-2 bg-[var(--color-champagne-gold)] rounded-full animate-pulse opacity-50"></div>
                <div className="w-2 h-2 bg-[var(--color-champagne-gold)] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-[var(--color-champagne-gold)] rounded-full animate-pulse opacity-50" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        {messages.length < 3 && !chatMutation.isPending && (
          <div className="bg-[#0a0a0a] px-6 py-3 flex gap-3 overflow-x-auto border-t border-[#333] relative z-20">
            {['Analyze my current finances', 'Do I have any budget warnings?', 'Are my goals on track?'].map(txt => (
              <button key={txt} onClick={() => setInput(txt)} className="text-[10px] font-mono font-bold tracking-widest text-[#aaa] border border-[#444] px-4 py-2 rounded uppercase whitespace-nowrap hover:bg-[#111] hover:text-[var(--color-champagne-gold)] hover:border-[var(--color-champagne-gold)] transition-colors shadow-recessed focus:outline-none">
                {txt}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 bg-[#0d0d0d] border-t border-[#333] relative z-20 flex flex-col">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Awaiting directive..."
              className="flex-1 bg-[#111] border border-[#333] text-white text-[14px] font-mono rounded focus:border-[var(--color-champagne-gold)] focus:shadow-[0_0_5px_rgba(212,175,55,0.3)] block px-4 py-3 outline-none transition-all placeholder-[#555] shadow-recessed uppercase"
            />
            <button
              type="submit"
              disabled={chatMutation.isPending || !input.trim()}
              className="px-6 py-3 bg-[#0a0a0a] text-engraved-gold border border-[rgba(212,175,55,0.5)] rounded hover:bg-[#1a1608] hover:border-[var(--color-champagne-gold)] transition-all disabled:opacity-40 shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center justify-center font-mono font-bold tracking-[0.2em] text-[11px]"
            >
              <Send className="w-4 h-4 mr-2" /> EXECUTE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}