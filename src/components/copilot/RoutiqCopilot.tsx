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
    <div className="flex flex-col h-[750px] bg-[#171717] border border-[#383838] rounded-xl overflow-hidden shadow-2xl">
      {/* Top Banner with Electric Lavender Accents */}
      <div className="p-4 border-b border-[#383838] bg-[#202020] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#A65BFF]/10 text-[#A65BFF] border border-[#A65BFF]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#FFFFFF]">
                ROUTIQ AI Fleet Copilot
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#A65BFF]/20 text-[#A65BFF] border border-[#A65BFF]/30 font-semibold">
                Electric Lavender
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] font-mono">
              Ground-truth operational reasoning & bottleneck diagnosis
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="text-xs font-mono text-[#A3A3A3] hover:text-[#FFFFFF] flex items-center gap-1.5 p-2 rounded hover:bg-[#282828] transition-colors"
          title="Clear Session History"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-2xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {msg.sender === 'copilot' ? (
              <div className="w-8 h-8 rounded-lg bg-[#A65BFF]/20 border border-[#A65BFF]/40 text-[#A65BFF] flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#FFF21A] text-[#171717] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                DISP
              </div>
            )}

            <div className="space-y-1.5">
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed font-sans ${
                  msg.sender === 'user'
                    ? 'bg-[#282828] text-[#FFFFFF] border border-[#383838]'
                    : 'bg-[#202020] text-[#FFFFFF] border border-[#383838]/80 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>

              {msg.sender === 'copilot' && (
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#A3A3A3] pl-1">
                  <span>{msg.timestamp}</span>
                  {msg.model && (
                    <span className="flex items-center gap-1 text-[#A65BFF]">
                      <ShieldCheck className="w-3 h-3" />
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
          <div className="flex gap-3 max-w-md items-center text-xs font-mono text-[#A65BFF] animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[#A65BFF]/20 border border-[#A65BFF]/40 text-[#A65BFF] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-lg bg-[#202020] border border-[#383838] flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-[#A65BFF]" />
              <span>Analyzing live fleet state & database constraints...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-3 border-t border-[#383838] bg-[#202020]/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-[#A3A3A3] uppercase shrink-0 pl-1">
          Inquiries:
        </span>
        {SUGGESTED_QUERIES.map((query, i) => (
          <button
            key={i}
            onClick={() => handleSend(query)}
            className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-[#171717] hover:bg-[#282828] border border-[#383838] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#383838] bg-[#202020]">
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
            className="flex-1 bg-[#171717] border border-[#383838] rounded-lg px-4 py-3 text-xs text-[#FFFFFF] placeholder-[#A3A3A3] focus:outline-none focus:border-[#A65BFF] font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="px-5 py-3 bg-[#A65BFF] hover:bg-[#A65BFF]/90 text-white font-mono text-xs font-bold uppercase rounded-lg transition-all disabled:opacity-40 flex items-center gap-2"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-2 text-[10px] text-[#A3A3A3] font-mono flex items-center justify-between">
          <span>AI answers are advisory. Final resource allocation requires authoritative transactional commit.</span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" /> Enter to send
          </span>
        </div>
      </div>
    </div>
  );
};

