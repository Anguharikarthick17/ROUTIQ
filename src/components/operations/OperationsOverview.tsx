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

  // Collect operational alerts with actionable targets
  const operationalAlerts: {
    type: 'urgent' | 'warning' | 'info';
    title: string;
    message: string;
    actionLabel: string;
    targetTab: string;
  }[] = [];

  const urgentOrders = deliveries.filter((d) => d.priority === 'urgent' && d.status === 'pending');
  if (urgentOrders.length > 0) {
    operationalAlerts.push({
      type: 'urgent',
      title: 'Urgent Dispatch Orders Pending',
      message: `${urgentOrders.length} critical shipment(s) awaiting driver & vehicle pairing.`,
      actionLabel: 'Resolve in Decision Lab',
      targetTab: 'decision-lab',
    });
  }

  const maintenanceUnits = vehicles.filter((v) => v.status === 'maintenance');
  if (maintenanceUnits.length > 0) {
    operationalAlerts.push({
      type: 'warning',
      title: 'Fleet Assets Under Maintenance',
      message: `${maintenanceUnits.map((v) => v.id).join(', ')} currently offline for technical inspection.`,
      actionLabel: 'Inspect Vehicles',
      targetTab: 'vehicles',
    });
  }

  const unavailDrivers = drivers.filter((d) => d.availability_status === 'unavailable');
  if (unavailDrivers.length > 0) {
    operationalAlerts.push({
      type: 'info',
      title: 'Driver Standby Roster Notice',
      message: `${unavailDrivers.map((d) => d.name).join(', ')} currently on scheduled leave.`,
      actionLabel: 'View Drivers',
      targetTab: 'drivers',
    });
  }

  return (
    <div className="space-y-6 w-full">
      {/* Action Notification Banner */}
      {lastActionResult && (
        <div
          className={`p-4 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-between transition-all ${
            lastActionResult.success
              ? 'bg-[#FFFFFF] text-[#176B38]'
              : 'bg-[#FFFFFF] text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-3">
            {lastActionResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-[#176B38] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#B42318] shrink-0" />
            )}
            <span className="text-xs font-mono font-bold text-[#111111]">
              {lastActionResult.message}
            </span>
          </div>
          <button
            onClick={clearLastResult}
            className="text-xs font-mono font-bold text-[#111111] hover:bg-[#FFF21A] border border-[#111111] rounded px-2.5 py-1 uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Editorial Header Section */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] p-6 rounded-xl shadow-[4px_4px_0px_#111111] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-[#FFF21A] text-[#111111] border border-[#111111] font-mono font-black text-[10px] tracking-wider uppercase">
              Live Operations
            </span>
            <span className="text-xs font-mono font-bold text-[#45421F] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#176B38]" />
              Database Synchronized • In-Memory Lock Bus Active
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[#111111]">
            COMMAND CENTER
          </h1>
          <p className="text-xs font-mono text-[#45421F] mt-1 max-w-2xl">
            Conflict-safe multi-resource dispatch, turn-by-turn road network routing, and continuous fleet telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateToTab('decision-lab')}
            className="px-4 py-2.5 rounded-lg bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border-2 border-[#111111] shadow-[3px_3px_0px_#111111]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Decision Lab</span>
          </button>
          <button
            onClick={resetDemoData}
            className="px-3.5 py-2.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FFF21A] border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] flex items-center gap-2 transition-colors shadow-[3px_3px_0px_#111111]"
            title="Reset to canonical demonstration state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Fleet</span>
          </button>
        </div>
      </div>

      {/* Operational Metrics: 6 Consistent Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Fleet Utilization */}
        <div className="bg-[#FFFFFF] border-2 border-[#111111] p-4 rounded-xl shadow-[3px_3px_0px_#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#45421F]">
              Utilization
            </span>
            <Activity className="w-3.5 h-3.5 text-[#A65BFF]" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-display font-black text-[#111111]">
              {metrics.fleetUtilizationPct}%
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#45421F] font-bold truncate">
            {metrics.assignedVehicles} of {vehicles.length - metrics.maintenanceVehicles - metrics.inactiveVehicles} active units
          </div>
        </div>

        {/* Metric 2: Total Vehicles */}
        <div className="bg-[#FFFFFF] border-2 border-[#111111] p-4 rounded-xl shadow-[3px_3px_0px_#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#45421F]">
              Total Fleet
            </span>
            <Truck className="w-3.5 h-3.5 text-[#111111]" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-display font-black text-[#111111]">
              {metrics.totalVehicles}
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#45421F] font-bold">
            <span className="text-[#176B38] font-black">{metrics.availableVehicles}</span> ready •{' '}
            <span className="text-[#8A4B00] font-black">{metrics.assignedVehicles}</span> assigned
          </div>
        </div>

        {/* Metric 3: Available Vehicles */}
        <div className="bg-[#FFFFFF] border-2 border-[#111111] p-4 rounded-xl shadow-[3px_3px_0px_#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#45421F]">
              Available Vehicles
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#176B38]" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-display font-black text-[#176B38]">
              {metrics.availableVehicles}
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#45421F] font-bold">
            Ready for dispatch
          </div>
        </div>

        {/* Metric 4: Active Drivers */}
        <div className="bg-[#FFFFFF] border-2 border-[#111111] p-4 rounded-xl shadow-[3px_3px_0px_#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#45421F]">
              Active Drivers
            </span>
            <Users className="w-3.5 h-3.5 text-[#A65BFF]" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-display font-black text-[#111111]">
              {metrics.totalDrivers}
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#45421F] font-bold">
            <span className="text-[#176B38] font-black">{metrics.availableDrivers}</span> standby •{' '}
            <span className="text-[#A65BFF] font-black">{metrics.assignedDrivers}</span> en route
          </div>
        </div>

        {/* Metric 5: Pending Orders */}
        <div className="bg-[#FFFFFF] border-2 border-[#111111] p-4 rounded-xl shadow-[3px_3px_0px_#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#45421F]">
              Pending Orders
            </span>
            <Package className="w-3.5 h-3.5 text-[#8A4B00]" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-display font-black text-[#111111]">
              {metrics.pendingDeliveries}
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#B42318] font-black">
            {urgentOrders.length} urgent priority
          </div>
        </div>

        {/* Metric 6: Completed Deliveries */}
        <div className="bg-[#FFFFFF] border-2 border-[#111111] p-4 rounded-xl shadow-[3px_3px_0px_#111111] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#45421F]">
              Completed
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#176B38]" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-display font-black text-[#176B38]">
              {metrics.completedDeliveries}
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#45421F] font-bold">
            {metrics.completionRatePct}% fulfillment rate
          </div>
        </div>
      </div>

      {/* Operational Alerts: Full Width */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] p-5 rounded-xl shadow-[4px_4px_0px_#111111]">
        <div className="flex items-center justify-between pb-3 border-b border-[#111111]/15 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#111111]" />
            <span className="text-xs font-mono font-black uppercase tracking-wider text-[#111111]">
              Operational Alerts & Standby Directives
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFF21A] text-[#111111] border border-[#111111]">
            {operationalAlerts.length} Active System Notices
          </span>
        </div>

        <div className="space-y-2.5">
          {operationalAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-2 border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.type === 'urgent'
                  ? 'bg-[#B42318]/10 text-[#B42318]'
                  : alert.type === 'warning'
                  ? 'bg-[#8A4B00]/10 text-[#8A4B00]'
                  : 'bg-[#FFF21A]/30 text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    alert.type === 'urgent'
                      ? 'bg-[#B42318]'
                      : alert.type === 'warning'
                      ? 'bg-[#8A4B00]'
                      : 'bg-[#111111]'
                  }`}
                />
                <div className="text-xs font-mono">
                  <span className="font-black text-[#111111] mr-1.5">{alert.title}:</span>
                  <span className="text-[#45421F] font-medium">{alert.message}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab(alert.targetTab)}
                className="px-3 py-1 text-xs font-mono font-bold bg-[#FFFFFF] hover:bg-[#FFF21A] text-[#111111] border border-[#111111] rounded shadow-[2px_2px_0px_#111111] flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-all"
              >
                <span>{alert.actionLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Route & Recent Allocations: 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Map Telemetry (65% width on desktop) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="bg-[#FFFFFF] border-2 border-[#111111] p-4 rounded-xl shadow-[4px_4px_0px_#111111] flex items-center justify-between">
            <div>
              <h2 className="text-base font-black font-display text-[#111111]">
                Live Route Telemetry & Street Geometry
              </h2>
              <p className="text-xs font-mono text-[#45421F]">
                Turn-by-turn road distance and ETA calculation via OSRM Open Routing.
              </p>
            </div>
            {selectedMapDelivery && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-[#FFF21A] border-2 border-[#111111] text-[#111111] shadow-[2px_2px_0px_#111111]">
                Selected: {selectedMapDelivery.id}
              </span>
            )}
          </div>

          <div className="flex-1">
            <InteractiveRouteMap
              selectedDelivery={selectedMapDelivery}
              allDeliveries={deliveries}
              onSelectDelivery={(del) => setSelectedMapDelivery(del)}
            />
          </div>
        </div>

        {/* Right Column: Recent Allocations Table / Stream */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border-2 border-[#111111] p-5 rounded-xl shadow-[4px_4px_0px_#111111] flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111] mb-3">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#111111] font-black">
                Recent Allocations
              </h3>
              <p className="text-[10px] font-mono text-[#45421F]">
                Select delivery to inspect live route
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('deliveries')}
              className="text-xs font-mono font-bold text-[#111111] hover:bg-[#FFF21A] px-2.5 py-1 rounded border border-[#111111] flex items-center gap-1 transition-colors"
            >
              <span>All ({deliveries.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {deliveries.slice(0, 8).map((del) => {
              const isSelected = selectedMapDelivery?.id === del.id;
              return (
                <div
                  key={del.id}
                  onClick={() => setSelectedMapDelivery(del)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FFF21A] border-[#111111] shadow-[3px_3px_0px_#111111]'
                      : 'bg-[#FFFFFF] border-[#111111]/25 hover:border-[#111111] hover:bg-[#F9F9F9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-black text-[#111111]">
                      {del.id}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase border border-[#111111] ${
                        del.priority === 'urgent'
                          ? 'bg-[#B42318] text-white'
                          : del.priority === 'high'
                          ? 'bg-[#FFF21A] text-[#111111]'
                          : 'bg-[#EEEEEE] text-[#111111]'
                      }`}
                    >
                      {del.priority}
                    </span>
                  </div>

                  <div className="text-xs text-[#111111] font-bold truncate">
                    {del.pickup_location}
                  </div>
                  <div className="text-[11px] text-[#45421F] font-medium truncate">
                    → {del.dropoff_location}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#111111]/15 flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#111111]">
                      Status:{' '}
                      <span className="uppercase text-[#A65BFF] font-black">
                        {del.status}
                      </span>
                    </span>
                    <span className="text-[#45421F] font-bold">
                      {formatRelativeTime(del.scheduled_time)}
                    </span>
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

