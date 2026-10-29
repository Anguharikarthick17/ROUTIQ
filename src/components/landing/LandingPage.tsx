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
    <div className="min-h-screen bg-[#FFF21A] text-[#111111] font-sans selection:bg-[#111111] selection:text-[#FFF21A]">
      {/* Top Editorial Nav */}
      <nav className="border-b-2 border-[#111111] bg-[#FFF21A] sticky top-0 z-40">
        <div className="w-full px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#111111] text-[#FFF21A] border-2 border-[#111111] flex items-center justify-center font-black font-display text-2xl tracking-tighter shadow-[2px_2px_0px_#111111]">
              RQ
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-wider text-[#111111]">
                ROUTIQ
              </span>
              <span className="hidden sm:inline-block ml-3 text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-[#A65BFF] text-white border border-[#111111] shadow-[1px_1px_0px_#111111]">
                Intelligence Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onEnterApp}
              className="px-6 py-2.5 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase tracking-wider rounded-lg border-2 border-[#111111] shadow-[3px_3px_0px_#111111] transition-transform active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: Lemon Yellow Editorial Panel */}
      <section className="relative overflow-hidden border-b-2 border-[#111111] bg-[#FFF21A]">
        <div className="w-full px-6 lg:px-12 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-xs font-mono font-black text-[#111111]">
                <Sparkles className="w-4 h-4 text-[#A65BFF]" />
                <span>NEXT-GENERATION FLEET & DISPATCH ORCHESTRATION</span>
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tight text-[#111111] leading-[0.95]">
                MOVE SMARTER.<br />
                <span className="text-[#A65BFF]">DELIVER BETTER.</span>
              </h1>

              <p className="text-base sm:text-xl text-[#45421F] max-w-xl font-bold leading-relaxed">
                An intelligent workstation for conflict-safe dispatch, authoritative resource allocation, and real-time turn-by-turn road network intelligence.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  onClick={onEnterApp}
                  className="px-8 py-4 bg-[#111111] hover:bg-[#282828] text-[#FFFFFF] font-mono text-sm font-black uppercase tracking-wider rounded-lg border-2 border-[#111111] shadow-[4px_4px_0px_#45421F] transition-transform active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="w-4 h-4 text-[#FFF21A]" />
                </button>
                <a
                  href="#how-it-works"
                  className="px-7 py-4 bg-[#FFFFFF] hover:bg-[#F3F4F6] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] text-sm font-mono font-black uppercase text-[#111111] rounded-lg transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  See How It Works
                </a>
              </div>

              {/* Guarantees */}
              <div className="pt-6 border-t-2 border-[#111111]/20 grid grid-cols-3 gap-4 text-xs font-mono text-[#45421F] font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#111111]" />
                  <span>Zero Double-Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#A65BFF]" />
                  <span>OSRM Road Routing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#176B38]" />
                  <span>Deterministic Audit</span>
                </div>
              </div>
            </div>

            {/* Right: Visual Route Geometry Graphic */}
            <div className="lg:col-span-5">
              <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-2xl p-6 shadow-[6px_6px_0px_#111111] relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b-2 border-[#111111]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#B42318] border border-[#111111]" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#FFF21A] border border-[#111111]" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#176B38] border border-[#111111]" />
                    <span className="ml-2 font-mono text-xs font-black text-[#111111]">DISPATCH_TOPOLOGY_V1</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#A65BFF] text-white border border-[#111111] font-black">
                    ACTIVE MESH
                  </span>
                </div>

                {/* Simulated Topological Map SVG */}
                <div className="py-6 flex items-center justify-center bg-[#FAF9F5] rounded-xl my-3 border border-[#111111]/10">
                  <svg viewBox="0 0 400 240" className="w-full h-auto">
                    {/* Road Network Grid */}
                    <line x1="20" y1="40" x2="380" y2="40" stroke="#DDDDDD" strokeWidth="1.5" />
                    <line x1="20" y1="120" x2="380" y2="120" stroke="#DDDDDD" strokeWidth="1.5" />
                    <line x1="20" y1="200" x2="380" y2="200" stroke="#DDDDDD" strokeWidth="1.5" />
                    <line x1="60" y1="20" x2="60" y2="220" stroke="#DDDDDD" strokeWidth="1.5" />
                    <line x1="180" y1="20" x2="180" y2="220" stroke="#DDDDDD" strokeWidth="1.5" />
                    <line x1="320" y1="20" x2="320" y2="220" stroke="#DDDDDD" strokeWidth="1.5" />

                    {/* Active Transit Path */}
                    <path
                      d="M 60 120 L 140 120 L 180 40 L 280 40 L 320 200"
                      fill="none"
                      stroke="#A65BFF"
                      strokeWidth="4"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />

                    {/* Waypoint Nodes */}
                    <circle cx="60" cy="120" r="8" fill="#FFF21A" stroke="#111111" strokeWidth="3" />
                    <text x="50" y="145" fill="#111111" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      HUB-04
                    </text>

                    <circle cx="180" cy="40" r="6" fill="#111111" />
                    <circle cx="280" cy="40" r="6" fill="#111111" />

                    <circle cx="320" cy="200" r="8" fill="#111111" stroke="#A65BFF" strokeWidth="3" />
                    <text x="300" y="225" fill="#111111" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      DROP-C
                    </text>
                  </svg>
                </div>

                {/* Telemetry pill */}
                <div className="p-3 bg-[#FFF21A]/30 rounded-lg border-2 border-[#111111] flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-[#45421F]">Active Payload: 450 kg</span>
                  <span className="text-[#111111] font-black">14.8 km • 24 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Pillars / Core Problems Solved */}
      <section className="py-24 border-b-2 border-[#111111] w-full px-6 lg:px-12 bg-[#FFFFFF]">
        <div className="mb-16">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A65BFF] font-black">
            PLATFORM CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-[#111111] mt-2 tracking-tight">
            ENGINEERED FOR LOGISTICS INTEGRITY
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-4 hover:bg-[#FFF21A]/10 transition-colors">
            <div className="p-3 rounded-lg bg-[#FFF21A] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-display text-[#111111]">
              Conflict-Safe Allocation
            </h3>
            <p className="text-xs text-[#45421F] leading-relaxed font-mono font-bold">
              Transactional concurrency locks eliminate double-booking entirely. Vehicles and drivers cannot be reserved across overlapping active deliveries.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-4 hover:bg-[#FFF21A]/10 transition-colors">
            <div className="p-3 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] w-fit">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-display text-[#111111]">
              ROUTIQ AI Copilot
            </h3>
            <p className="text-xs text-[#45421F] leading-relaxed font-mono font-bold">
              Powered by Google Gemini and real-time fleet graph analysis. Answers operational queries, explains bottlenecks, and diagnoses allocation failures.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-4 hover:bg-[#FFF21A]/10 transition-colors">
            <div className="p-3 rounded-lg bg-[#FFF21A] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] w-fit">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-display text-[#111111]">
              Turn-by-Turn Road Intelligence
            </h3>
            <p className="text-xs text-[#45421F] leading-relaxed font-mono font-bold">
              Real OSRM street-level routing calculates true road network geometry, distances, and drive times rather than inaccurate straight-line estimates.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#FFFFFF] border-2 border-[#A65BFF] shadow-[4px_4px_0px_#A65BFF] space-y-4">
            <div className="p-3 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black font-display text-[#111111]">
                ROUTIQ Decision Lab
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#A65BFF] text-white border border-[#111111] font-black uppercase">
                SIGNATURE
              </span>
            </div>
            <p className="text-xs text-[#45421F] leading-relaxed font-mono font-bold">
              Explain every dispatch decision with a deterministic eligibility matrix, non-mutating What-If comparative simulation, and active Conflict Radar.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-4 hover:bg-[#FFF21A]/10 transition-colors">
            <div className="p-3 rounded-lg bg-[#FFF21A] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] w-fit">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-display text-[#111111]">
              Transparent Telemetry
            </h3>
            <p className="text-xs text-[#45421F] leading-relaxed font-mono font-bold">
              Mathematical formulas for fleet utilization and delivery completion. No fabricated statistics or unverifiable live GPS illusions.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-4 hover:bg-[#FFF21A]/10 transition-colors">
            <div className="p-3 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] w-fit">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-display text-[#111111]">
              Immutable Audit Ledger
            </h3>
            <p className="text-xs text-[#45421F] leading-relaxed font-mono font-bold">
              Every creation, status transition, allocation, completion, and cancellation is immutably timestamped with actor traceability.
            </p>
          </div>
        </div>
      </section>

      {/* How it works workflow */}
      <section id="how-it-works" className="py-24 border-b-2 border-[#111111] w-full px-6 lg:px-12 bg-[#FFF21A]">
        <div className="mb-16">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A65BFF] font-black">
            EXECUTION LIFECYCLE
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-[#111111] mt-2 tracking-tight">
            THE ROUTIQ DISPATCH WORKFLOW
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-3">
            <div className="text-3xl font-mono font-black text-[#111111]">01</div>
            <h4 className="font-display font-black text-lg text-[#111111]">Order Ingestion</h4>
            <p className="text-xs text-[#45421F] font-mono font-bold">
              Deliveries enter the pending queue with payload, classification, and priority requirements.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-3">
            <div className="text-3xl font-mono font-black text-[#A65BFF]">02</div>
            <h4 className="font-display font-black text-lg text-[#111111]">Smart Matching</h4>
            <p className="text-xs text-[#45421F] font-mono font-bold">
              The recommendation engine scores available fleet assets and verifies capacity compatibility.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-3">
            <div className="text-3xl font-mono font-black text-[#111111]">03</div>
            <h4 className="font-display font-black text-lg text-[#111111]">Atomic Allocation</h4>
            <p className="text-xs text-[#45421F] font-mono font-bold">
              Row locks prevent race conditions while updating vehicle, driver, delivery, and audit states simultaneously.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-3">
            <div className="text-3xl font-mono font-black text-[#176B38]">04</div>
            <h4 className="font-display font-black text-lg text-[#111111]">Safe Release</h4>
            <p className="text-xs text-[#45421F] font-mono font-bold">
              Upon confirmed delivery or valid cancellation, resources automatically return to the available standby pool.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 w-full px-6 text-center space-y-8 bg-[#111111] text-white">
        <h2 className="text-4xl sm:text-6xl font-display font-black text-[#FFFFFF] tracking-tight">
          EXPERIENCE NEXT-LEVEL FLEET DISPATCH.
        </h2>
        <p className="text-sm sm:text-base text-[#DDDDDD] max-w-xl mx-auto font-mono">
          Ready for evaluation at the RISE @ RST 9 hackathon. Complete with automated tests, transactional safety, and street-level road intelligence.
        </p>
        <div>
          <button
            onClick={onEnterApp}
            className="px-9 py-4 bg-[#FFF21A] hover:bg-[#fff447] text-[#111111] font-mono text-sm font-black uppercase tracking-wider rounded-lg border-2 border-[#111111] shadow-[4px_4px_0px_#A65BFF] transition-transform active:translate-x-0.5 active:translate-y-0.5 inline-flex items-center gap-2"
          >
            <span>Enter Operational Console</span>
            <ArrowRight className="w-5 h-5 text-[#111111]" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[#111111] py-8 text-center text-xs font-mono text-[#45421F] font-bold bg-[#FFF21A]">
        <div className="w-full px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#111111]">ROUTIQ</span>
            <span>— AI-Powered Fleet & Logistics Intelligence Platform</span>
          </div>
          <div>Built for RISE @ RST 9 Hackathon</div>
        </div>
      </footer>
    </div>
  );
};

