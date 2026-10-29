import React, { useState } from 'react';
import { useOperational } from '../../context/OperationalContext';
import { InteractiveRouteMap } from '../map/InteractiveRouteMap';
import { Delivery } from '../../types';
import { formatRelativeTime } from '../../lib/utils';
import {
  Truck,
  Users,
  Package,
  Activity,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface OperationsOverviewProps {
  onNavigateToTab: (tab: string) => void;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({ onNavigateToTab }) => {
  const {
    vehicles,
    drivers,
    deliveries,
    assignments,
    metrics,
    resetDemoData,
    lastActionResult,
    clearLastResult,
  } = useOperational();

  const [selectedMapDelivery, setSelectedMapDelivery] = useState<Delivery | null>(() => {
    return deliveries.find((d) => d.status === 'in_transit' || d.status === 'assigned') || deliveries[0] || null;
  });

  // Collect operational alerts
  const operationalAlerts: { type: 'urgent' | 'warning' | 'info'; title: string; message: string }[] = [];
  const urgentOrders = deliveries.filter((d) => d.priority === 'urgent' && d.status === 'pending');
  if (urgentOrders.length > 0) {
    operationalAlerts.push({
      type: 'urgent',
      title: 'Urgent Dispatch Orders Pending',
      message: `${urgentOrders.length} critical shipment(s) awaiting driver & vehicle pairing.`,
    });
  }

  const maintenanceUnits = vehicles.filter((v) => v.status === 'maintenance');
  if (maintenanceUnits.length > 0) {
    operationalAlerts.push({
      type: 'warning',
      title: 'Fleet Assets Under Maintenance',
      message: `${maintenanceUnits.map((v) => v.id).join(', ')} currently offline for technical inspection.`,
    });
  }

  const unavailDrivers = drivers.filter((d) => d.availability_status === 'unavailable');
  if (unavailDrivers.length > 0) {
    operationalAlerts.push({
      type: 'info',
      title: 'Driver Standby Roster Notice',
      message: `${unavailDrivers.map((d) => d.name).join(', ')} currently on scheduled leave.`,
    });
  }

  return (
    <div className="space-y-8">
      {/* Action Notification Banner */}
      {lastActionResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            lastActionResult.success
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-red-950/40 border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {lastActionResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-mono">{lastActionResult.message}</span>
          </div>
          <button
            onClick={clearLastResult}
            className="text-xs font-mono text-[#A3A3A3] hover:text-[#FFFFFF] uppercase px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Editorial Headline Section */}
      <div className="border-b border-[#383838] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#FFF21A] text-[#171717] font-mono font-bold text-[10px] tracking-wider uppercase">
              Live Operations
            </span>
            <span className="text-xs font-mono text-[#A3A3A3]">
              Canonical Database Synchronized
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-[#FFFFFF]">
            COMMAND CENTER
          </h1>
          <p className="text-xs font-mono text-[#A3A3A3] mt-1 max-w-xl">
            Conflict-safe multi-resource dispatch, turn-by-turn road network routing, and continuous fleet telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDemoData}
            className="px-3 py-2 rounded bg-[#202020] hover:bg-[#282828] border border-[#383838] text-xs font-mono text-[#A3A3A3] hover:text-[#FFFFFF] flex items-center gap-1.5 transition-colors"
            title="Reset to canonical demonstration state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Fleet</span>
          </button>
        </div>
      </div>

      {/* High-Impact Asymmetric Metric Band */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Lemon Yellow Hero Metric Card */}
        <div className="md:col-span-4 bg-[#FFF21A] text-[#171717] p-6 rounded-xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717]/80">
              Fleet Utilization
            </span>
            <span className="p-1.5 rounded bg-[#171717] text-[#FFF21A]">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="my-6">
            <div className="text-6xl font-display font-black leading-none">
              {metrics.fleetUtilizationPct}%
            </div>
            <div className="text-xs font-mono font-bold mt-2 text-[#171717]/80">
              {metrics.assignedVehicles} active of {vehicles.length - metrics.maintenanceVehicles - metrics.inactiveVehicles} operable units
            </div>
          </div>
          <div className="pt-3 border-t border-[#171717]/20 flex items-center justify-between text-[11px] font-mono">
            <span>Standby Available: {metrics.availableVehicles}</span>
            <button
              onClick={() => onNavigateToTab('vehicles')}
              className="font-bold underline flex items-center gap-0.5 hover:opacity-80"
            >
              <span>Fleet Asset Grid</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Secondary Dark Grid Metrics */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#202020] border border-[#383838] p-5 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] font-mono uppercase text-[#A3A3A3] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#FFF21A]" />
              <span>Vehicles</span>
            </div>
            <div className="text-3xl font-display font-bold text-[#FFFFFF] my-2">
              {metrics.totalVehicles}
            </div>
            <div className="text-[10px] font-mono text-[#A3A3A3]">
              <span className="text-emerald-400 font-bold">{metrics.availableVehicles}</span> ready •{' '}
              <span className="text-yellow-400 font-bold">{metrics.assignedVehicles}</span> assigned
            </div>
          </div>

          <div className="bg-[#202020] border border-[#383838] p-5 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] font-mono uppercase text-[#A3A3A3] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#A65BFF]" />
              <span>Drivers</span>
            </div>
            <div className="text-3xl font-display font-bold text-[#FFFFFF] my-2">
              {metrics.totalDrivers}
            </div>
            <div className="text-[10px] font-mono text-[#A3A3A3]">
              <span className="text-emerald-400 font-bold">{metrics.availableDrivers}</span> standby •{' '}
              <span className="text-[#A65BFF] font-bold">{metrics.assignedDrivers}</span> en route
            </div>
          </div>

          <div className="bg-[#202020] border border-[#383838] p-5 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] font-mono uppercase text-[#A3A3A3] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Orders</span>
            </div>
            <div className="text-3xl font-display font-bold text-[#FFFFFF] my-2">
              {metrics.pendingDeliveries}
            </div>
            <div className="text-[10px] font-mono text-[#A3A3A3]">
              <span className="text-red-400 font-bold">{urgentOrders.length}</span> urgent priority
            </div>
          </div>

          <div className="bg-[#202020] border border-[#383838] p-5 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] font-mono uppercase text-[#A3A3A3] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed</span>
            </div>
            <div className="text-3xl font-display font-bold text-emerald-400 my-2">
              {metrics.completedDeliveries}
            </div>
            <div className="text-[10px] font-mono text-[#A3A3A3]">
              {metrics.completionRatePct}% fulfillment rate
            </div>
          </div>

          {/* Operational Alerts Row inside Metric section */}
          <div className="col-span-2 sm:col-span-4 bg-[#202020] border border-[#383838] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] font-bold">
                Operational Dispatch Directives
              </span>
              <span className="text-[10px] font-mono text-[#A3A3A3]">
                {operationalAlerts.length} Active System Notices
              </span>
            </div>
            <div className="space-y-2">
              {operationalAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-3 ${
                    alert.type === 'urgent'
                      ? 'bg-red-950/30 border-red-900/50 text-red-200'
                      : alert.type === 'warning'
                      ? 'bg-amber-950/30 border-amber-900/50 text-amber-200'
                      : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-300'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      alert.type === 'urgent'
                        ? 'text-red-400'
                        : alert.type === 'warning'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }`}
                  />
                  <div className="flex-1 truncate">
                    <span className="font-bold mr-1.5">{alert.title}:</span>
                    <span>{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map & Active Delivery Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-[#FFFFFF]">
                Active Route Telemetry & Street Geometry
              </h2>
              <p className="text-xs font-mono text-[#A3A3A3]">
                Live turn-by-turn road distance and ETA calculation via OSRM Open Routing.
              </p>
            </div>
            {selectedMapDelivery && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#202020] border border-[#383838] text-[#FFF21A]">
                Selected: {selectedMapDelivery.id}
              </span>
            )}
          </div>

          <InteractiveRouteMap
            selectedDelivery={selectedMapDelivery}
            allDeliveries={deliveries}
            onSelectDelivery={(del) => setSelectedMapDelivery(del)}
          />
        </div>

        {/* Recent Assignment Stream */}
        <div className="lg:col-span-4 bg-[#202020] border border-[#383838] p-5 rounded-xl flex flex-col h-[510px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#383838]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#FFFFFF] font-bold">
              Recent Allocations
            </h3>
            <button
              onClick={() => onNavigateToTab('deliveries')}
              className="text-xs font-mono text-[#FFF21A] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
            {deliveries.slice(0, 6).map((del) => {
              const isSelected = selectedMapDelivery?.id === del.id;
              return (
                <div
                  key={del.id}
                  onClick={() => setSelectedMapDelivery(del)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#171717] border-[#FFF21A] shadow-md'
                      : 'bg-[#171717]/60 border-[#383838] hover:border-[#A3A3A3]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#FFF21A]">{del.id}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        del.priority === 'urgent'
                          ? 'bg-red-950 text-red-400'
                          : del.priority === 'high'
                          ? 'bg-yellow-950 text-[#FFF21A]'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {del.priority}
                    </span>
                  </div>

                  <div className="text-xs text-[#FFFFFF] font-semibold truncate">
                    {del.pickup_location}
                  </div>
                  <div className="text-[11px] text-[#A3A3A3] truncate">→ {del.dropoff_location}</div>

                  <div className="mt-2 pt-2 border-t border-[#383838]/60 flex items-center justify-between text-[10px] font-mono text-[#A3A3A3]">
                    <span>Status: {del.status}</span>
                    <span>{formatRelativeTime(del.scheduled_time)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
