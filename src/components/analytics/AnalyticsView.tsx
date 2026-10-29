import React from 'react';
import { useOperational } from '../../context/OperationalContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, Info, BarChart2, CheckCircle, Clock } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { vehicles, drivers, deliveries, metrics, auditLogs } = useOperational();

  // Status distribution data
  const statusData = [
    { name: 'Pending', count: metrics.pendingDeliveries, color: '#A3A3A3' },
    { name: 'Active/In-Transit', count: metrics.activeDeliveries, color: '#FFF21A' },
    { name: 'Delivered', count: metrics.completedDeliveries, color: '#10B981' },
    { name: 'Cancelled', count: metrics.cancelledDeliveries, color: '#EF4444' },
  ];

  // Priority distribution data
  const priorityData = [
    {
      priority: 'Urgent',
      count: deliveries.filter((d) => d.priority === 'urgent').length,
      fill: '#EF4444',
    },
    {
      priority: 'High',
      count: deliveries.filter((d) => d.priority === 'high').length,
      fill: '#F59E0B',
    },
    {
      priority: 'Normal',
      count: deliveries.filter((d) => d.priority === 'normal').length,
      fill: '#3B82F6',
    },
    {
      priority: 'Low',
      count: deliveries.filter((d) => d.priority === 'low').length,
      fill: '#71717A',
    },
  ];

  // Vehicle type distribution
  const vehicleTypeCounts: Record<string, number> = {};
  vehicles.forEach((v) => {
    vehicleTypeCounts[v.vehicle_type] = (vehicleTypeCounts[v.vehicle_type] || 0) + 1;
  });
  const vehicleTypeData = Object.entries(vehicleTypeCounts).map(([type, count]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count,
  }));

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ['Delivery ID', 'Pickup', 'Dropoff', 'Priority', 'Capacity (kg)', 'Status', 'Vehicle', 'Driver', 'Scheduled Time'];
    const rows = deliveries.map((d) => [
      d.id,
      `"${d.pickup_location.replace(/"/g, '""')}"`,
      `"${d.dropoff_location.replace(/"/g, '""')}"`,
      d.priority,
      d.required_capacity,
      d.status,
      d.assigned_vehicle_id || 'Unassigned',
      d.assigned_driver_id || 'Unassigned',
      d.scheduled_time,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `routiq_deliveries_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#383838]">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#FFF21A] font-bold">
            Data & Telemetry Engine
          </div>
          <h1 className="text-3xl font-display font-bold text-[#FFFFFF] mt-1">
            Operational Intelligence & Analytics
          </h1>
          <p className="text-xs text-[#A3A3A3] mt-1 font-mono">
            Derived strictly from persisted operational records and transactional database state.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-[#202020] hover:bg-[#282828] border border-[#383838] text-xs font-mono font-bold uppercase rounded flex items-center gap-2 text-[#FFFFFF] transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#FFF21A]" />
          <span>Export Deliveries CSV</span>
        </button>
      </div>

      {/* KPI Definition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-[#202020] border border-[#383838] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
              Fleet Utilization
            </span>
            <span className="p-2 rounded bg-[#FFF21A]/10 text-[#FFF21A]">
              <BarChart2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-4xl font-display font-bold text-[#FFF21A]">
            {metrics.fleetUtilizationPct}%
          </div>
          <div className="mt-4 pt-3 border-t border-[#383838] text-[11px] font-mono text-[#A3A3A3] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#A65BFF] shrink-0" />
            <span>
              Formula: ({metrics.assignedVehicles} Assigned ÷{' '}
              {vehicles.length - metrics.maintenanceVehicles - metrics.inactiveVehicles} Operable Units) × 100
            </span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#202020] border border-[#383838] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
              Fulfillment Rate
            </span>
            <span className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-4xl font-display font-bold text-emerald-400">
            {metrics.completionRatePct}%
          </div>
          <div className="mt-4 pt-3 border-t border-[#383838] text-[11px] font-mono text-[#A3A3A3] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#A65BFF] shrink-0" />
            <span>
              Formula: ({metrics.completedDeliveries} Delivered ÷ {deliveries.length} Total Deliveries) × 100
            </span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#202020] border border-[#383838] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
              Active Driver Allocation
            </span>
            <span className="p-2 rounded bg-[#A65BFF]/10 text-[#A65BFF]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-4xl font-display font-bold text-[#A65BFF]">
            {drivers.length > 0
              ? Math.round((metrics.assignedDrivers / drivers.length) * 100)
              : 0}
            %
          </div>
          <div className="mt-4 pt-3 border-t border-[#383838] text-[11px] font-mono text-[#A3A3A3] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#A65BFF] shrink-0" />
            <span>
              {metrics.assignedDrivers} on active routes • {metrics.availableDrivers} on standby • {metrics.unavailableDrivers} unavailable
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="p-6 rounded-xl bg-[#202020] border border-[#383838]">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#FFFFFF] mb-4">
            Delivery Lifecycle Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#383838',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-[#383838] text-xs font-mono">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#A3A3A3]">{item.name}:</span>
                <span className="font-bold text-[#FFFFFF]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-6 rounded-xl bg-[#202020] border border-[#383838]">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#FFFFFF] mb-4">
            Order Priority Spectrum
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="priority" stroke="#A3A3A3" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#A3A3A3" fontSize={11} fontFamily="monospace" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#383838',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-4 border-t border-[#383838] text-xs font-mono text-[#A3A3A3]">
            Urgent and High priority orders receive automatic dispatch recommendation weights.
          </div>
        </div>
      </div>

      {/* Fleet Mix Breakdown */}
      <div className="p-6 rounded-xl bg-[#202020] border border-[#383838]">
        <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#FFFFFF] mb-4">
          Fleet Composition by Asset Classification
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {vehicleTypeData.map((vt) => (
            <div key={vt.type} className="p-4 rounded-lg bg-[#171717] border border-[#383838]">
              <span className="text-[10px] font-mono text-[#A3A3A3] block truncate">{vt.type}</span>
              <span className="text-2xl font-bold font-mono text-[#FFF21A] mt-1 block">
                {vt.count}
              </span>
              <span className="text-[10px] font-mono text-[#A3A3A3]">
                {Math.round((vt.count / vehicles.length) * 100)}% of total fleet
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

