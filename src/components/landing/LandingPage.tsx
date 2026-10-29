import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Navigation,
  Activity,
  ArrowRight,
  CheckCircle,
  Truck,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-[#171717] text-[#FFFFFF] font-sans selection:bg-[#FFF21A] selection:text-[#171717]">
      {/* Top Editorial Nav */}
      <nav className="border-b border-[#383838] bg-[#171717]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF21A] text-[#171717] flex items-center justify-center font-black font-display text-xl tracking-tighter">
              RQ
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-wider text-[#FFFFFF]">
                ROUTIQ
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#202020] text-[#A65BFF] border border-[#383838]">
                Intelligence Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onEnterApp}
              className="px-5 py-2.5 bg-[#FFF21A] hover:bg-[#fff447] text-[#171717] font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#FFF21A]/10"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: Lemon Yellow Editorial Panel */}
      <section className="relative overflow-hidden border-b border-[#383838]">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#202020] border border-[#383838] text-xs font-mono text-[#FFF21A]">
                <Sparkles className="w-3.5 h-3.5 text-[#A65BFF]" />
                <span>Next-Generation Fleet & Dispatch Orchestration</span>
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tight text-[#FFFFFF] leading-[0.95]">
                MOVE SMARTER.<br />
                <span className="text-[#FFF21A]">DELIVER BETTER.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#A3A3A3] max-w-xl font-normal leading-relaxed">
                An intelligent command center for conflict-safe dispatch, authoritative resource allocation, and real-time turn-by-turn road network intelligence.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  onClick={onEnterApp}
                  className="px-7 py-4 bg-[#FFF21A] hover:bg-[#fff447] text-[#171717] font-mono text-sm font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shadow-xl shadow-[#FFF21A]/20"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="px-6 py-4 bg-[#202020] hover:bg-[#282828] border border-[#383838] text-sm font-mono uppercase text-[#FFFFFF] rounded-lg transition-colors"
                >
                  See How It Works
                </a>
              </div>

              {/* Guarantees */}
              <div className="pt-6 border-t border-[#383838] grid grid-cols-3 gap-4 text-xs font-mono text-[#A3A3A3]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#FFF21A]" />
                  <span>Zero Double-Booking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#A65BFF]" />
                  <span>OSRM Road Routing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Deterministic Audit</span>
                </div>
              </div>
            </div>

            {/* Right: Visual Route Geometry Graphic */}
            <div className="lg:col-span-5">
              <div className="bg-[#202020] border-2 border-[#FFF21A] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-[#383838]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="ml-2 font-mono text-xs text-[#A3A3A3]">DISPATCH_TOPOLOGY_V1</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A65BFF]/20 text-[#A65BFF] font-bold">
                    ACTIVE MESH
                  </span>
                </div>

                {/* Simulated Topological Map SVG */}
                <div className="py-6 flex items-center justify-center">
                  <svg viewBox="0 0 400 240" className="w-full h-auto">
                    {/* Road Network Grid */}
                    <line x1="20" y1="40" x2="380" y2="40" stroke="#2a2a2a" strokeWidth="1" />
                    <line x1="20" y1="120" x2="380" y2="120" stroke="#2a2a2a" strokeWidth="1" />
                    <line x1="20" y1="200" x2="380" y2="200" stroke="#2a2a2a" strokeWidth="1" />
                    <line x1="60" y1="20" x2="60" y2="220" stroke="#2a2a2a" strokeWidth="1" />
                    <line x1="180" y1="20" x2="180" y2="220" stroke="#2a2a2a" strokeWidth="1" />
                    <line x1="320" y1="20" x2="320" y2="220" stroke="#2a2a2a" strokeWidth="1" />

                    {/* Active Transit Path */}
                    <path
                      d="M 60 120 L 140 120 L 180 40 L 280 40 L 320 200"
                      fill="none"
                      stroke="#FFF21A"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />

                    {/* Waypoint Nodes */}
                    <circle cx="60" cy="120" r="7" fill="#171717" stroke="#FFF21A" strokeWidth="3" />
                    <text x="50" y="145" fill="#FFF21A" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      HUB-04
                    </text>

                    <circle cx="180" cy="40" r="5" fill="#A65BFF" />
                    <circle cx="280" cy="40" r="5" fill="#A65BFF" />

                    <circle cx="320" cy="200" r="7" fill="#171717" stroke="#A65BFF" strokeWidth="3" />
                    <text x="300" y="225" fill="#A65BFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      DROP-C
                    </text>
                  </svg>
                </div>

                {/* Telemetry pill */}
                <div className="p-3 bg-[#171717] rounded-lg border border-[#383838] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#A3A3A3]">Active Payload: 450 kg</span>
                  <span className="text-[#FFF21A] font-bold">14.8 km • 24 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Pillars / Core Problems Solved */}
      <section className="py-24 border-b border-[#383838] max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="text-xs font-mono uppercase tracking-wider text-[#FFF21A] font-bold">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#FFFFFF] mt-2">
            ENGINEERED FOR LOGISTICS INTEGRITY
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-xl bg-[#202020] border border-[#383838] space-y-4 hover:border-[#FFF21A] transition-colors">
            <div className="p-3 rounded-lg bg-[#FFF21A]/10 text-[#FFF21A] w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#FFFFFF]">
              Conflict-Safe Allocation
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
              Transactional concurrency locks eliminate double-booking entirely. Vehicles and drivers cannot be reserved across overlapping active deliveries.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#202020] border border-[#383838] space-y-4 hover:border-[#A65BFF] transition-colors">
            <div className="p-3 rounded-lg bg-[#A65BFF]/10 text-[#A65BFF] w-fit">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#FFFFFF]">
              ROUTIQ AI Copilot
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
              Powered by Google Gemini and real-time fleet graph analysis. Answers operational queries, explains bottlenecks, and diagnoses allocation failures.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#202020] border border-[#383838] space-y-4 hover:border-[#FFF21A] transition-colors">
            <div className="p-3 rounded-lg bg-[#FFF21A]/10 text-[#FFF21A] w-fit">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#FFFFFF]">
              Turn-by-Turn Road Intelligence
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
              Real OSRM street-level routing calculates true road network geometry, distances, and drive times rather than inaccurate straight-line estimates.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#202020] border-2 border-[#A65BFF] space-y-4 shadow-xl shadow-[#A65BFF]/10">
            <div className="p-3 rounded-lg bg-[#A65BFF]/20 text-[#A65BFF] w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-display text-[#FFFFFF]">
                ROUTIQ Decision Lab
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A65BFF]/20 text-[#A65BFF] font-bold">
                SIGNATURE
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
              Explain every dispatch decision with a deterministic eligibility matrix, non-mutating What-If comparative simulation, and active Conflict Radar.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#202020] border border-[#383838] space-y-4 hover:border-[#FFF21A] transition-colors">
            <div className="p-3 rounded-lg bg-[#FFF21A]/10 text-[#FFF21A] w-fit">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#FFFFFF]">
              Transparent Telemetry
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
              Mathematical formulas for fleet utilization and delivery completion. No fabricated statistics or unverifiable live GPS illusions.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#202020] border border-[#383838] space-y-4 hover:border-[#A65BFF] transition-colors">
            <div className="p-3 rounded-lg bg-[#A65BFF]/10 text-[#A65BFF] w-fit">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#FFFFFF]">
              Immutable Audit Ledger
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
              Every creation, status transition, allocation, completion, and cancellation is immutably timestamped with actor traceability.
            </p>
          </div>
        </div>
      </section>

      {/* How it works workflow */}
      <section id="how-it-works" className="py-24 border-b border-[#383838] max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A65BFF] font-bold">
            Execution Lifecycle
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#FFFFFF] mt-2">
            THE ROUTIQ DISPATCH WORKFLOW
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-[#202020] border border-[#383838] space-y-3">
            <div className="text-2xl font-mono font-black text-[#FFF21A]">01</div>
            <h4 className="font-display font-bold text-lg text-[#FFFFFF]">Order Ingestion</h4>
            <p className="text-xs text-[#A3A3A3] font-mono">
              Deliveries enter the pending queue with payload, classification, and priority requirements.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#202020] border border-[#383838] space-y-3">
            <div className="text-2xl font-mono font-black text-[#A65BFF]">02</div>
            <h4 className="font-display font-bold text-lg text-[#FFFFFF]">Smart Matching</h4>
            <p className="text-xs text-[#A3A3A3] font-mono">
              The recommendation engine scores available fleet assets and verifies capacity compatibility.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#202020] border border-[#383838] space-y-3">
            <div className="text-2xl font-mono font-black text-[#FFF21A]">03</div>
            <h4 className="font-display font-bold text-lg text-[#FFFFFF]">Atomic Allocation</h4>
            <p className="text-xs text-[#A3A3A3] font-mono">
              Row locks prevent race conditions while updating vehicle, driver, delivery, and audit states simultaneously.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#202020] border border-[#383838] space-y-3">
            <div className="text-2xl font-mono font-black text-emerald-400">04</div>
            <h4 className="font-display font-bold text-lg text-[#FFFFFF]">Safe Release</h4>
            <p className="text-xs text-[#A3A3A3] font-mono">
              Upon confirmed delivery or valid cancellation, resources automatically return to the available standby pool.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 max-w-5xl mx-auto px-6 text-center space-y-8">
        <h2 className="text-4xl sm:text-6xl font-display font-black text-[#FFFFFF]">
          EXPERIENCE NEXT-LEVEL FLEET DISPATCH.
        </h2>
        <p className="text-sm sm:text-base text-[#A3A3A3] max-w-xl mx-auto font-mono">
          Ready for evaluation at the RISE @ RST 9 hackathon. Complete with automated tests, transactional safety, and street-level road intelligence.
        </p>
        <div>
          <button
            onClick={onEnterApp}
            className="px-8 py-4 bg-[#FFF21A] hover:bg-[#fff447] text-[#171717] font-mono text-sm font-bold uppercase tracking-wider rounded-lg transition-all inline-flex items-center gap-2 shadow-2xl shadow-[#FFF21A]/30"
          >
            <span>Enter Operational Console</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#383838] py-8 text-center text-xs font-mono text-[#A3A3A3]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#FFFFFF]">ROUTIQ</span>
            <span>— AI-Powered Fleet & Logistics Intelligence Platform</span>
          </div>
          <div>Built for RISE @ RST 9 Hackathon</div>
        </div>
      </footer>
    </div>
  );
};

