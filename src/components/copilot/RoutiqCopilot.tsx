import React, { useState } from 'react';
import { useOperational } from '../../context/OperationalContext';
import { askRoutiqCopilot } from '../../lib/gemini';
import { Sparkles, Send, Bot, ShieldCheck, CornerDownLeft, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  model?: string;
  timestamp: string;
  sources?: string[];
}

const SUGGESTED_QUERIES = [
  'Which vehicles are currently available?',
  'Which deliveries are urgent?',
  'What is the current fleet utilization?',
  'Summarize current operational bottlenecks',
];

export const RoutiqCopilot: React.FC = () => {
  const { vehicles, drivers, deliveries } = useOperational();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: 'Welcome to **ROUTIQ AI Fleet Copilot**. I analyze live fleet state, conflict reservations, and route allocation rules in real time.\n\nAsk any operational question or select a prompt below.',
      model: 'ROUTIQ Heuristic Intelligence Engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['Fleet State Engine', 'Audit Log Bus'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await askRoutiqCopilot(textToSend, {
        vehicles,
        drivers,
        deliveries,
        activeAlerts: [],
      });

      const copilotMsg: Message = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: response.text,
        model: response.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        text: 'An unexpected communication error occurred. Stored telemetry remains consistent.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'copilot',
        text: 'Copilot memory refreshed. Ready for operational inquiries.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[750px] bg-[#FFFFFF] border-2 border-[#111111] rounded-xl overflow-hidden shadow-[4px_4px_0px_#111111]">
      {/* Top Banner with Editorial Branding */}
      <div className="p-4 border-b-2 border-[#111111] bg-[#FFF21A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black font-display tracking-tight text-[#111111]">
                ROUTIQ AI FLEET COPILOT
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#A65BFF] text-white border border-[#111111] font-black uppercase">
                Intelligence Engine
              </span>
            </div>
            <p className="text-xs text-[#45421F] font-bold">
              Ground-truth operational reasoning & bottleneck diagnosis
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="text-xs font-bold text-[#111111] bg-[#FFFFFF] hover:bg-[#F3F4F6] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-transform active:translate-x-0.5 active:translate-y-0.5"
          title="Clear Session History"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#FAF9F5]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-2xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {msg.sender === 'copilot' ? (
              <div className="w-9 h-9 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#FFF21A] text-[#111111] font-mono font-black text-xs border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0 mt-1">
                DISP
              </div>
            )}

            <div className="space-y-1.5">
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed font-sans border-2 border-[#111111] ${
                  msg.sender === 'user'
                    ? 'bg-[#111111] text-[#FFFFFF] shadow-[3px_3px_0px_#45421F]'
                    : 'bg-[#FFFFFF] text-[#111111] shadow-[3px_3px_0px_#111111]'
                }`}
              >
                <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
              </div>

              {msg.sender === 'copilot' && (
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#45421F] font-bold pl-1">
                  <span>{msg.timestamp}</span>
                  {msg.model && (
                    <span className="flex items-center gap-1 text-[#A65BFF]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {msg.model}
                    </span>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <span>Sources: {msg.sources.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 max-w-md items-center text-xs font-mono text-[#111111] animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-3 rounded-lg bg-[#FFFFFF] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-[#A65BFF]" />
              <span className="font-bold">Analyzing live fleet state & database constraints...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-3 border-t-2 border-[#111111] bg-[#FFF21A]/30 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-mono text-[#111111] font-black uppercase shrink-0 pl-1">
          Quick Inquiries:
        </span>
        {SUGGESTED_QUERIES.map((query, i) => (
          <button
            key={i}
            onClick={() => handleSend(query)}
            className="text-xs font-bold whitespace-nowrap px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FFF21A] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-[#111111] transition-colors"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t-2 border-[#111111] bg-[#FFFFFF]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot about vehicle availability, route allocation, or dispatch bottlenecks..."
            className="flex-1 bg-[#FFFFFF] border-2 border-[#111111] rounded-lg px-4 py-3 text-xs text-[#111111] placeholder-[#45421F]/60 focus:outline-none focus:bg-[#FFF21A]/20 font-bold"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="px-6 py-3 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase rounded-lg border-2 border-[#111111] shadow-[3px_3px_0px_#111111] transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 flex items-center gap-2"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-2 text-[10px] text-[#45421F] font-bold flex items-center justify-between">
          <span>AI answers are advisory. Final resource allocation requires authoritative transactional commit.</span>
          <span className="flex items-center gap-1 font-mono">
            <CornerDownLeft className="w-3 h-3" /> Enter to send
          </span>
        </div>
      </div>
    </div>
  );
};


