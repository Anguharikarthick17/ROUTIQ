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
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const { resetDemoData } = useOperational();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // If user is on landing page
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'deliveries', label: 'Deliveries', icon: Package },
    { id: 'vehicles', label: 'Fleet Assets', icon: Truck },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, isAi: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#171717] text-[#FFFFFF] font-sans selection:bg-[#FFF21A] selection:text-[#171717]">
      {/* Top Application Header */}
      <header className="border-b border-[#383838] bg-[#171717]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Wordmark & Mode Switcher */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-[#FFF21A] text-[#171717] flex items-center justify-center font-black font-display text-lg tracking-tighter">
                RQ
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-wider text-[#FFFFFF]">
                  ROUTIQ
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#202020] text-[#FFF21A] border border-[#383838] font-bold">
                  v1.0 • RISE @ RST 9
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowLanding(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#A3A3A3] hover:text-[#FFFFFF] rounded hover:bg-[#202020] transition-colors border border-transparent hover:border-[#383838]"
              title="View Public Landing Page"
            >
              <Globe className="w-3.5 h-3.5 text-[#FFF21A]" />
              <span>Landing Page</span>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? item.isAi
                        ? 'bg-[#A65BFF] text-white shadow-lg shadow-[#A65BFF]/20 font-bold'
                        : 'bg-[#FFF21A] text-[#171717] shadow-lg shadow-[#FFF21A]/20 font-bold'
                      : item.isAi
                      ? 'text-[#A65BFF] hover:bg-[#202020] hover:text-white'
                      : 'text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#202020]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#202020] border border-[#383838] text-xs font-mono">
              <UserCheck className="w-3.5 h-3.5 text-[#A65BFF]" />
              <span className="text-[#A3A3A3]">Role:</span>
              <select
                value={role}
                onChange={(e) => switchRole(e.target.value as any)}
                className="bg-transparent text-[#FFFFFF] font-bold focus:outline-none cursor-pointer"
              >
                <option value="dispatcher" className="bg-[#171717] text-white">
                  Dispatcher
                </option>
                <option value="fleet_manager" className="bg-[#171717] text-white">
                  Fleet Manager
                </option>
                <option value="admin" className="bg-[#171717] text-white">
                  Admin
                </option>
              </select>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#A3A3A3] hover:text-[#FFFFFF]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#383838] bg-[#171717] px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 ${
                    isActive
                      ? item.isAi
                        ? 'bg-[#A65BFF] text-white font-bold'
                        : 'bg-[#FFF21A] text-[#171717] font-bold'
                      : 'text-[#A3A3A3]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-[#383838]">
              <button
                onClick={() => {
                  setShowLanding(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-mono text-[#FFF21A]"
              >
                ← View Landing Page
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && (
          <OperationsOverview onNavigateToTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'deliveries' && <DeliveryManagementView />}
        {activeTab === 'vehicles' && <VehicleManagementView />}
        {activeTab === 'drivers' && <DriverManagementView />}
        {activeTab === 'copilot' && <RoutiqCopilot />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'audit' && <AuditHistoryView />}
      </main>
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
