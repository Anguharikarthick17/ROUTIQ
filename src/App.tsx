import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OperationalProvider, useOperational } from './context/OperationalContext';
import { LandingPage } from './components/landing/LandingPage';
import { OperationsOverview } from './components/operations/OperationsOverview';
import { VehicleManagementView } from './components/vehicles/VehicleManagementView';
import { DriverManagementView } from './components/drivers/DriverManagementView';
import { DeliveryManagementView } from './components/deliveries/DeliveryManagementView';
import { RoutiqCopilot } from './components/copilot/RoutiqCopilot';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AuditHistoryView } from './components/audit/AuditHistoryView';
import { DecisionLabView } from './components/decision-lab/DecisionLabView';
import { isSupabaseConfigured } from './lib/supabase';
import { Delivery } from './types';
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Bot,
  BarChart2,
  ShieldCheck,
  Globe,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  UserCheck,
  Sliders,
  Database,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const { resetDemoData } = useOperational();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [decisionLabDeliveryId, setDecisionLabDeliveryId] = useState<string | undefined>(undefined);

  // If user is on landing page
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'decision-lab', label: 'Decision Lab', icon: Sliders, isSignature: true },
    { id: 'deliveries', label: 'Deliveries', icon: Package },
    { id: 'vehicles', label: 'Fleet Assets', icon: Truck },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, isAi: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FFF21A] text-[#111111] font-sans flex flex-col lg:flex-row antialiased selection:bg-[#111111] selection:text-[#FFF21A]">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-[#111111] text-[#FFFFFF] border-b-2 border-[#111111] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded bg-[#FFF21A] text-[#111111] flex items-center justify-center font-black font-display text-base tracking-tighter">
            RQ
          </div>
          <div>
            <div className="font-display font-black text-lg tracking-wider text-[#FFFFFF] leading-none">
              ROUTIQ
            </div>
            <div className="text-[10px] font-mono text-[#FFF21A] tracking-wider uppercase">
              Fleet Workstation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLanding(true)}
            className="p-1.5 text-xs font-mono text-[#FFF21A] hover:bg-[#222222] rounded border border-[#333333]"
            title="Landing Page"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 bg-[#FFF21A] text-[#111111] rounded font-bold"
            aria-label="Toggle Navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Left Navigation Sidebar (Desktop Rail & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#111111] text-[#FFFFFF] border-r-2 border-[#111111] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#262626]">
          <div
            onClick={() => {
              setActiveTab('overview');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FFF21A] text-[#111111] flex items-center justify-center font-black font-display text-xl tracking-tighter shadow-[3px_3px_0px_#A65BFF] transition-transform group-hover:scale-105">
              RQ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-2xl tracking-tight text-[#FFFFFF]">
                  ROUTIQ
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#FFF21A] text-[#111111] text-[9px] font-mono font-black uppercase tracking-wider">
                  OS
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#888888] tracking-wider uppercase mt-0.5">
                Fleet & Logistics Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono font-bold tracking-widest text-[#666666] uppercase">
            Platform Workstation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-[#FFF21A] text-[#111111] font-bold shadow-[3px_3px_0px_#A65BFF]'
                    : item.isSignature
                    ? 'text-[#FFF21A] hover:bg-[#1E1E1E] hover:text-[#FFF21A]'
                    : item.isAi
                    ? 'text-[#A65BFF] hover:bg-[#1E1E1E]'
                    : 'text-[#BBBBBB] hover:bg-[#1E1E1E] hover:text-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-[#111111]'
                        : item.isSignature
                        ? 'text-[#FFF21A]'
                        : item.isAi
                        ? 'text-[#A65BFF]'
                        : 'text-[#888888] group-hover:text-[#FFFFFF]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.isSignature && !isActive && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#A65BFF]/20 text-[#A65BFF] border border-[#A65BFF]/30 font-bold">
                    Core
                  </span>
                )}
                {item.isAi && !isActive && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#A65BFF] text-white font-bold">
                    AI
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#262626]">
            <button
              onClick={() => {
                setShowLanding(true);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 rounded-lg text-xs font-mono text-[#888888] hover:text-[#FFF21A] hover:bg-[#1E1E1E] transition-colors flex items-center gap-2.5"
            >
              <Globe className="w-4 h-4 text-[#FFF21A]" />
              <span>Public Landing Page</span>
            </button>
          </div>
        </nav>

        {/* Utility Footer: Role Selector & Persistence */}
        <div className="p-4 border-t border-[#262626] bg-[#0A0A0A] space-y-3">
          {/* Persistence status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#171717] border border-[#2B2B2B] text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#FFF21A]" />
              <span className="text-[#AAAAAA]">Storage:</span>
            </div>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                isSupabaseConfigured()
                  ? 'bg-[#176B38] text-white'
                  : 'bg-[#45421F] text-[#FFF21A]'
              }`}
            >
              {isSupabaseConfigured() ? 'Supabase PG Cloud' : 'Local Fallback'}
            </span>
          </div>

          {/* Role selector */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#171717] border border-[#2B2B2B] text-xs font-mono">
            <div className="flex items-center gap-2 text-[#AAAAAA]">
              <UserCheck className="w-3.5 h-3.5 text-[#A65BFF]" />
              <span>Role:</span>
            </div>
            <select
              value={role}
              onChange={(e) => switchRole(e.target.value as any)}
              className="bg-transparent text-[#FFF21A] font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="dispatcher" className="bg-[#111111] text-white">
                Dispatcher
              </option>
              <option value="fleet_manager" className="bg-[#111111] text-white">
                Fleet Manager
              </option>
              <option value="admin" className="bg-[#111111] text-white">
                Admin
              </option>
            </select>
          </div>

          <div className="text-[10px] font-mono text-[#555555] text-center">
            ROUTIQ v1.0 • RISE @ RST 9
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Full-Viewport Workspace */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#FFF21A] text-[#111111]">
        {/* Top Operational Status Ribbon */}
        <div className="w-full bg-[#111111] text-[#FFFFFF] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#111111]">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#FFF21A] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[#FFF21A]">
              Live Logistics Engine
            </span>
            <span className="hidden sm:inline text-[#666666]">|</span>
            <span className="hidden sm:inline text-[#AAAAAA]">
              Turn-by-turn road routing & multi-resource transactional locking
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('decision-lab')}
              className="px-3 py-1 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_#FFF21A]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Decision Lab</span>
            </button>
            <button
              onClick={resetDemoData}
              className="px-2.5 py-1 bg-[#222222] hover:bg-[#333333] text-[#FFF21A] font-mono text-xs rounded border border-[#333333] flex items-center gap-1.5 transition-colors"
              title="Reset demonstration state"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">Reset Fleet</span>
            </button>
          </div>
        </div>

        {/* Primary Viewport Content Area: 100% width, no arbitrary max-w */}
        <main className="w-full flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'overview' && (
            <OperationsOverview onNavigateToTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'decision-lab' && (
            <DecisionLabView initialDeliveryId={decisionLabDeliveryId} />
          )}
          {activeTab === 'deliveries' && (
            <DeliveryManagementView
              onOpenDecisionLab={(id) => {
                setDecisionLabDeliveryId(id);
                setActiveTab('decision-lab');
              }}
            />
          )}
          {activeTab === 'vehicles' && <VehicleManagementView />}
          {activeTab === 'drivers' && <DriverManagementView />}
          {activeTab === 'copilot' && <RoutiqCopilot />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'audit' && <AuditHistoryView />}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <OperationalProvider>
        <AppContent />
      </OperationalProvider>
    </AuthProvider>
  );
}

export default App;

